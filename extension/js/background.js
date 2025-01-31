/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */




browser.runtime.onMessage.addListener(function(request, sender) {
    let enableSearch =true;
    if ('undefined' !== typeof localStorage) {
      enableSearch = localStorage.getItem('enableSearch');
      enableSearch = 'true' === enableSearch || null === enableSearch;
    }

    // This message is received from 'content.js' and 'popup.js'.
    if (enableSearch && 'getOptions' === request.message) {
      if ('undefined' !== typeof localStorage) {
        browser.tabs.query({
          'active': true,
          'currentWindow': true
        },
        function(tabs) {
          if ('undefined' !== typeof tabs[0].id && tabs[0].id) {
            let showOccurrences = localStorage.getItem('showOccurrences');
            showOccurrences = 'true' === showOccurrences || null === showOccurrences;

            let subtleHighlighting = localStorage.getItem('subtleHighlighting');
            subtleHighlighting = 'true' === subtleHighlighting;

            //activate search
            // console.log("highlighting!");
            browser.tabs.sendMessage(tabs[0].id, {
              'message': 'returnOptions',
              'remove': request.remove,
              'keywords': localStorage.getItem('keywords'),
              'showOccurrences': showOccurrences,
              'subtleHighlighting': subtleHighlighting
            });
          }
        });
      }
    }

    if (!enableSearch && 'getOptions' === request.message && request.fromSaveButton) {
      browser.tabs.query({
        'active': true,
        'currentWindow': true
      },
      function(tabs) {
          browser.tabs.sendMessage(tabs[0].id, {
            'message': 'cleanHighlights'
          });        
      });    
    }

    // This message is recived from 'content.js'.
    if ('showOccurrences' === request.message) {
        if (!enableSearch){
          browser.browserAction.setBadgeText({text: 'X', 'tabId':  sender.tab.id });
        }else{
          let showOccurrences = localStorage.getItem('showOccurrences');
          showOccurrences = 'true' === showOccurrences || null === showOccurrences;          
          if (showOccurrences){
            browser.browserAction.setBadgeText({
              'text': showOccurrences && request.occurrences ? String(request.occurrences) : '0',
              'tabId': sender.tab.id
            });
          }else{
            browser.browserAction.setBadgeText({
              'text': '',
              'tabId': sender.tab.id
            });
          }
         
        }
       
    }
  

    if (!enableSearch){
      browser.tabs.query({
        'active': true,
        'currentWindow': true
      },
      function(tabs) {
        browser.browserAction.setBadgeText({text: 'X', 'tabId': tabs[0].id });   
      }); 
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
    function(tabs) {
      refreshSearch(tabs[0]);
    }); 
  }
});

function refreshSearch(tab) {   
      //get options
      let showOccurrences = localStorage.getItem('showOccurrences');
      showOccurrences = 'true' === showOccurrences || null === showOccurrences;
      let subtleHighlighting = localStorage.getItem('subtleHighlighting');
      subtleHighlighting = 'true' === subtleHighlighting;
      enableSearch = localStorage.getItem('enableSearch');
      enableSearch = 'true' === enableSearch || null === enableSearch;
  
      if (enableSearch){
        //refresh search
        browser.tabs.sendMessage(tab.id, {
          'message': 'returnOptions',
          'remove': true,
          'keywords': localStorage.getItem('keywords'),
          'showOccurrences': showOccurrences,
          'subtleHighlighting': subtleHighlighting
        });

        const message = {
          event: 'updateline',
        };
        browser.runtime.sendMessage(message);
      }
}
