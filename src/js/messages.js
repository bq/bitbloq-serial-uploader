/* *******************************************************
 * bitbloq Serial Uploader
 * Chrome Message Passing functionality
 ********************************************************* */
'use strict';
/* global bitbloqSU, Mocks */
/* jshint -W030 */

var Messages = {};

Messages.setPort = function(path, board) {
    return bitbloqSU.Program.testBoard(path, board);
};



Messages.program = function(path, board, code) {
    return bitbloqSU.Program.setBoard(board).load(code, path, board);
};

Messages.getPorts = function() {
    bitbloqSU.Serial.getDevices().then(function(ports) {
        console.log(ports);
    });
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

    var onGetDevices = function(ports) {
        var responseMsg = {
            msg: 'ports',
            path: ports
        };
        respondent(responseMsg, request.port);
    };

    bitbloqSU.Serial.getDevices()
        .then(onGetDevices)
        .catch(function() {
            onGetDevices([]);
        });

});

Handler.add('setPort', function(request) {

    var handler = function(response) {
        respondent({
            msg: response
        }, request.port);
    };

    return Messages.setPort(request.params.path, request.params.board)
        .then(handler)
        .catch(handler);

});

Handler.add('program', function(request) {

    var programHandler = function(response) {

        console.info('bitbloqSU.messages.program.response', response);
        var responseMsg = {
            msg: response
        };

        respondent(responseMsg, request.port);
    };

    Messages.program(request.params.path, request.params.board, request.params.data)
        .then(programHandler)
        .catch(programHandler);
});

Handler.add('close', function() {
    Messages.close();
});


/* Mocks */
Messages.setPortMock = function(type) {
    var board = Mocks[type].board;

    return bitbloqSU.Serial.getDevices().then(function(port) {
        console.log('port', port[0].path);
        Messages.setPort(port[0].path, board).then(function(response) {
            console.log(response);
        });

    });
};

Messages.programMock = function(type) {
    var code = Mocks[type].code;
    var board = Mocks[type].board;

    return bitbloqSU.Serial.getDevices().then(function(port) {
        console.log('port', port[0].path);
        Messages.program(port[0].path, board, code).then(function(response) {
            console.log(response);
        });
    });
};
