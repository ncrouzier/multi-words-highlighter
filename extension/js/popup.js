/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */



document.addEventListener('DOMContentLoaded', function () {

  browser.commands.getAll().then((commands) => {
    const shortcutList = commands;

    //update title with shortcuts
    const enableSearchRow = document.getElementById("enableSearchRow");
    const enable_toggle_shortcut = commands.find((command) => command.name === "enable-toggle-feature").shortcut;
    const enable_toggle_shortcutText = enable_toggle_shortcut ? enable_toggle_shortcut : "no shortcut set";
    enableSearchRow.title = `Save options and refresh highlights. (${enable_toggle_shortcutText})`;

    const buttonClear = document.getElementById("buttonClear");
    const clear_shortcut = commands.find((command) => command.name === "clear-feature").shortcut;
    const clear_shortcutText = clear_shortcut ? clear_shortcut : "no shortcut set";
    buttonClear.title = `Clear highlights. (${clear_shortcutText})`;

    const buttonSearch = document.getElementById("buttonSearch");
    const search_shortcut = commands.find((command) => command.name === "search-feature").shortcut;
    const search_shortcutText = search_shortcut ? search_shortcut : "no shortcut set";
    buttonSearch.title = `Highlight words. (${search_shortcutText})`;

  });

  loadOptions();

  const textareaKeywords = document.getElementById('textareaKeywords');
  const lineCounter = document.getElementById('lineCounter');

  textareaKeywords.addEventListener('scroll', () => {
    lineCounter.scrollTop = textareaKeywords.scrollTop;
    lineCounter.scrollLeft = textareaKeywords.scrollLeft;
  });

  textareaKeywords.addEventListener('input', () => {
    saveOptions();
    // updateLineCounter(false);
    browser.tabs.query({
      'active': true,
      'currentWindow': true
    },
      function (tabs) {
        cleanHighlights(tabs[0].id);       
      });
  });

  
  updateLineCounter(true);

  document.getElementById('buttonCancel').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('buttonSave').addEventListener('click', () => {
    saveOptions();
    window.close();
    browser.runtime.sendMessage({
      message: 'refreshActiveTab',
      remove: false
    });
  });

  document.getElementById('buttonSearch').addEventListener('click', () => {
    saveOptions();
    browser.runtime.sendMessage({
      message: 'refreshActiveTab',
      remove: true
    });
  });

  document.getElementById('buttonClear').addEventListener('click', () => {
    browser.tabs.query({
      'active': true,
      'currentWindow': true
    },
      function (tabs) {
        cleanHighlights(tabs[0].id);       
      });
  });

});

function cleanHighlights(tabId) {
  browser.tabs.sendMessage(tabId, { message: "cleanHighlights" }, (response) => {   
  });
}

function updateLineCounter(reset) {
  // Implementation of line counter logic
}

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(message) {
    if (message.event === 'updateline') {
      if (message.color === false) {       
        updateLineCounter(false);
      }else{
        updateLineCounter(true);
      }
      
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
          const lineCount = textareaKeywords.value.split('\n').length;
          const keywords = textareaKeywords.value.split('\n');
          const outarr = new Array();

          if (lineCountCache !== lineCount) {
            for (let x = 0; x < lineCount; x++) {
              if (color && response.get(keywords[x])) {
                outarr[x] = `</br><div style="background-color:${response.get(keywords[x])}" class="line" id="line${x}">${x + 1}.</div>`;
              } else {
                outarr[x] = `</br><div class="line" id="line${x}">${x + 1}.</div>`;
              }
            }
            lineCounter.innerHTML = outarr.join('\n');
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


