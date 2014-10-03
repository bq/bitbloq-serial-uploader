'use strict';
/* global console */

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
        //        delays: [300, 300, 300, 30, 70, 5, 30, 70],
        delay_reset: 200,
        delay_sendData: 100,
        max_size: 32256
    }, {
        id: 'FT232R_USB_UART',
        name: 'ZUM BT',
        arch: 'arduino',
        board: 'bt328',
        bitrate: 19200,
        maxPageSize: 128,
        //        delays: [200, 200, 200, 50, 90, 20, 100, 70],
        delay_reset: 100,
        delay_sendData: 20,
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
                        console.log('Board detected -> ', currentBoard);
                        console.log('Board detected on port -> ', currentPort);
                        break;
                    }
                }
                callback();
            });
        } catch (e) {
            console.error(e);
        }
    };

    var getCurrentBoard = function() {
        return currentBoard;
    };
    var getCurrentPort = function() {
        return currentPort;
    };

    var disconnect = function() {

        //if (bitbloqSerial.boardConnected) {
        SerialAPI.disconnect(connectionId, function() {
            console.log('Port disconnected!');
            connectionId = -1;
            boardConnected = false;
        }); // Close port
        //}
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
                    console.log('Connecting to board...');
                    SerialAPI.connect(currentPort, {
                        bitrate: currentBoard.bitrate,
                        sendTimeout: 2000,
                        receiveTimeout: 2000,
                        ctsFlowControl: true,
                        name: 'bitbloqSerialConnection'
                    }, function(info) {
                        if (info.connectionId != -1) {
                            connectionId = info.connectionId;
                            boardConnected = true;
                            console.info('Connection board TEST', 'OK', info);
                            resolve();
                        } else {
                            boardConnected = false;
                            connectionId = -1;
                            console.error('Connection board TEST', 'KO');
                            reject();
                        }
                    });
                } catch (e) {
                    connectionId = -1;
                    boardConnected = false;
                    console.error('Connection board TEST', 'KO');
                    reject(e);
                }
            } else {
                resolve();
            }
        });

    };

    var autoConfig = function() {

        return new Promise(function(resolve, reject) {

            console.log('Detecting boards....');

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
                    console.error('currentPort is not defined');
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

            console.info('Chrome is writing on board...');
            if (boardConnected) {

                SerialAPI.send(connectionId, data, function(sendInfo) {
                    console.info('sendInfo', sendInfo);
                    setTimeout(function() {
                        resolve();
                    }, 100);
                });

            } else {
                console.error('sendData error');
            }
        });
    };

    //var bitbloqSerialEvent;
    // var addChromeSerialListeners = function() {

    //     try {
    //         SerialAPI.onReceive.addListener(onReceiveCallback);
    //         //SerialAPI.onReceiveError.addListener(onReceiveErrorCallback);
    //     } catch (e) {
    //         console.log('UNABLE ADD CHROME.SERIAL LISTENERS', e);
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
    // console.log('SerialAPI.onReceive', responseCode);

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
    // console.log(lineBuffer);

    // if (progmodeflag && lineBuffer >= 4) {

    //     console.log('progmodeflag', progmodeflag, 'lineBuffer', lineBuffer);
    //     lineBuffer = 0;
    //     progmodeflag = false;
    //     console.info('----- progmode_finished event emit----');
    //     bitbloqEmitter.emit('progmode_finished');
    //     onReceiveCallbackPromise.resolve();

    // } else if (!progmodeflag && lineBuffer >= 8) {
    //     lineBuffer = 0;
    //     console.info('----- next_prog_page event emit----');
    //     bitbloqEmitter.emit('next_prog_page');
    //     onReceiveCallbackPromise.resolve();
    // }

    // }
    // else if ((counterInitialEvents !== null) && responseCode === 10 || responseCode === 14) {
    //     counterInitialEvents += 1;
    //     console.log('oooooooooooooooooo', counterInitialEvents);
    //     if (counterInitialEvents === 4) {
    //         counterInitialEvents = null;
    //         console.info('----- EVENTO EMITIDO ----');
    //         bitbloqEmitter.emit('progmode_finished');
    //     }
    // }
    //};

    // var onReceiveErrorCallback = function(e) {
    //     console.error('SerialAPI.onReceiveError', e);
    // };

    return {
        getDevicesList: getDevicesList,
        setConfig: setConfig,
        setControlSignals: setControlSignals,
        autoConfig: autoConfig,
        getCurrentBoard: getCurrentBoard,
        getCurrentPort: getCurrentPort,
        portsOnSystem: portsOnSystem,
        sendData: sendData,
        connect: connect,
        disconnect: disconnect
    };

})();