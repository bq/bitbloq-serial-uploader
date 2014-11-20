/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqComm - Chrome Message Passing functionality
 ********************************************************* */

'use strict';
/* global bitbloqSU, logger */

(function() {

    window.chrome.runtime.onConnectExternal.addListener(function(port) {

        var respondent = function(responseMsg) {
            port.postMessage(responseMsg);
            logger.info('Sending Response...');
            logger.info({
                'responseMsg': responseMsg.msg
            });
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

            if (request.msg === 'connect') {

                responseMsg.msg = 'connect.ready';
                responseMsg.params = bitbloqSU.SerialAPI.getDevices(function(devs) {
                    return devs;
                });
                respondent(responseMsg);

            } else if (request.msg === 'board') {
                var boardName = null,
                    portName = null;
                if (request.params) {
                    boardName = request.params.board;
                    portName = request.params.port;
                }

                bitbloqSU.Serial.autoConfig(boardName, portName).then(function() {
                    bitbloqSU.UI.paintBoardInfo();
                    responseMsg.msg = 'board.ready';
                    responseMsg.params = bitbloqSU.Serial.getDeviceInfo();
                    respondent(responseMsg);
                    bitbloqSU.Serial.disconnect();
                }).catch(function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    respondent(responseMsg);
                    bitbloqSU.Serial.disconnect();
                });

            } else if (request.msg === 'programming') {

                bitbloqSU.Serial.autoConfig(request.params.boardName, request.params.portName).then(function() {
                    bitbloqSU.UI.paintBoardInfo();
                    bitbloqSU.Program.load(request.params.code).then(function() {
                        responseMsg.msg = 'programming.ok';
                        respondent(responseMsg);
                        logger.info('bitbloqSU.Program.load finished');
                        bitbloqSU.Serial.disconnect();
                    }).catch(function(e) {
                        logger.info(e);
                        responseMsg.msg = 'programming.ko';
                        respondent(responseMsg);
                        logger.warn('bitbloqSU.Program.load failed');
                    });

                }, function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    respondent(responseMsg);
                    bitbloqSU.Serial.disconnect();
                });

            }

        });

    });

})();
