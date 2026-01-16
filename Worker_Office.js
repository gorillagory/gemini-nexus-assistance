// ==========================================
// MODULE: OFFICE WORKER (The Creator)
// ==========================================

function handleOfficeRequest(task, listId) {
  const title = task.title.toLowerCase();
  
  // 1. FREE CHECK: Input Validation
  // If notes are empty, AI has nothing to work with. Stop here (Save Money).
  if (!task.notes || task.notes.length < 10) {
    console.warn(`⚠️ Skipped: "${task.title}" - Notes too short or empty.`);
    return;
  }

  // 2. Identify Category
  let category = "iskandarzulqarnain"; 
  if (typeof CONFIG !== 'undefined' && CONFIG.TARGET_LISTS) {
    CONFIG.TARGET_LISTS.forEach(list => {
      if (title.includes(list.toLowerCase())) category = list;
    });
  }

  // 3. FREE CHECK: Output Validation
  // Logic: Check if we already created this file to prevent double-billing.
  // We predict the filename based on the task title.
  let predictedName = "";
  if (title.includes("!slide")) predictedName = `[SLIDES] ${task.title.replace("!slide", "").trim()}`;
  else if (title.includes("!sheet")) predictedName = `[DATA] ${task.title.replace("!sheet", "").trim()}`;
  else predictedName = `[DRAFT] ${task.title.replace("!draft", "").trim()}`;

  if (fileExistsInBrain(category, predictedName)) {
    console.warn(`💰 Saved Money: "${predictedName}" already exists. Skipping.`);
    // Auto-complete the task because the work is already done
    completeTask(task, listId, `File already exists: ${predictedName}`);
    return;
  }

  // ==========================================
  // 💸 PAID SECTION STARTS HERE (Gemini Call)
  // ==========================================
  
  const masterMemory = getNexusMemory(category); 
  const fileContext = getBrainContext(category); 
  const styleGuide = getStyleInstruction(category); 

  const context = `
    === PROJECT MEMORY ===
    ${masterMemory}
    
    === RELEVANT FILES ===
    ${fileContext}
    
    === STYLE & PERSONA (${category}) ===
    ${styleGuide}
  `;

  let fileUrl = null;
  let docType = "DOC";

  try {
    if (title.includes("!slide")) {
      fileUrl = generateSlides(task, context, category);
      docType = "SLIDE";
    } else if (title.includes("!sheet")) {
      fileUrl = generateSheet(task, context, category);
      docType = "SHEET";
    } else {
      fileUrl = generateDoc(task, context, category);
      docType = "DOC";
    }
  } catch (e) {
    console.error("Generative Error: " + e.message);
    return;
  }

  if (!fileUrl) {
    console.error(`❌ Generation failed for ${task.title}. Keeping task open.`);
    return;
  }

  if (typeof logProjectAsset === 'function') {
    logProjectAsset(category, docType, task.title, fileUrl, task.notes);
  }

  updateBrainLog(category, `Generated ${docType}: "${task.title}"`, fileUrl);
  completeTask(task, listId, `✅ Content Created: ${fileUrl}`);
}

// --- FREE VALIDATION HELPERS ---

function fileExistsInBrain(category, fileName) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolder = root.getFoldersByName(category);
    if (!catFolder.hasNext()) return false;
    
    // We check the specific category folder for the file
    // Note: This matches "exact name"
    return catFolder.next().getFilesByName(fileName).hasNext();
  } catch(e) { return false; }
}

function completeTask(task, listId, noteUpdate) {
  task.notes = `${noteUpdate}\n\nOriginal: ${task.notes || ''}`;
  task.status = 'completed'; 
  try { Tasks.Tasks.update(task, listId, task.id); } catch (e) {}
}

// --- GENERATORS (Keep existing code below) ---
// (Paste your existing getStyleInstruction, generateDoc, generateSlides, generateSheet functions here)
function getStyleInstruction(category) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    if (!root.getFoldersByName("_Library").hasNext()) return "Style: Professional.";
    const lib = root.getFoldersByName("_Library").next();
    const files = lib.getFilesByName("STYLE_MATRIX.md");
    if (!files.hasNext()) return "Style: Standard Corporate.";
    return files.next().getBlob().getDataAsString(); 
  } catch (e) { return "Style: Default."; }
}

function generateDoc(task, context, category) {
  const prompt = `
    ACT AS: The primary owner of the '${category}' project.
    TASK: Write a document based on: "${task.title}".
    NOTES: "${task.notes || 'No specific notes'}".
    ${context}
    INSTRUCTION: Write in the specific Tone/Style defined for ${category} in the Style Matrix.
    OUTPUT: Return Markdown text.
  `;
  const content = askGemini(prompt, "You are a professional writer.");
  if (!content) return null;

  const doc = DocumentApp.create(`[DRAFT] ${task.title.replace("!draft", "").trim()}`);
  doc.getBody().setText(content);
  moveFileToCategory(doc.getId(), category);
  return doc.getUrl();
}

function generateSlides(task, context, category) {
  const prompt = `
    ACT AS: A Presentation Designer for '${category}'.
    TASK: Create slide content for: "${task.title}".
    NOTES: "${task.notes || 'No specific notes'}".
    ${context}
    INSTRUCTION: Adhere to the ${category} Style Matrix.
    OUTPUT: Return JSON array ONLY: [{"title": "Slide Title", "bullets": ["Point A", "Point B"]}]. Limit 5 slides.
  `;
  const jsonStr = askGemini(prompt, "Return JSON only.");
  if (!jsonStr) return null;
  
  try {
    const cleanJson = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    const slidesData = JSON.parse(cleanJson);
    const deck = SlidesApp.create(`[SLIDES] ${task.title.replace("!slide", "").trim()}`);
    slidesData.forEach(s => {
      const slide = deck.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
      try {
        slide.getShapes()[0].getText().setText(s.title);
        slide.getShapes()[1].getText().setText(s.bullets.join('\n'));
      } catch(e){}
    });
    moveFileToCategory(deck.getId(), category);
    return deck.getUrl();
  } catch (e) {
    console.error("JSON Parse Error: " + e.message);
    return null;
  }
}

function generateSheet(task, context, category) {
  const prompt = `
    ACT AS: A Data Analyst for '${category}'.
    TASK: Create a spreadsheet structure for: "${task.title}".
    NOTES: "${task.notes || 'No specific notes'}".
    ${context}
    INSTRUCTION: Corporate headers.
    OUTPUT: Return JSON 2D Array (Rows and Columns) ONLY.
  `;
  const jsonStr = askGemini(prompt, "Return JSON only.");
  if (!jsonStr) return null;

  try {
    const cleanJson = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
    const rows = JSON.parse(cleanJson);
    const ss = SpreadsheetApp.create(`[DATA] ${task.title.replace("!sheet", "").trim()}`);
    const sheet = ss.getActiveSheet();
    if (rows.length > 0) sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    moveFileToCategory(ss.getId(), category);
    return ss.getUrl();
  } catch (e) {
    console.error("JSON Parse Error: " + e.message);
    return null;
  }
}