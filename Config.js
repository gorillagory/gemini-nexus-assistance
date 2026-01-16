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