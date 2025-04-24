/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */

document.addEventListener('DOMContentLoaded', function () {
  loadOptions();

  const textareaKeywords = document.getElementById('textareaKeywords');
  const lineCounter = document.getElementById('lineCounter');

  textareaKeywords.addEventListener('scroll', () => {
    lineCounter.scrollTop = textareaKeywords.scrollTop;
    lineCounter.scrollLeft = textareaKeywords.scrollLeft;
  });

  textareaKeywords.addEventListener('input', () => {
    saveOptions();
    updateLineCounter(false);
  });

  updateLineCounter(true);

  document.getElementById('buttonCancel').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('buttonSave').addEventListener('click', () => {
    saveOptions();
    window.close();
    browser.runtime.sendMessage({
      message: 'getOptions',
      fromSaveButton: true,
      remove: true
    });
  });
});

function updateLineCounter(reset) {
  // Implementation of line counter logic
}

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(message) {
    if (message.event === 'updateline') {
        line_counter(true);
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
