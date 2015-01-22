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

    //connect(port,bitrate):connectionID
    //disconnect()
    //send(data):promise
    //+connection:connectionID

    bitbloqSU.SerialAPI = window.chrome.serial;
    bitbloqSU.lineBuffer = 0;
    var connectionId = -1;

    var receiverListener;

    //
    var defaultOnReceiveDataCallback = function(done) {
        return function(evt) {
            if (evt.data.byteLength) {
                if (bitbloqSU.lineBuffer) {
                    console.warn('bitbloqSU.lineBuffer set to 0');
                    removeReceiveDataListener();
                    console.info('bitbloqSU.SerialAPI.onReceive.addListener removed');
                    done();
                }
            } else {
                console.error('Data receive byteLength === 0');
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
        console.info('bitbloqSU.init');
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
                console.info('Connecting to board...');
                bitbloqSU.SerialAPI.connect(port, {
                    bitrate: bitrate,
                    //sendTimeout: 2000,
                    //receiveTimeout: 2000,
                    //ctsFlowControl: true,
                    name: 'bitbloqSerialConnection'
                }, function(info) {
                    if (info.connectionId !== -1) {

                        console.info({
                            'Connection board TEST OK': info
                        });
                        connectionId = info.connectionId;
                        resolve(info.connectionId);
                        return;
                    } else {
                        console.error({
                            'Connection board TEST KO': 'KO'
                        });
                        reject(-1);
                        return;
                    }
                });
            } catch (e) {
                console.error({
                    'Connection board TEST KO': e
                });
                reject(-2);
                return;
            }
        });
    };

    var sendData = function(data) {
        console.info('Sending ' + data.byteLength + ' bytes.');
        if (data.byteLength === 0) {
            return Promise.reject();
        }
        return new Promise(function(resolveSendData, rejectSendData) {
            console.info('Chrome is writing on board...');
            var onReceivePromise = new Promise(function(resolveOnReceive) {
                bitbloqSU.Serial.addReceiveDataListener(defaultOnReceiveDataCallback(resolveOnReceive));
            });
            window.chrome.serial.flush(connectionId, function() {
                bitbloqSU.SerialAPI.send(connectionId, data, function(sendInfo) {
                    console.info('sendInfo :', sendInfo);
                    onReceivePromise.then(function() {
                        resolveSendData();
                    }).
                    catch (function() {
                        console.eror(':(');
                        rejectSendData();
                    });
                });
            });
        });
    };


    return {
        init: init,
        sendData: sendData,
        connect: connect,
        disconnect: disconnect,
        getDevices: getDevices,
        getConnections: getConnections,
        receiverListener: receiverListener,
        defaultOnReceiveDataCallback: defaultOnReceiveDataCallback,
        addReceiveDataListener: addReceiveDataListener,
        removeReceiveDataListener: removeReceiveDataListener
    };
})();
