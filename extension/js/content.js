/*
 * License:
 *
 * This software is distributed under the terms of the GNU General Public License v3.
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Copyright (c) 2017, Iván Ruvalcaba <mario.i.ruvalcaba[at]gmail[dot]com>
 */

// Based on 'highlight: JavaScript text higlighting jQuery plugin' by Johann Burkard.
// http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html
// MIT license.

function keywordsHighlighter(options, remove) {
  let occurrences = 0;
  function highlight(node, pos, keyword, options, hexColor) {
    let span = document.createElement('span');

    span.className = 'highlighted' + ' ' + (options.subtleHighlighting ? 'subtle ' : '');

    // caluclate luminance of hexcolor
    let red = parseInt(hexColor.substring(1, 3), 16);
    let green = parseInt(hexColor.substring(3, 5), 16);
    let blue = parseInt(hexColor.substring(5, 7), 16);
    let luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    span.style.color = luminance > 0.49 ?  "#000000" : "#ffffff"; // legibility fix
    span.style.backgroundColor = hexColor;

    let highlighted = node.splitText(pos);

    highlighted.splitText(keyword.length);

    let highlightedClone = highlighted.cloneNode(true);

    span.appendChild(highlightedClone);
    highlighted.parentNode.replaceChild(span, highlighted);

    occurrences++;
  }

  function addHighlights(node, keywords, options, colorArray) {
    let skip = 0;
    // console.log(keywords);
    if (3 === node.nodeType) {
      for (let i = 0; i < keywords.length; i++) {
        
        let keyword = keywords[i].toLowerCase();
        let pos = node.data.toLowerCase().indexOf(keyword);

        if (0 <= pos) {
          let hexColor = colorArray[i];
          highlight(node, pos, keyword, options, hexColor);
          skip = 1;
        }
      }
    }
    else if (1 === node.nodeType && !/(script|style|textarea)/i.test(node.tagName) && node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        i += addHighlights(node.childNodes[i], keywords, options,colorArray);
      }
    }

    return skip;
  }

 

  if (remove) {
    removeHighlights(document.body);
  }

  let keywords = options.keywords.split(',');
  delete options.keywords;

  let colorArray = [];
  for (let i = 0; i < keywords.length; i++) {
    colorArray[i] = getRandomColor();
  }
  addHighlights(document.body, keywords, options, colorArray);
  browser.runtime.sendMessage({
    'message': 'showOccurrences',
    'occurrences': occurrences
  });
}

function removeHighlights(node) {
  let span;
  while ((span = node.querySelector('span.highlighted'))) {
    let parent = span.parentNode;
    // Move all children of the root element to the parent
    while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
    }
    // Remove the root element
    parent.removeChild(span);
    // span.outerHTML = span.innerHTML;
  }
  occurrences = 0;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}

browser.runtime.onMessage.addListener(function(request) { 
  if ('returnOptions' === request.message) {
    if ('undefined' != typeof request.keywords && request.keywords) {
      keywordsHighlighter({
        'keywords': request.keywords,
        'subtleHighlighting': request.subtleHighlighting
      },
      request.remove
      );
    }
  }else if ('cleanHighlights' === request.message) {
    removeHighlights(document.body);
    browser.runtime.sendMessage({
      'message': 'showOccurrences',
      'occurrences': 0
    });
  }
});


browser.runtime.sendMessage({
  'message': 'getOptions',
  'fromSaveButton': false,
  'remove': true
});
