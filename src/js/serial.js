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

bitbloqSU.Serial = {};

bitbloqSU.SerialAPI = window.chrome.serial;
bitbloqSU.Serial.connectionId = -1;
bitbloqSU.Serial.TIMEOUT = 5000;

bitbloqSU.Serial.receiverListener = undefined;

bitbloqSU.Serial.defaultOnReceiveDataCallback = function(resolve, reject) {

    var timeout;
    // timeout for sendind data double ACK
    if (bitbloqSU.Serial.TIMEOUT) {
        timeout = setTimeout(function() {
            bitbloqSU.Serial.removeReceiveDataListener();
            console.warn('bitbloqSU.serial.sendData.timeout');
            reject('send:timeout');
        }, bitbloqSU.Serial.TIMEOUT);
    }

    return function(evt) {
        clearTimeout(timeout);
        bitbloqSU.Serial.removeReceiveDataListener();
        if (evt.data.byteLength > 0) {
            resolve(evt);
        } else {
            console.error('Data receive byteLength === 0');
            reject('send:empty');
        }
    };
};

bitbloqSU.Serial.addReceiveDataListener = function(callback) {
    //console.info('bitbloqSU.addReceiveDataListener');
    bitbloqSU.Serial.receiverListener = callback;
};
bitbloqSU.Serial.removeReceiveDataListener = function() {
    //console.info('bitbloqSU.removeReceiveDataListener');
    bitbloqSU.Serial.receiverListener = undefined;
};

bitbloqSU.Serial.init = function() {
    console.log('bitbloqSU.serial.init');
    bitbloqSU.SerialAPI.onReceive.addListener(function(evt) {
        console.log('bitbloqSU.Serial.init.onReceive', evt);
        if (bitbloqSU.Serial.receiverListener) {
            bitbloqSU.Serial.receiverListener.call(this, evt);
        }
    });
    bitbloqSU.SerialAPI.onReceiveError.addListener(function(evt) {
        console.error('Connection ' + evt.connectionId + ' received error: ' + evt.error);
        bitbloqSU.Serial.disconnect();
    });
};

bitbloqSU.Serial.getDevices = function() {
    return new Promise(function(resolve) {
        bitbloqSU.SerialAPI.getDevices(function(connections) {
            resolve(connections);
        });
    });
};

bitbloqSU.Serial.getConnections = function() {
    return new Promise(function(resolve) {
        bitbloqSU.SerialAPI.getConnections(function(connections) {
            resolve(connections);
        });
    });
};

bitbloqSU.Serial.disconnect = function() {
    return new Promise(function(resolve) {
        bitbloqSU.Serial.getConnections().then(function(connections) {
            if (connections.length > 0) {
                connections.forEach(function(connection) {
                    bitbloqSU.SerialAPI.disconnect(connection.connectionId, function() {});
                });
                bitbloqSU.Serial.connectionId = -1;
                console.info('Port disconnected!');
                resolve();
            }
        });
    });
};

//First port: "/dev/ttyACM0"
bitbloqSU.Serial.connect = function(port, bitrate) {
    return new Promise(function(resolve, reject) {
        try {
            console.info('Connecting to board...', port, bitrate);
            bitbloqSU.SerialAPI.connect(port, {
                bitrate: bitrate,
                sendTimeout: bitbloqSU.Serial.TIMEOUT,
                receiveTimeout: bitbloqSU.Serial.TIMEOUT,
                //ctsFlowControl: true,
                name: 'bitbloqSerialConnection'
            }, function(info) {
                if (info.connectionId !== -1) {
                    console.info('bitbloqSU.serial.connect.ok', info);
                    bitbloqSU.Serial.connectionId = info.connectionId;
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

bitbloqSU.Serial.sendData = function(data, delay) {
    console.info('bitbloqSU.serial.sendData', data.byteLength);
    if (data.byteLength === 0) {
        return Promise.reject();
    }
    return new Promise(function(resolveSendData, rejectSendData) {
        var onReceivePromise = new Promise(function(resolveOnReceive, rejectOnReceive) {
            bitbloqSU.Serial.addReceiveDataListener(bitbloqSU.Serial.defaultOnReceiveDataCallback(resolveOnReceive, rejectOnReceive));
        });
        console.info('Chrome is writing on board...');
        window.chrome.serial.flush(bitbloqSU.Serial.connectionId, function() {
            bitbloqSU.SerialAPI.send(bitbloqSU.Serial.connectionId, data, function(response) {
                console.info('bitbloqSU.serial.sendData.response', response);
                onReceivePromise.then(function(response) {
                    if (delay) {
                        setTimeout(function() {
                            resolveSendData(response);
                        }, delay);
                    } else {
                        resolveSendData(response);
                    }
                }).catch(function(response) {
                    rejectSendData(response);
                });
            });
        });
    });
};

bitbloqSU.Serial.setControlSignals = function(data) {
    return new Promise(function(resolve) {
        bitbloqSU.SerialAPI.setControlSignals(bitbloqSU.Serial.connectionId, data, function() {
            resolve();
        });
    });
};

bitbloqSU.Serial.init();
