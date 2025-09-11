// Function to get our data from storage
const getPinboardData = async () => {
  const result = await chrome.storage.local.get(['pinboard']);
  // If no data exists, initialize with a default structure
  return result.pinboard || { folders: { 'Default': [] } };
};

// Create the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToPinboard",
    title: "Save Image to Pinboard",
    contexts: ["image"] // This makes it appear only when you right-click an image
  });
});

// Listen for when the context menu item is clicked
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveToPinboard") {
    const imageUrl = info.srcUrl;
    const pageUrl = info.pageUrl;

    if (!imageUrl) {
      console.error("Pinboard: No image URL found.");
      return;
    }

    const data = await getPinboardData();
    
    // Create an object for the new image
    const newImage = {
      src: imageUrl,
      page: pageUrl,
      id: `img-${Date.now()}` // Unique ID for easy deletion
    };

    // Add the new image to the 'Default' folder
    // In a future version, you could let the user choose the folder here!
    data.folders['Default'].push(newImage);

    // Save the updated data back to storage
    await chrome.storage.local.set({ pinboard: data });

    console.log("Pinboard: Image saved!", newImage);
  }
});