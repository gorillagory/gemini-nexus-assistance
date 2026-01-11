function setupDriveWorkspace() {
  const ROOT_NAME = "Fast Work";
  
  // 1. Create (or find) Root Folder
  const roots = DriveApp.getFoldersByName(ROOT_NAME);
  let rootFolder;
  if (roots.hasNext()) {
    rootFolder = roots.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_NAME);
    // There is no strictly "Purple" enum in standard DriveApp, using generic logic or standard UI
    // Note: DriveApp has limited color setting via script compared to UI, 
    // but we can set specific predefined hex-like enums if using Advanced Drive Service.
    // For standard DriveApp, we often skip color coding via script or use descriptions.
    // However, we CAN organize them.
  }

  // 2. Define Categories and Color Hints (Standard DriveApp has specific color enums)
  // Mapping standard DriveApp colors roughly to your scheme:
  const STRUCTURE = [
    { name: 'Bayam', color: DriveApp.FolderColor.GRAY },       // Work
    { name: 'PITSA', color: DriveApp.FolderColor.RED },        // NGO
    { name: 'Music', color: DriveApp.FolderColor.ORANGE },     // Creative
    { name: 'iskandarzulqarnain', color: DriveApp.FolderColor.GREEN }, // Personal
    { name: 'Personal', color: DriveApp.FolderColor.GREEN },   // Family
    { name: 'Gmanage', color: DriveApp.FolderColor.BLUE }      // Legacy
  ];

  // 3. Create Sub-folders
  STRUCTURE.forEach(item => {
    const existing = rootFolder.getFoldersByName(item.name);
    let catFolder;
    if (existing.hasNext()) {
      catFolder = existing.next();
    } else {
      catFolder = rootFolder.createFolder(item.name);
    }
    // Set Color
    try {
      catFolder.setColor(item.color);
    } catch (e) {
      console.log(`Could not set color for ${item.name}: ${e.message}`);
    }
  });

  console.log("✅ Drive Workspace Architecture Created.");
}

function upgradeDriveToBrain() {
  const ROOT_NAME = "Fast Work";
  const root = DriveApp.getFoldersByName(ROOT_NAME).next();
  const subfolders = root.getFolders();
  
  while (subfolders.hasNext()) {
    const folder = subfolders.next();
    // Create _Brain folder if it doesn't exist
    if (!folder.getFoldersByName("_Brain").hasNext()) {
      folder.createFolder("_Brain");
      console.log(`🧠 Created Brain for ${folder.getName()}`);
    }
  }
}