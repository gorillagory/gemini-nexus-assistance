// ==========================================
// MODULE: DRIVE & BRAIN MANAGER
// ==========================================

function createProjectFolder(categoryName, taskTitle, aiAnalysis) {
  const ROOT_NAME = "Fast Work";
  const root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_NAME);
  const catFolder = getOrCreateFolder(root, categoryName);

  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const folderName = `${dateStr}_${taskTitle.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}`;
  const taskFolder = catFolder.createFolder(folderName);

  const mdContent = `# Project: ${taskTitle}\n\n## Strategy\n${aiAnalysis.strategy}\n\n## Plan\n${aiAnalysis.subtasks.join('\n- ')}`;
  taskFolder.createFile("README.md", mdContent);

  return taskFolder.getUrl();
}

function getBrainContext(categoryName) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolders = root.getFoldersByName(categoryName);
    if (!catFolders.hasNext()) return "";
    
    const brainFolders = catFolders.next().getFoldersByName("_Brain");
    if (!brainFolders.hasNext()) return "";
    
    const files = brainFolders.next().getFiles();
    let context = "";
    while (files.hasNext()) {
      const f = files.next();
      if (f.getName().endsWith(".md") || f.getName().endsWith(".txt")) {
        context += `\n--- SOURCE: ${f.getName()} ---\n${f.getBlob().getDataAsString().substring(0, 3000)}\n`;
      }
    }
    return context.substring(0, 10000);
  } catch (e) { return ""; }
}

function updateBrainLog(categoryName, action, link) {
  try {
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const catFolder = root.getFoldersByName(categoryName).hasNext() ? root.getFoldersByName(categoryName).next() : root.getFoldersByName("iskandarzulqarnain").next();
    const brainFolder = getOrCreateFolder(catFolder, "_Brain");
    
    const files = brainFolder.getFilesByName("HISTORY.md");
    let file, content = "";
    if (files.hasNext()) { file = files.next(); content = file.getBlob().getDataAsString(); }
    else { file = brainFolder.createFile("HISTORY.md", "# Log\n"); }

    const entry = `\n- **${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm")}**: ${action} [Link](${link})`;
    file.setContent(content + entry);
  } catch(e) {}
}

function moveFileToCategory(fileId, categoryName) {
  try {
    const file = DriveApp.getFileById(fileId);
    const root = DriveApp.getFoldersByName("Fast Work").next();
    const target = root.getFoldersByName(categoryName).hasNext() ? root.getFoldersByName(categoryName).next() : root.getFoldersByName("iskandarzulqarnain").next();
    file.moveTo(target);
  } catch(e) {}
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function initLibrary() {
  const root = DriveApp.getFoldersByName("Fast Work").next();
  if (!root.getFoldersByName("_Library").hasNext()) {
    root.createFolder("_Library");
    console.log("Created _Library folder.");
  }
}