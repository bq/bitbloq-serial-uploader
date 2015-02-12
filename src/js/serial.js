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
bitbloqSU.Serial.TIMEOUT = 1000;
bitbloqSU.Serial.lineBuffer = 0;

bitbloqSU.Serial.receiverListener = undefined;

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

bitbloqSU.Serial.disconnect = function(callback) {
    bitbloqSU.SerialAPI.getConnections(function(connections) {
        if (connections.length > 0) {
            connections.forEach(function(connection) {
                bitbloqSU.SerialAPI.disconnect(connection.connectionId, function() {
                    bitbloqSU.Serial.connectionId = -1;
                    console.info('bitbloqSU.serial.disconnect.ok');
                    if (callback) {
                        callback({
                            msg: 'ok'
                        });
                    }
                });
            });
        } else {
            console.info('bitbloqSU.serial.disconnect.empty');
            if (callback) {
                callback({
                    msg: 'ok'
                });
            }
        }
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
                callback({
                    msg: 'connection:ok',
                    data: info
                });
                return;
            } else {
                console.error('bitbloqSU.serial.connect.ko');
                callback({
                    error: 'serial:error:connection'
                });
                return;
            }
        });
    } catch (e) {
        console.error('bitbloqSU.serial.connect.ko', e);
        callback({
            error: 'serial:error:connection'
        });
        return;
    }

};

bitbloqSU.Serial.sendData = function(data, callback) {
    bitbloqSU.Serial.sendId = Math.random();
    console.info('bitbloqSU.serial.sendData', data.byteLength);
    console.info('bitbloqSU.serial.sendData.id', bitbloqSU.Serial.sendId);
    if (data.byteLength === 0) {
        return callback({
            error: 'send:data:empty'
        });
    }

    var timeout,
        onReceiveACK,
        sendDataACK;
    // timeout for sendind data double ACK
    if (bitbloqSU.Serial.TIMEOUT) {
        timeout = setTimeout(function() {
            bitbloqSU.Serial.removeReceiveDataListener();
            console.error('bitbloqSU.serial.sendData.timeout');
            callback({
                error: 'send:onreceive:timeout'
            });
        }, bitbloqSU.Serial.TIMEOUT);
    }

    bitbloqSU.Serial.addReceiveDataListener(function(evt) {
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
                onReceiveACK = {
                    msg: 'send:ack2:ok',
                    data: evt.data
                };
                if (sendDataACK && sendDataACK.msg) {
                    callback({
                        msg: 'send:ok'
                    });
                }
            }
        } else {
            console.error('Data receive byteLength === 0');
            callback({
                error: 'send:response:empty'
            });
        }
    });

    console.info('Chrome is writing on board...');
    bitbloqSU.SerialAPI.flush(bitbloqSU.Serial.connectionId, function() {
        bitbloqSU.SerialAPI.send(bitbloqSU.Serial.connectionId, data, function(response) {
            console.info('bitbloqSU.serial.sendData.response', response);
            console.info('bitbloqSU.serial.sendData.response.id', bitbloqSU.Serial.sendId);
            sendDataACK = {
                msg: 'send:ack1:ok',
                data: response
            };
            if (onReceiveACK && onReceiveACK) {
                callback({
                    msg: 'send:ok'
                });
            }
        });
    });

};

bitbloqSU.Serial.setControlSignals = function(data, callback) {
    bitbloqSU.SerialAPI.setControlSignals(bitbloqSU.Serial.connectionId, data, function(response) {
        callback({
            msg: response ? 'ok' : 'response:empty',
            data: response
        });
    });
};

bitbloqSU.Serial.init = function(argument) {
    bitbloqSU.Serial.addOnReceiveListeners();
    bitbloqSU.Serial.removeOnReceiveListeners();
};

bitbloqSU.Serial.init();
