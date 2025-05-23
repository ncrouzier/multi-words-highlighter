/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */

document.addEventListener('DOMContentLoaded', function () {
  // Initialize UI elements
  initializeUI();
  
  // Load saved options
  loadOptions();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup tab functionality
  setupTabs();
});

/* ===== UI Initialization ===== */
function initializeUI() {
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Initialize textarea and counters
  const textareaKeywords = document.getElementById('textareaKeywords');
  const lineCounter = document.getElementById('lineCounter');
  const wordCounter = document.getElementById('wordCounter');
  
  // Setup scroll synchronization
  textareaKeywords.addEventListener('scroll', () => {
    lineCounter.scrollTop = textareaKeywords.scrollTop;
    lineCounter.scrollLeft = textareaKeywords.scrollLeft;
    wordCounter.scrollTop = textareaKeywords.scrollTop;
    wordCounter.scrollLeft = textareaKeywords.scrollLeft;
  });
  
  // Update initial line counter
  updateLineCounter(true);
}

/* ===== Keyboard Shortcuts Setup ===== */
function setupKeyboardShortcuts() {
  browser.commands.getAll().then((commands) => {
    // Setup enable toggle shortcut
    const checkboxEnableSearch = document.getElementById("checkboxEnableSearch");
    const enable_toggle_shortcut = commands.find((command) => command.name === "enable-toggle-feature").shortcut;
    const enable_toggle_shortcutText = enable_toggle_shortcut ? enable_toggle_shortcut : "no shortcut set";
    checkboxEnableSearch.title = `Save options and refresh highlights. (${enable_toggle_shortcutText})`;

    // Setup clear shortcut
    const buttonClear = document.getElementById("buttonClear");
    const clear_shortcut = commands.find((command) => command.name === "clear-feature").shortcut;
    const clear_shortcutText = clear_shortcut ? clear_shortcut : "no shortcut set";
    buttonClear.title = `Clear highlights. (${clear_shortcutText})`;

    // Setup search shortcut
    const buttonSearch = document.getElementById("buttonSearch");
    const search_shortcut = commands.find((command) => command.name === "search-feature").shortcut;
    const search_shortcutText = search_shortcut ? search_shortcut : "no shortcut set";
    buttonSearch.title = `Highlight words. (${search_shortcutText})`;
  });
}

/* ===== Event Listeners Setup ===== */
function setupEventListeners() {
  // Textarea input handling
  const textareaKeywords = document.getElementById('textareaKeywords');
  textareaKeywords.addEventListener('input', () => {
    saveOptions();
    showSaveNotification();
    browser.tabs.query({
      'active': true,
      'currentWindow': true
    }, function (tabs) {
      cleanHighlights(tabs[0].id);       
    });
  });

  // Button click handlers
  document.getElementById('buttonSearch').addEventListener('click', handleSearch);
  document.getElementById('buttonClear').addEventListener('click', handleClear);
  document.getElementById('buttonRemoveEmpty').addEventListener('click', handleRemoveEmpty);
  document.getElementById('buttonRemoveAll').addEventListener('click', handleRemoveAll);

  // Checkbox change handlers
  setupCheckboxListeners();

  // Message listener for background script communication
  setupMessageListener();
}

/* ===== Button Handlers ===== */
function handleSearch() {
  saveOptions();
  browser.runtime.sendMessage({
    message: 'refreshActiveTab',
    remove: true
  });
}

function handleClear() {
  browser.tabs.query({
    'active': true,
    'currentWindow': true
  }, function (tabs) {
    cleanHighlights(tabs[0].id);       
  });
}

function handleRemoveEmpty() {
  const textarea = document.getElementById('textareaKeywords');
  const lines = textarea.value.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  textarea.value = nonEmptyLines.join('\n');
  saveOptions();
  showSaveNotification("Empty lines removed");
  updateLineCounter(true);
}

function handleRemoveAll() {
  const textarea = document.getElementById('textareaKeywords');
  textarea.value = "";
  saveOptions();
  showSaveNotification("All lines removed");
  updateLineCounter(true);
}

/* ===== Checkbox Handlers ===== */
function setupCheckboxListeners() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      saveOptions();
      showSaveNotification();
      
      if (checkbox.id === 'checkboxEnableSearch') {
        const statusLabel = checkbox.nextElementSibling;
        statusLabel.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
        // browser.runtime.sendMessage({
        //   message: 'refreshActiveTab',
        //   remove: false
        // });
        if(!checkbox.checked){
        browser.tabs.query({
        },
          function (tabs) {
            tabs.forEach(tab => {
              browser.tabs.sendMessage(tab.id, {
                'message': 'cleanHighlights'
              });
            });
          });
        }else{
          browser.runtime.sendMessage({
            message: 'refreshActiveTab',
            remove: true
          });
        }
      }
    });
  });

  // Update status label on load
  const enableCheckbox = document.getElementById('checkboxEnableSearch');
  const statusLabel = enableCheckbox.nextElementSibling;
  statusLabel.textContent = enableCheckbox.checked ? 'Enabled' : 'Disabled';
}

/* ===== Message Handling ===== */
function setupMessageListener() {
  browser.runtime.onMessage.addListener((message) => {
    if (message.event === 'updateline') {
      if (message.color === false) {       
        updateLineCounter(false);
      } else {
        updateLineCounter(true);
        if (localStorage.getItem('sortByOccurrences') === 'true' && message.foundWordsCount) {
          sortKeywordsByOccurrences(message.foundWordsCount);
        }
      }
    }
    if (message.event === 'updateEnableButton') {
      if (message.enabled !== undefined) {
        const checkbox = document.getElementById('checkboxEnableSearch');
        checkbox.checked = message.enabled;
        const statusLabel = checkbox.nextElementSibling;
        statusLabel.textContent = message.enabled ? 'Enabled' : 'Disabled';
        updateButtonStates();
        showSaveNotification();
      }
    }
  });
}

/* ===== Tab Functionality ===== */
function setupTabs() {
  function setupTabs(container) {
    const tabButtons = container.querySelectorAll('.tab-button');
    const tabPanes = container.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        const targetPane = container.querySelector(`#${tabId}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  // Setup main tabs
  const mainTabs = document.querySelector('.main-tabs');
  if (mainTabs) {
    setupTabs(mainTabs);
  }
  
  // Setup nested options tabs
  const optionsTabs = document.querySelector('.options-tabs');
  if (optionsTabs) {
    setupTabs(optionsTabs);
  }
}

/* ===== Utility Functions ===== */
function cleanHighlights(tabId) {
  browser.tabs.sendMessage(tabId, { message: "cleanHighlights" });
}

function showSaveNotification(message) {
  const notification = document.getElementById('saveNotification');
  notification.classList.add('show');
  notification.innerHTML = message || "Options saved";
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 1000);
}

function updateButtonStates() {
  const isEnabled = localStorage.getItem('enableSearch') === 'true';
  const buttonSearch = document.getElementById('buttonSearch');
  const buttonClear = document.getElementById('buttonClear');
  
  buttonSearch.disabled = !isEnabled;
  buttonClear.disabled = !isEnabled;
  
  if (!isEnabled) {
    buttonSearch.classList.add('disabled');
    buttonClear.classList.add('disabled');
  } else {
    buttonSearch.classList.remove('disabled');
    buttonClear.classList.remove('disabled');
  }
}

function updateLineCounter(color) {
  let lineCountCache = 0;
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      browser.tabs.sendMessage(tabs[0].id, { message: 'getFoundWords' })
        .then((response) => {
          if (!response) {
            throw new Error('No response received for found words.');
          }
          const foundWords = response.foundWords;
          const foundWordsCount = response.foundWordsCount;
          const textarea = document.getElementById('textareaKeywords');
          let keywords = textarea.value.split('\n');
          const lineCount = keywords.length;

          const outarr = new Array();
          const wordarr = new Array();

          if (lineCountCache !== lineCount) {
            for (let x = 0; x < lineCount; x++) {
              if (color && foundWords.get(keywords[x])) {
                outarr[x] = `</br><div style="background-color:${foundWords.get(keywords[x])}" class="line" id="line${x}">${x + 1}.</div>`;
              } else {
                outarr[x] = `</br><div class="line" id="line${x}">${x + 1}.</div>`;
              }
              wordarr[x] = `</br><div class="countLine" style="white-space: nowrap;" title="${foundWordsCount.get(keywords[x]) || 0}">${foundWordsCount.get(keywords[x]) || 0}</div>`;
            }
            lineCounter.innerHTML = outarr.join('\n');
            wordCounter.innerHTML = wordarr.join('\n');
          }
          lineCountCache = lineCount;
        })
        .catch((error) => {
          console.error('Error sending message to tab:', error);
        });
    } else {
      console.error('No active tab found.');
    }
  });
}

function sortKeywordsByOccurrences(foundWordsCount) {
  const textarea = document.getElementById('textareaKeywords');
  let keywords = textarea.value.split('\n');
  
  keywords = keywords.sort((a, b) => {
    const countA = foundWordsCount.get(a) || 0;
    const countB = foundWordsCount.get(b) || 0;
    return countB - countA;
  });
  
  textarea.value = keywords.join('\n');
  saveOptions();
}


