// ==========================================
// MODULE: SYSTEM HEALTH & DYNAMIC INIT
// ==========================================

/**
 * THE BIG GREEN BUTTON: Use this to set up a new account or fix structure.
 */
function initializeSystem() {
  const ss = SpreadsheetApp.getActive();
  ss.toast("🛠 Initializing Nexus Ecosystem...", "Nexus Admin");

  // 1. Setup Spreadsheet Control Panel
  ensureSettingsSheet();

  // 2. Setup Drive Root
  const ROOT_NAME = "Fast Work";
  const root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_NAME);

  // 3. Sync Task Lists to Drive
  syncFoldersWithTasks();

  ss.toast("✅ Initialization Complete.", "Nexus Admin");
}

/**
 * Creates the 'Settings' tab if missing.
 */
function ensureSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Settings");
  
  if (!sheet) {
    sheet = ss.insertSheet("Settings");
    const headers = [["TASK LIST NAME", "CATEGORY", "CONTEXT / TAGS (Keywords for AI)"]];
    sheet.getRange(1, 1, 1, 3).setValues(headers)
         .setFontWeight("bold")
         .setBackground("#4285F4")
         .setFontColor("white");
    
    // Pre-populate with your known lists
    const defaults = [
      ["Bayam", "WORK", "Technical, Cloud Architecture, sange-nexus"],
      ["Music", "PERSONAL", "Creative, Guitar, Songwriting"],
      ["PITSA", "NGO", "Grants, Community, PKNS"],
      ["Personal", "PERSONAL", "Family, Health, Home"],
      ["iskandarzulqarnain", "GENERAL", "Default context"]
    ];
    sheet.getRange(2, 1, defaults.length, 3).setValues(defaults);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 3);
  }
}

/**
 * AUTO-SYNC: Scans Google Tasks and ensures BOTH Drive and Settings are updated.
 */
function syncFoldersWithTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName("Settings");
  const ui = SpreadsheetApp.getActive();
  
  ui.toast("🔍 Syncing Task Lists with Nexus...", "Nexus Admin");

  const ROOT_NAME = "Fast Work";
  const root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_NAME);
  
  // 1. Get all lists from Google Tasks
  const currentLists = Tasks.Tasklists.list().items;
  
  // 2. Get currently tracked lists in Settings sheet (Column A)
  const trackedLists = settingsSheet.getDataRange().getValues().map(row => row[0]);

  currentLists.forEach(list => {
    if (list.title === CONFIG.SOURCE_LIST) return;

    // A. Ensure Folder Structure exists
    const catFolder = getOrCreateFolder(root, list.title);
    const brainFolder = getOrCreateFolder(catFolder, "_Brain");
    getOrCreateFolder(brainFolder, "_Inbox");
    getOrCreateFolder(brainFolder, "_Archive");

    // B. Auto-populate Settings sheet if list is new
    if (trackedLists.indexOf(list.title) === -1) {
      console.log(`✨ Found new list: ${list.title}. Adding to Settings.`);
      settingsSheet.appendRow([list.title, "UNCATEGORIZED", "New list found. Add context keywords here."]);
      
      // Highlight the new row so you see it
      const lastRow = settingsSheet.getLastRow();
      settingsSheet.getRange(lastRow, 1, 1, 3).setBackground("#fff2cc"); 
    }
  });

  ui.toast("✅ Sync Complete. New lists added to Settings.", "Nexus Admin");
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

// ... (Keep existing runHealthCheck function)
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