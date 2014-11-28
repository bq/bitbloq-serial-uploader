/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqComm - Chrome Message Passing functionality
 ********************************************************* */
'use strict';
/* global bitbloqSU, logger, $*/
/* jshint -W030 */
(function() {
    var CONNECTEDFLAG = false;
    var PROGMODEFLAG = false;
    window.chrome.runtime.onConnectExternal.addListener(function(port) {
        var respondent = function(responseMsg) {
            logger.info('Sending Response...');
            logger.info({
                'responseMsg': responseMsg.msg
            });
            port.postMessage(responseMsg);
        };
        port.onMessage.addListener(function(request) {
            logger.info({
                'request.msg': request.msg,
                'request.params': request.params
            });
            var responseMsg = {
                msg: null,
                params: null
            };
            var boardName, portName;
            logger.info({
                'CONNECTEDFLAG': CONNECTEDFLAG,
                'PROGMODEFLAG': PROGMODEFLAG
            });
            if (CONNECTEDFLAG && PROGMODEFLAG) {
                return;
            }
            if (request.msg === 'connect' && !CONNECTEDFLAG) {
                CONNECTEDFLAG = true;
                responseMsg.msg = 'connect.ready';
                responseMsg.params = bitbloqSU.SerialAPI.getDevices(function(devs) {
                    return devs;
                });
                logger.info('before:connect');
                respondent(responseMsg);
            } else if (request.msg === 'board') {
                boardName = $('#board-picker').val(),
                portName = $('#port-picker').val();
                bitbloqSU.Serial.autoConfig(boardName, portName).then(function() {
                    bitbloqSU.UI.paintBoardInfo();
                    responseMsg.msg = 'board.ready';
                    responseMsg.params = bitbloqSU.Serial.getDeviceInfo();
                    logger.info('board:message');
                    logger.info('FLAGS to false board', CONNECTEDFLAG, PROGMODEFLAG);
                    bitbloqSU.Serial.disconnect();
                    respondent(responseMsg);
                }, function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    logger.info('board:not:ready');
                    bitbloqSU.Serial.disconnect();
                    CONNECTEDFLAG = false;
                    PROGMODEFLAG = false;
                    logger.info('FLAGS to false board.not.ready', CONNECTEDFLAG, PROGMODEFLAG);
                    respondent(responseMsg);
                });
            } else if (request.msg === 'programming' && !PROGMODEFLAG) {
                PROGMODEFLAG = true;
                boardName = $('#board-picker').val(),
                portName = $('#port-picker').val();
                bitbloqSU.Serial.autoConfig(boardName, portName).then(function() {
                    bitbloqSU.UI.paintBoardInfo();
                    bitbloqSU.Program.load(request.params.code).then(function() {
                        responseMsg.msg = 'programming.ok';
                        logger.info('programming:ok');
                        CONNECTEDFLAG = false;
                        PROGMODEFLAG = false;
                        logger.info('FLAGS to false programming', CONNECTEDFLAG, PROGMODEFLAG);
                        logger.info('bitbloqSU.Program.load finished');
                        respondent(responseMsg);
                        bitbloqSU.Serial.disconnect();
                    }, function(e) {
                        logger.info(e);
                        responseMsg.msg = 'programming.ko';
                        logger.info('programming:ko');
                        logger.warn('bitbloqSU.Program.load failed');
                        CONNECTEDFLAG = false;
                        PROGMODEFLAG = false;
                        logger.info('FLAGS to false --> programming ko', CONNECTEDFLAG, PROGMODEFLAG);
                        respondent(responseMsg);
                    });
                }, function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    bitbloqSU.Serial.disconnect();
                    CONNECTEDFLAG = false;
                    PROGMODEFLAG = false;
                    logger.info('FLAGS to false --> board.not.ready', CONNECTEDFLAG, PROGMODEFLAG);
                    respondent(responseMsg);
                });
            } else if (request.msg === 'reset') {
                CONNECTEDFLAG = false;
                PROGMODEFLAG = false;
            }
        });
    });
})();
