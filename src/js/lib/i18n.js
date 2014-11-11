'use strict';
Array.prototype.forEach.call(document.getElementsByTagName('*'), function(el) {
    if (el.hasAttribute('data-i18n')) {
        el.innerHTML = window.chrome.i18n.getMessage(el.getAttribute('data-i18n'));
    }
});
