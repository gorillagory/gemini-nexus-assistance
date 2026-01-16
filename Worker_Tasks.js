// ==========================================
// MODULE: TASK WORKER (The Project Manager)
// ==========================================

function handleTaskOrganization(task, inboxId, listMap) {
  // 1. Setup
  const overrides = {
    isUrgent: task.title.includes("!urgent"),
    isProject: task.title.toLowerCase().includes("project")
  };

  // Fetch Memory
  let categoryHint = "iskandarzulqarnain";
  if (CONFIG && CONFIG.TARGET_LISTS) {
    CONFIG.TARGET_LISTS.forEach(l => { if(task.title.includes(l)) categoryHint = l; });
  }
  const masterMemory = getNexusMemory(categoryHint);

  // 2. Analyze & Plan
  const prompt = `
    Act as a Senior Project Manager. Plan this request: "${task.title}"
    Notes: "${task.notes || ''}"

    === MEMORY CONTEXT ===
    ${masterMemory.substring(0, 1500)}

    === LIST DEFINITIONS ===
    - 'Bayam': Work, Technical, Cloud, Corporate.
    - 'PITSA': NGO, Grants, Community.
    - 'Music': Creative, Arts.
    - 'Personal': Family, Health, Home.
    - 'iskandarzulqarnain': General/Default.
    ======================

    INSTRUCTIONS:
    1. Categorize into ONE of: ${JSON.stringify(CONFIG.TARGET_LISTS)}.
    2. Generate a "project_tag": e.g. [Bayam Cloud].
    3. Create "completion_plan" (3-6 steps).

    CRITICAL - DELEGATION RULES:
    - If a step requires writing a document, append ' !draft'.
    - If a step requires a presentation, append ' !slide'.
    - If a step requires data/finance, append ' !sheet'.
    - RULE: ONLY GENERATE ONE FILE PER TYPE. Consolidate similar outputs.

    Return JSON ONLY:
    {
      "targetList": "List Name",
      "cleanTitle": "Title",
      "project_tag": "[TAG]",
      "durationMinutes": 60,
      "strategy": "Strategy",
      "completion_plan": ["Step 1", "Step 2"],
      "shouldCalendar": boolean
    }
  `;

  const analysisStr = askGemini(prompt, "Return JSON only.");
  if (!analysisStr) return;
  const analysis = JSON.parse(analysisStr);

  // 3. Drive Logic
  let driveLink = "";
  if (analysis.durationMinutes >= 30 || overrides.isProject) {
    try { driveLink = createProjectFolder(analysis.targetList, analysis.cleanTitle, analysis); } catch (e) {}
  }

  // 4. Robust List Matching
  let targetListName = CONFIG.TARGET_LISTS[0];
  const cleanTarget = analysis.targetList.toLowerCase().trim();
  Object.keys(listMap).forEach(key => {
    if (key.toLowerCase().trim() === cleanTarget) targetListName = key;
  });
  const targetId = listMap[targetListName];

  // 5. Create Parent Task
  const parentNote = `🏷️ Context: ${analysis.project_tag}\n🧠 Strategy: ${analysis.strategy}\n` + (driveLink ? `📂 Workspace: ${driveLink}\n` : "") + `\nOriginal: ${task.notes || ''}`;

  const parentTask = Tasks.Tasks.insert({
    title: `${analysis.project_tag} ${analysis.cleanTitle}`,
    notes: parentNote,
    due: new Date().toISOString()
  }, targetId);

  // 6. Create Subtasks (NOW WITH CONTEXT!)
  Utilities.sleep(1000);
  if (analysis.completion_plan) {
    analysis.completion_plan.forEach(step => {
      try {
        const taggedTitle = `${analysis.project_tag} ${step}`;
        // CHANGED: We now pass the 'parentNote' to the child so the Worker knows the context!
        const child = Tasks.Tasks.insert({
          title: taggedTitle,
          notes: parentNote // <--- THIS IS THE CRITICAL FIX
        }, targetId);
        Tasks.Tasks.move(targetId, child.id, { parent: parentTask.id });
      } catch (e) {}
    });
  }

  // 7. Calendar
  if (analysis.shouldCalendar) createCalendarEvent(analysis.cleanTitle, analysis.durationMinutes, targetListName);

  // 8. Cleanup
  try {
    Tasks.Tasks.remove(inboxId, task.id);
    if (analysis.durationMinutes >= 30) {
       updateNexusMemory(targetListName, analysis.cleanTitle, analysis.strategy, driveLink || "Task List");
    }
    logHistory("Worker_Tasks", "Plan Executed", `Moved ${analysis.cleanTitle} to ${targetListName}`, "SUCCESS");
  } catch (e) {
    logHistory("Worker_Tasks", "Error", e.message, "ERROR");
  }
}

function createCalendarEvent(title, duration, listName) {
  try {
    let cal;
    const specificCalendars = CalendarApp.getCalendarsByName(listName);
    if (specificCalendars.length > 0) cal = specificCalendars[0];
    else cal = CalendarApp.getDefaultCalendar();

    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + (duration || 60));

    cal.createEvent(`[Focus] ${title}`, start, end, { description: "Auto-scheduled by Nexus" });
  } catch(e) {}
}