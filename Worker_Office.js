// ==========================================
// MODULE: OFFICE WORKER
// ==========================================

function handleOfficeRequest(task, inboxId) {
  const title = task.title.toLowerCase();
  
  let category = "iskandarzulqarnain";
  CONFIG.TARGET_LISTS.forEach(list => {
    if (title.includes(list.toLowerCase())) category = list;
  });

  // 2. Fetch "Brain" Context (Master Memory + Specific Files)
  const masterMemory = getNexusMemory(category); // High Level
  const fileContext = getBrainContext(category); // Low Level (Specific Docs)
  const context = `MASTER MEMORY:\n${masterMemory}\n\nSPECIFIC FILES:\n${fileContext}`;
  let fileUrl = "";
  
  if (title.includes("!slide")) {
    fileUrl = generateSlides(task, context, category);
  } else if (title.includes("!sheet")) {
    fileUrl = generateSheet(task, context, category);
  } else {
    fileUrl = generateDoc(task, context, category);
  }

  updateBrainLog(category, `Generated content: "${task.title}"`, fileUrl);
  logHistory("Worker_Office", "Content Created", `Created ${task.title}`, "SUCCESS");

  task.notes = `✅ Content Created: ${fileUrl}\n\nOriginal: ${task.notes}`;
  task.title = "[DONE] " + task.title;
  
  try { Tasks.Tasks.update(task, inboxId, task.id); } catch (e) {}
}

// --- GENERATORS ---
function generateDoc(task, context, category) {
  const prompt = `Role: Assistant for ${category}. Write document: "${task.title}". Notes: "${task.notes}". Context: ${context}. Return Markdown text.`;
  const content = askGemini(prompt, "You are a writer.");
  
  const doc = DocumentApp.create(`[DRAFT] ${task.title.replace("!draft", "").trim()}`);
  doc.getBody().setText(content);
  moveFileToCategory(doc.getId(), category);
  return doc.getUrl();
}

function generateSlides(task, context, category) {
  const prompt = `Role: Designer for ${category}. Create slides for: "${task.title}". Notes: "${task.notes}". Context: ${context}. Return JSON array: [{"title": "T", "bullets": ["A","B"]}]. Limit 5 slides.`;
  const jsonStr = askGemini(prompt, "Return JSON only.");
  const slidesData = JSON.parse(jsonStr);
  
  const deck = SlidesApp.create(`[SLIDES] ${task.title.replace("!slide", "").trim()}`);
  slidesData.forEach(s => {
    const slide = deck.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    try {
      slide.getShapes()[0].getText().setText(s.title);
      slide.getShapes()[1].getText().setText(s.bullets.join('\n'));
    } catch(e){}
  });
  moveFileToCategory(deck.getId(), category);
  return deck.getUrl();
}

function generateSheet(task, context, category) {
  const prompt = `Role: Analyst for ${category}. Create spreadsheet for: "${task.title}". Notes: "${task.notes}". Context: ${context}. Return JSON 2D Array.`;
  const jsonStr = askGemini(prompt, "Return JSON only.");
  const rows = JSON.parse(jsonStr);
  
  const ss = SpreadsheetApp.create(`[DATA] ${task.title.replace("!sheet", "").trim()}`);
  const sheet = ss.getActiveSheet();
  if (rows.length > 0) sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  moveFileToCategory(ss.getId(), category);
  return ss.getUrl();
}