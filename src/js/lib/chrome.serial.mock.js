'use strict';

window.chrome = {
    serial: {
        FAIL_RATE: {
            ALL: 0.5,
            GET_CONNECTIONS: 0,
            GET_DEVICES: 0,
            CONNECT: 0,
            DISCONNECT: 0,
            SET_CONTROL_SIGNALS: 0,
            FLUSH: 0,
            SEND: 0
        }
    }
};

window.chrome.serial.applyNoise = function(rate) {
    var fail = Math.random();
    var threshold = window.chrome.serial.FAIL_RATE.ALL;
    if (window.chrome.serial.FAIL_RATE[rate] >= 0) {
        threshold = window.chrome.serial.FAIL_RATE[rate];
    }
    return fail < threshold;
};

window.chrome.serial.onReceive = {
    HANDLER: undefined,
    addListener: function(handler) {
        window.chrome.serial.onReceive.HANDLER = handler;
    }
};

window.chrome.serial.onReceiveError = {
    HANDLER_ERROR: undefined,
    addListener: function(handler) {
        window.chrome.serial.onReceiveError.HANDLER_ERROR = handler;
    }
};

window.chrome.serial.getConnections = function(handler) {
    var response;
    if (window.chrome.serial.applyNoise('GET_CONNECTIONS')) {
        response = [];
    } else {
        response = [{
            displayName: 'device1',
            path: 'device1'
        }, {
            displayName: 'device2',
            path: 'device2'
        }, {
            displayName: 'device3',
            path: 'device3'
        }];
    }
    handler(response);
};

window.chrome.serial.getDevices = function(handler) {
    var response;
    if (window.chrome.serial.applyNoise('GET_DEVICES')) {
        response = [];
    } else {
        response = [{
            displayName: 'device1',
            path: 'device1',
            driverId: 'DexcomG4',
            usbDevice: 3,
            model: 'G4Receiver',
            serialNumber: 'DM36820627',
            id: 'G4Receiver DM36820627'
        }, {
            displayName: 'device2',
            path: 'device2',
            driverId: 'DexcomG3',
            usbDevice: 3,
            model: 'G3Receiver',
            serialNumber: 'DM36820626',
            id: 'G3Receiver DM36820626'
        }];
    }
    handler(response);
};

window.chrome.serial.connect = function(port, options, handler) {
    var response;
    if (window.chrome.serial.applyNoise('CONNECT')) {
        response = undefined;
    } else {
        response = {
            connectionId: 'connection1'
        };
    }
    handler(response);
};

window.chrome.serial.disconnect = function(connectionId, handler) {
    handler();
};

window.chrome.serial.setControlSignals = function(connectionId, infoObject, handler) {
    handler();
};

window.chrome.serial.flush = function(connectionId, handler) {
    handler();
};

window.chrome.serial.SEND_TIMEOUT = 1000;
window.chrome.serial.send = function(connectionId, data, handler) {
    setTimeout(function() {
        if (data === 'reject' || window.chrome.serial.applyNoise('SEND')) {
            console.error('send:reject');
            // disconnected timeout device_lost system_error
            // https://developer.chrome.com/apps/serial#event-onReceiveError
            if (window.chrome.serial.onReceiveError.HANDLER_ERROR) {
                window.chrome.serial.onReceiveError.HANDLER_ERROR('system_error');
            }
        } else {
            console.error('send:resolve');
            window.chrome.serial.HANDLER({
                data: {
                    byteLength: 2,
                    data: 'ACK'
                }
            });
        }
    }, window.chrome.serial.SEND_TIMEOUT);
    handler('send:response');
};
