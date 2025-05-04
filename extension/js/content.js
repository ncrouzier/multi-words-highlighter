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

let foundWords = new Map();

let countW = 0;


function keywordsHighlighter(options, remove) {
  let totalOccurrences = 0;

  function highlight(node, position, keyword, options, color, index, depth) {
    const span = document.createElement('span');
    span.className = 'highlighted' + (options.subtleHighlighting ? ' subtle' : '');

    const red = parseInt(color.substring(1, 3), 16);
    const green = parseInt(color.substring(3, 5), 16);
    const blue = parseInt(color.substring(5, 7), 16);
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    span.style.color = luminance > 0.49 ? "#000000" : "#ffffff";
    span.style.backgroundImage = `linear-gradient(to bottom, ${color}, ${color})`;
    span.style.backgroundSize = `100% ${100 - (depth * 10)}%`;
    span.style.backgroundRepeat = 'no-repeat';
    span.style.backgroundPosition = '0 50%';

    const highlightedNode = node.splitText(position);
    highlightedNode.splitText(keyword.length);

    const highlightedClone = highlightedNode.cloneNode(true);
    span.appendChild(highlightedClone);
    highlightedNode.parentNode.replaceChild(span, highlightedNode);

    foundWords.set(keyword, color);
    totalOccurrences++;

    return highlightedClone;
  }

  function addHighlights(node, keywords, options, colorMap, depth) {
    let skip = 0;
    countW++;

    if (depth === 0 && node.parentNode.classList.contains('highlighted')) return skip;

    if (node.nodeType === 3 && node.data.trim() !== '') {
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        if (keyword) {
          const position = node.data.toLowerCase().indexOf(keyword.toLowerCase());
          if (position >= 0) {
            const remainingKeywords = keywords.slice(i + 1);
            const color = colorMap.get(keyword);

            const highlightedNode = highlight(node, position, keyword, options, color, i, depth);
            if (options.searchEmbedded) {
              const embeddedKeywords = remainingKeywords.filter(kw => keyword.toLowerCase().includes(kw.toLowerCase()));
              if (embeddedKeywords.length > 0) {
                addHighlights(highlightedNode, embeddedKeywords, options, colorMap, depth + 1);
              }
            }
            skip = 1;
          }
        }
      }
    } else if (node.nodeType === 1 && !/(script|style|textarea)/i.test(node.tagName) && node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        i += addHighlights(node.childNodes[i], keywords, options, colorMap, depth);
      }
    }

    return skip;
  }

  if (remove) {
    removeHighlights(document.body);
  }

  const keywords = options.keywords.split('\n').filter(Boolean).sort((a, b) => b.length - a.length);
  const colorMap = new Map(keywords.map(keyword => [keyword, getRandomColor()]));

  foundWords = new Map();
  countW = 0;
  const startTime = performance.now();
  addHighlights(document.body, keywords, options, colorMap, 0);
  const endTime = performance.now();

  browser.runtime.sendMessage({ event: 'updateline', color: true });
  browser.runtime.sendMessage({ message: 'showOccurrences', occurrences: totalOccurrences });
  
}

function removeHighlights(rootNode) {
  let highlightedSpan;
  while ((highlightedSpan = rootNode.querySelector('span.highlighted'))) {
    const parent = highlightedSpan.parentNode;
    // Move all children of the root element to the parent
    while (highlightedSpan.firstChild) {
      parent.insertBefore(highlightedSpan.firstChild, highlightedSpan);
    }
    // Remove the root element
    parent.removeChild(highlightedSpan);
  }
  rootNode.normalize();
  occurrences = 0;
  browser.runtime.sendMessage({
    'message': 'showOccurrences',
    'occurrences': occurrences
  });
  foundWords = new Map();
  browser.runtime.sendMessage({ event: 'updateline', color: false });
}

function getRandomColor() {
  const letters = '0123456789ABCDEF'.split('');
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
}

browser.runtime.onMessage.addListener(function (request, sender, response) {
  if ('searchForKeyWords' === request.message) {
    if ('undefined' != typeof request.keywords && request.keywords) {
      keywordsHighlighter({
        'keywords': request.keywords,
        'subtleHighlighting': request.subtleHighlighting,
        'searchEmbedded': request.searchEmbedded
      },
        true
      );
    }
  } else if ('cleanHighlights' === request.message) {
    //manual clear
    removeHighlights(document.body);
    let searchOnTabfocus = localStorage.getItem('searchOnTabfocus');
    searchOnTabfocus = 'true' === searchOnTabfocus || null === searchOnTabfocus;
    if (searchOnTabfocus) {
      browser.runtime.sendMessage({ message: 'clearHighlights'});
    }
  } else if ('getFoundWords' === request.message) {
    response(foundWords);
  }
});

