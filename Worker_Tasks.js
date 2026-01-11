// ==========================================
// MODULE: TASK WORKER (Context & Tagging Edition)
// ==========================================

function handleTaskOrganization(task, inboxId, listMap) {
  // 1. Setup
  const overrides = { 
    isUrgent: task.title.includes("!urgent"),
    isProject: task.title.toLowerCase().includes("project")
  };
  
  // NEW: Fetch Memory to help decide the tag
  let categoryHint = "iskandarzulqarnain";
  CONFIG.TARGET_LISTS.forEach(l => { if(task.title.includes(l)) categoryHint = l; });
  const masterMemory = getNexusMemory(categoryHint); 

  // 2. Analyze
  const prompt = `
    Act as a Project Manager. Plan this task: "${task.title}"
    Notes: "${task.notes || ''}"
    
    === MEMORY CONTEXT ===
    ${masterMemory.substring(0, 1500)}
    ======================

    INSTRUCTIONS:
    1. Categorize into: ${JSON.stringify(CONFIG.TARGET_LISTS)}.
    2. Generate a "project_tag": A short, bracketed identifier like [Bayam VDP] or [PITSA PKNS] or [Music].
    3. Create "completion_plan": 3-6 steps.
    
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

  // 4. Create Parent Task
  const targetListName = listMap[analysis.targetList] ? analysis.targetList : CONFIG.TARGET_LISTS[0];
  const targetId = listMap[targetListName];
  const parentNote = `🏷️ Context: ${analysis.project_tag}\n🧠 Strategy: ${analysis.strategy}\n` + (driveLink ? `📂 Workspace: ${driveLink}\n` : "") + `\nOriginal: ${task.notes || ''}`;

  const parentTask = Tasks.Tasks.insert({
    title: `${analysis.project_tag} ${analysis.cleanTitle}`, // Add tag to main title too? Optional.
    notes: parentNote,
    due: new Date().toISOString()
  }, targetId);

  // 5. Create Subtasks (With INHERITED TAGS)
  Utilities.sleep(1000); 
  if (analysis.completion_plan) {
    analysis.completion_plan.forEach(step => {
      try {
        // HERE IS THE MAGIC: We prepend the tag to every subtask
        const taggedTitle = `${analysis.project_tag} ${step}`;
        
        const child = Tasks.Tasks.insert({ title: taggedTitle }, targetId);
        Tasks.Tasks.move(targetId, child.id, { parent: parentTask.id });
      } catch (e) {}
    });
  }

  // 6. Calendar
  if (analysis.shouldCalendar) createCalendarEvent(analysis.cleanTitle, analysis.durationMinutes, targetListName);

  // 7. Cleanup & Learn
  try {
    Tasks.Tasks.remove(inboxId, task.id);
    if (analysis.durationMinutes >= 30) { 
       updateNexusMemory(analysis.targetList, analysis.cleanTitle, analysis.strategy, driveLink || "Task List");
    }
    logHistory("Worker_Tasks", "Task Organized", `Tagged ${analysis.cleanTitle} as ${analysis.project_tag}`, "SUCCESS");
  } catch (e) {
    logHistory("Worker_Tasks", "Error", e.message, "ERROR");
  }
}

function createCalendarEvent(title, duration, listName) {
  let cal;
  const specificCalendars = CalendarApp.getCalendarsByName(listName);
  if (specificCalendars.length > 0) cal = specificCalendars[0];
  else cal = CalendarApp.getDefaultCalendar();

  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + (duration || 60));
  
  cal.createEvent(`[Focus] ${title}`, start, end, { description: "Auto-scheduled by Nexus" });
}