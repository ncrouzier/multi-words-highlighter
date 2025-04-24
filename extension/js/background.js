/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */

let tabsStates = new Map();


browser.runtime.onMessage.addListener(function (request, sender) {

  let enableSearch = localStorage.getItem('enableSearch');
  enableSearch = 'true' === enableSearch || null === enableSearch;

  if (enableSearch && 'getOptions' === request.message) {
    browser.tabs.query({
        'active': true,
        'currentWindow': true
      },
      function (tabs) {
        if ('undefined' !== typeof tabs[0].id && tabs[0].id) {
          const keywords = localStorage.getItem('keywords');
          let showOccurrences = localStorage.getItem('showOccurrences');
          showOccurrences = 'true' === showOccurrences || null === showOccurrences;
          let subtleHighlighting = localStorage.getItem('subtleHighlighting');
          subtleHighlighting = 'true' === subtleHighlighting;
          let searchEmbedded = localStorage.getItem('searchEmbedded');
          searchEmbedded = 'true' === searchEmbedded;

          searchForKeyWords(tabs[0].id, {
            'remove': request.remove,
            'keywords': keywords,
            'showOccurrences': showOccurrences,
            'subtleHighlighting': subtleHighlighting,
            'searchEmbedded': searchEmbedded
          });
        }
      });
  }

  if (!enableSearch && 'getOptions' === request.message && request.fromSaveButton) {
    browser.tabs.query({

    },
      function (tabs) {
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, {
            'message': 'cleanHighlights'
          });
        });

      });
  }

  if ('showOccurrences' === request.message) {
    if (!enableSearch) {
      browser.browserAction.setBadgeText({ text: 'X', 'tabId': sender.tab.id });
    } else {
      let showOccurrences = localStorage.getItem('showOccurrences');
      showOccurrences = 'true' === showOccurrences || null === showOccurrences;
      if (showOccurrences) {
        browser.browserAction.setBadgeText({
          'text': request.occurrences ? String(request.occurrences) : '0',
          'tabId': sender.tab.id
        });
      } else {
        browser.browserAction.setBadgeText({
          'text': '',
          'tabId': sender.tab.id
        });
      }

    }

  }

});

browser.tabs.onActivated.addListener(async (activeInfo) => {
  let searchOnTabfocus = localStorage.getItem('searchOnTabfocus');
  searchOnTabfocus = 'true' === searchOnTabfocus || null === searchOnTabfocus;
  if (searchOnTabfocus) {
    const tab = await browser.tabs.get(activeInfo.tabId);
    refreshSearch(tab);
  }
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
      // code to execute when the tab is reloaded
      tabsStates.set(tabId, null);
      refreshSearch(tab);

  }
});

//context menu
browser.menus.create({
  id: "multi-search",
  title: "Multi Search",
  contexts: ["all"]
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "multi-search") {
    //refreshing 
    //enable search when searching from context menu
    localStorage.setItem('enableSearch', true);
    refreshSearch(tab);
  }
});

browser.commands.onCommand.addListener((command) => {
  if (command === "search-feature") {
    browser.tabs.query({
      'active': true,
      'currentWindow': true
    },
      function (tabs) {
        refreshSearch(tabs[0],true);
      });
  }
});


function refreshSearch(tab, forceRefresh) {
  const enableSearch = isLocalStorageEnabled('enableSearch');
  if (!enableSearch) {
    return;
  }

  const showOccurrences = isLocalStorageEnabled('showOccurrences');
  const subtleHighlighting = isLocalStorageEnabled('subtleHighlighting');
  const searchEmbedded = isLocalStorageEnabled('searchEmbedded');
  const keywords = localStorage.getItem('keywords');

  searchForKeyWords(tab.id, {
    remove: true,
    keywords,
    showOccurrences,
    subtleHighlighting,
    searchEmbedded
  }, forceRefresh);
}

function isLocalStorageEnabled(key) {
  return localStorage.getItem(key) === 'true' || localStorage.getItem(key) === null;
}


function searchForKeyWords(tabId, options, forceRefresh = false) {
  const currentOptionsHash = hashObjectSimple(options);

  if (forceRefresh) {
    tabsStates.delete(tabId);
  }

  if (tabsStates.has(tabId) && tabsStates.get(tabId) === currentOptionsHash) {
    return;
  }

  tabsStates.set(tabId, currentOptionsHash);

  browser.tabs.sendMessage(tabId, {
    message: 'searchForKeyWords',
    remove: options.remove,
    keywords: options.keywords,
    showOccurrences: options.showOccurrences,
    subtleHighlighting: options.subtleHighlighting,
    searchEmbedded: options.searchEmbedded,
  });
}


function hashObjectSimple(obj) {
  const jsonString = JSON.stringify(obj);
  let hash = 0;
  if (jsonString.length === 0) return hash;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
