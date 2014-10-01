'use strict';
/* global bitbloqSerial, programmingBoard*/

var logger = window.console;


/* *******************************************************
bitbloqComm - Chrome Message Passing functionality
********************************************************* */

(function() {

    window.chrome.runtime.onConnectExternal.addListener(function(port) {

        port.onMessage.addListener(function(request) {

            logger.log('request.msg', request.msg);
            logger.log('request.params', request.params);

            var programming = false;

            var responseMsg = {
                msg: null,
                params: null
            };

            if (request.msg === 'bitbloq.connect') {
                responseMsg.msg = 'chromeapp.ready';
                responseMsg.params = bitbloqSerial.getCurrentBoard();
            } else if (request.msg === 'bitbloq.checkboard') {
                responseMsg.msg = 'chromeapp.boardConnected';
                responseMsg.params = bitbloqSerial.getCurrentBoard();
            } else if (request.msg === 'bitbloq.config') {
                responseMsg.msg = 'chromeapp.configured';
            } else if (request.msg === 'bitbloq.programming') {
                responseMsg.msg = 'chromeapp.programmed';
                programming = true;
            } else if (request.msg === 'bitbloq.isSuccess') {
                responseMsg.msg = 'chromeapp.isSuccess';
            }

            bitbloqSerial.autoConfig().then(function() {
                logger.log('Sending Response...');
                if (programming) {
                    programmingBoard(request.params.code).then(function() {
                        port.postMessage(responseMsg);
                        logger.log('responseMsg', responseMsg);
                    }).catch(function(e) {
                        responseMsg.msg = 'chromeapp.error';
                        logger.log(e);
                    });
                } else {
                    port.postMessage(responseMsg);
                    logger.log('responseMsg', responseMsg);
                }

            });

        });

    });

})();