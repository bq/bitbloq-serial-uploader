/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Serial - Chrome.serial communication functionality
 ********************************************************* */
'use strict';
/* global logger, Promise, bitbloqSU*/
/* jshint unused:false */
if (!window.bitbloqSU) {
    window.bitbloqSU = {};
}


bitbloqSU.Serial = (function() {

    bitbloqSU.SerialAPI = window.chrome.serial;
    bitbloqSU.lineBuffer = 0;
    var connectionId = -1;
    var TIMEOUT = 3000;

    var receiverListener;

    var defaultOnReceiveDataCallback = function(resolve, reject) {

        // timeout for sendind data double ACK
        setTimeout(function() {
            removeReceiveDataListener();
            console.warn('bitbloqSU.serial.sendData.timeout');
            reject('send:timeout');
        }, TIMEOUT);

        return function(evt) {
            removeReceiveDataListener();
            if (evt.data.byteLength) {
                console.info('bitbloqSU.SerialAPI.onReceive.addListener removed');
                resolve();
            } else {
                console.error('Data receive byteLength === 0');
                reject('send:empty');
            }
        };
    };

    var addReceiveDataListener = function(callback) {
        console.info('bitbloqSU.addReceiveDataListener');
        receiverListener = callback;
    };
    var removeReceiveDataListener = function() {
        console.info('bitbloqSU.removeReceiveDataListener');
        receiverListener = undefined;
    };

    var init = function() {
        console.log('bitbloqSU.serial.init');
        bitbloqSU.SerialAPI.onReceive.addListener(function(evt) {
            if (receiverListener) {
                receiverListener.call(this, evt);
            }
        });
        bitbloqSU.SerialAPI.onReceiveError.addListener(function(evt) {
            console.error('Connection ' + evt.connectionId + ' received error: ' + evt.error);
            disconnect();
        });
    };

    var getDevices = function() {
        return new Promise(function(resolve) {
            bitbloqSU.SerialAPI.getDevices(function(connections) {
                resolve(connections);
            });
        });
    };

    var getConnections = function() {
        return new Promise(function(resolve) {
            bitbloqSU.SerialAPI.getConnections(function(connections) {
                resolve(connections);
            });
        });
    };

    var disconnect = function() {
        return new Promise(function(resolve) {
            getConnections().then(function(connections) {
                if (connections.length > 0) {
                    connections.forEach(function(connection) {
                        bitbloqSU.SerialAPI.disconnect(connection.connectionId, function() {
                            connectionId = -1;
                            console.info('Port disconnected!');

                        });
                    });
                    resolve();
                }
            });
        });
    };

    //First port: "/dev/ttyACM0"
    var connect = function(port, bitrate) {
        return new Promise(function(resolve, reject) {
            try {
                console.info('Connecting to board...', port, bitrate);
                bitbloqSU.SerialAPI.connect(port, {
                    bitrate: bitrate,
                    sendTimeout: TIMEOUT,
                    receiveTimeout: TIMEOUT,
                    //ctsFlowControl: true,
                    name: 'bitbloqSerialConnection'
                }, function(info) {
                    if (info.connectionId !== -1) {

                        console.info('bitbloqSU.serial.connect.ok', info);
                        connectionId = info.connectionId;
                        resolve(info.connectionId);
                        return;
                    } else {
                        console.error('bitbloqSU.serial.connect.ko');
                        reject(-1);
                        return;
                    }
                });
            } catch (e) {
                console.error('bitbloqSU.serial.connect.ko', e);
                reject(-2);
                return;
            }
        });
    };

    var sendData = function(data) {
        console.info('bitbloqSU.serial.sendData', data.byteLength);
        if (data.byteLength === 0) {
            return Promise.reject();
        }
        return new Promise(function(resolveSendData, rejectSendData) {
            var onReceivePromise = new Promise(function(resolveOnReceive, rejectOnReceive) {
                bitbloqSU.Serial.addReceiveDataListener(defaultOnReceiveDataCallback(resolveOnReceive, rejectOnReceive));
            });
            console.info('Chrome is writing on board...');
            window.chrome.serial.flush(connectionId, function() {
                bitbloqSU.SerialAPI.send(connectionId, data, function(response) {
                    console.info('bitbloqSU.serial.sendData.response', response);
                    onReceivePromise.then(function(response) {
                        resolveSendData(response);
                    }).catch(function(response) {
                        rejectSendData(response);
                    });
                });
            });
        });
    };

    var setControlSignals = function(data, delay) {
        return new Promise(function(resolve) {
            bitbloqSU.SerialAPI.setControlSignals(connectionId, data, function() {
                setTimeout(function() {
                    resolve();
                }, delay);
            });
        });
    };

    return {
        init: init,
        sendData: sendData,
        connect: connect,
        disconnect: disconnect,
        setControlSignals: setControlSignals,
        getDevices: getDevices,
        getConnections: getConnections,
        receiverListener: receiverListener,
        defaultOnReceiveDataCallback: defaultOnReceiveDataCallback,
        addReceiveDataListener: addReceiveDataListener,
        removeReceiveDataListener: removeReceiveDataListener
    };
})();

bitbloqSU.Serial.init();
