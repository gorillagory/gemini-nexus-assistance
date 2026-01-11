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