// ==========================================
// MODULE: TASK WORKER (Dynamic Dictionary Edition)
// ==========================================

function handleTaskOrganization(task, inboxId, listMap) {
  // 1. Setup
  const overrides = {
    isUrgent: task.title.includes("!urgent"),
    isProject: task.title.toLowerCase().includes("project")
  };

  // 2. FETCH LIVE CONTEXT FROM SETTINGS SHEET
  const liveMap = CONFIG.LIST_MAP;
  const listDefinitions = Object.entries(liveMap)
    .map(([name, info]) => `- '${name}': (${info.category}) ${info.context}`)
    .join('\n');

  let categoryHint = "iskandarzulqarnain";
  Object.keys(liveMap).forEach(l => { if(task.title.includes(l)) categoryHint = l; });
  const masterMemory = getNexusMemory(categoryHint);

  // 3. Analyze & Plan
  const prompt = `
    Act as a Senior Project Manager. Plan this request: "${task.title}"
    Notes: "${task.notes || ''}"

    === DYNAMIC LIST DICTIONARY (Categorization Rules) ===
    ${listDefinitions}
    =====================================================

    INSTRUCTIONS:
    1. Categorize into the most appropriate list from the dictionary.
    2. Generate a "project_tag": e.g. [Bayam Cloud].
    3. Create "completion_plan" (3-6 steps).
    4. Append ' !draft', ' !slide', or ' !sheet' to steps requiring file generation.

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

  // 4. Drive Logic
  let driveLink = "";
  if (analysis.durationMinutes >= 30 || overrides.isProject) {
    try { driveLink = createProjectFolder(analysis.targetList, analysis.cleanTitle, analysis); } catch (e) {}
  }

  // 5. Robust List Matching
  let targetListName = analysis.targetList;
  const targetId = listMap[targetListName] || listMap['iskandarzulqarnain'];

  // 6. Create Parent Task
  const parentNote = `🏷️ Context: ${analysis.project_tag}\n🧠 Strategy: ${analysis.strategy}\n` + (driveLink ? `📂 Workspace: ${driveLink}\n` : "") + `\nOriginal: ${task.notes || ''}`;

  const parentTask = Tasks.Tasks.insert({
    title: `${analysis.project_tag} ${analysis.cleanTitle}`,
    notes: parentNote,
    due: new Date().toISOString()
  }, targetId);

  // 7. Create Subtasks with Context
  if (analysis.completion_plan) {
    analysis.completion_plan.forEach(step => {
      try {
        const taggedTitle = `${analysis.project_tag} ${step}`;
        const child = Tasks.Tasks.insert({ 
          title: taggedTitle,
          notes: parentNote 
        }, targetId);
        Tasks.Tasks.move(targetId, child.id, { parent: parentTask.id });
      } catch (e) {}
    });
  }

  // 8. Cleanup & Log
  try {
    Tasks.Tasks.remove(inboxId, task.id);
    logHistory("Worker_Tasks", "Plan Executed", `Moved ${analysis.cleanTitle} to ${targetListName}`, "SUCCESS");
  } catch (e) {
    logHistory("Worker_Tasks", "Error", e.message, "ERROR");
  }
}

// ... (Keep createCalendarEvent)

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