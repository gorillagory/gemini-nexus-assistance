// ==========================================
// MODULE: AI INTERFACE (With Retry Logic)
// ==========================================

function askGemini(prompt, systemInstruction = "You are a helpful assistant.") {
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  };

  // RETRY LOOP (Max 3 attempts)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = UrlFetchApp.fetch(`${CONFIG.MODEL_URL}?key=${CONFIG.API_KEY}`, options);
      const responseCode = response.getResponseCode();
      
      // SUCCESS
      if (responseCode === 200) {
        const json = JSON.parse(response.getContentText());
        if (!json.candidates || !json.candidates[0].content) return null;
        return json.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      
      // RATE LIMIT (429) - WAIT AND RETRY
      if (responseCode === 429) {
        console.warn(`⚠️ Quota Hit (429). Waiting 10s before retry ${attempt}...`);
        Utilities.sleep(10000); // Wait 10 seconds
        continue; // Try again
      }

      // OTHER ERRORS
      console.error(`❌ Gemini API Error (${responseCode}): ` + response.getContentText());
      return null;

    } catch (e) {
      console.error(`❌ Connection Failed (Attempt ${attempt}): ` + e.toString());
      Utilities.sleep(2000);
    }
  }
  
  return null; // Failed after 3 attempts
}