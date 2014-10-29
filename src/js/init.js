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
    $('#icon-minimize').on('click', function() {

    });
    $('#icon-maximize').on('click', function() {

    });
    $('#icon-close').on('click', function() {

    });
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
