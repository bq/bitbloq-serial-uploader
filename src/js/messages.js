/* *******************************************************
 * bitbloq Serial Uploader
 * Chrome Message Passing functionality
 ********************************************************* */
'use strict';
/* global bitbloqSU, chrome */
/* jshint -W030 */

var respondent = function(responseMsg, port) {
    console.info('Sending Response...');
    console.info({
        'responseMsg': responseMsg.msg
    });

    if (port) {
        port.postMessage(responseMsg);
    }
};

var Handler = (function() {

    var handler = {
        port: null,
        responders: {},
        add: function(message, responder) {
            this.responders[message] = responder;
        },
        respond: function(request) {
            request = request || {};
            request.port = this.port;
            console.info({
                'request.msg': request.msg,
                'request.params': request.params
            });

            if (!this.responders[request.msg]) {
                request.msg = 'defaultHandler';
            }
            this.responders[request.msg](request);

        }
    };

    window.chrome.runtime.onConnectExternal.addListener(function(port) {
        handler.port = port;
        port.onMessage.addListener(handler.respond.bind(handler));
    });

    return handler;

})();

Handler.add('defaultHandler', function(request) {

    var responseMsg = {
        msg: 'not-implemented'
    };

    respondent(responseMsg, request.port);

});

Handler.add('getPorts', function(request) {

    var onGetDevices = function(ports) {
        var responseMsg = {
            msg: 'ports',
            path: ports
        };
        respondent(responseMsg, request.port);
    };

    chrome.serial.getDevices(onGetDevices);

});

Handler.add('setPort', function(request) {

    var onConnect = function(connectionInfo) {

        var responseMsg;
        // If connect returns a connection id
        if (connectionInfo.connectionId) {
            bitbloqSU.Program.enter_progmode().then(function() {
                responseMsg = {
                    msg: 'connectingport:ok'
                };
                respondent(responseMsg, request.port);
            }).fail(function(error) {
                responseMsg = {
                    msg: 'connectingport:ko',
                    params: error
                };
                respondent(responseMsg, request.port);
            });

        } else {
            responseMsg = {
                msg: 'connectingport:ko'
            };
            respondent(responseMsg, request.port);
        }
    };

    var options = {
        bitrate: request.board.bitrate
    };

    chrome.serial.connect(request.path, options, onConnect);

});

Handler.add('program', function(request) {
    bitbloqSU.Program.setBoard(request.board).load(request.data, request.path, request.board).then(function() {

        var responseMsg = {
            msg: 'program:ok'
        };

        console.info('bitbloqSU.Program:ok');
        respondent(responseMsg, request.port);
    }).fail(function() {

        var responseMsg = {
            msg: 'program:ko'
        };

        console.info('program:ko');
        respondent(responseMsg, request.port);
    });
});
