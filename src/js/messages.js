/* *******************************************************
 * bitbloq Serial Uploader
 * Chrome Message Passing functionality
 ********************************************************* */
'use strict';
/* global bitbloqSU */
/* jshint -W030 */

var Messages = {};

Messages.setPort = function(path, board, callback) {
    return bitbloqSU.Program.testBoard(path, board, callback);
};

Messages.program = function(path, board, code, callback) {
    return bitbloqSU.Program.setBoard(board).load(code, path, board, callback);
};

Messages.close = function() {
    window.close();
};

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

        },
        trigger: function(message, params) {
            return this.responders[message](params);
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

Handler.add('version', function(request) {

    var responseMsg = {
        msg: bitbloqSU.version || '1.0.0'
    };

    respondent(responseMsg, request.port);

});

Handler.add('getPorts', function(request) {

    bitbloqSU.SerialAPI.getDevices(function(ports) {
        ports = ports || [];
        var responseMsg = {
            msg: 'ports',
            path: ports
        };
        respondent(responseMsg, request.port);
    });

});

Handler.add('setPort', function(request) {

    Messages.setPort(request.params.path, request.params.board, function(response) {
        console.info('bitbloqSU.messages.setPort.response', response);
        respondent(response, request.port);
    });

});

Handler.add('program', function(request) {

    Messages.program(request.params.path, request.params.board, request.params.data, function(response) {
        console.info('bitbloqSU.messages.program.response', response);
        respondent(response, request.port);
    });

});

Handler.add('close', function() {
    Messages.close();
});
