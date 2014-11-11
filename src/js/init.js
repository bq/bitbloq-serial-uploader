'use strict';
/* global bitbloqSU, $ */
/* jshint unused:false */

/* *****************************
Chrome App interface management
******************************** */
bitbloqSU.UI = (function() {

    var appWindow = window.chrome.app.window.current();

    // Board Info
    function paintBoardInfo() {
        if (bitbloqSU.Serial.getDeviceInfo().connected) {
            $('.board > .chromeapp__info__item__value').html(bitbloqSU.Serial.getDeviceInfo().boardInfo.name);
            $('.port > .chromeapp__info__item__value').html(bitbloqSU.Serial.getDeviceInfo().port);
        } else {
            var defaultMessage = window.chrome.i18n.getMessage($('.chromeapp__info__item__value').attr('data-i18n'));
            $('.board > .chromeapp__info__item__value').html(defaultMessage);
            $('.port > .chromeapp__info__item__value').html(defaultMessage);
        }
    }

    function addDOMListeners() {
        $('body').on('contextmenu', function() {
            return false;
        });
        $('#icon-minimize').on('click', function(event) {
            event.preventDefault();
            appWindow.minimize();
        });
        $('#icon-maximize').on('click', function(event) {
            event.preventDefault();
            if (appWindow.isMaximized()) {
                appWindow.restore();
                appWindow.resizeTo(400, 300);
            } else {
                appWindow.maximize();
            }
        });
        $('#icon-close').on('click', function(event) {
            event.preventDefault();
            appWindow.close();
        });

    }

    var init = function() {
        addDOMListeners();
        bitbloqSU.Serial.autoConfig().then(function() {
            bitbloqSU.UI.paintBoardInfo();
            bitbloqSU.Serial.disconnect();
        });
    };

    return {
        paintBoardInfo: paintBoardInfo,
        addDOMListeners: addDOMListeners,
        appWindow: appWindow,
        init: init
    };
})();
