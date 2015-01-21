/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqComm - Chrome Message Passing functionality
 ********************************************************* */
'use strict';
/* global bitbloqSU, logger, chrome */
/* jshint -W030 */

var Handler = (function() {

    var handler = {
        port: null,
        responders: {},
        add: function(message, responder) {
            if (!this.responders[responder]) {
                this.responders[responder] = [];
            }
            this.responders[responder].push(responder);
        },
        respond: function(request) {
            logger.info({
                'request.msg': request.msg,
                'request.params': request.params
            });

            var msg = request.msg;
            if (this.responders[msg]) {
                var responderList = this.responders[msg];
                for (var i = 0; i < responderList.length; i++) {
                    var responder = responderList[i];
                    responder(request, this.port);
                }
            }
        }
    };

    window.chrome.runtime.onConnectExternal.addListener(function(port) {
        handler.port = port;
        port.onMessage.addListener(handler.respond.bind(handler));
    });

    return handler;

})();

var respondent = function(responseMsg, port) {
    logger.info('Sending Response...');
    logger.info({
        'responseMsg': responseMsg.msg
    });
    port.postMessage(responseMsg);
};

Handler.add('getPorts', function() {

    var responseMsg = {
        msg: 'ports',
        path: []
    };

    var onGetDevices = function(ports) {
        for (var i = 0; i < ports.length; i++) {
            responseMsg.path.push(ports[i].path);
        }
        respondent(responseMsg);
    };

    chrome.serial.getDevices(onGetDevices);

});

Handler.add('setPort', function(request) {

    var onConnect = function(connectionInfo) {

        var responseMsg;

        if (connectionInfo.connectionId) {
            responseMsg = {
                msg: 'connectingport:ok'
            };

        } else {
            responseMsg = {
                msg: 'connectingport:ko'
            };
        }

        respondent(responseMsg);

    };

    var options = {
        bitrate: request.board.bitrate
    };

    chrome.serial.connect(request.path, options, onConnect);

});

Handler.add('program', function(request) {
    bitbloqSU.Program.load(request.data, request.path, request.board).then(function() {

        var responseMsg = {
            msg: 'program:ok'
        };

        logger.info('bitbloqSU.Program:ok');
        respondent(responseMsg, request.port);
    }).fail(function() {

        var responseMsg = {
            msg: 'program:ko'
        };

        logger.info('program:ko');
        respondent(responseMsg, request.port);
    });
});

// Handler.add('reset', function(request, port) {});