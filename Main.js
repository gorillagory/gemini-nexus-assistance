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
        .addItem('📂 Sync Task Lists to Drive', 'syncFoldersWithTasks') // <--- NEW
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