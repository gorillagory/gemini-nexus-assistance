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