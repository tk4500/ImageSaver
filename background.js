// --- Storage Key Constants ---
const FOLDER_LIST_KEY = 'pinboard_folders';
const getFolderDataKey = (folderName) => `pinboard_data_${folderName}`;

// Function to get the list of folder names
const getFolderList = async () => {
  const result = await chrome.storage.local.get(FOLDER_LIST_KEY);
  // If no folder list exists, initialize it with 'Default'
  if (!result[FOLDER_LIST_KEY]) {
    const defaultFolders = ['Default'];
    await chrome.storage.local.set({ [FOLDER_LIST_KEY]: defaultFolders });
    // Also initialize the data for the 'Default' folder
    await chrome.storage.local.set({ [getFolderDataKey('Default')]: [] });
    return defaultFolders;
  }
  return result[FOLDER_LIST_KEY];
};

// --- Core Function to Build the Dynamic Context Menu ---
const updateContextMenu = async () => {
  await chrome.contextMenus.removeAll();
  const folderNames = await getFolderList();

  chrome.contextMenus.create({
    id: "pinboard-parent",
    title: "Save Image to Pinboard",
    contexts: ["image"]
  });

  if (folderNames.length === 0) return;

  folderNames.forEach(folderName => {
    chrome.contextMenus.create({
      id: `save-to-${folderName}`,
      parentId: "pinboard-parent",
      title: folderName,
      contexts: ["image"]
    });
  });
};

// --- Event Listeners ---

// 1. When installed, build the menu for the first time.
chrome.runtime.onInstalled.addListener(() => {
  updateContextMenu();
});

// 2. Listen for changes ONLY to the folder list to rebuild the menu.
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes[FOLDER_LIST_KEY]) {
    console.log("Pinboard folder list changed. Rebuilding context menu.");
    updateContextMenu();
  }
});

// 3. Listen for a click on a context menu item.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId && info.menuItemId.toString().startsWith('save-to-')) {
    const imageUrl = info.srcUrl;
    const pageUrl = info.pageUrl;
    const folderName = info.menuItemId.toString().substring('save-to-'.length);
    const folderDataKey = getFolderDataKey(folderName);

    if (!imageUrl) return;

    // Get the data for THIS SPECIFIC FOLDER
    const result = await chrome.storage.local.get(folderDataKey);
    const folderImages = result[folderDataKey] || [];

    const newImage = {
      src: imageUrl,
      id: `img-${Date.now()}`
    };

    folderImages.push(newImage);

    // Save the data for THIS SPECIFIC FOLDER
    await chrome.storage.local.set({ [folderDataKey]: folderImages });
    console.log(`Pinboard: Image saved to "${folderName}"!`);
  }
});