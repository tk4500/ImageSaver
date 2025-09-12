document.addEventListener('DOMContentLoaded', () => {
  // --- Storage Key Constants (must match background.js) ---
  const FOLDER_LIST_KEY = 'pinboard_folders';
  const getFolderDataKey = (folderName) => `pinboard_data_${folderName}`;
  
  // --- DOM Elements ---
  const newFolderForm = document.getElementById('new-folder-form');
  const folderNameInput = document.getElementById('folder-name-input');
  const foldersListEl = document.getElementById('folders-list');
  const imagesContainer = document.getElementById('images-container');

  // --- Display Functions ---

  const displayFolders = (folderNames) => {
    foldersListEl.innerHTML = '';
    folderNames.forEach(name => {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'folder-item';

      const folderNameSpan = document.createElement('span');
      folderNameSpan.textContent = name;
      folderNameSpan.className = 'folder-name';
      folderNameSpan.addEventListener('click', async () => {
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        folderDiv.classList.add('active');
        await displayImages(name); // Now an async operation
      });

      folderDiv.appendChild(folderNameSpan);

      if (name !== 'Default') {
        const deleteFolderBtn = document.createElement('span');
        deleteFolderBtn.textContent = '✖';
        deleteFolderBtn.className = 'delete-folder-btn';
        deleteFolderBtn.title = `Delete folder "${name}"`;
        deleteFolderBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteFolder(name, folderNames);
        });
        folderDiv.appendChild(deleteFolderBtn);
      }
      foldersListEl.appendChild(folderDiv);
    });
  };

  const displayImages = async (folderName) => {
    imagesContainer.innerHTML = '<h2>Loading...</h2>';
    const folderDataKey = getFolderDataKey(folderName);
    const result = await chrome.storage.local.get(folderDataKey);
    const images = result[folderDataKey] || [];
    
    imagesContainer.innerHTML = ''; // Clear loading message

    if (images.length === 0) {
      imagesContainer.innerHTML = `<h2>No images in "${folderName}".</h2>`;
      return;
    }

    images.forEach(image => {
      const imageCard = document.createElement('div');
      imageCard.className = 'image-card';
      
      const img = document.createElement('img');
      img.src = image.src;
      img.addEventListener('click', () => chrome.tabs.create({ url: image.src }));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteImage(folderName, image.id, images));

      imageCard.appendChild(img);
      imageCard.appendChild(deleteBtn);
      imagesContainer.appendChild(imageCard);
    });
  };

  // --- Data Management Functions ---

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const folderName = folderNameInput.value.trim();
    if (!folderName) return;

    const result = await chrome.storage.local.get(FOLDER_LIST_KEY);
    const currentFolders = result[FOLDER_LIST_KEY] || ['Default'];

    if (!currentFolders.includes(folderName)) {
      const newFolders = [...currentFolders, folderName];
      await chrome.storage.local.set({ [FOLDER_LIST_KEY]: newFolders });
      // Initialize empty data for the new folder
      await chrome.storage.local.set({ [getFolderDataKey(folderName)]: [] });
      folderNameInput.value = '';
      await initialize();
    } else {
      alert("A folder with that name already exists.");
    }
  };

  const deleteFolder = async (folderNameToDelete, currentFolders) => {
    if (confirm(`Are you sure you want to delete "${folderNameToDelete}"?`)) {
      const newFolders = currentFolders.filter(name => name !== folderNameToDelete);
      // Update the master folder list
      await chrome.storage.local.set({ [FOLDER_LIST_KEY]: newFolders });
      // Remove the specific data for that folder
      await chrome.storage.local.remove(getFolderDataKey(folderNameToDelete));
      
      imagesContainer.innerHTML = '<h2>Select a folder to view images.</h2>';
      await initialize();
    }
  };

  const deleteImage = async (folderName, imageId, currentImages) => {
    const newImages = currentImages.filter(image => image.id !== imageId);
    await chrome.storage.local.set({ [getFolderDataKey(folderName)]: newImages });
    // Refresh the view for the current folder
    await displayImages(folderName);
  };
  
  // --- Initialization ---

  const initialize = async () => {
    const result = await chrome.storage.local.get(FOLDER_LIST_KEY);
    let folderNames = result[FOLDER_LIST_KEY];
    
    // First-time run check
    if (!folderNames) {
        folderNames = ['Default'];
        await chrome.storage.local.set({ [FOLDER_LIST_KEY]: folderNames });
        await chrome.storage.local.set({ [getFolderDataKey('Default')]: [] });
    }

    displayFolders(folderNames);
  };

  newFolderForm.addEventListener('submit', handleCreateFolder);
  
  initialize().then(() => {
    const firstFolder = foldersListEl.querySelector('.folder-item .folder-name');
    if (firstFolder) {
      firstFolder.click();
    }
  });
});