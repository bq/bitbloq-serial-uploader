'use strict';
/* global bitbloqSerial, bitbloqProgram, logger, paintBoardInfo */

/* *******************************************************
bitbloqComm - Chrome Message Passing functionality
********************************************************* */
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

            logger.info('request.msg', request.msg);
            logger.info('request.params', request.params);

            var responseMsg = {
                msg: null,
                params: null
            };

            if (request.msg === 'connect') {

                responseMsg.msg = 'connect.ready';
                respondent(responseMsg);

            } else if (request.msg === 'board') {

                bitbloqSerial.autoConfig().then(function() {
                    paintBoardInfo();
                    responseMsg.msg = 'board.ready';
                    responseMsg.params = bitbloqSerial.getCurrentBoard();
                    respondent(responseMsg);
                }, function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    respondent(responseMsg);
                });

            } else if (request.msg === 'programming') {

                bitbloqSerial.autoConfig().then(function() {
                    paintBoardInfo();
                    bitbloqProgram.load(request.params.code).then(function() {
                        logger.info('bitbloqProgram.load finished');
                        responseMsg.msg = 'programming.ok';
                        respondent(responseMsg);
                    }).catch(function(e) {
                        logger.info(e);
                        responseMsg.msg = 'programming.ko';
                        respondent(responseMsg);
                    });

                }, function() {
                    responseMsg.msg = 'board.notready';
                    port.postMessage(responseMsg);
                    respondent(responseMsg);

                    //@TODO
                    //responseMsg.msg = 'programming.ko';
                    //programming = false;
                });

            }


        });

    });

})();
