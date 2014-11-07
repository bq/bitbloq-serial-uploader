'use strict';
/* global bitbloqSerial, $ */
/* jshint unused:false */

/* *****************************
Chrome App interface management
******************************** */
// Board Info
function paintBoardInfo() {
    $('.board > .chromeapp__info__item__value').html(bitbloqSerial.getCurrentBoard().name);
    $('.port > .chromeapp__info__item__value').html(bitbloqSerial.getCurrentPort());
}

function addDOMListeners() {
    $('body').on('contextmenu', function() {
        return false;
    });
    $('#icon-minimize').on('click', function(event) {
        event.preventDefault();
        window.chrome.app.window.current().minimize();
    });
    $('#icon-maximize').on('click', function(event) {
        event.preventDefault();
        window.chrome.app.window.current().maximize();
    });
    $('#icon-close').on('click', function(event) {
        event.preventDefault();
        window.chrome.app.window.current().close();
    });

}

var init = function() {
    addDOMListeners();
    bitbloqSerial.autoConfig().then(function() {
        paintBoardInfo();
        bitbloqSerial.disconnect();
    });
};
