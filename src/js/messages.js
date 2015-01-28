/* *******************************************************
 * bitbloq Serial Uploader
 * Chrome Message Passing functionality
 ********************************************************* */
'use strict';
/* global bitbloqSU */
/* jshint -W030 */

var Mocks = {};
Mocks.freeduino = {};
Mocks.freeduino.board = {
    'id': 'Arduino_Uno',
    'name': 'Arduino Uno',
    'arch': 'arduino',
    'board': 'uno',
    'bitrate': 115200,
    'maxPageSize': 128,
    'delay_reset': 10,
    'max_size': 32256
};
//Mocks.freeduino.port = 'COM3';
Mocks.freeduino.code = ':100000000C9461000C947E000C947E000C947E0095\r\n:100010000C947E000C947E000C947E000C947E0068\r\n:100020000C947E000C947E000C947E000C947E0058\r\n:100030000C947E000C947E000C947E000C947E0048\r\n:100040000C94A9000C947E000C947E000C947E000D\r\n:100050000C947E000C947E000C947E000C947E0028\r\n:100060000C947E000C947E00000000002400270009\r\n:100070002A0000000000250028002B0000000000DE\r\n:1000800023002600290004040404040404040202DA\r\n:100090000202020203030303030301020408102007\r\n:1000A0004080010204081020010204081020000012\r\n:1000B0000007000201000003040600000000000029\r\n:1000C000000011241FBECFEFD8E0DEBFCDBF11E08E\r\n:1000D000A0E0B1E0E2E5F4E002C005900D92A030AE\r\n:1000E000B107D9F711E0A0E0B1E001C01D92A9303D\r\n:1000F000B107E1F70E9418020C9480000C940000F4\r\n:10010000F8940C9427028DE060E00E94C4018CE01A\r\n:1001100061E00E94C40168EE73E080E090E00E941C\r\n:10012000F1008DE061E00E94C4018CE060E00E947B\r\n:10013000C40168EE73E080E090E00E94F100089551\r\n:100140008DE061E00E9485018CE061E00E94850104\r\n:1001500008951F920F920FB60F9211242F933F9381\r\n:100160008F939F93AF93BF9380910401909105016A\r\n:10017000A0910601B0910701309108010196A11DDF\r\n:10018000B11D232F2D5F2D3720F02D570196A11D76\r\n:10019000B11D209308018093040190930501A09361\r\n:1001A0000601B09307018091000190910101A09197\r\n:1001B0000201B09103010196A11DB11D80930001C0\r\n:1001C00090930101A0930201B0930301BF91AF91FD\r\n:1001D0009F918F913F912F910F900FBE0F901F9085\r\n:1001E00018959B01AC017FB7F89480910001909124\r\n:1001F0000101A0910201B091030166B5A89B05C061\r\n:100200006F3F19F00196A11DB11D7FBFBA2FA92F15\r\n:10021000982F8827860F911DA11DB11D62E0880FC0\r\n:10022000991FAA1FBB1F6A95D1F7BC012DC0FFB74C\r\n:10023000F8948091000190910101A0910201B09188\r\n:100240000301E6B5A89B05C0EF3F19F00196A11D7B\r\n:10025000B11DFFBFBA2FA92F982F88278E0F911D90\r\n:10026000A11DB11DE2E0880F991FAA1FBB1FEA95CF\r\n:10027000D1F7861B970B885E9340C8F2215030401F\r\n:100280004040504068517C4F2115310541055105D2\r\n:1002900071F60895789484B5826084BD84B58160D8\r\n:1002A00084BD85B5826085BD85B5816085BDEEE67E\r\n:1002B000F0E0808181608083E1E8F0E0108280815D\r\n:1002C00082608083808181608083E0E8F0E08081CB\r\n:1002D00081608083E1EBF0E0808184608083E0EBEB\r\n:1002E000F0E0808181608083EAE7F0E080818460D3\r\n:1002F000808380818260808380818160808380812F\r\n:10030000806880831092C1000895CF93DF93482FB7\r\n:1003100050E0CA0186569F4FFC0134914A575F4F07\r\n:10032000FA018491882369F190E0880F991FFC01FC\r\n:10033000E859FF4FA591B491FC01EE58FF4FC591CC\r\n:10034000D491662351F42FB7F8948C91932F909504\r\n:1003500089238C93888189230BC0623061F42FB785\r\n:10036000F8948C91932F909589238C938881832B7B\r\n:1003700088832FBF06C09FB7F8948C91832B8C93F2\r\n:100380009FBFDF91CF910895482F50E0CA01825559\r\n:100390009F4FFC012491CA0186569F4FFC01949106\r\n:1003A0004A575F4FFA013491332309F440C02223A6\r\n:1003B00051F1233071F0243028F42130A1F02230A3\r\n:1003C00011F514C02630B1F02730C1F02430D9F433\r\n:1003D00004C0809180008F7703C0809180008F7D62\r\n:1003E0008093800010C084B58F7702C084B58F7D64\r\n:1003F00084BD09C08091B0008F7703C08091B000A8\r\n:100400008F7D8093B000E32FF0E0EE0FFF1FEE58DA\r\n:10041000FF4FA591B4912FB7F894662321F48C91E6\r\n:100420009095892302C08C91892B8C932FBF0895BE\r\n:10043000CF93DF930E944A010E94A000C0E0D0E069\r\n:100440000E9483002097E1F30E940000F9CFF89406\r\n:02045000FFCFDC\r\n:00000001FF\r\n';

Mocks.zoom = {};
Mocks.zoom.board = {
    'id': 'FT232R_USB_UART',
    'name': 'ZUM BT',
    'arch': 'arduino',
    'board': 'bt328',
    'bitrate': 19200,
    'maxPageSize': 128,
    'delay_reset': 1,
    'max_size': 28672
};
//Mocks.zoom.port = 'COM4';
Mocks.zoom.code = ':100000000C9461000C947E000C947E000C947E0095\r\n:100010000C947E000C947E000C947E000C947E0068\r\n:100020000C947E000C947E000C947E000C947E0058\r\n:100030000C947E000C947E000C947E000C947E0048\r\n:100040000C949D000C947E000C947E000C947E0019\r\n:100050000C947E000C947E000C947E000C947E0028\r\n:100060000C947E000C947E00000000002400270009\r\n:100070002A0000000000250028002B0000000000DE\r\n:1000800023002600290004040404040404040202DA\r\n:100090000202020203030303030301020408102007\r\n:1000A0004080010204081020010204081020000012\r\n:1000B0000007000201000003040600000000000029\r\n:1000C000000011241FBECFEFD8E0DEBFCDBF11E08E\r\n:1000D000A0E0B1E0EAE3F4E002C005900D92A030A8\r\n:1000E000B107D9F711E0A0E0B1E001C01D92A9303D\r\n:1000F000B107E1F70E940C020C9480000C94000000\r\n:10010000F8940C941B028DE060E00E94B80168EE48\r\n:1001100073E080E090E00E94E5008DE061E00E94E5\r\n:10012000B80168EE73E080E090E00E94E500089579\r\n:100130008DE061E00E94790108951F920F920FB641\r\n:100140000F9211242F933F938F939F93AF93BF935D\r\n:100150008091040190910501A0910601B0910701E1\r\n:10016000309108010196A11DB11D232F2D5F2D3760\r\n:1001700020F02D570196A11DB11D209308018093F9\r\n:10018000040190930501A0930601B09307018091AB\r\n:10019000000190910101A0910201B091030101962B\r\n:1001A000A11DB11D8093000190930101A093020154\r\n:1001B000B0930301BF91AF919F918F913F912F9188\r\n:1001C0000F900FBE0F901F9018959B01AC017FB749\r\n:1001D000F8948091000190910101A0910201B091E9\r\n:1001E000030166B5A89B05C06F3F19F00196A11DDC\r\n:1001F000B11D7FBFBA2FA92F982F8827860F911D79\r\n:10020000A11DB11D62E0880F991FAA1FBB1F6A952F\r\n:10021000D1F7BC012DC0FFB7F894809100019091F7\r\n:100220000101A0910201B0910301E6B5A89B05C0B0\r\n:10023000EF3F19F00196A11DB11DFFBFBA2FA92FE5\r\n:10024000982F88278E0F911DA11DB11DE2E0880F08\r\n:10025000991FAA1FBB1FEA95D1F7861B970B885ED3\r\n:100260009340C8F2215030404040504068517C4F8C\r\n:10027000211531054105510571F60895789484B52D\r\n:10028000826084BD84B5816084BD85B5826085BD92\r\n:1002900085B5816085BDEEE6F0E080818160808378\r\n:1002A000E1E8F0E01082808182608083808181605B\r\n:1002B0008083E0E8F0E0808181608083E1EBF0E022\r\n:1002C000808184608083E0EBF0E0808181608083C6\r\n:1002D000EAE7F0E0808184608083808182608083AF\r\n:1002E0008081816080838081806880831092C100DA\r\n:1002F0000895CF93DF93482F50E0CA0186569F4F51\r\n:10030000FC0134914A575F4FFA018491882369F1C7\r\n:1003100090E0880F991FFC01E859FF4FA591B49117\r\n:10032000FC01EE58FF4FC591D491662351F42FB7CD\r\n:10033000F8948C91932F909589238C9388818923AD\r\n:100340000BC0623061F42FB7F8948C91932F909585\r\n:1003500089238C938881832B88832FBF06C09FB706\r\n:10036000F8948C91832B8C939FBFDF91CF9108954C\r\n:10037000482F50E0CA0182559F4FFC012491CA01C9\r\n:1003800086569F4FFC0194914A575F4FFA01349172\r\n:10039000332309F440C0222351F1233071F024307B\r\n:1003A00028F42130A1F0223011F514C02630B1F02C\r\n:1003B0002730C1F02430D9F404C0809180008F77B9\r\n:1003C00003C0809180008F7D8093800010C084B531\r\n:1003D0008F7702C084B58F7D84BD09C08091B00045\r\n:1003E0008F7703C08091B0008F7D8093B000E32FA2\r\n:1003F000F0E0EE0FFF1FEE58FF4FA591B4912FB71D\r\n:10040000F894662321F48C919095892302C08C91F5\r\n:10041000892B8C932FBF0895CF93DF930E943E01C9\r\n:100420000E949800C0E0D0E00E9483002097E1F392\r\n:0A0430000E940000F9CFF894FFCFFE\r\n:00000001FF\r\n';

Mocks.arduino = {};
Mocks.arduino.board = {
    'id': 'FT232R_USB_UART',
    'name': 'ZUM BT',
    'arch': 'arduino',
    'board': 'bt328',
    'bitrate': 9600,
    'maxPageSize': 128,
    'delay_reset': 1,
    'max_size': 28672
};
//Mocks.arduino.port = '/dev/ttyACM0';
Mocks.arduino.code = ':100000000C9461000C947E000C947E000C947E0095\r\n:100010000C947E000C947E000C947E000C947E0068\r\n:100020000C947E000C947E000C947E000C947E0058\r\n:100030000C947E000C947E000C947E000C947E0048\r\n:100040000C949D000C947E000C947E000C947E0019\r\n:100050000C947E000C947E000C947E000C947E0028\r\n:100060000C947E000C947E00000000002400270009\r\n:100070002A0000000000250028002B0000000000DE\r\n:1000800023002600290004040404040404040202DA\r\n:100090000202020203030303030301020408102007\r\n:1000A0004080010204081020010204081020000012\r\n:1000B0000007000201000003040600000000000029\r\n:1000C000000011241FBECFEFD8E0DEBFCDBF11E08E\r\n:1000D000A0E0B1E0EAE3F4E002C005900D92A030A8\r\n:1000E000B107D9F711E0A0E0B1E001C01D92A9303D\r\n:1000F000B107E1F70E940C020C9480000C94000000\r\n:10010000F8940C941B028DE060E00E94B80168EE48\r\n:1001100073E080E090E00E94E5008DE061E00E94E5\r\n:10012000B80168EE73E080E090E00E94E500089579\r\n:100130008DE061E00E94790108951F920F920FB641\r\n:100140000F9211242F933F938F939F93AF93BF935D\r\n:100150008091040190910501A0910601B0910701E1\r\n:10016000309108010196A11DB11D232F2D5F2D3760\r\n:1001700020F02D570196A11DB11D209308018093F9\r\n:10018000040190930501A0930601B09307018091AB\r\n:10019000000190910101A0910201B091030101962B\r\n:1001A000A11DB11D8093000190930101A093020154\r\n:1001B000B0930301BF91AF919F918F913F912F9188\r\n:1001C0000F900FBE0F901F9018959B01AC017FB749\r\n:1001D000F8948091000190910101A0910201B091E9\r\n:1001E000030166B5A89B05C06F3F19F00196A11DDC\r\n:1001F000B11D7FBFBA2FA92F982F8827860F911D79\r\n:10020000A11DB11D62E0880F991FAA1FBB1F6A952F\r\n:10021000D1F7BC012DC0FFB7F894809100019091F7\r\n:100220000101A0910201B0910301E6B5A89B05C0B0\r\n:10023000EF3F19F00196A11DB11DFFBFBA2FA92FE5\r\n:10024000982F88278E0F911DA11DB11DE2E0880F08\r\n:10025000991FAA1FBB1FEA95D1F7861B970B885ED3\r\n:100260009340C8F2215030404040504068517C4F8C\r\n:10027000211531054105510571F60895789484B52D\r\n:10028000826084BD84B5816084BD85B5826085BD92\r\n:1002900085B5816085BDEEE6F0E080818160808378\r\n:1002A000E1E8F0E01082808182608083808181605B\r\n:1002B0008083E0E8F0E0808181608083E1EBF0E022\r\n:1002C000808184608083E0EBF0E0808181608083C6\r\n:1002D000EAE7F0E0808184608083808182608083AF\r\n:1002E0008081816080838081806880831092C100DA\r\n:1002F0000895CF93DF93482F50E0CA0186569F4F51\r\n:10030000FC0134914A575F4FFA018491882369F1C7\r\n:1003100090E0880F991FFC01E859FF4FA591B49117\r\n:10032000FC01EE58FF4FC591D491662351F42FB7CD\r\n:10033000F8948C91932F909589238C9388818923AD\r\n:100340000BC0623061F42FB7F8948C91932F909585\r\n:1003500089238C938881832B88832FBF06C09FB706\r\n:10036000F8948C91832B8C939FBFDF91CF9108954C\r\n:10037000482F50E0CA0182559F4FFC012491CA01C9\r\n:1003800086569F4FFC0194914A575F4FFA01349172\r\n:10039000332309F440C0222351F1233071F024307B\r\n:1003A00028F42130A1F0223011F514C02630B1F02C\r\n:1003B0002730C1F02430D9F404C0809180008F77B9\r\n:1003C00003C0809180008F7D8093800010C084B531\r\n:1003D0008F7702C084B58F7D84BD09C08091B00045\r\n:1003E0008F7703C08091B0008F7D8093B000E32FA2\r\n:1003F000F0E0EE0FFF1FEE58FF4FA591B4912FB71D\r\n:10040000F894662321F48C919095892302C08C91F5\r\n:10041000892B8C932FBF0895CF93DF930E943E01C9\r\n:100420000E949800C0E0D0E00E9483002097E1F392\r\n:0A0430000E940000F9CFF894FFCFFE\r\n:00000001FF\r\n';


var Messages = {};

Messages.setPort = function(path, board) {
    return bitbloqSU.Program.testBoard(path, board);
};

Messages.setPortMock = function(type) {
    var board = Mocks[type].board;

    return bitbloqSU.Serial.getDevices().then(function(port) {
        console.log('port', port[0].path);
        Messages.setPort(port[0].path, board).then(function(response) {
            console.log(response);
        });

    });
};

Messages.program = function(path, board, code) {
    return bitbloqSU.Program
        .setBoard(board)
        .load(code, path, board);
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

Handler.add('getPorts', function(request) {

    var onGetDevices = function(ports) {
        var responseMsg = {
            msg: 'ports',
            path: ports
        };
        respondent(responseMsg, request.port);
    };

    bitbloqSU.Serial.getDevices().then(onGetDevices).catch(function() {
        onGetDevices([]);
    });

});

Handler.add('setPort', function(request) {

    var handler = function(response) {
        respondent({
            msg: response
        }, request.port);
    };

    return Messages.setPort(request.board, request.path)
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
