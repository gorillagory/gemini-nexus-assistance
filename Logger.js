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