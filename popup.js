document.addEventListener('DOMContentLoaded', () => {
  const newFolderForm = document.getElementById('new-folder-form');
  const folderNameInput = document.getElementById('folder-name-input');
  const foldersList = document.getElementById('folders-list');
  const imagesContainer = document.getElementById('images-container');

  let pinboardData = {}; // A local cache of our data

  // Function to get data from storage
  const getPinboardData = async () => {
    const result = await chrome.storage.local.get(['pinboard']);
    return result.pinboard || { folders: { 'Default': [] } };
  };

  // Function to save data to storage
  const savePinboardData = async () => {
    await chrome.storage.local.set({ pinboard: pinboardData });
  };

  // --- Display Functions ---

  const displayFolders = () => {
    foldersList.innerHTML = ''; // Clear current list
    const folderNames = Object.keys(pinboardData.folders);

    folderNames.forEach(name => {
      const folderDiv = document.createElement('div');
      folderDiv.textContent = name;
      folderDiv.className = 'folder-item';
      folderDiv.addEventListener('click', () => {
        // Highlight active folder
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        folderDiv.classList.add('active');
        displayImages(name);
      });
      foldersList.appendChild(folderDiv);
    });
  };

  const displayImages = (folderName) => {
    imagesContainer.innerHTML = ''; // Clear current images
    const images = pinboardData.folders[folderName];

    if (!images || images.length === 0) {
      imagesContainer.innerHTML = `<h2>No images in "${folderName}".</h2>`;
      return;
    }

    images.forEach(image => {
      const imageCard = document.createElement('div');
      imageCard.className = 'image-card';
      
      const img = document.createElement('img');
      img.src = image.src;
      img.title = `Click to open original page`;
      img.addEventListener('click', () => chrome.tabs.create({ url: image.page }));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteImage(folderName, image.id));

      imageCard.appendChild(img);
      imageCard.appendChild(deleteBtn);
      imagesContainer.appendChild(imageCard);
    });
  };

  // --- Event Handler Functions ---

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const folderName = folderNameInput.value.trim();
    if (folderName && !pinboardData.folders[folderName]) {
      pinboardData.folders[folderName] = [];
      await savePinboardData();
      folderNameInput.value = '';
      displayFolders();
    }
  };

  const deleteImage = async (folderName, imageId) => {
    // Filter out the image with the matching id
    pinboardData.folders[folderName] = pinboardData.folders[folderName].filter(
      (image) => image.id !== imageId
    );
    await savePinboardData();
    // Refresh the view for the current folder
    displayImages(folderName);
  };
  
  // --- Initialization ---

  const initialize = async () => {
    pinboardData = await getPinboardData();
    displayFolders();
    
    // Automatically select and display the first folder if it exists
    const firstFolder = foldersList.querySelector('.folder-item');
    if (firstFolder) {
      firstFolder.click();
    }
  };

  // Add event listeners
  newFolderForm.addEventListener('submit', handleCreateFolder);

  // Initial load
  initialize();
});