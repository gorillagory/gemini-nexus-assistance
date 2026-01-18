// ==========================================
// CONFIGURATION (Sheet-Driven Edition)
// ==========================================

const CONFIG = {
  get API_KEY() { 
    if (typeof SECRETS !== 'undefined' && SECRETS.GEMINI_API_KEY) {
      return SECRETS.GEMINI_API_KEY;
    }
    return PropertiesService.getScriptProperties().getProperty('API_KEY');
  },

  SOURCE_LIST: 'Inbox', 

  /**
   * DYNAMIC: Reads the 'Settings' sheet to categorize lists.
   * This allows you to manage AI routing without touching code.
   */
  get LIST_MAP() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName("Settings");
      
      // If sheet doesn't exist, we fallback to a safe empty object
      if (!sheet) return {}; 

      const data = sheet.getDataRange().getValues();
      const map = {};
      
      // Skip header row [0], build map from rows
      for (let i = 1; i < data.length; i++) {
        const [name, cat, tags] = data[i];
        if (name) map[name] = { category: cat, context: tags };
      }
      return map;
    } catch (e) {
      console.error("Config Error: " + e.message);
      return {};
    }
  },

  // Helper to get just the names of lists currently being tracked in Settings
  get TARGET_LISTS() {
    return Object.keys(this.LIST_MAP);
  },

  MODEL_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
};