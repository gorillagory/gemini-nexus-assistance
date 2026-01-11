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