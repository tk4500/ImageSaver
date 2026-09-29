// Bulk‑action shortcuts and helper functions
function selectAllFolders() {
  const folderItems = document.querySelectorAll('.folder-item');
  folderItems.forEach(item => item.classList.add('selected'));
  const deleteBtn = document.getElementById('delete-selected-btn');
  if (deleteBtn) deleteBtn.disabled = false;
}

function deleteSelectedFolders() {
  const selected = Array.from(document.querySelectorAll('.folder-item.selected'));
  if (selected.length === 0) return;
  if (!confirm(`Delete ${selected.length} selected folder(s)?`)) return;
  // Gather current folder names from DOM
  const currentFolderNames = Array.from(foldersListEl.querySelectorAll('.folder-name')).map(el => el.textContent);
  selected.forEach(item => {
    const name = item.querySelector('.folder-name').textContent;
    deleteFolder(name, currentFolderNames);
  });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


  // After deletion, disable the bulk delete button until new selection
  const deleteBtn = document.getElementById('delete-selected-btn');
  if (deleteBtn) deleteBtn.disabled = true;
  // Clear visual selection state
  document.querySelectorAll('.folder-item.selected').forEach(item => item.classList.remove('selected'));
  showToast('Selected folders deleted');
}

document.addEventListener('keydown', (e) => {
  // Ctrl+A selects all folders (bulk‑action shortcut)
  if (e.ctrlKey && e.key === 'a') {
    e.preventDefault();
    selectAllFolders();
  }
  // Ctrl+Shift+D deletes selected folders
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    deleteSelectedFolders();
  }
});
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)



function renderBulkControls() {
  // expose for testing
  if (typeof window !== 'undefined') {
    window.renderBulkControls = renderBulkControls;
  }
  const container = document.getElementById('bulk-controls');
  // Clear any existing controls
  container.innerHTML = '';
  const selectAllBtn = document.createElement('button');
  selectAllBtn.type = 'button';
  selectAllBtn.id = 'select-all-btn';
  selectAllBtn.textContent = 'Select All';
  selectAllBtn.addEventListener('click', selectAllFolders);
  const deleteSelBtn = document.createElement('button');
  deleteSelBtn.type = 'button';
  deleteSelBtn.id = 'delete-selected-btn';
  deleteSelBtn.textContent = 'Delete Selected';
  deleteSelBtn.disabled = true;
  deleteSelBtn.addEventListener('click', deleteSelectedFolders);
  container.appendChild(selectAllBtn);
  container.appendChild(deleteSelBtn);
}

function showToast(message) {
  const toastEl = document.getElementById('toast');
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2000);
}

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
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)



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
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


        folderDiv.appendChild(deleteFolderBtn);
      }
      foldersListEl.appendChild(folderDiv);
    });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


  };

  // Display images for a folder with loading spinner
  const displayImages = async (folderName) => {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    imagesContainer.innerHTML = '';
    const folderDataKey = getFolderDataKey(folderName);
    const result = await chrome.storage.local.get(folderDataKey);
    const images = result[folderDataKey] || [];
    spinner.style.display = 'none';

    if (images.length === 0) {
      imagesContainer.innerHTML = `<h2>No images in "${folderName}".</h2>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    images.forEach(image => {
      const imageCard = document.createElement('div');
      imageCard.className = 'image-card';
      const img = document.createElement('img');
      img.alt = image.title || 'Saved image';
      img.addEventListener('click', () => chrome.tabs.create({ url: image.src }));
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteImage(folderName, image.id, images));
      imageCard.appendChild(img);
      imageCard.appendChild(deleteBtn);
      fragment.appendChild(imageCard);
    });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


    imagesContainer.appendChild(fragment);
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
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


      // Initialize empty data for the new folder
      await chrome.storage.local.set({ [getFolderDataKey(folderName)]: [] });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


      folderNameInput.value = '';
      await initialize();
      showToast('Folder created');
    } else {
      showToast('Folder already exists');
    }
  };
  const deleteFolder = async (folderNameToDelete, currentFolders) => {
    if (confirm(`Are you sure you want to delete "${folderNameToDelete}"?`)) {
      const newFolders = currentFolders.filter(name => name !== folderNameToDelete);
      // Update the master folder list
      await chrome.storage.local.set({ [FOLDER_LIST_KEY]: newFolders });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


      // Remove the specific data for that folder
      await chrome.storage.local.remove(getFolderDataKey(folderNameToDelete));
      
      imagesContainer.innerHTML = '<h2>Select a folder to view images.</h2>';
      await initialize();
    }
  };

  const deleteImage = async (folderName, imageId, currentImages) => {
    const newImages = currentImages.filter(image => image.id !== imageId);
    await chrome.storage.local.set({ [getFolderDataKey(folderName)]: newImages });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


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
        // Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


        await chrome.storage.local.set({ [getFolderDataKey('Default')]: [] });
        // Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


    }
    
    displayFolders(folderNames);
  };
// expose initialize for testing
if (typeof window !== 'undefined') {
window.initialize = initialize;
}

  newFolderForm.addEventListener('submit', handleCreateFolder);
  
  initialize().then(() => {
      const firstFolder = foldersListEl.querySelector('.folder-item .folder-name');
      if (firstFolder) {
        firstFolder.click();
      }
      // Render bulk action controls after UI is ready
      renderBulkControls();
    });
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)


});
// Trigger DOMContentLoaded for environments where the document is already loaded (e.g., jsdom tests)
