/**
 * typing.js — Terminal typing animation
 * Types out text content character-by-character with a blinking cursor
 * that moves to the right, line by line — just like a real terminal.
 * Each grid box frame appears just before the cursor starts typing in it.
 */
(function () {
    'use strict';

    var LINE_DELAY = 80;      // ms pause between lines
    var START_DELAY = 400;    // ms before typing starts
    var BOX_REVEAL_DELAY = 150; // ms pause after revealing a new box frame

    /**
     * Per-section typing speed (ms per character).
     * Commands (index page) type slowly like user input;
     * lists dump fast like terminal output.
     */
    function getSpeed(el) {
        var cls = (el.parentElement && el.parentElement.className) || '';
        if (cls.indexOf('certs') !== -1) return 8;
        if (cls.indexOf('links') !== -1) return 12;
        if (cls.indexOf('cve-item') !== -1) return 15;
        // Index page command links: <a> wrapping a <span>
        if (el.tagName === 'A' && el.querySelector('span')) return 35;
        return 18;
    }

    /**
     * Walk up from an element to find its closest .grid > div container.
     */
    function getGridBox(el) {
        var node = el;
        while (node && node.parentElement) {
            if (node.parentElement.classList &&
                node.parentElement.classList.contains('grid')) {
                return node;
            }
            node = node.parentElement;
        }
        return null;
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Target containers whose direct children should be typed out
        var containers = document.querySelectorAll(
            '.whoami, .kiss, .certs, .links, .cves, .wafwoof, .cve-item'
        );
        if (!containers.length) return;

        // Collect every direct-child <span> or <a> in document order
        var queue = [];
        containers.forEach(function (container) {
            Array.from(container.children).forEach(function (child) {
                var tag = child.tagName;
                if (tag === 'SPAN' || tag === 'A') {
                    queue.push(child);
                }
            });
        });
        if (!queue.length) return;

        // Prepare items: save original text, clear it, insert a text node
        var items = queue.map(function (el) {
            // For <a><span>text</span></a>, type into the inner <span>
            var target = el.querySelector('span') || el;
            var text = target.textContent;
            target.textContent = '';
            var textNode = document.createTextNode('');
            target.appendChild(textNode);
            return {
                el: el,
                target: target,
                text: text,
                textNode: textNode,
                speed: getSpeed(el),
                box: getGridBox(el)   // the .grid > div ancestor
            };
        });

        // Blinking block cursor element
        var cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.textContent = '\u2588'; // █

        var lineIdx = 0;
        var charIdx = 0;
        var currentBox = null;  // track which box is currently visible

        function type() {
            if (lineIdx >= items.length) {
                // All done — cursor blinks briefly then disappears
                setTimeout(function () {
                    cursor.remove();
                    document.body.classList.add('typing-done');
                }, 1500);
                return;
            }

            var item = items[lineIdx];

            // First character of a new line
            if (charIdx === 0) {
                // If this item is in a new grid box, reveal the frame first
                if (item.box && item.box !== currentBox) {
                    currentBox = item.box;
                    currentBox.style.opacity = '1';
                    // Brief pause so the frame is visible before text appears
                    setTimeout(function () {
                        item.el.style.opacity = '1';
                        item.target.appendChild(cursor);
                        setTimeout(type, 0);
                    }, BOX_REVEAL_DELAY);
                    return;
                }
                item.el.style.opacity = '1';
                item.target.appendChild(cursor);
            }

            if (charIdx < item.text.length) {
                item.textNode.textContent = item.text.slice(0, charIdx + 1);
                charIdx++;
                setTimeout(type, item.speed);
            } else {
                // Line finished — detach cursor, move to next line
                cursor.remove();
                lineIdx++;
                charIdx = 0;
                setTimeout(type, LINE_DELAY);
            }
        }

        // Go
        setTimeout(type, START_DELAY);
    });
})();
