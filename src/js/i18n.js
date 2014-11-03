Array.prototype.forEach.call(document.getElementsByTagName('*'), function(el) {
    if (el.hasAttribute('data-i18n')) {
        el.innerHTML = chrome.i18n.getMessage('__MSG_' + el.getAttribute('data-i18n') + '__');
    }
});
