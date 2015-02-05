/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Serial - Chrome.serial communication functionality
 ********************************************************* */
'use strict';
/* global Promise, bitbloqSU*/
/* jshint unused:false */
if (!window.bitbloqSU) {
    window.bitbloqSU = {};
}

bitbloqSU.Serial = {};

bitbloqSU.SerialAPI = window.chrome.serial;
bitbloqSU.Serial.connectionId = -1;
bitbloqSU.Serial.TIMEOUT = 10000;
bitbloqSU.Serial.lineBuffer = 0;

bitbloqSU.Serial.receiverListener = undefined;

bitbloqSU.Serial.defaultOnReceiveDataCallback = function(resolve, reject) {

    var timeout;
    // timeout for sendind data double ACK
    if (bitbloqSU.Serial.TIMEOUT) {
        timeout = setTimeout(function() {
            bitbloqSU.Serial.removeReceiveDataListener();
            console.error('bitbloqSU.serial.sendData.timeout');
            reject('send:timeout');
        }, bitbloqSU.Serial.TIMEOUT);
    }

    return function(evt) {
        console.info('bitbloqSU.callback');
        var str;
        if (evt.data.byteLength === 2) {
            str = String.fromCharCode.apply(null, new Uint16Array(evt.data));
        } else {
            str = String.fromCharCode.apply(null, new Uint8Array(evt.data));
        }
        var responseCode = parseInt(str.charCodeAt(0).toString(16), 10);
        console.info('onReceive.responseCode', responseCode);
        if (evt.data.byteLength !== 0) {
            bitbloqSU.Serial.lineBuffer += evt.data.byteLength;
            console.warn('onReceive.evt.data.byteLength', evt.data.byteLength);
            console.info('bitbloqSU.serial.lineBuffer', bitbloqSU.Serial.lineBuffer);
            if (bitbloqSU.Serial.lineBuffer >= 2) {
                console.info('lineBuffer >= 2');
                bitbloqSU.Serial.lineBuffer = 0;
                bitbloqSU.Serial.removeReceiveDataListener();
                clearTimeout(timeout);
                resolve();
            }
        } else {
            console.error('Data receive byteLength === 0');
            reject('send:empty');
        }
    };
};

bitbloqSU.Serial.addReceiveDataListener = function(callback) {
    bitbloqSU.Serial.receiverListener = callback;
};
bitbloqSU.Serial.removeReceiveDataListener = function() {
    bitbloqSU.Serial.receiverListener = undefined;
};

bitbloqSU.Serial.removeOnReceiveListeners = function() {
    console.log('bitbloqSU.Serial.removeOnReceiveListeners');
    bitbloqSU.SerialAPI.onReceive.removeListener();
    bitbloqSU.SerialAPI.onReceiveError.removeListener();
};

bitbloqSU.Serial.addOnReceiveListeners = function() {
    console.log('bitbloqSU.Serial.addOnReceiveListeners');
    bitbloqSU.SerialAPI.onReceive.addListener(function(evt) {
        console.log('bitbloqSU.Serial.init.onReceive', evt);
        console.log('bitbloqSU.Serial.init.onReceive.id', bitbloqSU.Serial.sendId);
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

bitbloqSU.Serial.connect = function(port, bitrate, callback) {

    try {
        console.info('Connecting to board...', port, bitrate);
        bitbloqSU.SerialAPI.connect(port, {
            bitrate: bitrate,
            sendTimeout: bitbloqSU.Serial.TIMEOUT,
            receiveTimeout: bitbloqSU.Serial.TIMEOUT,
            //ctsFlowControl: true,
            name: 'bitbloqSerialConnection'
        }, function(info) {
            if (info && info.connectionId !== -1) {
                console.info('bitbloqSU.serial.connect.ok', info);
                bitbloqSU.Serial.connectionId = info.connectionId;
                callback(info.connectionId);
                return;
            } else {
                console.error('bitbloqSU.serial.connect.ko');
                bitbloqSU.Program.SEMAPHORE = false;
                callback('program:error:connection');
                return;
            }
        });
    } catch (e) {
        console.error('bitbloqSU.serial.connect.ko', e);
        callback(-1);
        return;
    }

};

bitbloqSU.Serial.sendData = function(data) {
    bitbloqSU.Serial.sendId = Math.random();
    console.info('bitbloqSU.serial.sendData', data.byteLength);
    console.info('bitbloqSU.serial.sendData.id', bitbloqSU.Serial.sendId);
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
                console.info('bitbloqSU.serial.sendData.response.id', bitbloqSU.Serial.sendId);
                onReceivePromise.then(function(response) {
                    console.info('------bitbloqSU.serial.onReceivePromise------- Ready to next step');
                    resolveSendData(response);
                }).
                catch(function(response) {
                    rejectSendData(response);
                });
            });
        });
    });
};

bitbloqSU.Serial.setControlSignals = function(data, callback) {
    //return new Promise(function(resolve, reject) {
    bitbloqSU.SerialAPI.setControlSignals(bitbloqSU.Serial.connectionId, data, function(response) {
        if (response) {
            // resolve(response);
            callback(response);
            // setTimeout(function() {
            //     resolve(response);
            // }, bitbloqSU.Program.board.delay_reset);
        }
        // else {
        //     reject(response);
        // }
    });
    //});
};

bitbloqSU.Serial.init = function(argument) {
    bitbloqSU.Serial.addOnReceiveListeners();
    bitbloqSU.Serial.removeOnReceiveListeners();
};

bitbloqSU.Serial.init();
