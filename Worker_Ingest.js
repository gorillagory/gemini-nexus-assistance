// ==========================================
// MODULE: CONTEXT INGESTER (The Digestive System)
// ==========================================

function runIngestCycle() {
  const root = DriveApp.getFoldersByName("Fast Work");
  if (!root.hasNext()) return;
  const rootFolder = root.next();
  
  const categories = CONFIG.TARGET_LISTS; // e.g. ['Bayam', 'PITSA', ...]
  
  categories.forEach(catName => {
    processCategoryInbox(rootFolder, catName);
  });
}

function processCategoryInbox(rootFolder, catName) {
  // 1. Find or Create the Structure: Category -> _Brain -> _Inbox
  const catFolder = getChildFolder(rootFolder, catName);
  if (!catFolder) return;
  
  const brainFolder = getOrCreateFolder(catFolder, "_Brain");
  const inboxFolder = getOrCreateFolder(brainFolder, "_Inbox");
  const archiveFolder = getOrCreateFolder(brainFolder, "_Archive");
  
  // 2. Process Files in _Inbox
  const files = inboxFolder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    console.log(`[Ingest] Processing ${file.getName()} for ${catName}...`);
    
    let markdownContent = "";
    
    try {
      // 3. Convert based on type
      const mime = file.getMimeType();
      
      if (mime === MimeType.GOOGLE_DOCS || mime === MimeType.MICROSOFT_WORD) {
        markdownContent = extractTextFromDoc(file);
      } else if (mime === MimeType.PDF || mime.includes("image")) {
        markdownContent = extractTextFromPdf(file);
      } else if (mime === MimeType.PLAIN_TEXT || mime.includes("markdown")) {
         markdownContent = file.getBlob().getDataAsString();
      }
      
      // 4. Save as .md in _Brain
      if (markdownContent && markdownContent.length > 50) {
        const safeName = file.getName().replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
        brainFolder.createFile(`[REF]_${safeName}.md`, markdownContent);
        console.log(`✅ Converted: [REF]_${safeName}.md`);
        
        // 5. Archive Original
        file.moveTo(archiveFolder);
      } else {
        console.log(`⚠️ Skipped ${file.getName()} (No text found or too short)`);
      }
      
    } catch (e) {
      console.error(`❌ Failed to ingest ${file.getName()}: ${e.message}`);
    }
  }
}

// --- HELPER: GOOGLE DOCS / WORD ---
function extractTextFromDoc(file) {
  let docId = file.getId();
  
  // If Word, we must convert to GDoc temporarily to read text
  let isTemp = false;
  if (file.getMimeType() === MimeType.MICROSOFT_WORD) {
    const resource = { title: file.getName(), mimeType: MimeType.GOOGLE_DOCS };
    const newFile = Drive.Files.insert(resource, file.getBlob());
    docId = newFile.id;
    isTemp = true;
  }
  
  const doc = DocumentApp.openById(docId);
  const text = doc.getBody().getText();
  
  // Cleanup temp file if we created one
  if (isTemp) Drive.Files.remove(docId);
  
  return `Title: ${file.getName()}\nType: Document\n\n${text}`;
}

// --- HELPER: PDF / IMAGES (OCR) ---
function extractTextFromPdf(file) {
  // Use Advanced Drive API to "scan" the PDF
  const resource = { title: file.getName(), mimeType: MimeType.GOOGLE_DOCS };
  
  // 'ocr: true' is the magic switch
  const imageBlob = file.getBlob();
  const options = { ocr: true, ocrLanguage: "en" };
  
  try {
    const newFile = Drive.Files.insert(resource, imageBlob, options);
    const doc = DocumentApp.openById(newFile.id);
    const text = doc.getBody().getText();
    
    // Delete the temp GDoc created by OCR
    Drive.Files.remove(newFile.id);
    
    return `Title: ${file.getName()}\nType: PDF Scanned\n\n${text}`;
  } catch (e) {
    console.warn("OCR Failed. File might be too large or encrypted.");
    return null;
  }
}

// --- UTILITIES ---
function getChildFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  // Fallback map for Personal/iskandar naming mismatch if necessary
  if (name === "iskandarzulqarnain") {
     const f = parent.getFoldersByName("iskandarzulqarnain"); 
     if (f.hasNext()) return f.next();
  }
  return null;
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}