'use strict';
/* global bitbloqSerial, bitbloqProgram, logger */

/* *******************************************************
bitbloqComm - Chrome Message Passing functionality
********************************************************* */
(function() {

    window.chrome.runtime.onConnectExternal.addListener(function(port) {

        port.onMessage.addListener(function(request) {

            logger.info('request.msg', request.msg);
            logger.info('request.params', request.params);

            var programming = false;

            var responseMsg = {
                msg: null,
                params: null
            };

            if (request.msg === 'bitbloq.connect') {
                responseMsg.msg = 'chromeapp.ready';
                responseMsg.params = bitbloqSerial.getCurrentBoard();
            } else if (request.msg === 'bitbloq.programming') {
                responseMsg.msg = 'chromeapp.programmed';
                programming = true;
            }

            bitbloqSerial.autoConfig().then(function() {
                logger.info('Sending Response...');
                logger.info({
                    'bitbloqProgram programming flag': programming
                });
                if (programming) {
                    bitbloqProgram.load(request.params.code).then(function() {
                        port.postMessage(responseMsg);
                        logger.info({
                            'responseMsg': responseMsg.msg
                        });
                        logger.info('bitbloqProgram.load finished');
                    }).catch(function(e) {
                        responseMsg.msg = 'chromeapp.error';
                        logger.info(e);
                    });
                } else {
                    port.postMessage(responseMsg);
                    logger.info({
                        'responseMsg': responseMsg.msg
                    });
                }

            }, function() {
                responseMsg.msg = 'chromeapp.noboard';
                port.postMessage(responseMsg);
            });

        });

    });

})();
