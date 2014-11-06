'use strict';
/* global logger, Promise */

/* *******************************************************
bitbloqSerial - Chrome.serial communication functionality
********************************************************* */

var st = null;
var SerialAPI = window.chrome.serial;

var bitbloqSerial = (function() {

    var currentBoard = null;
    var currentPort = null;
    var boardConnected = false;
    var connectionId = -1;

    var portsOnSystem = [];
    //TODO Setting configuration on config file
    var boardList = [{
        id: 'Arduino_Uno',
        name: 'Arduino Uno',
        arch: 'arduino',
        board: 'uno',
        bitrate: 115200,
        maxPageSize: 128,
        delay_reset: 200,
        delay_sendData: 150,
        max_size: 32256
    }, {
        id: 'FT232R_USB_UART',
        name: 'ZUM BT',
        arch: 'arduino',
        board: 'bt328',
        bitrate: 19200,
        maxPageSize: 128,
        delay_reset: 200,
        delay_sendData: 150,
        max_size: 28672
    }];

    var getDevicesList = function(callback) {
        try {
            SerialAPI.getDevices(function(devices) {
                portsOnSystem = devices;
                for (var i = 0; i < portsOnSystem.length; i++) {
                    var port = portsOnSystem[i];

                    var boardInfo = {
                        boardId: port.displayName
                    };
                    if (setConfig(boardInfo)) {
                        currentPort = port.path;
                        logger.info('Board detected -> ', currentBoard);
                        logger.info('Board detected on port -> ', currentPort);
                        break;
                    }
                }
                callback();
            });
        } catch (e) {
            logger.error(e);
        }
    };

    var getCurrentBoard = function() {
        return currentBoard;
    };
    var getCurrentPort = function() {
        return currentPort;
    };
    var getConnections = function() {
        return new Promise(function(resolve) {
            SerialAPI.getConnections(function(connections) {
                resolve(connections);
            });
        });
    };

    var disconnect = function() {

        bitbloqSerial.getConnections().then(function(connections) {
            if (connections.length > 0) {
                SerialAPI.disconnect(connectionId, function() {
                    logger.info('Port disconnected!');
                    connectionId = -1;
                    boardConnected = false;
                }); // Close port
            }
        });

    };

    var connect = function() {

        //Disconnect before 10 seconds by safety
        if (!st) {
            st = setTimeout(function() {
                bitbloqSerial.disconnect();
                clearTimeout(st);
                st = null;
            }, 10000);
        }

        return new Promise(function(resolve, reject) {

            if (!boardConnected) {
                try {
                    logger.info('Connecting to board...');
                    SerialAPI.connect(currentPort, {
                        bitrate: currentBoard.bitrate,
                        sendTimeout: 2000,
                        receiveTimeout: 2000,
                        //ctsFlowControl: true,
                        name: 'bitbloqSerialConnection'
                    }, function(info) {
                        if (info.connectionId !== -1) {
                            connectionId = info.connectionId;
                            boardConnected = true;
                            logger.info('Connection board TEST', 'OK', info);
                            resolve();
                        } else {
                            boardConnected = false;
                            connectionId = -1;
                            logger.error('Connection board TEST', 'KO');
                            reject();
                        }
                    });
                } catch (e) {
                    connectionId = -1;
                    boardConnected = false;
                    logger.error('Connection board TEST', 'KO');
                    reject(e);
                }
            } else {
                resolve();
            }
        });

    };

    var autoConfig = function() {

        return new Promise(function(resolve, reject) {

            logger.info('Detecting boards....');

            getDevicesList(function() {

                connect().then(function() {

                    //addChromeSerialListeners();

                    resolve();
                }).catch(function() {
                    connectionId = -1;
                    boardConnected = false;
                    currentBoard = null;
                    reject();
                });

                if (!currentPort) {
                    connectionId = -1;
                    boardConnected = false;
                    currentBoard = null;
                    reject();
                    logger.error('currentPort is not defined');
                }

            });
        });
    };

    var setConfig = function(config) {
        for (var i = 0; i < boardList.length; i++) {
            var item = boardList[i];
            if (item.id === config.boardId) {
                currentBoard = item;
                return true;
            }
        }
        return false;
    };

    /*
    infoObject = {
        dtr: false,
        rts: false
    }
     */
    var setControlSignals = function(infoObject) {
        return new Promise(function(resolve) {
            SerialAPI.setControlSignals(connectionId, infoObject, function() {
                setTimeout(function() {
                    resolve();
                }, bitbloqSerial.getCurrentBoard().delay_reset);
            });
        });
    };

    var sendData = function(data) {

        return new Promise(function(resolve) {

            logger.info('Chrome is writing on board...');
            if (boardConnected) {

                SerialAPI.send(connectionId, data, function(sendInfo) {
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

    //var bitbloqSerialEvent;
    // var addChromeSerialListeners = function() {

    //     try {
    //         SerialAPI.onReceive.addListener(onReceiveCallback);
    //         //SerialAPI.onReceiveError.addListener(onReceiveErrorCallback);
    //     } catch (e) {
    //         logger.info('UNABLE ADD CHROME.SERIAL LISTENERS', e);
    //     }
    // };

    // var deleteChromeSerialListeners = function() {
    //     // body...
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

    return {
        getDevicesList: getDevicesList,
        setConfig: setConfig,
        setControlSignals: setControlSignals,
        autoConfig: autoConfig,
        getCurrentBoard: getCurrentBoard,
        getCurrentPort: getCurrentPort,
        getConnections: getConnections,
        portsOnSystem: portsOnSystem,
        sendData: sendData,
        connect: connect,
        disconnect: disconnect
    };

})();
