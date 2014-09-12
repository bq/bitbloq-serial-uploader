'use strict';

////Parameters that change between boards:
// Number of memory pages
var page_number = 256;
// Memory page size
var page_size = 128;

////Useful parameters throughout the code:
var trimmed_commands; // trimmed_commands store the hex commands that will be passed to the board.

//constants being used from the STK500 protocol
var STK500 = {
    CRC_EOP: 0x20, // 'SPACE'
    STK_SET_PARAMETER: 0x40, // '@'
    STK_GET_PARAMETER: 0x41, // 'A'
    STK_SET_DEVICE: 0x42, // 'B'
    STK_SET_DEVICE_EXT: 0x45, // 'E'
    STK_ENTER_PROGMODE: 0x50, // 'P'
    STK_LEAVE_PROGMODE: 0x51, // 'Q'
    STK_LOAD_ADDRESS: 0x55, // 'U'
    STK_UNIVERSAL: 0x56, // 'V'
    STK_PROG_LOCK: 0x63, // 'c'
    STK_PROG_PAGE: 0x64, // 'd'
    STK_READ_PAGE: 0x74, // 't'
    STK_READ_SIGN: 0x75 // 'u'
};


//// Memory addresses of the different memory pages ---> ATMega328
var address_l = [];
var address_r = [];
for (var i = 0; i < page_number / 4; i++) {
    address_l.push(0x00);
    address_l.push(0x40);
    address_l.push(0x80);
    address_l.push(0xc0);

    address_r.push('0x' + i);
    address_r.push('0x' + i);
    address_r.push('0x' + i);
    address_r.push('0x' + i);
}

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
var hex;

function setHex(program) {
    hex = program;
}

// Read and parse the hex doc
function load_hex() {
    hex =
        ':100000000C945C000C9479000C9479000C947900A9\n:100010000C9479000C9479000C9479000C9479007C\n:100020000C9479000C9479000C9479000C9479006C\n:100030000C9479000C9479000C9479000C9479005C\n:100040000C949A000C9479000C9479000C9479002B\n:100050000C9479000C9479000C9479000C9479003C\n:100060000C9479000C947900000000070002010054\n:100070000003040600000000000000000102040864\n:100080001020408001020408102001020408102002\n:10009000040404040404040402020202020203032E\n:1000A0000303030300000000250028002B000000CC\n:1000B0000000240027002A0011241FBECFEFD8E043\n:1000C000DEBFCDBF11E0A0E0B1E0E4E2F4E002C0A9\n:1000D00005900D92A230B107D9F711E0A2E0B1E08E\n:1000E00001C01D92AB30B107E1F70E9400020C94F1\n:1000F0000D020C94000061E0809100010C949101CC\n:10010000CF93DF93C0E0D1E061E088810E94CA0113\n:1001100068EE73E080E090E00E94070160E0888173\n:100120000E94CA0168EE73E080E090E0DF91CF9119\n:100130000C9407011F920F920FB60F9211242F9368\n:100140003F938F939F93AF93BF93809103019091BF\n:100150000401A0910501B09106013091020123E054\n:10016000230F2D3720F40196A11DB11D05C026E8EF\n:10017000230F0296A11DB11D20930201809303015C\n:1001800090930401A0930501B093060180910701AB\n:1001900090910801A0910901B0910A010196A11D59\n:1001A000B11D8093070190930801A0930901B093BA\n:1001B0000A01BF91AF919F918F913F912F910F9025\n:1001C0000FBE0F901F9018953FB7F89480910701CC\n:1001D00090910801A0910901B0910A0126B5A89B50\n:1001E00005C02F3F19F00196A11DB11D3FBF662725\n:1001F000782F892F9A2F620F711D811D911D42E06A\n:10020000660F771F881F991F4A95D1F70895CF92DF\n:10021000DF92EF92FF92CF93DF936B017C010E94FC\n:10022000E400EB01C114D104E104F10479F00E946F\n:10023000E4006C1B7D0B683E7340A0F381E0C81A9C\n:10024000D108E108F108C851DC4FECCFDF91CF9124\n:10025000FF90EF90DF90CF900895789484B58260FE\n:1002600084BD84B5816084BD85B5826085BD85B55A\n:10027000816085BDEEE6F0E0808181608083E1E809\n:10028000F0E0108280818260808380818160808341\n:10029000E0E8F0E0808181608083E1EBF0E0808144\n:1002A00084608083E0EBF0E0808181608083EAE716\n:1002B000F0E080818460808380818260808380819F\n:1002C000816080838081806880831092C10008955E\n:1002D000833081F028F4813099F08230A1F00895C4\n:1002E0008630A9F08730B9F08430D1F48091800055\n:1002F0008F7D03C0809180008F7780938000089568\n:1003000084B58F7702C084B58F7D84BD08958091B8\n:10031000B0008F7703C08091B0008F7D8093B000D4\n:100320000895CF93DF9390E0FC01E458FF4F2491B0\n:10033000FC01E057FF4F8491882349F190E0880F3A\n:10034000991FFC01E255FF4FA591B4918C559F4F29\n:10035000FC01C591D4919FB7611108C0F8948C91AC\n:10036000209582238C93888182230AC0623051F4C5\n:10037000F8948C91322F309583238C938881822B33\n:10038000888304C0F8948C91822B8C939FBFDF915B\n:10039000CF9108950F931F93CF93DF931F92CDB703\n:1003A000DEB7282F30E0F901E859FF4F8491F901B9\n:1003B000E458FF4F1491F901E057FF4F04910023D7\n:1003C000C9F0882321F069830E9468016981E02FC8\n:1003D000F0E0EE0FFF1FEC55FF4FA591B4919FB7D2\n:1003E000F8948C91611103C01095812301C0812B79\n:1003F0008C939FBF0F90DF91CF911F910F91089524\n:100400000E942D010E947B00C0E0D0E00E9480008D\n:100410002097E1F30E940000F9CFF8940C941002A9\n:04042000F894FFCF7E\n:020424000D00C9\n:00000001FF';

    // Slice the used information from the input hex file
    var prog_init = hex.split('\n');
    var prog = [];
    var i = 0;
    for (i = 0; i < prog_init.length; i++) {
        prog_init[i] = prog_init[i].slice(9, prog_init[i].length - 2);
    }

    prog_init = prog_init.join('');

    while (prog_init.length % 256 !== 0) {
        prog_init += 'FF';
    }
    //  console.log(prog_init);

    //  Split the information in 2 character commands
    var odd = false;
    var dummy = '';
    for (i = 0; i < prog_init.length; i++) {
        dummy += prog_init[i];
        if (odd) {
            prog.push(parseInt(dummy, 16)); //parse to int from hex string
            dummy = '';
            odd = false;
        } else {
            odd = true;
        }
    }

    return prog;
}

function transform_data() {
    //load commands
    var command = load_hex();

    //obtain the page number that is needed
    var page_number = Math.ceil(command.length / (page_size));
    console.log('Total page number -->', page_number);

    var i = 0;
    trimmed_commands = [];
    while (trimmed_commands.length < page_number) {
        trimmed_commands.push(command.slice(page_size * i, (page_size) * (i + 1)));
        i += 1;
    }

}

var stringReceived = '';

var onReceiveCallback = function(info) {
    if (info.connectionId == expectedConnectionId && info.data) {
        var str = convertArrayBufferToString(info.data);
        if (str.charAt(str.length - 1) === '\n') {
            stringReceived += str.substring(0, str.length - 1);
            onLineReceived(stringReceived);
            stringReceived = '';
        } else {
            stringReceived += str;
        }
    }
    console.log("received: " + stringReceived);
};

// window.addEventListener('bitbloqSerial_onreceive', function(info) {
//     console.log('bitbloqSerial_onreceive', info);

//     if (info.connectionId == expectedConnectionId && info.data) {
//         var str = convertArrayBufferToString(info.data);
//         if (str.charAt(str.length - 1) === '\n') {
//             stringReceived += str.substring(0, str.length - 1);
//             onLineReceived(stringReceived);
//             stringReceived = '';
//         } else {
//             stringReceived += str;
//         }
//     }
//     console.log('received: ' + stringReceived);

// }, false);



///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

// Reset the board and trigger the next function
var changeSignals = function(type) {
    console.log('*** Reset arduino ***');
    var p = new Promise(
        function(resolve) {
            // DTR-RTS ON
            setTimeout(function() {

                bitbloqSerial.setControlSignals({
                    dtr: true,
                    rts: true
                });
                // chrome.serial.setControlSignals(connectionId, {
                //     dtr: true,
                //     rts: true
                // }, function() {});
                console.log('DTR-RTS ON');
                setTimeout(function() {

                    // DTR-RTS OFF
                    bitbloqSerial.setControlSignals({
                        dtr: false,
                        rts: false
                    });
                    //chrome.serial.setControlSignals(connectionId, {
                    //     dtr: true,
                    //     rts: true
                    // }, function() {});

                    console.log('DTR-RTS OFF');
                    setTimeout(function() {
                        resolve();
                    }, bitbloqSerial.getCurrentBoard().delays[0]);
                }, bitbloqSerial.getCurrentBoard().delays[1]);
            }, bitbloqSerial.getCurrentBoard().delays[2]);
        });
    p.then(
        function() {
            if (type === 0) {
                changeSignals(1);
            } else if (type == 1) {
                enter_progmode();
            } else if (type == 2) {
                bitbloqSerial.disconnect();
            }
        });
};

// Send the commands to enter the programming mode
function enter_progmode() {
    var p = new Promise(
        function(resolve) {
            console.log('*** Entering progmode ***');
            var buffer = new Uint8Array(2);
            buffer[0] = STK500.STK_ENTER_PROGMODE;
            buffer[1] = STK500.CRC_EOP;

            bitbloqSerial.sendData(buffer.buffer);
            //chrome.serial.send(connectionId, buffer.buffer, function() {});

            setTimeout(function() {
                resolve();
            }, bitbloqSerial.getCurrentBoard().delays[3]);
        });
    p.then(load_address(0));
}

// Create and send the commands needed to specify in which memory address we are writting currently
function load_address(address) {
    var p = new Promise(
        function(resolve) {
            var load_address = new Uint8Array(4);
            load_address[0] = STK500.STK_LOAD_ADDRESS;
            load_address[1] = address_l[address];
            load_address[2] = address_r[address];
            load_address[3] = STK500.CRC_EOP;
            console.log('Accessing address : ', address, '--------->', address_l[address], address_r[address], '\n command: ', load_address);

            bitbloqSerial.sendData(load_address.buffer);
            //chrome.serial.send(connectionId, load_address.buffer, function() {});

            setTimeout(function() {
                resolve();
            }, bitbloqSerial.getCurrentBoard().delays[4]);
        });
    p.then(function() {
        program_page(address);
    });
}

// Create the command structure needed to program the current memory page
function program_page(it) {
    var p = new Promise(
        function(resolve) {
            console.log('Message length: ', trimmed_commands[it].length);
            var init_part = [STK500.STK_PROG_PAGE, 0x00, 0x80, 0x46];

            console.log('Programming page ', it);

            trimmed_commands[it] = init_part.concat(trimmed_commands[it]);
            trimmed_commands[it].push(STK500.CRC_EOP);

            console.log(trimmed_commands[it]); // log the page that it is currently programming

            setTimeout(function() {
                resolve();
            }, bitbloqSerial.getCurrentBoard().delays[5]);
    });

	p.then(function(buffer){
			var buffer=new Uint8Array(trimmed_commands[it].length);
			for (var i=0; i<buffer.length; i++){ 
				buffer[i]=trimmed_commands[it][i];
			}
			serialSendPage( buffer, it);
		});
}

// Send the commands to program the current memory page
function serialSendPage(buffer, it) {
    var p = new Promise(
        function(resolve) {

            bitbloqSerial.sendData(buffer.buffer);
            //chrome.serial.send(connectionId, buffer.buffer, function() {});

            setTimeout(function() {
                resolve();
            }, bitbloqSerial.getCurrentBoard().delays[6]);
        });
    p.then(
        function() {
            if (it == trimmed_commands.length - 1) { //go to next step
//                console.log("goto leave_progmode()");
                leave_progmode();
            } else if (it < trimmed_commands.length - 1) { // continue the loop
//                console.log("goto load_address()");
                it++;
                load_address(it);
            }
        });
}

// Send the commands to leave the programming mode
function leave_progmode() {
    var p = new Promise(
        function(resolve) {
            console.log('*** Leaving progmode ***');
            var leave_progmode = new Uint8Array(2);
            leave_progmode[0] = STK500.STK_LEAVE_PROGMODE;
            leave_progmode[1] = STK500.CRC_EOP;

            bitbloqSerial.sendData(leave_progmode.buffer);
            //chrome.serial.send(connectionId, leave_progmode.buffer, function() {});

            setTimeout(function() {
                resolve();
            }, bitbloqSerial.getCurrentBoard().delays[7]);
        });
    p.then(changeSignals(2));
}



/* *******************************************************
bitbloqSerial - Chrome.serial communication functionality
********************************************************* */

var bitbloqSerial = (function() {

    var chrome = window.chrome;
    var currentBoard = null;
    var currentPort = null;
    var boardConnected = false;
    var connectionId = -1;

    var portsOnSystem = [];
    var boardList = [{
        id: 'Arduino_Uno',
        name: 'Arduino Uno',
        bitrate: 115200,
//        delays: [300, 300, 300, 30, 70, 5, 30, 70],
        delays: [300, 300, 300, 30, 70, 5, 30, 70],
        max_size: 32256
    }, {
        id: 'FT232R_USB_UART',
        name: 'ZUM BT',
        bitrate: 19200,
        delays: [300, 300, 300, 50, 90, 20, 100, 70],
        max_size: 28672
    }];

    var getDevicesList = function(callback) {
        chrome.serial.getDevices(function(devices) {
            portsOnSystem = devices;
            callback();
        });
    };

    var getCurrentBoard = function() {
        return currentBoard;
    };

    

    var disconnect = function() {
        chrome.serial.disconnect(connectionId, function() {
            connectionId = -1;
            boardConnected = false;
            console.log('Port disconnected!');
        }); // Close port
    };

    var autoConfig = new Promise(
        function(resolve, reject) {

            console.log('autoConfig');

            getDevicesList(function() {

                console.log(portsOnSystem);

                for (var i = 0; i < portsOnSystem.length; i++) {
                    var port = portsOnSystem[i];
                    console.log(port);
                    if (setConfig({
                        boardId: port.displayName
                    })) {
                        currentPort = port.path;
                        console.log('currentBoard', currentBoard, 'currentPort', currentPort);

                        addChromeSerialListeners();
							var connect = new Promise(
									  function(resolve, reject) {
											try {
													console.log("connecting");
												 chrome.serial.connect(currentPort, {
													  bitrate: currentBoard.bitrate
												 }, function(info) {
													  console.log('BOARD connected', info);
													  if (info.connectionId != -1) {
													  		console.log
														   connectionId = info.connectionId;
														   boardConnected = true;
														   console.log('***Board Connected***');
													  } else {
														   boardConnected = false;
														   connectionId = -1;
														   console.log('***Closed USB Port***');
														   reject();
													  }
												 });
											} catch (e) {
												 connectionId = -1;
												 boardConnected = false;
												 reject(e);
											}
								});
                        connect.then(function() {
                            resolve();
                        }).fail(function() {
                            connectionId = -1;
                            boardConnected = false;
                            currentBoard = null;
                            reject();
                        });
                        break;
                    }
                }

                if (!currentPort) {
                    connectionId = -1;
                    boardConnected = false;
                    currentBoard = null;
                    console.log('No BOARD CONNECT!');
                    reject();
                }

            });
        });

    var setConfig = function(config) {

        for (var i = 0; i < boardList.length; i++) {
            var item = boardList[i];
            if (item.id === config.boardId) {
                currentBoard = item;
                return true;
            }
        }
        return false;

    };

    /*
    infoObject = {
        dtr: false,
        rts: false
    }
     */
    var setControlSignals = function(infoObject) {
//    		console.log("Setcontrolsignals ", connectionId, infoObject); 
        chrome.serial.setControlSignals(connectionId, infoObject, function() {});
    };

    var sendData = function(data) {
        chrome.serial.send(connectionId, data, function() {});
    };

    //var bitbloqSerialEvent;
    var addChromeSerialListeners = function() {

        try {
            //bitbloqSerialEvent = new Event('bitbloqSerial_onreceive');

            chrome.serial.onReceive.addListener(onReceiveCallback);
            chrome.serial.onReceiveError.addListener(onReceiveCallback);

        } catch (e) {
            console.log(e);
        }
    };

    // var onReceiveCallback = function(e) {
    //     console.log(e);
    //     //window.dispatchEvent(bitbloqSerialEvent);
    // };

    return {
        getDevicesList: getDevicesList,
        setConfig: setConfig,
        setControlSignals: setControlSignals,
        autoConfig: autoConfig,
        getCurrentBoard: getCurrentBoard,
        portsOnSystem: portsOnSystem,
        sendData: sendData,
        disconnect: disconnect
    };

})();


/* *******************************************************
bitbloqComm - Chrome Message Passing functionality
********************************************************* */

var bitbloqComm = (function(window) {

    window.chrome.runtime.onMessageExternal.addListener(
        function(request, sender, sendResponse) {

            // if (sender.url == blacklistedWebsite)
            //     return; // don't allow this web page access

            console.log('request.msg', request.msg);
            console.log('request.params', request.params);

            if (request.msg === 'bitbloq.connect') {
                sendResponse({
                    msg: 'chromeapp.ready',
                    params: bitbloqSerial.getCurrentBoard()
                });
                // bitbloqSerial.autoConfig.then(function() {
                //     sendResponse({
                //         msg: 'chromeapp.ready',
                //         params: bitbloqSerial.getCurrentBoard()
                //     });
                // }).fail(function() {
                //     sendResponse(undefined);
                // });

            } else if (request.msg === 'bitbloq.checkboard') {

                bitbloqSerial.autoConfig.then(function() {
                    console.log('Placa conectada');
                    sendResponse({
                        msg: 'chromeapp.boardConnected',
                        params: bitbloqSerial.getCurrentBoard()
                    });
                }).fail(function(e) {
                    sendResponse({
                        msg: 'chromeapp.boardConnected',
                        params: bitbloqSerial.getCurrentBoard()
                    });
                });


            } else if (request.msg === 'bitbloq.config') {

                //Set config on chrome app
                sendResponse({
                    msg: 'chromeapp.configured'
                });

            } else if (request.msg === 'bitbloq.programming') {

                //TODO: Send program to board
                setHex(request.params.program.code);
                transform_data();

                console.log('Program size: ', sizeof(trimmed_commands), '. Max size available in the board: ', bitbloqSerial.getCurrentBoard().max_size);

                if (sizeof(trimmed_commands) < bitbloqSerial.getCurrentBoard().max_size) {

                    changeSignals(0);

                    sendResponse({
                        msg: 'chromeapp.programming'
                    });

                } else {
                    console.log('ERROR: program larger than available memory');
                }

            } else if (request.msg === 'bitbloq.isSuccess') {

                sendResponse({
                    msg: 'chromeapp.isSuccess'
                });

            }
        });

    // function errorManager() {
    //     //TODO
    // }
})(window);

/* *****************************
Chrome App interface management
******************************** */
//// Portpicker
function buildPortPicker() {

    var eligiblePorts = bitbloqSerial.portsOnSystem.filter(function(port) {
        return !port.path.match(/[Bb]luetooth/);
    });

    var portPicker = document.getElementById('port-picker');
    eligiblePorts.forEach(function(port) {
        var portOption = document.createElement('option');
        portOption.value = portOption.innerText = port.path;
        portPicker.appendChild(portOption);
    });

    //Default values
    //selectedPort = portPicker.selectedOptions[0].value;

    // portPicker.onchange = function() {
    //     chrome.serial.disconnect(connectionId, onDisconnect); // Close port
    //     selectedPort = this.selectedOptions[0].value;
    //     console.log('Selected port: ', selectedPort);
    //     openSelectedPort();
    // };
}


var onLoadApp = function() {
    bitbloqSerial.autoConfig.then(function() {
        buildPortPicker();
    });

    /* Listeners */

    document.querySelector('#program_board_button').addEventListener('click', function() {
		  transform_data();
        console.log('Program size: ', sizeof(trimmed_commands), '. Max size available in the board: ', 						bitbloqSerial.getCurrentBoard().max_size);

        if (sizeof(trimmed_commands) < bitbloqSerial.getCurrentBoard().max_size) {
            changeSignals(0);
        }

    });

};


/*
Initializing chrome app
 */
document.addEventListener('DOMContentLoaded', function() {
    onLoadApp();
});
