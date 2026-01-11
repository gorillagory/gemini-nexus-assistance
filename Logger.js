// ==========================================
// MODULE: IMMUTABLE HISTORIAN
// ==========================================

const LOG_SHEET_NAME = "History";

/**
 * Appends a log entry to the History sheet.
 * @param {string} module - e.g., "Main", "Worker_Tasks", "Drive"
 * @param {string} action - e.g., "Task Moved", "File Created", "Error"
 * @param {string} details - Specific info (Title, URL, etc.)
 * @param {string} status - "SUCCESS", "WARNING", "ERROR"
 */
function logHistory(module, action, details, status = "SUCCESS") {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(LOG_SHEET_NAME);

    // 1. Create Sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET_NAME);
      // Create Header Row
      const headers = [["TIMESTAMP", "MODULE", "ACTION", "DETAILS", "STATUS"]];
      sheet.getRange(1, 1, 1, 5).setValues(headers)
           .setFontWeight("bold")
           .setBackground("#202124") // Dark header
           .setFontColor("white");
      sheet.setFrozenRows(1);
      
      // Protect Sheet (Make it "Immutable" for editors except you/script)
      const protection = sheet.protect().setDescription('Immutable History Log');
      protection.setWarningOnly(true); // Warns you if you try to edit manually
    }

    // 2. Prepare Data
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    // 3. Append Row (Append Only = Immutable History)
    sheet.appendRow([timestamp, module, action, details, status]);

    // 4. Color Code Status Column (Visual Cue)
    const lastRow = sheet.getLastRow();
    const statusCell = sheet.getRange(lastRow, 5);
    
    if (status === "ERROR") statusCell.setBackground("#fce8e6").setFontColor("#c5221f"); // Red
    else if (status === "WARNING") statusCell.setBackground("#ffeec5").setFontColor("#b06000"); // Yellow
    else statusCell.setBackground("#e6f4ea").setFontColor("#137333"); // Green

  } catch (e) {
    console.error("Logger Failed: " + e.message);
  }
}