/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Serial - Chrome.serial communication functionality
 ********************************************************* */

'use strict';
/* global logger, Promise, bitbloqSU*/

bitbloqSU.Serial = (function() {

    bitbloqSU.SerialAPI = window.chrome.serial;
    bitbloqSU.disconnectTimer = null;

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

    var getDevicesList = function(callback) {
        try {
            bitbloqSU.SerialAPI.getDevices(function(devices) {
                for (var i = 0; i < devices.length; i++) {
                    var info = devices[i];
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
    var setDeviceInfo = function(config) {
        if (!config) {
            deviceInfo.port = undefined;
            deviceInfo.connected = false;
            deviceInfo.connectionId = -1;
            deviceInfo.boardInfo = null;
            return false;
        }
        for (var i = 0; i < _boardList.length; i++) {
            var item = _boardList[i];
            if (item.id === config.displayName) {
                deviceInfo.boardInfo = item;
                deviceInfo.port = config.path;
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
                bitbloqSU.SerialAPI.disconnect(deviceInfo.connectionId, function() {
                    deviceInfo.connectionId = -1;
                    deviceInfo.connected = false;
                    logger.info('Port disconnected!');
                }); // Close port
            }
        });

    };

    var connect = function() {

        return new Promise(function(resolve, reject) {

            if (deviceInfo.connected) {
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
                rejected();
            }
        });

    };

    var autoConfig = function() {

        return new Promise(function(resolve, reject) {

            logger.info('Detecting boards....');

            getDevicesList(function(statusOk) {

                if (statusOk) {
                    connect().then(function() {

                        //Disconnect before 10 seconds by safety
                        if (!bitbloqSU.disconnectTimer) {
                            bitbloqSU.disconnectTimer = setTimeout(function() {
                                bitbloqSU.Serial.disconnect();
                                clearTimeout(bitbloqSU.disconnectTimer);
                                bitbloqSU.disconnectTimer = null;
                            }, 10000);
                        }

                        resolve();
                    }).catch(function() {
                        setDeviceInfo(null);
                        reject();
                    });
                }

                if (!deviceInfo.port || !statusOk) {
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
        return new Promise(function(resolve) {
            logger.info('Chrome is writing on board...');
            if (deviceInfo.connected) {
                bitbloqSU.SerialAPI.send(deviceInfo.connectionId, data, function(sendInfo) {
                    logger.info('sendInfo', sendInfo);
                    setTimeout(function() {
                        resolve();
                    }, 100);
                });
            } else {
                logger.error('sendData error');
            }
        });
    };

    return {
        setControlSignals: setControlSignals,
        autoConfig: autoConfig,
        getDeviceInfo: getDeviceInfo,
        sendData: sendData,
        connect: connect,
        disconnect: disconnect
    };


    //@TODO REFACTOR SENDING DATA
    //
    //var bitbloqSerialEvent;
    // var addChromeSerialListeners = function() {

    //     try {
    //         SerialAPI.onReceive.addListener(onReceiveCallback);
    //         //SerialAPI.onReceiveError.addListener(onReceiveErrorCallback);
    //     } catch (e) {
    //         logger.info('UNABLE ADD CHROME.SERIAL LISTENERS', e);
    //     }
    // };

    //var onReceiveCallbackPromise = new Promise(function() {});
    //var onReceiveCallback = function(e) {
    // var str;
    // (e.data.byteLength === 2) ? str = String.fromCharCode.apply(null, new Uint16Array(e.data)) : str = String.fromCharCode.apply(null, new Uint8Array(e.data));
    // var responseCode = parseInt(str.charCodeAt(0).toString(16), 10);
    // logger.info('SerialAPI.onReceive', responseCode);

    // if (responseCode !== 0) {

    // var output = [],
    //     sNumber = responseCode.toString();

    // for (var i = 0, len = sNumber.length; i < len; i += 1) {
    //     output.push(+sNumber.charAt(i));
    // }
    // for (var j = 0; j < output.length; j++) {
    //     lineBuffer += output[j];
    // }
    // lineBuffer += e.data.byteLength;
    // logger.info(lineBuffer);

    // if (progmodeflag && lineBuffer >= 4) {

    //     logger.info('progmodeflag', progmodeflag, 'lineBuffer', lineBuffer);
    //     lineBuffer = 0;
    //     progmodeflag = false;
    //     logger.info('----- progmode_finished event emit----');
    //     bitbloqEmitter.emit('progmode_finished');
    //     onReceiveCallbackPromise.resolve();

    // } else if (!progmodeflag && lineBuffer >= 8) {
    //     lineBuffer = 0;
    //     logger.info('----- next_prog_page event emit----');
    //     bitbloqEmitter.emit('next_prog_page');
    //     onReceiveCallbackPromise.resolve();
    // }

    // }
    // else if ((counterInitialEvents !== null) && responseCode === 10 || responseCode === 14) {
    //     counterInitialEvents += 1;
    //     logger.info('oooooooooooooooooo', counterInitialEvents);
    //     if (counterInitialEvents === 4) {
    //         counterInitialEvents = null;
    //         logger.info('----- EVENTO EMITIDO ----');
    //         bitbloqEmitter.emit('progmode_finished');
    //     }
    // }
    //};

    // var onReceiveErrorCallback = function(e) {
    //     logger.error('SerialAPI.onReceiveError', e);
    // };

})();
