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
        $('#board-picker option').removeAttr('selected');
        if (bitbloqSU.Serial.getDeviceInfo().connected) {
            $('#board-picker option[value="' + bitbloqSU.Serial.getDeviceInfo().boardInfo.id + '"]').attr('selected', true);
        } else {
            $($('#board-picker option')[0]).attr('selected', 'true');
        }
        // if (bitbloqSU.Serial.getDeviceInfo().connected) {
        //     $('.board > .chromeapp__info__item__value').html(bitbloqSU.Serial.getDeviceInfo().boardInfo.name);
        //     $('.port > .chromeapp__info__item__value').html(bitbloqSU.Serial.getDeviceInfo().port);
        // } else {
        //     var defaultMessage = window.chrome.i18n.getMessage($('.chromeapp__info__item__value').attr('data-i18n'));
        //     $('.board > .chromeapp__info__item__value').html(defaultMessage);
        //     $('.port > .chromeapp__info__item__value').html(defaultMessage);
        // }
    }

    function paintPortInfo() {
        $('#port-picker option').removeAttr('selected');
        if (bitbloqSU.Serial.getDeviceInfo().connected) {
            $('#port-picker option[value="' + bitbloqSU.Serial.getDeviceInfo().port + '"]').attr('selected', true);
        } else {
            $($('#port-picker option')[0]).attr('selected', 'true');
        }
        // if (bitbloqSU.Serial.getDeviceInfo().connected) {
        //     $('.board > .chromeapp__info__item__value').html(bitbloqSU.Serial.getDeviceInfo().boardInfo.name);
        //     $('.port > .chromeapp__info__item__value').html(bitbloqSU.Serial.getDeviceInfo().port);
        // } else {
        //     var defaultMessage = window.chrome.i18n.getMessage($('.chromeapp__info__item__value').attr('data-i18n'));
        //     $('.board > .chromeapp__info__item__value').html(defaultMessage);
        //     $('.port > .chromeapp__info__item__value').html(defaultMessage);
        // }
    }
    //// Portpicker
    function buildPortPicker(ports) {
        var eligiblePorts = ports.filter(function(port) {
            return !port.path.match(/[Bb]luetooth/);
        });
        var portPicker = document.getElementById('port-picker');
        eligiblePorts.forEach(function(port) {
            var portOption = document.createElement('option');
            portOption.value = portOption.innerText = port.path;
            portPicker.appendChild(portOption);
        });
        portPicker.onchange = function(evt) {
            bitbloqSU.SerialAPI.getDevices(function(devices) {
                bitbloqSU.Serial.setPort(evt.target.value);
            });
        };
    }
    //// Portpicker
    function buildBoardPicker(boards) {
        var boardPicker = document.getElementById('board-picker');
        boardPicker.onchange = function(evt) {
            bitbloqSU.Serial.setBoard(evt.target.value);
        };
    }

    function addDOMListeners() {
        $('body').on('contextmenu', function() {
            return false;
        });
        $('.title-bar__icon').on('click', function() {
            chrome.runtime.reload();
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
        bitbloqSU.Serial.init();
        bitbloqSU.Serial.autoConfig().then(function() {
            bitbloqSU.SerialAPI.getDevices(function(devices) {
                bitbloqSU.UI.buildPortPicker(devices);
            });
            bitbloqSU.UI.paintBoardInfo();
            bitbloqSU.UI.paintPortInfo();
            bitbloqSU.Serial.disconnect();
        });
    };
    return {
        paintBoardInfo: paintBoardInfo,
        paintPortInfo: paintPortInfo,
        buildPortPicker: buildPortPicker,
        addDOMListeners: addDOMListeners,
        appWindow: appWindow,
        init: init
    };
})();
