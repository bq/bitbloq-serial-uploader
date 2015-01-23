'use strict';
/* global bitbloqSU, $ */
/* jshint unused:false */
/* *****************************
Chrome App interface management
******************************** */
if (!window.bitbloqSU) {
    window.bitbloqSU = {};
}

bitbloqSU.UI = (function() {
    var appWindow = window.chrome.app.window.current();

    function addDOMListeners() {
        $('body').on('contextmenu', function() {
            return false;
        });
        //window.chrome.runtime.reload();
    }

    var init = function() {
        console.log('bitbloqSU.UI.init');
        addDOMListeners();
    };

    return {
        addDOMListeners: addDOMListeners,
        appWindow: appWindow,
        init: init
    };
})();

bitbloqSU.UI.init();
