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
                'request.msg': request.msg
            });
            logger.info({
                'request.params': request.params
            });

            var responseMsg = {
                msg: null,
                params: null
            };

            if (request.msg === 'connect') {

                responseMsg.msg = 'connect.ready';
                respondent(responseMsg);

            } else if (request.msg === 'board') {

                bitbloqSU.Serial.autoConfig().then(function() {
                    bitbloqSU.UI.paintBoardInfo();
                    responseMsg.msg = 'board.ready';
                    responseMsg.params = bitbloqSU.Serial.getDeviceInfo();
                    respondent(responseMsg);
                }, function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    respondent(responseMsg);
                });

            } else if (request.msg === 'programming') {

                bitbloqSU.Serial.autoConfig().then(function() {
                    bitbloqSU.UI.paintBoardInfo();
                    bitbloqSU.Program.load(request.params.code).then(function() {
                        responseMsg.msg = 'programming.ok';
                        respondent(responseMsg);
                        logger.info('bitbloqSU.Program.load finished');
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
                });

            }

        });

    });

})();
