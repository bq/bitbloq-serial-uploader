/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Serial - Chrome.serial communication functionality
 ********************************************************* */
'use strict';
/* global logger, Promise, bitbloqSU*/
/* jshint unused:false */
bitbloqSU.Serial = (function() {
    bitbloqSU.SerialAPI = window.chrome.serial;
    bitbloqSU.disconnectTimer = null;
    bitbloqSU.lineBuffer = 0;

    var deviceInfo = {
        port: undefined,
        connected: false,
        connectionId: -1,
        boardInfo: undefined
    };
    if (window.bitbloqSU.availableBoards) {
        var _boardList = window.bitbloqSU.availableBoards;
    } else {
        throw 'Board configurations not available';
    }
    var receiverListener;
    var defaultOnReceiveDataCallback = function(done) {
        return function(evt) {
            logger.info('bitbloqSU.callback');
            var str;
            if (evt.data.byteLength === 2) {
                str = String.fromCharCode.apply(null, new Uint16Array(evt.data));
            } else {
                str = String.fromCharCode.apply(null, new Uint8Array(evt.data));
            }
            var responseCode = parseInt(str.charCodeAt(0).toString(16), 10);
            logger.info({
                'SerialAPI.onReceive': responseCode
            });
            if (evt.data.byteLength !== 0) {
                logger.warn({
                    'evt.data.byteLength': evt.data.byteLength
                });
                bitbloqSU.lineBuffer += evt.data.byteLength;
                logger.info({
                    'lineBuffer': bitbloqSU.lineBuffer
                });
                if (bitbloqSU.lineBuffer >= 2) {
                    logger.info('lineBuffer >= 2');
                    if (bitbloqSU.lineBuffer) {
                        bitbloqSU.lineBuffer = 0;
                        logger.warn('bitbloqSU.lineBuffer set to 0');
                        removeReceiveDataListener();
                        logger.info('bitbloqSU.SerialAPI.onReceive.addListener removed');
                        done();
                    }
                } else if (bitbloqSU.lineBuffer >= 4) {
                    logger.info('lineBuffer >= 4');
                    if (bitbloqSU.lineBuffer) {
                        bitbloqSU.lineBuffer = 0;
                        logger.warn('bitbloqSU.lineBuffer set to 0');
                        removeReceiveDataListener();
                        logger.info('bitbloqSU.SerialAPI.onReceive.addListener removed');
                        done();
                    }
                }
            } else {
                logger.error('Data receive byteLength === 0');
            }
        };
    };
    var addReceiveDataListener = function(callback) {
        logger.info('bitbloqSU.addReceiveDataListener');
        receiverListener = callback;
    };
    var removeReceiveDataListener = function() {
        logger.info('bitbloqSU.removeReceiveDataListener');
        receiverListener = undefined;
    };
    var init = function() {
        logger.info('bitbloqSU.init');
        bitbloqSU.SerialAPI.onReceive.addListener(function(evt) {
            if (receiverListener) {
                receiverListener.call(this, evt);
            }
        });
        bitbloqSU.SerialAPI.onReceiveError.addListener(function(evt) {
            logger.error('Connection ' + evt.connectionId + ' received error: ' + evt.error);
            disconnect();
        });
    };
    var getDevicesList = function(boardName, port, callback) {
        try {
            bitbloqSU.SerialAPI.getDevices(function(devices) {

                for (var i = 0; i < devices.length; i++) {
                    var info = devices[i];
                    if (!info.displayName && boardName && port) {
                        info.displayName = boardName;
                        info.path = port;
                    }
                    if (setDeviceInfo(info)) {
                        logger.info('Board detected -> ', deviceInfo);
                        callback(true);
                        return true;
                    }
                }
                callback(false);
            });
        } catch (e) {
            logger.error(e);
        }
    };
    var getDeviceInfo = function() {
        return deviceInfo;
    };
    var setPort = function(port) {
        deviceInfo.port = port;
    };
    var setBoard = function(board) {
        deviceInfo.board = board;
    };
    var setDeviceInfo = function(info) {
        if (!info || !info.displayName) {
            deviceInfo.port = undefined;
            deviceInfo.connected = true;
            deviceInfo.connectionId = -1;
            deviceInfo.boardInfo = null;
            return false;
        }
        for (var i = 0; i < _boardList.length; i++) {
            var item = _boardList[i];
            if (item.id === info.displayName) {
                deviceInfo.boardInfo = item;
                deviceInfo.port = info.path;
                deviceInfo.connected = true;
                return true;
            }
        }
        return false;
    };
    var getConnections = function() {
        return new Promise(function(resolve) {
            bitbloqSU.SerialAPI.getConnections(function(connections) {
                resolve(connections);
            });
        });
    };
    var disconnect = function() {
        getConnections().then(function(connections) {
            if (connections.length > 0) {
                connections.forEach(function(connection) {
                    bitbloqSU.SerialAPI.disconnect(connection.connectionId, function() {
                        deviceInfo.connectionId = -1;
                        deviceInfo.connected = false;
                        logger.info('Port disconnected!');
                    }); // Close port
                });
            }
        });
    };
    var connect = function() {
        return new Promise(function(resolve, reject) {
            getConnections().then(function(connections) {
                if (!connections || connections.length === 0) {
                    try {
                        logger.info('Connecting to board...');
                        bitbloqSU.SerialAPI.connect(deviceInfo.port, {
                            bitrate: deviceInfo.boardInfo.bitrate,
                            sendTimeout: 2000,
                            receiveTimeout: 2000,
                            //ctsFlowControl: true,
                            name: 'bitbloqSerialConnection'
                        }, function(info) {
                            if (info.connectionId !== -1) {
                                deviceInfo.connectionId = info.connectionId;
                                deviceInfo.connected = true;
                                logger.info({
                                    'Connection board TEST OK': info
                                });
                                resolve();
                            } else {
                                deviceInfo.connected = false;
                                deviceInfo.connectionId = -1;
                                logger.error({
                                    'Connection board TEST KO': 'KO'
                                });
                                reject();
                            }
                        });
                    } catch (e) {
                        deviceInfo.connectionId = -1;
                        deviceInfo.connected = false;
                        deviceInfo.boardInfo = null;
                        logger.error({
                            'Connection board TEST KO': e
                        });
                        reject(e);
                    }
                } else {
                    //disconnect();
                    reject();
                }
            });
        });
    };
    /** @Deprecated: use disconnect */
    var disconnectTimerFunc = function(time) {
        return disconnect();
    };
    var autoConfig = function(boardName, port) {
        return new Promise(function(resolve, reject) {
            logger.info('Detecting boards....');
            getDevicesList(boardName, port, function(statusOk) {

                if (statusOk) {
                    connect().then(function() {
                        resolve();
                    }).catch(function() {
                        setDeviceInfo(null);
                        reject();
                    });
                } else {
                    if (!bitbloqSU.disconnectTimer) {
                        bitbloqSU.disconnectTimer = setTimeout(function() {
                            reject();
                            clearTimeout(bitbloqSU.disconnectTimer);
                            bitbloqSU.disconnectTimer = null;
                            //chrome.runtime.reload();
                        }, 3000);
                    }
                }
                if (!deviceInfo.port || !statusOk && !boardName && !port) {
                    setDeviceInfo(null);
                    reject();
                    logger.error('None board detected!');
                }
            });
        });
    };
    /*
    infoObject = {
        dtr: false,
        rts: false
    }
     */
    var setControlSignals = function(infoObject) {
        return new Promise(function(resolve) {
            bitbloqSU.SerialAPI.setControlSignals(deviceInfo.connectionId, infoObject, function() {
                setTimeout(function() {
                    resolve();
                }, bitbloqSU.Serial.getDeviceInfo().boardInfo.delay_reset);
            });
        });
    };
    var sendData = function(data) {
        logger.info('Sending ' + data.byteLength + ' bytes.');
        if (data.byteLength === 0) {
            return Promise.reject();
        }
        return new Promise(function(resolveSendData, rejectSendData) {
            logger.info('Chrome is writing on board...');
            logger.info({
                'deviceInfo': deviceInfo
            });
            if (deviceInfo.connected) {
                var onReceivePromise = new Promise(function(resolveOnReceive) {
                    bitbloqSU.Serial.addReceiveDataListener(defaultOnReceiveDataCallback(resolveOnReceive));
                });
                window.chrome.serial.flush(deviceInfo.connectionId, function() {
                    bitbloqSU.SerialAPI.send(deviceInfo.connectionId, data, function(sendInfo) {
                        logger.info('sendInfo :', sendInfo);
                        onReceivePromise.then(function() {
                            resolveSendData();
                        }).
                        catch(function() {
                            logger.eror(':(');
                            rejectSendData();
                        });
                    });
                });
            } else {
                logger.error('device is not connected');
                rejectSendData();
            }
        });
    };
    return {
        init: init,
        setControlSignals: setControlSignals,
        autoConfig: autoConfig,
        getDeviceInfo: getDeviceInfo,
        setDeviceInfo: setDeviceInfo,
        sendData: sendData,
        connect: connect,
        disconnect: disconnect,
        receiverListener: receiverListener,
        defaultOnReceiveDataCallback: defaultOnReceiveDataCallback,
        addReceiveDataListener: addReceiveDataListener,
        removeReceiveDataListener: removeReceiveDataListener,
        disconnectTimerFunc: disconnectTimerFunc
    };
})();
