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


  /* Enable Line Numbering to any HTML Textarea by Charmaine Chui at https://medium.com/weekly-webtips/enable-line-numbering-to-any-html-textarea-35e15ea320e2 */
  var textareaKeywords = document.getElementById('textareaKeywords');
  var lineCounter = document.getElementById('lineCounter');
  textareaKeywords.addEventListener('scroll', () => {
    lineCounter.scrollTop = textareaKeywords.scrollTop;
    lineCounter.scrollLeft = textareaKeywords.scrollLeft;
  });

  textareaKeywords.addEventListener('input', () => {
    saveOptions();
    line_counter(false);
  });
  line_counter(true);


  document.getElementById('buttonCancel').addEventListener('click', function () {
    window.close();
  });

  document.getElementById('buttonSave').addEventListener('click', function () {
    saveOptions();
    window.close();

    browser.runtime.sendMessage({
      'message': 'getOptions',
      'fromSaveButton': true,
      'remove': true
    });

  });
});

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(message) {
    if (message.event === 'updateline') {
        line_counter(true);
    }
}

function line_counter(color) {
  var lineCountCache = 0;
  browser.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    browser.tabs.sendMessage(tabs[0].id, {
      'message': 'getFoundWords'
    }).then((response) => {
      var lineCount = textareaKeywords.value.split('\n').length;
      var outarr = new Array();
      if (lineCountCache != lineCount) {
        for (var x = 0; x < lineCount; x++) {
          if (color && response && response.get(x)) {
            outarr[x] = '</br><div style="background-color:' + response.get(x) + '" class="line" id="line' + x + '">' + (x + 1) + '.</div>';
          } else {
            outarr[x] = '</br><div class="line" id="line' + x + '">' + (x + 1) + '.</div>';
          }
        }
        lineCounter.innerHTML = outarr.join('\n');
      }
      lineCountCache = lineCount;
    });
  });
}
