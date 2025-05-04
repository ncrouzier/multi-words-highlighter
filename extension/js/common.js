/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */

function loadOptions() {  // eslint-disable-line no-unused-vars
  if ('undefined' !== typeof localStorage) {
    document.getElementById('textareaKeywords').value = localStorage.getItem('keywords');

    document.getElementById('checkboxEnableSearch').checked =
      'true' === localStorage.getItem('enableSearch');

    document.getElementById('checkboxShowOccurrences').checked =
      'true' === localStorage.getItem('showOccurrences') || null === localStorage.getItem('showOccurrences');

    document.getElementById('checkboxSubtleHighlighting').checked =
      'true' === localStorage.getItem('subtleHighlighting') || null === localStorage.getItem('subtleHighlighting');
    
    document.getElementById('checkboxEmbedded').checked =
      'true' === localStorage.getItem('searchEmbedded') || null === localStorage.getItem('searchEmbedded');

    document.getElementById('checkboxSearchOnTabfocus').checked =
      'true' === localStorage.getItem('searchOnTabfocus') || null === localStorage.getItem('searchOnTabfocus');

  }
}

function saveOptions() {  // eslint-disable-line no-unused-vars
  // console.log("savingOptions");
  if ('undefined' !== typeof localStorage) {
    localStorage.setItem('keywords', document.getElementById('textareaKeywords').value);
    localStorage.setItem('enableSearch', document.getElementById('checkboxEnableSearch').checked);
    localStorage.setItem('showOccurrences', document.getElementById('checkboxShowOccurrences').checked);
    localStorage.setItem('subtleHighlighting', document.getElementById('checkboxSubtleHighlighting').checked);
    localStorage.setItem('searchEmbedded', document.getElementById('checkboxEmbedded').checked);
    localStorage.setItem('searchOnTabfocus', document.getElementById('checkboxSearchOnTabfocus').checked);
  }
}


