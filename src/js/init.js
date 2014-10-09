'use strict';
/* global bitbloqSerial */

/* *****************************
Chrome App interface management
******************************** */
// Board Info
function paintBoardInfo() {
    document.querySelector('.board > .program__actions__item__info').innerText = bitbloqSerial.getCurrentBoard().name;
    document.querySelector('.port > .program__actions__item__info').innerText = bitbloqSerial.getCurrentPort();
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
});
