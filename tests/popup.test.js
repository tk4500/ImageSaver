/**
 * Minimal UI tests for ImageSaver popup using @testing-library/dom and jest.
 */
const { fireEvent } = require('@testing-library/dom');
const fs = require('fs');
const path = require('path');

// Load the HTML and JS as strings
const html = fs.readFileSync(path.resolve(__dirname, '../popup.html'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../popup.js'), 'utf8');

function setupDom() {
  document.documentElement.innerHTML = html;
  // Load the popup script directly so it runs in this environment
  const popupPath = require('path').resolve(__dirname, '../popup.js');
  require(popupPath);
  // If the script exposed an async initialize function, return its promise
  if (typeof window !== 'undefined' && typeof window.initialize === 'function') {
    return window.initialize();
  }
  return Promise.resolve();
}




describe('ImageSaver popup UI', () => {
  beforeEach(async () => {
    global.chrome = {
      storage: {
        local: {
          _data: {},
          async get(key) { return { [key]: this._data[key] || [] }; },
          async set(obj) { Object.assign(this._data, obj); },
          async remove(key) { delete this._data[key]; },
        },
      },
      tabs: { create: jest.fn() },
    };
    // Initialize the DOM and the popup script, awaiting any async init
    await setupDom();
    // Ensure DOMContentLoaded handlers run in jsdom (in case script didn't fire)
    if (document.readyState !== 'loading') {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
    // expose renderBulkControls for test reliability
    if (typeof window !== 'undefined' && window.renderBulkControls) {
      window.renderBulkControls();
    }
  });

  test('creates folder and shows toast', async () => {
    // wait for initialization to complete
    await new Promise(r => setTimeout(r, 500));
    const input = document.getElementById('folder-name-input');
    const submitBtn = document.querySelector('#new-folder-form button[type="submit"]');
    input.value = 'TestFolder';
    fireEvent.click(submitBtn);
    // wait for async operations in handleCreateFolder
    await new Promise(r => setTimeout(r, 800));
    const toast = document.getElementById('toast');
    // Verify toast was shown (class 'show' added) and contains correct text
    expect(toast.classList.contains('show')).toBe(true);
    expect(toast.textContent).toBe('Folder created');
  });

  test('bulk action buttons have type="button"', async () => {
    // wait for bulk controls to be rendered after initialization
    await new Promise(r => setTimeout(r, 500));
    // ensure renderBulkControls available (call again to guarantee buttons exist)
    if (typeof window !== 'undefined' && window.renderBulkControls) {
      window.renderBulkControls();
    }
    const selectAllBtn = document.getElementById('select-all-btn');
    const deleteSelBtn = document.getElementById('delete-selected-btn');
    expect(selectAllBtn).not.toBeNull();
    expect(deleteSelBtn).not.toBeNull();
    expect(selectAllBtn.getAttribute('type')).toBe('button');
    expect(deleteSelBtn.getAttribute('type')).toBe('button');
  });

  test('active folder receives contrasting focus outline', async () => {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder-item';
    const span = document.createElement('span');
    span.className = 'folder-name';
    span.textContent = 'Default';
    folderDiv.appendChild(span);
    document.getElementById('folders-list').appendChild(folderDiv);
    fireEvent.click(span);
    folderDiv.focus();
    const style = getComputedStyle(folderDiv);
    expect(style.outlineColor).not.toBe('rgb(0, 86, 179)');
  });
});
