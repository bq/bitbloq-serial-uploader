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
        addDOMListeners();
        bitbloqSU.Serial.init();
        bitbloqSU.Serial.autoConfig().then(function() {
            bitbloqSU.SerialAPI.getDevices(function(devices) {
                bitbloqSU.UI.buildPortPicker(devices);
            });
            bitbloqSU.UI.paintBoardInfo();
            bitbloqSU.UI.paintPortInfo();
            bitbloqSU.Serial.disconnect();
        }).catch(function() {
            bitbloqSU.SerialAPI.getDevices(function(devices) {
                bitbloqSU.UI.buildPortPicker(devices);
            });
            bitbloqSU.UI.paintBoardInfo();
            bitbloqSU.UI.paintPortInfo();
        });
    };
    return {
        addDOMListeners: addDOMListeners,
        appWindow: appWindow,
        init: init
    };
})();
