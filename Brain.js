// ==========================================
// MODULE: AI INTERFACE
// ==========================================

function askGemini(prompt, systemInstruction = "You are a helpful assistant.") {
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] }
  };

  try {
    // console.log("🤖 Asking Gemini..."); // Optional: Uncomment to debug speed
    
    const response = UrlFetchApp.fetch(`${CONFIG.MODEL_URL}?key=${CONFIG.API_KEY}`, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });
    
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      console.error(`❌ Gemini API Error (${responseCode}): ` + response.getContentText());
      return null;
    }
    
    const json = JSON.parse(response.getContentText());

    if (!json.candidates || !json.candidates[0].content) {
      console.error("❌ Gemini returned empty candidates (Safety Filter Triggered?)");
      return null;
    }

    const rawText = json.candidates[0].content.parts[0].text;
    return rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
  } catch (e) {
    console.error("❌ Gemini Connection Failure: " + e.toString());
    return null;
  }
}