// ==========================================
// MODULE: MAIN ORCHESTRATOR
// ==========================================

/**
 * TRIGGER: Run this every 5-10 minutes (Time-driven)
 */
function mainHeartbeat() {
  // 1. FAST LOOP: Always process tasks
  try {
    processInbox(); 
  } catch (e) {
    console.error("Heartbeat Task Error: " + e.message);
    logHistory("System", "Heartbeat", "Task loop failed: " + e.message, "ERROR");
  }

  // 2. SLOW LOOP: Process Drive Ingest (Hourly)
  if (shouldRunIngest()) {
    console.log("⏰ Hourly Ingest Cycle Starting...");
    try {
      runIngestCycle(); // From Worker_Ingest.gs
      updateLastIngestTime();
    } catch (e) {
      console.error("Heartbeat Drive Error: " + e.message);
      logHistory("System", "Heartbeat", "Drive loop failed: " + e.message, "ERROR");
    }
  }
}

// ------------------------------------------
// TRAFFIC CONTROLLER (Decides what to do)
// ------------------------------------------
function processInbox() {
  if (typeof CONFIG === 'undefined') throw new Error("Config.gs missing");

  const lists = getTaskListsMap();
  if (!lists[CONFIG.SOURCE_LIST]) { 
    console.error(`Inbox list "${CONFIG.SOURCE_LIST}" not found.`); 
    return; 
  }
  
  const inboxId = lists[CONFIG.SOURCE_LIST];
  let tasks;
  
  try {
    tasks = Tasks.Tasks.list(inboxId).items;
  } catch (e) {
    console.error("API Error: " + e.message);
    return;
  }

  if (!tasks || tasks.length === 0) { 
    console.log("Inbox empty."); 
    return; 
  }

  tasks.forEach(task => {
    if (!task.title) return;
    console.log(`Processing: ${task.title}`);

    // ROUTE A: Office Work (!slide, !draft, !sheet)
    if (task.title.toLowerCase().includes("!slide") || 
        task.title.toLowerCase().includes("!draft") || 
        task.title.toLowerCase().includes("!sheet") ||
        task.title.toLowerCase().includes("!summary")) {
      
      handleOfficeRequest(task, inboxId); // Calls Worker_Office.gs

    } 
    // ROUTE B: Standard Organization
    else {
      handleTaskOrganization(task, inboxId, lists); // Calls Worker_Tasks.gs
    }
  });
}

// ------------------------------------------
// DASHBOARD & UTILS (UNIFIED MENU)
// ------------------------------------------

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ NEXUS')
    // 1. Main Controls
    .addItem('🔄 Force Sync (Inbox)', 'processInbox')
    .addItem('🧠 Force Ingest (Drive)', 'runIngestCycle')
    .addItem('🚀 RUN EVERYTHING', 'forceRunAll')
    .addSeparator()
    
    // 2. Admin Submenu (From Admin_Health.gs)
    .addSubMenu(ui.createMenu('🏥 System Health')
        .addItem('🛠 Initialize System', 'initializeSystem')
        .addItem('🏥 Check Health Status', 'runHealthCheck'))
        
    // 3. Architect Submenu (From Admin_Architect.gs)
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
    SpreadsheetApp.getActive().toast("🏗️ Updating Architecture...", "Nexus Architect");
    
    // Call the new module
    if (typeof updateManifesto === 'function') {
      updateManifesto(change);
      SpreadsheetApp.getActive().toast("✅ Manifesto Updated.", "Nexus Architect");
    } else {
      SpreadsheetApp.getActive().toast("❌ Admin_Architect.gs missing!", "Error");
    }
  }
}

function forceRunAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast("🚀 Starting Full System Sync...", "Nexus Agent");
  
  logHistory("System", "Manual Sync", "User initiated force sync", "INFO");
  
  try {
    processInbox();
    ss.toast("✅ Inbox Cleared. Checking Drive...", "Nexus Agent");
    
    runIngestCycle();
    
    // Update Dashboard Timestamp
    const sheet = ss.getSheetByName("Nexus Dashboard") || ss.getActiveSheet();
    const time = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss");
    sheet.getRange("B2").setValue(`Last Run: ${time}`).setFontColor("green");
    
    ss.toast("✅ System Sync Complete.", "Nexus Agent");
    logHistory("System", "Manual Sync", "Sync completed successfully", "SUCCESS");
    
  } catch (e) {
    ss.toast("❌ Error: " + e.message, "Nexus Agent");
    logHistory("System", "Manual Sync", e.message, "ERROR");
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