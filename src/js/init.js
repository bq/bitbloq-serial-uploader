'use strict';
/* global bitbloqSerial, $ */

/* *****************************
Chrome App interface management
******************************** */
// Board Info
function paintBoardInfo() {
    $('.board > .program__actions__item__info').html(bitbloqSerial.getCurrentBoard().name);
    $('.port > .program__actions__item__info').html(bitbloqSerial.getCurrentPort());
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

    // app.window.onfocus = function() {
    //     console.log("focus");
    //     focusTitlebars(true);
    // }

    // app.window.onblur = function() {
    //     console.log("blur");
    //     focusTitlebars(false);
    // }
}

var init = function() {
    bitbloqSerial.autoConfig().then(function() {
        paintBoardInfo();
        bitbloqSerial.disconnect();
    });
};


/* Initializing chrome app */
document.addEventListener('DOMContentLoaded', function() {


    init();
    addDOMListeners();
});
