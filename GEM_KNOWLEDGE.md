# NEXUS OS - CURRENT CODEBASE

Last Updated: 2026-01-13T21:36:44.079Z

## FILE: Admin_Architect.js
```javascript
// ==========================================
// MODULE: THE ARCHITECT (Self-Documentation)
// ==========================================

const MANIFESTO_FILENAME = "SYSTEM_MANIFESTO.md";
const ADMIN_FOLDER_NAME = "_Admin"; // A special folder for system files

/**
 * 1. INITIALIZE / READ MANIFESTO
 * Ensures the system documentation exists.
 */
function getManifesto() {
  const root = DriveApp.getFoldersByName("Fast Work").next();
  
  // Find/Create _Admin folder
  let adminFolder;
  if (root.getFoldersByName(ADMIN_FOLDER_NAME).hasNext()) {
    adminFolder = root.getFoldersByName(ADMIN_FOLDER_NAME).next();
  } else {
    adminFolder = root.createFolder(ADMIN_FOLDER_NAME);
  }

  const files = adminFolder.getFilesByName(MANIFESTO_FILENAME);
  
  if (files.hasNext()) {
    return files.next().getBlob().getDataAsString();
  } else {
    // Default Starting State (The one we discussed)
    const initialContent = `# NEXUS SYSTEM ARCHITECTURE
Last Updated: ${new Date().toISOString()}

## 1. Core Philosophy
Nexus is an AI-driven Operating System on Google Apps Script. It uses a "Read-Merge-Write" memory architecture to maintain context across tasks.

## 2. Module Registry
- **Main.gs:** Orchestrator & Heartbeat.
- **Worker_Tasks.gs:** Planning, Subtask Nesting, Calendar Blocking.
- **Worker_Office.gs:** RAG Document Generation.
- **Worker_Memory.gs:** Associative Knowledge Graph (Read/Write).
- **Worker_Library.gs:** Fact Checker (Read Only).
- **Worker_Drive.gs:** File System Manager.
- **Worker_Ingest.gs:** OCR & File Digestion.
- **Brain.gs:** AI Interface (Gemini).
- **Logger.gs:** Immutable Audit Trail.
- **Admin_Health.gs:** System Diagnostics.
- **Admin_Architect.gs:** Self-Documentation (This Module).

## 3. Coding Rules
- **Modularity:** Keep logic separated.
- **Memory Safety:** Always read context before writing.
- **Logs:** Use logHistory() for user visibility.
`;
    adminFolder.createFile(MANIFESTO_FILENAME, initialContent);
    return initialContent;
  }
}

/**
 * 2. UPDATE MANIFESTO
 * Call this when you add a new feature or change a rule.
 * @param {string} changeDescription - e.g., "Added Worker_Finance.gs to handle invoices."
 */
function updateManifesto(changeDescription) {
  console.log("🏗️ Architect is updating system documentation...");
  const currentManifesto = getManifesto();

  const prompt = `
    You are the System Architect for the Nexus OS. 
    Your goal is to update the 'SYSTEM_MANIFESTO.md' file to reflect recent changes.

    === CURRENT MANIFESTO ===
    ${currentManifesto}

    === NEW CHANGE/FEATURE ===
    "${changeDescription}"

    === INSTRUCTIONS ===
    1. Update the "Module Registry" if a new file was added.
    2. Update "Core Philosophy" or "Rules" if the change affects logic.
    3. Keep the format clean and professional (Markdown).
    4. Update the "Last Updated" timestamp.
    
    Return the FULL Markdown content.
  `;

  const newContent = askGemini(prompt, "You are a Technical Writer. Return Markdown only.");

  if (newContent) {
    overwriteManifesto(newContent);
    console.log("✅ SYSTEM_MANIFESTO.md updated.");
    logHistory("Architect", "Manifesto Update", changeDescription, "SUCCESS");
  } else {
    console.error("❌ Failed to update Manifesto.");
  }
}

/**
 * Helper to overwrite the file
 */
function overwriteManifesto(newContent) {
  const root = DriveApp.getFoldersByName("Fast Work").next();
  const adminFolder = root.getFoldersByName(ADMIN_FOLDER_NAME).next();
  const files = adminFolder.getFilesByName(MANIFESTO_FILENAME);
  
  if (files.hasNext()) {
    files.next().setContent(newContent);
  } else {
    adminFolder.createFile(MANIFESTO_FILENAME, newContent);
  }
}
```

## FILE: Admin_Health.js
```javascript
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
```

## FILE: Brain.js
```javascript
// ==========================================
// MODULE: AI INTERFACE (With Retry Logic)
// ==========================================

function askGemini(prompt, systemInstruction = "You are a helpful assistant.") {
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  };

  // RETRY LOOP (Max 3 attempts)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = UrlFetchApp.fetch(`${CONFIG.MODEL_URL}?key=${CONFIG.API_KEY}`, options);
      const responseCode = response.getResponseCode();
      
      // SUCCESS
      if (responseCode === 200) {
        const json = JSON.parse(response.getContentText());
        if (!json.candidates || !json.candidates[0].content) return null;
        return json.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      
      // RATE LIMIT (429) - WAIT AND RETRY
      if (responseCode === 429) {
        console.warn(`⚠️ Quota Hit (429). Waiting 10s before retry ${attempt}...`);
        Utilities.sleep(10000); // Wait 10 seconds
        continue; // Try again
      }

      // OTHER ERRORS
      console.error(`❌ Gemini API Error (${responseCode}): ` + response.getContentText());
      return null;

    } catch (e) {
      console.error(`❌ Connection Failed (Attempt ${attempt}): ` + e.toString());
      Utilities.sleep(2000);
    }
  }
  
  return null; // Failed after 3 attempts
}
```

## FILE: Config.js
```javascript
// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  // 1. Getter for API Key
  get API_KEY() { 
    if (typeof SECRETS !== 'undefined' && SECRETS.GEMINI_API_KEY) {
      return SECRETS.GEMINI_API_KEY;
    }
    return PropertiesService.getScriptProperties().getProperty('API_KEY');
  },
  
  SOURCE_LIST: 'Inbox', 
  
  TARGET_LISTS: [
    'iskandarzulqarnain', 
    'Personal',           
    'Bayam',              
    'PITSA',              
    'Music',              
    'Gmanage'             
  ],

  // UPDATED: Back to 2.5-flash (Standard for 2026)
  MODEL_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
};
```

## FILE: Logger.js
```javascript
// ==========================================
// MODULE: IMMUTABLE HISTORIAN & DASHBOARD
// ==========================================

const LOG_SHEET_NAME = "History";
const DASHBOARD_NAME = "Nexus Dashboard";

/**
 * Standard System Log (The "Black Box")
 * Appends technical logs to the 'History' tab.
 */
function logHistory(module, action, details, status = "SUCCESS") {
  try {
    const ss = getDashboardSpreadsheet();
    let sheet = ss.getSheetByName(LOG_SHEET_NAME);

    // 1. Create Sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET_NAME);
      const headers = [["TIMESTAMP", "MODULE", "ACTION", "DETAILS", "STATUS"]];
      sheet.getRange(1, 1, 1, 5).setValues(headers)
           .setFontWeight("bold")
           .setBackground("#202124") // Dark header
           .setFontColor("white");
      sheet.setFrozenRows(1);
      
      try {
        const protection = sheet.protect().setDescription('Immutable History Log');
        protection.setWarningOnly(true);
      } catch(e) {}
    }

    // 2. Append Data
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([timestamp, module, action, details, status]);

    // 3. Color Code Status
    const lastRow = sheet.getLastRow();
    const statusCell = sheet.getRange(lastRow, 5);
    
    if (status === "ERROR") statusCell.setBackground("#fce8e6").setFontColor("#c5221f"); // Red
    else if (status === "WARNING") statusCell.setBackground("#ffeec5").setFontColor("#b06000"); // Yellow
    else statusCell.setBackground("#e6f4ea").setFontColor("#137333"); // Green

  } catch (e) {
    console.error("Logger Failed: " + e.message);
  }
}

/**
 * NEW: Project-Specific Asset Log (The "Timeline Builder")
 * Writes to a specific tab like "Log_Bayam" or "Log_Personal".
 * This allows for clean timeline visualization per category.
 */
function logProjectAsset(category, type, title, url, contextSummary) {
  try {
    const ss = getDashboardSpreadsheet();
    // Sanitize sheet name (max 100 chars, no illegal chars)
    const cleanCat = category.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
    const sheetName = `Timeline_${cleanCat}`; 
    
    let sheet = ss.getSheetByName(sheetName);

    // Create Category Sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Timeline-ready headers
      const headers = [["DATE", "TIME", "TYPE", "ASSET TITLE", "LINK", "CONTEXT/NOTES"]];
      sheet.getRange(1, 1, 1, 6).setValues(headers)
           .setFontWeight("bold")
           .setBackground("#4285F4") // Google Blue header for Projects
           .setFontColor("white");
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(4, 300); // Wider Title
      sheet.setColumnWidth(6, 300); // Wider Notes
      
      // Delete extra columns to keep it clean
      if (sheet.getMaxColumns() > 6) {
        sheet.deleteColumns(7, sheet.getMaxColumns() - 6);
      }
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm");
    
    // Append Data
    sheet.appendRow([dateStr, timeStr, type, title, url, contextSummary]);
    
  } catch (e) {
    console.error("Project Log Failed: " + e.message);
    logHistory("Logger", "Dashboard Error", e.message, "ERROR");
  }
}

/**
 * Helper: Gets the active spreadsheet or finds 'Nexus Dashboard' in Drive.
 */
function getDashboardSpreadsheet() {
  try {
    // 1. Try Active Spreadsheet (Best for bound scripts)
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    // 2. Fallback: Search Drive (For standalone scripts)
    const files = DriveApp.getFilesByName(DASHBOARD_NAME);
    if (files.hasNext()) return SpreadsheetApp.open(files.next());
    
    // 3. Fallback: Create New
    return SpreadsheetApp.create(DASHBOARD_NAME);
  }
}
```

## FILE: Main.js
```javascript
// ==========================================
// MODULE: MAIN ORCHESTRATOR
// ==========================================

/**
 * TRIGGER: Run this every 5-10 minutes (Time-driven)
 */
function mainHeartbeat() {
  // 1. PHASE 1: The Manager (Clear Inbox & Organize)
  try {
    processInbox(); 
  } catch (e) {
    console.error("Heartbeat Task Error: " + e.message);
    logHistory("System", "Heartbeat", "Inbox loop failed: " + e.message, "ERROR");
  }

  // 2. PHASE 2: The Specialist (Scan Projects & Execute Work)
  try {
    processActiveProjects();
  } catch (e) {
    console.error("Heartbeat Worker Error: " + e.message);
  }

  // 3. PHASE 3: The Digestive System (Hourly)
  if (shouldRunIngest()) {
    console.log("⏰ Hourly Ingest Cycle Starting...");
    try {
      runIngestCycle(); 
      updateLastIngestTime();
    } catch (e) {
      logHistory("System", "Heartbeat", "Drive loop failed: " + e.message, "ERROR");
    }
  }
}

// ------------------------------------------
// PHASE 1: INBOX MANAGER
// ------------------------------------------
function processInbox() {
  if (typeof CONFIG === 'undefined') throw new Error("Config.gs missing");

  const lists = getTaskListsMap();
  if (!lists[CONFIG.SOURCE_LIST]) return;
  
  const inboxId = lists[CONFIG.SOURCE_LIST];
  let tasks;
  try { tasks = Tasks.Tasks.list(inboxId).items; } catch (e) { return; }

  if (!tasks || tasks.length === 0) { console.log("Inbox empty."); return; }

  tasks.forEach(task => {
    if (!task.title) return;
    console.log(`Processing Inbox: ${task.title}`);
    
    // ALL tasks go to the Project Manager now.
    // The Manager will delegate file creation via subtasks flags (!draft, !slide).
    handleTaskOrganization(task, inboxId, lists); 
  });
}

// ------------------------------------------
// PHASE 2: PROJECT WORKER (THE SWEEPER)
// ------------------------------------------
function processActiveProjects() {
  const lists = getTaskListsMap();
  
  CONFIG.TARGET_LISTS.forEach(listName => {
    if (!lists[listName]) return;
    const listId = lists[listName];
    
    let tasks;
    try { tasks = Tasks.Tasks.list(listId).items; } catch (e) { return; }

    if (!tasks || tasks.length === 0) return;

    tasks.forEach(task => {
      // Ignore completed tasks
      if (task.status === 'completed') return;

      // Check for Action Flags
      if (task.title.includes("!draft") || 
          task.title.includes("!slide") || 
          task.title.includes("!sheet")) {
            
        console.log(`⚡ Auto-Executing Worker: ${task.title} in ${listName}`);
        handleOfficeRequest(task, listId); // Execute & Complete
      }
    });
  });
}

// ------------------------------------------
// UTILS
// ------------------------------------------

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ NEXUS')
    .addItem('🔄 Force Sync (Inbox)', 'processInbox')
    .addItem('⚡ Run Project Sweeper', 'processActiveProjects')
    .addItem('🚀 RUN EVERYTHING', 'mainHeartbeat')
    .addSeparator()
    .addSubMenu(ui.createMenu('🏥 System Health')
        .addItem('🛠 Initialize System', 'initializeSystem')
        .addItem('🏥 Check Health Status', 'runHealthCheck'))
    .addSubMenu(ui.createMenu('🏗️ Architect')
        .addItem('📝 Update Manifesto', 'triggerManifestoUpdate'))
    .addToUi();
}

// Helper function to ask user what changed
function triggerManifestoUpdate() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('System Update', 'What feature or rule did you just add?', ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    const change = response.getResponseText();
    if (typeof updateManifesto === 'function') {
      updateManifesto(change);
      SpreadsheetApp.getActive().toast("✅ Manifesto Updated.", "Nexus Architect");
    }
  }
}

function shouldRunIngest() {
  const props = PropertiesService.getScriptProperties();
  const lastRun = parseInt(props.getProperty('LAST_INGEST_TIME') || '0');
  return (new Date().getTime() - lastRun) > (60 * 60 * 1000);
}

function updateLastIngestTime() {
  PropertiesService.getScriptProperties().setProperty('LAST_INGEST_TIME', new Date().getTime().toString());
}

function getTaskListsMap() {
  const allLists = Tasks.Tasklists.list().items;
  const map = {};
  allLists.forEach(l => map[l.title] = l.id);
  return map;
}
```

## FILE: Secrets.js
```javascript
// ==========================================
// 🔒 SECRETS VAULT
// This file is ignored by Git. Do not share.
// ==========================================

const SECRETS = {
  GEMINI_API_KEY: 'AIzaSyDVhFIRF9HQtRLT8Oh64GWlExVPQR9vrSQ'
};
```

## FILE: Setup_Drive.js
```javascript
function setupDriveWorkspace() {
  const ROOT_NAME = "Fast Work";
  
  // 1. Create (or find) Root Folder
  const roots = DriveApp.getFoldersByName(ROOT_NAME);
  let rootFolder;
  if (roots.hasNext()) {
    rootFolder = roots.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_NAME);
    // There is no strictly "Purple" enum in standard DriveApp, using generic logic or standard UI
    // Note: DriveApp has limited color setting via script compared to UI, 
    // but we can set specific predefined hex-like enums if using Advanced Drive Service.
    // For standard DriveApp, we often skip color coding via script or use descriptions.
    // However, we CAN organize them.
  }

  // 2. Define Categories and Color Hints (Standard DriveApp has specific color enums)
  // Mapping standard DriveApp colors roughly to your scheme:
  const STRUCTURE = [
    { name: 'Bayam', color: DriveApp.FolderColor.GRAY },       // Work
    { name: 'PITSA', color: DriveApp.FolderColor.RED },        // NGO
    { name: 'Music', color: DriveApp.FolderColor.ORANGE },     // Creative
    { name: 'iskandarzulqarnain', color: DriveApp.FolderColor.GREEN }, // Personal
    { name: 'Personal', color: DriveApp.FolderColor.GREEN },   // Family
    { name: 'Gmanage', color: DriveApp.FolderColor.BLUE }      // Legacy
  ];

  // 3. Create Sub-folders
  STRUCTURE.forEach(item => {
    const existing = rootFolder.getFoldersByName(item.name);
    let catFolder;
    if (existing.hasNext()) {
      catFolder = existing.next();
    } else {
      catFolder = rootFolder.createFolder(item.name);
    }
    // Set Color
    try {
      catFolder.setColor(item.color);
    } catch (e) {
      console.log(`Could not set color for ${item.name}: ${e.message}`);
    }
  });

  console.log("✅ Drive Workspace Architecture Created.");
}

function upgradeDriveToBrain() {
  const ROOT_NAME = "Fast Work";
  const root = DriveApp.getFoldersByName(ROOT_NAME).next();
  const subfolders = root.getFolders();
  
  while (subfolders.hasNext()) {
    const folder = subfolders.next();
    // Create _Brain folder if it doesn't exist
    if (!folder.getFoldersByName("_Brain").hasNext()) {
      folder.createFolder("_Brain");
      console.log(`🧠 Created Brain for ${folder.getName()}`);
    }
  }
}
```

## FILE: Worker_Drive.js
```javascript
// ==========================================
// MODULE: DRIVE & BRAIN MANAGER
// ==========================================

function createProjectFolder(categoryName, taskTitle, aiAnalysis) {
  const ROOT_NAME = "Fast Work";
  const root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_NAME);
  const catFolder = getOrCreateFolder(root, categoryName);

  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const folderName = `${dateStr}_${taskTitle.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}`;
  const taskFolder = catFolder.createFolder(folderName);

  const mdContent = `# Project: ${taskTitle}\n\n## Strategy\n${aiAnalysis.strategy}\n\n## Plan\n${aiAnalysis.subtasks.join('\n- ')}`;
  taskFolder.createFile("README.md", mdContent);

  return taskFolder.getUrl();
}

function getBrainContext(categoryName) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolders = root.getFoldersByName(categoryName);
    if (!catFolders.hasNext()) return "";
    
    const brainFolders = catFolders.next().getFoldersByName("_Brain");
    if (!brainFolders.hasNext()) return "";
    
    const files = brainFolders.next().getFiles();
    let context = "";
    while (files.hasNext()) {
      const f = files.next();
      if (f.getName().endsWith(".md") || f.getName().endsWith(".txt")) {
        context += `\n--- SOURCE: ${f.getName()} ---\n${f.getBlob().getDataAsString().substring(0, 3000)}\n`;
      }
    }
    return context.substring(0, 10000);
  } catch (e) { return ""; }
}

function updateBrainLog(categoryName, action, link) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolder = root.getFoldersByName(categoryName).hasNext() ? root.getFoldersByName(categoryName).next() : root.getFoldersByName("iskandarzulqarnain").next();
    const brainFolder = getOrCreateFolder(catFolder, "_Brain");
    
    const files = brainFolder.getFilesByName("HISTORY.md");
    let file, content = "";
    if (files.hasNext()) { file = files.next(); content = file.getBlob().getDataAsString(); }
    else { file = brainFolder.createFile("HISTORY.md", "# Log\n"); }

    const entry = `\n- **${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")}**: ${action} [Link](${link})`;
    file.setContent(content + entry);
  } catch(e) {}
}

function moveFileToCategory(fileId, categoryName) {
  try {
    const file = DriveApp.getFileById(fileId);
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const target = root.getFoldersByName(categoryName).hasNext() ? root.getFoldersByName(categoryName).next() : root.getFoldersByName("iskandarzulqarnain").next();
    file.moveTo(target);
  } catch(e) {}
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function initLibrary() {
  const root = DriveApp.getFoldersByName("Fast Work").next();
  if (!root.getFoldersByName("_Library").hasNext()) {
    root.createFolder("_Library");
    console.log("Created _Library folder.");
  }
}
```

## FILE: Worker_Ingest.js
```javascript
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
```

## FILE: Worker_Library.js
```javascript
// ==========================================
// MODULE: THE LIBRARIAN (Fact Checker)
// ==========================================

const GLOBAL_LIBRARY_FOLDER = "_Library";

/**
 * Searches the Global Library for context matching the task keywords.
 * Returns a string of "Facts" to inject into the AI prompt.
 */
function fetchLibraryFacts(taskTitle) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    
    // 1. Find or Create Library
    let libFolder;
    if (root.getFoldersByName(GLOBAL_LIBRARY_FOLDER).hasNext()) {
      libFolder = root.getFoldersByName(GLOBAL_LIBRARY_FOLDER).next();
    } else {
      libFolder = root.createFolder(GLOBAL_LIBRARY_FOLDER);
      libFolder.createFile("README.md", "# Global Library\nDrop company profiles, glossaries, and fact sheets here.");
      return ""; // Empty library, nothing to fetch
    }

    // 2. keyword Extraction (Simple approach: Split title into words)
    // We filter for "Proper Nouns" or acronyms (Capitalized words > 2 chars)
    const keywords = taskTitle.split(" ")
      .map(w => w.replace(/[^a-zA-Z0-9]/g, "")) // Clean punctuation
      .filter(w => w.length > 2 && /^[A-Z]/.test(w)); // Only Capitalized words (e.g. VDP, Petronas)

    if (keywords.length === 0) return "";

    console.log(`[Library] Searching facts for: ${keywords.join(", ")}`);

    // 3. Search Files
    // We look for files that HAVE these keywords in their content or title
    let foundFacts = "";
    const files = libFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      // Only check text/markdown to be fast
      if (file.getMimeType() === MimeType.PLAIN_TEXT || file.getName().endsWith(".md")) {
        const content = file.getBlob().getDataAsString();
        
        // Check if any keyword exists in this file
        const hasMatch = keywords.some(k => content.includes(k));
        
        if (hasMatch) {
          foundFacts += `\n--- FACT SOURCE: ${file.getName()} ---\n${content.substring(0, 1500)}\n`;
        }
      }
    }

    return foundFacts;

  } catch (e) {
    console.error("Library Error: " + e.message);
    return "";
  }
}
```

## FILE: Worker_Memory.js
```javascript
// ==========================================
// MODULE: NEXUS LONG-TERM MEMORY (The Associative Cortex)
// ==========================================

const MEMORY_FILE_NAME = "NEXUS_MEMORY.md";

/**
 * 1. READ MEMORY
 * Fetches the Master Knowledge Graph to inform the AI before it works.
 */
function getNexusMemory(category) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolders = root.getFoldersByName(category);
    if (!catFolders.hasNext()) return "";
    
    const brainFolders = catFolders.next().getFoldersByName("_Brain");
    if (!brainFolders.hasNext()) return "";
    
    const brain = brainFolders.next();
    const files = brain.getFilesByName(MEMORY_FILE_NAME);
    
    if (files.hasNext()) {
      return files.next().getBlob().getDataAsString();
    } else {
      // Initialize with KNOWLEDGE GRAPH structure if missing
      const initialMemory = `# ${category} KNOWLEDGE GRAPH\n\n## 1. Entity Relationships\n- [None]\n\n## 2. Active Contexts\n- [None]\n\n## 3. Recurring Themes\n- [None]`;
      brain.createFile(MEMORY_FILE_NAME, initialMemory);
      return initialMemory;
    }
  } catch (e) {
    console.error("Memory Read Error: " + e.message);
    return "";
  }
}

/**
 * 2. UPDATE MEMORY (The Learning Process)
 * Asks Gemini to merge new task info into the Knowledge Graph.
 */
function updateNexusMemory(category, taskTitle, taskOutcome, link) {
  console.log(`[Memory] 🧠 Linking Concepts & Entities for ${category}...`); 
  
  const currentMemory = getNexusMemory(category);
  
  // 1. CALL THE LIBRARIAN
  const libraryFacts = fetchLibraryFacts(taskTitle); // <--- NEW STEP
  
  const prompt = `
    You are the "Associative Cortex". Build the Knowledge Graph.
    
    === EXISTING GRAPH ===
    ${currentMemory}
    
    === GLOBAL LIBRARY FACTS (SOURCE OF TRUTH) ===
    ${libraryFacts || "No specific library records found."}
    
    === NEW DATA POINT ===
    Task: "${taskTitle}"
    Outcome: "${taskOutcome}"
    
    === RULE: SMART ENRICHMENT ===
    If the "Global Library Facts" define a term (e.g., "VDP"), use THAT definition to refine the graph.
    Example: If user says "VDP grant" but Library says "VDP is Petronas Vendor Dev Program", write:
    "* **VDP:** Petronas Vendor Development Program (Grant)."
    
    === INSTRUCTIONS ===
    1. Identify Entities & Relations.
    2. Cross-reference with Library Facts.
    3. Update the Graph in Markdown.
  `;
  
  const newMemoryContent = askGemini(prompt, "Return Markdown only.");
  
  if (newMemoryContent) {
    overwriteMemoryFile(category, newMemoryContent);
    console.log(`[Memory] ✅ Knowledge Graph Updated (Enriched by Library)`);
    logHistory("Memory", "Graph Update", `Linked entities in ${category} with Library Data`, "SUCCESS");
  } else {
    console.error(`[Memory] ❌ Failed to update graph.`);
  }
}

/**
 * Helper to overwrite the file
 */
function overwriteMemoryFile(category, newContent) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolder = root.getFoldersByName(category).next();
    const brain = catFolder.getFoldersByName("_Brain").next();
    
    const files = brain.getFilesByName(MEMORY_FILE_NAME);
    if (files.hasNext()) {
      files.next().setContent(newContent);
    } else {
      brain.createFile(MEMORY_FILE_NAME, newContent);
    }
  } catch (e) {
    console.error("Memory Write Error: " + e.message);
  }
}
```

## FILE: Worker_Office.js
```javascript
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
```

## FILE: Worker_Tasks.js
```javascript
// ==========================================
// MODULE: TASK WORKER (The Project Manager)
// ==========================================

function handleTaskOrganization(task, inboxId, listMap) {
  // 1. Setup
  const overrides = {
    isUrgent: task.title.includes("!urgent"),
    isProject: task.title.toLowerCase().includes("project")
  };

  // Fetch Memory
  let categoryHint = "iskandarzulqarnain";
  if (CONFIG && CONFIG.TARGET_LISTS) {
    CONFIG.TARGET_LISTS.forEach(l => { if(task.title.includes(l)) categoryHint = l; });
  }
  const masterMemory = getNexusMemory(categoryHint);

  // 2. Analyze & Plan
  const prompt = `
    Act as a Senior Project Manager. Plan this request: "${task.title}"
    Notes: "${task.notes || ''}"

    === MEMORY CONTEXT ===
    ${masterMemory.substring(0, 1500)}

    === LIST DEFINITIONS ===
    - 'Bayam': Work, Technical, Cloud, Corporate.
    - 'PITSA': NGO, Grants, Community.
    - 'Music': Creative, Arts.
    - 'Personal': Family, Health, Home.
    - 'iskandarzulqarnain': General/Default.
    ======================

    INSTRUCTIONS:
    1. Categorize into ONE of: ${JSON.stringify(CONFIG.TARGET_LISTS)}.
    2. Generate a "project_tag": e.g. [Bayam Cloud].
    3. Create "completion_plan" (3-6 steps).

    CRITICAL - DELEGATION RULES:
    - If a step requires writing a document, append ' !draft'.
    - If a step requires a presentation, append ' !slide'.
    - If a step requires data/finance, append ' !sheet'.
    - RULE: ONLY GENERATE ONE FILE PER TYPE. Consolidate similar outputs.

    Return JSON ONLY:
    {
      "targetList": "List Name",
      "cleanTitle": "Title",
      "project_tag": "[TAG]",
      "durationMinutes": 60,
      "strategy": "Strategy",
      "completion_plan": ["Step 1", "Step 2"],
      "shouldCalendar": boolean
    }
  `;

  const analysisStr = askGemini(prompt, "Return JSON only.");
  if (!analysisStr) return;
  const analysis = JSON.parse(analysisStr);

  // 3. Drive Logic
  let driveLink = "";
  if (analysis.durationMinutes >= 30 || overrides.isProject) {
    try { driveLink = createProjectFolder(analysis.targetList, analysis.cleanTitle, analysis); } catch (e) {}
  }

  // 4. Robust List Matching
  let targetListName = CONFIG.TARGET_LISTS[0];
  const cleanTarget = analysis.targetList.toLowerCase().trim();
  Object.keys(listMap).forEach(key => {
    if (key.toLowerCase().trim() === cleanTarget) targetListName = key;
  });
  const targetId = listMap[targetListName];

  // 5. Create Parent Task
  const parentNote = `🏷️ Context: ${analysis.project_tag}\n🧠 Strategy: ${analysis.strategy}\n` + (driveLink ? `📂 Workspace: ${driveLink}\n` : "") + `\nOriginal: ${task.notes || ''}`;

  const parentTask = Tasks.Tasks.insert({
    title: `${analysis.project_tag} ${analysis.cleanTitle}`,
    notes: parentNote,
    due: new Date().toISOString()
  }, targetId);

  // 6. Create Subtasks (NOW WITH CONTEXT!)
  Utilities.sleep(1000);
  if (analysis.completion_plan) {
    analysis.completion_plan.forEach(step => {
      try {
        const taggedTitle = `${analysis.project_tag} ${step}`;
        // CHANGED: We now pass the 'parentNote' to the child so the Worker knows the context!
        const child = Tasks.Tasks.insert({
          title: taggedTitle,
          notes: parentNote // <--- THIS IS THE CRITICAL FIX
        }, targetId);
        Tasks.Tasks.move(targetId, child.id, { parent: parentTask.id });
      } catch (e) {}
    });
  }

  // 7. Calendar
  if (analysis.shouldCalendar) createCalendarEvent(analysis.cleanTitle, analysis.durationMinutes, targetListName);

  // 8. Cleanup
  try {
    Tasks.Tasks.remove(inboxId, task.id);
    if (analysis.durationMinutes >= 30) {
       updateNexusMemory(targetListName, analysis.cleanTitle, analysis.strategy, driveLink || "Task List");
    }
    logHistory("Worker_Tasks", "Plan Executed", `Moved ${analysis.cleanTitle} to ${targetListName}`, "SUCCESS");
  } catch (e) {
    logHistory("Worker_Tasks", "Error", e.message, "ERROR");
  }
}

function createCalendarEvent(title, duration, listName) {
  try {
    let cal;
    const specificCalendars = CalendarApp.getCalendarsByName(listName);
    if (specificCalendars.length > 0) cal = specificCalendars[0];
    else cal = CalendarApp.getDefaultCalendar();

    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + (duration || 60));

    cal.createEvent(`[Focus] ${title}`, start, end, { description: "Auto-scheduled by Nexus" });
  } catch(e) {}
}
```

