// ==========================================
// MODULE: SYSTEM HEALTH & INIT
// ==========================================

function initializeSystem() {
  // Direct call to avoid variable confusion
  SpreadsheetApp.getActive().toast("🛠 Initializing Folder Structure...", "Nexus Admin");

  const ROOT_NAME = "Fast Work";
  const root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_NAME);

  // Safely get target lists
  const categories = (typeof CONFIG !== 'undefined' && CONFIG.TARGET_LISTS) ? CONFIG.TARGET_LISTS : ['iskandarzulqarnain', 'Personal', 'Bayam', 'PITSA', 'Music', 'Gmanage'];

  categories.forEach(catName => {
    const catFolder = getOrCreateFolder(root, catName);
    const brainFolder = getOrCreateFolder(catFolder, "_Brain");
    getOrCreateFolder(brainFolder, "_Inbox");
    getOrCreateFolder(brainFolder, "_Archive");

    const files = brainFolder.getFilesByType(MimeType.PLAIN_TEXT);
    if (!files.hasNext()) {
      brainFolder.createFile("README.md", `# ${catName} Context\n\n- [ ] Add Company Profile\n- [ ] Add Key Contacts`);
    }
  });

  SpreadsheetApp.getActive().toast("✅ Initialization Complete.", "Nexus Admin");
  runHealthCheck(); 
}

function runHealthCheck() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  ss.toast("🏥 Scanning System Health...", "Nexus Admin");

  const START_ROW = 5;
  const headers = [["CATEGORY", "MAIN FOLDER", "BRAIN", "INBOX", "CONTEXT FILES (.md)", "LAST ACTIVITY", "STATUS"]];
  
  // Clear previous report area clearly
  sheet.getRange(START_ROW, 1, 30, 7).clearContent().setBorder(false, false, false, false, false, false);
  
  sheet.getRange(START_ROW, 1, 1, 7).setValues(headers).setFontWeight("bold").setBackground("#4a4a4a").setFontColor("white");

  const reportData = [];
  const ROOT_NAME = "Fast Work";
  const rootIter = DriveApp.getFoldersByName(ROOT_NAME);
  
  if (!rootIter.hasNext()) {
    SpreadsheetApp.getUi().alert("❌ Root Folder 'Fast Work' missing! Run Initialize first.");
    return;
  }
  const root = rootIter.next();

  const categories = (typeof CONFIG !== 'undefined' && CONFIG.TARGET_LISTS) ? CONFIG.TARGET_LISTS : ['iskandarzulqarnain', 'Personal', 'Bayam', 'PITSA', 'Music', 'Gmanage'];

  categories.forEach(catName => {
    let folderStatus = "❌";
    let brainStatus = "❌";
    let inboxStatus = "❌";
    let contextCount = 0;
    let lastActivity = "-";
    let overallStatus = "CRITICAL";

    const catFolders = root.getFoldersByName(catName);
    if (catFolders.hasNext()) {
      folderStatus = "✅";
      const catFolder = catFolders.next();

      const brains = catFolder.getFoldersByName("_Brain");
      if (brains.hasNext()) {
        brainStatus = "✅";
        const brain = brains.next();

        if (brain.getFoldersByName("_Inbox").hasNext()) inboxStatus = "✅";

        const files = brain.getFiles();
        let newestDate = new Date(0); 
        
        while (files.hasNext()) {
          const f = files.next();
          if (f.getName().endsWith(".md")) {
            contextCount++;
          }
          if (f.getLastUpdated() > newestDate) {
            newestDate = f.getLastUpdated();
          }
        }
        
        if (newestDate.getTime() > 0) {
          lastActivity = Utilities.formatDate(newestDate, Session.getScriptTimeZone(), "dd MMM HH:mm");
        }
      }
    }

    if (folderStatus === "✅" && brainStatus === "✅" && inboxStatus === "✅") {
      overallStatus = contextCount > 0 ? "ONLINE 🟢" : "NO CONTEXT 🟡";
    }

    reportData.push([catName, folderStatus, brainStatus, inboxStatus, contextCount, lastActivity, overallStatus]);
  });

  if (reportData.length > 0) {
    const range = sheet.getRange(START_ROW + 1, 1, reportData.length, 7);
    range.setValues(reportData);
    range.setHorizontalAlignment("center");
    range.setBorder(true, true, true, true, true, true);
  }

  sheet.getRange("B2").setValue(`Last Check: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss")}`);
  ss.toast("✅ Health Check Updated.", "Nexus Admin");
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}