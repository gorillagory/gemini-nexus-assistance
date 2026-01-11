// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  // 1. Try to read from local Secrets.js (for Clasp push)
  // 2. Fallback to ScriptProperties (for Cloud manual entry)
  API_KEY: typeof SECRETS !== 'undefined' ? SECRETS.GEMINI_API_KEY : PropertiesService.getScriptProperties().getProperty('API_KEY'), 
  
  SOURCE_LIST: 'Inbox', 
  
  TARGET_LISTS: [
    'iskandarzulqarnain', 
    'Personal',           
    'Bayam',              
    'PITSA',              
    'Music',              
    'Gmanage'             
  ],

  MODEL_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
};