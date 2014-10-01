'use strict';

/* global sizeof, bitbloqSerial, console */


var bitbloqEmitter = new Emitter();




/*
Board management functions
 */

// Read and parse the hex doc
function load_hex(hex) {

    //Default program
    if (!hex) {
        return false;
    }

    // Slice the used information from the input hex file
    var prog_init = hex.split('\r\n');

    var prog = [];
    var i = 0;
    for (i = 0; i < prog_init.length; i++) {
        prog_init[i] = prog_init[i].slice(9, prog_init[i].length - 2);
    }

    prog_init = prog_init.join('');

    while (prog_init.length % 256 !== 0) {
        prog_init += 'FF';
    }

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

function transform_data(hex) {
    //load commands
    var command = load_hex(hex);
    //Number of memory pages for current program that is needed
    var page_number = Math.ceil(command.length / (bitbloqSerial.getCurrentBoard().maxPageSize));
    console.log('Total page number -->', page_number);
    var i = 0;
    trimmed_commands = [];
    while (trimmed_commands.length < page_number) {
        trimmed_commands.push(command.slice(bitbloqSerial.getCurrentBoard().maxPageSize * i, (bitbloqSerial.getCurrentBoard().maxPageSize) * (i + 1)));
        i += 1;
    }

    // init adresses
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

    return page_number;

}

///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

// Reset the board and trigger the next function
function changeSignals() {
    console.log('*** Reset arduino ***');
    return new Promise(function(resolve) {

        // DTR-RTS ON
        var signalControlOn = {
            dtr: true,
            rts: true
        };
        // DTR-RTS OFF
        var signalControlOff = {
            dtr: false,
            rts: false
        };

        bitbloqSerial.setControlSignals(signalControlOn).then(function() {
            console.log('DTR-RTS ON');
            return bitbloqSerial.setControlSignals(signalControlOff);
        }).then(function() {
            console.log('DTR-RTS OFF');
            resolve();
        });

    });

};

// Send the commands to enter the programming mode
function enter_progmode() {
    return new Promise(function(resolve) {
        console.log('*** Entering progmode ***');
        var buffer = new Uint8Array(2);
        buffer[0] = STK500.STK_ENTER_PROGMODE;
        buffer[1] = STK500.CRC_EOP;

        bitbloqSerial.sendData(buffer.buffer).then(function() {
            resolve();
        });

    });

}

// Create and send the commands needed to specify in which memory address we are writting currently
function load_address(address) {
    return new Promise(function(resolve) {
        var load_address = new Uint8Array(4);
        load_address[0] = STK500.STK_LOAD_ADDRESS;
        load_address[1] = address_l[address];
        load_address[2] = address_r[address];
        load_address[3] = STK500.CRC_EOP;
        console.log('Accessing address : ', address, '--------->', address_l[address], address_r[address], '\n command: ', load_address);

        bitbloqSerial.sendData(load_address.buffer).then(function() {
            resolve(address);
        });


        // return Promise.all([resolve(address), bitbloqSerial.onReceiveCallbackPromise]).then(function() {
        //     bitbloqSerial.onReceiveCallbackPromise = new Promise();
        //     resolve(address);
        // });

    });
}

// Create the command structure needed to program the current memory page
function program_page(it) {
    return new Promise(function(resolve) {
        console.log('Message length: ', trimmed_commands[it].length);
        var init_part = [STK500.STK_PROG_PAGE, 0x00, 0x80, 0x46];

        console.log('Programming page ', it);

        trimmed_commands[it] = init_part.concat(trimmed_commands[it]);
        trimmed_commands[it].push(STK500.CRC_EOP);

        console.log(trimmed_commands[it]); // log the page that it is currently programming

        var buffer = new Uint8Array(trimmed_commands[it].length);
        for (var i = 0; i < buffer.length; i++) {
            buffer[i] = trimmed_commands[it][i];
        }

        bitbloqSerial.sendData(buffer.buffer).then(function() {
            resolve();
        });

        // return Promise.all([sendDataPromise, bitbloqSerial.onReceiveCallbackPromise]).then(function() {
        //     bitbloqSerial.onReceiveCallbackPromise = new Promise();
        //     resolve();
        // });

    });

}

// Send the commands to leave the programming mode
function leave_progmode() {
    return new Promise(function(resolve) {
        console.log('*** Leaving progmode ***');
        var leaveProgmodeValue = new Uint8Array(2);
        leaveProgmodeValue[0] = STK500.STK_LEAVE_PROGMODE;
        leaveProgmodeValue[1] = STK500.CRC_EOP;

        bitbloqSerial.sendData(leaveProgmodeValue.buffer).then(function() {
            console.log('leave_progmode finished');
            resolve();
        });

    });
}


//////////////////////////////////////////////
///Composite programming functions
//////////////////////////////////////7

function resetBoard() {
    return changeSignals().then(function() {
        return changeSignals();
    });
}

function writePage(address) {
    return load_address(address).then(function(address) {
        return program_page(address);
    });
}

function addWriteStep(promise, it) {
    return promise.then(function() {
        return writePage(it);
    });
}









/**
 * [programmingBoard description]
 * @date        2014-09-27
 * @anotherdate 2014-09-27T10:22:13+0100
 * @param       {[type]}                 code [description]
 * @return      {[type]}                      [description]
 */
var programmingBoard = function(code) {

    lineBuffer = 0;
    progmodeflag = true;

    bitbloqEmitter.removeAllListeners();

    var p;


    //Reset .> prog_mode -> (writing_pages * num_pages) -> leave_progmode -> resetBoard -> disconnect
    var programmingBoardOperationList = [
        resetBoard,
        enter_progmode
    ];

    return new Promise(function(resolve, reject) {

        var numberOfCurrentProgramPages = transform_data(code);

        console.log('Program size: ', sizeof(trimmed_commands), '. Max size available in the board: ', bitbloqSerial.getCurrentBoard().max_size);

        if (sizeof(trimmed_commands) < bitbloqSerial.getCurrentBoard().max_size) {


            //TODO The promise must be resolve here
            changeSignals().then(function() {
                return changeSignals();
            }).then(function() {
                console.log('enter_progmode');
                return enter_progmode();
            }).then(function() {

                p = writePage(0);
                for (var i = 1; i < numberOfCurrentProgramPages; i++) {
                    p = addWriteStep(p, i);
                }
                return p;

            }).then(function() {
                console.log('leave_progmode');
                return leave_progmode();
            }).then(function() {
                return changeSignals();
            }).then(function() {
                return changeSignals();
            }).then(function() {
                bitbloqSerial.disconnect();
            }).catch(function() {
                console.error('program flow error ', arguments);
            });


            // //adding as many writing page operations as
            // for (var i = 0; i < numberOfCurrentProgramPages; i++) {
            //     programmingBoardOperationList.push(addWriteStep);
            // }

            // programmingBoardOperationList.push(leave_progmode, resetBoard, bitbloqSerial.disconnect);

            // console.log(programmingBoardOperationList);

            // var sizeOfProgrammingBoardOperationList = programmingBoardOperationList.length;

            // //Reset
            // var preliminaryOperations = programmingBoardOperationList[0]().then(function() {
            //     //enter_progmode
            //     return programmingBoardOperationList[1]();
            // });

            // //Triggering writing_pages process
            // pageIndex = 0;

            // bitbloqEmitter.on('progmode_finished', function() {
            //     //Triggering prog_page mode
            //     p = programmingBoardOperationList[2](preliminaryOperations, 0);
            //     console.log('--- board_response -> writing page_number: ---', 0);
            //     console.log('pageIndex value : ', pageIndex);
            // });

            // bitbloqEmitter.on('next_prog_page', function() {

            //     console.log('sizeOfProgrammingBoardOperationList', sizeOfProgrammingBoardOperationList);
            //     pageIndex += 1;
            //     if (pageIndex < sizeOfProgrammingBoardOperationList - 5) {
            //         p = programmingBoardOperationList[pageIndex + 2](p, pageIndex);
            //         console.log('--- board_response -> writing page_number: ---', pageIndex);
            //         console.log('pageIndex value : ', pageIndex);
            //         console.log('****************************writing operation:', programmingBoardOperationList[pageIndex + 2]);
            //     } else {
            //         console.log('all_pages_programmed');
            //         bitbloqEmitter.emit('all_pages_programmed');
            //     }


            // });

            // bitbloqEmitter.on('all_pages_programmed', function() {
            //     p.then(function() {
            //         //leave_progmode
            //         console.log(programmingBoardOperationList[sizeOfProgrammingBoardOperationList - 3]);
            //         return programmingBoardOperationList[sizeOfProgrammingBoardOperationList - 3]();
            //     }).then(function() {
            //         //reset
            //         console.log(programmingBoardOperationList[sizeOfProgrammingBoardOperationList - 2]);
            //         return programmingBoardOperationList[sizeOfProgrammingBoardOperationList - 2]();
            //     }).then(function() {
            //         //disconnect
            //         programmingBoardOperationList[sizeOfProgrammingBoardOperationList - 1]();
            //         clearTimeout(st);
            //         lineBuffer = 0;
            //     });
            // });


            // resetBoard().then(function() {
            //     console.log('enter_progmode');
            //     return enter_progmode();
            // }).then(function() {

            //     p = writePage(0);
            //     for (var i = 1; i < numberOfCurrentProgramPages; i++) {
            //         p = addWriteStep(p, i);
            //     }
            //     return p;

            // }).then(function() {
            //     console.log('leave_progmode');
            //     return leave_progmode();
            // }).then(function() {
            //     return changeSignals();
            // }).then(function() {
            //     return changeSignals();
            // }).then(function() {
            //     bitbloqSerial.disconnect();
            // });
        } else {
            reject();
            console.log('ERROR: program larger than available memory');
        }
    });

};


/* *****************************
Chrome App interface management
******************************** */
// Board Info
function paintBoardInfo() {
    document.querySelector('.board > .program__actions__item__info').innerText = bitbloqSerial.getCurrentBoard().name;
    document.querySelector('.port > .program__actions__item__info').innerText = bitbloqSerial.getCurrentPort();
}

var sampleCode;

var onLoadApp = function() {
    bitbloqSerial.autoConfig().then(function() {
        paintBoardInfo();
        bitbloqSerial.disconnect();
    });

    /* Listeners */
    document.querySelector('.board_program_test_button').addEventListener('click', function() {

        //Test program - blink 2 led on pin 13 & 12 each one second
        sampleCode = ':100000000C9461000C947E000C947E000C947E0095\r\n:100010000C947E000C947E000C947E000C947E0068\r\n:100020000C947E000C947E000C947E000C947E0058\r\n:100030000C947E000C947E000C947E000C947E0048\r\n:100040000C94A9000C947E000C947E000C947E000D\r\n:100050000C947E000C947E000C947E000C947E0028\r\n:100060000C947E000C947E00000000002400270009\r\n:100070002A0000000000250028002B0000000000DE\r\n:1000800023002600290004040404040404040202DA\r\n:100090000202020203030303030301020408102007\r\n:1000A0004080010204081020010204081020000012\r\n:1000B0000007000201000003040600000000000029\r\n:1000C000000011241FBECFEFD8E0DEBFCDBF11E08E\r\n:1000D000A0E0B1E0E2E5F4E002C005900D92A030AE\r\n:1000E000B107D9F711E0A0E0B1E001C01D92A9303D\r\n:1000F000B107E1F70E9418020C9480000C940000F4\r\n:10010000F8940C9427028DE060E00E94C4018CE01A\r\n:1001100061E00E94C40168EE73E080E090E00E941C\r\n:10012000F1008DE061E00E94C4018CE060E00E947B\r\n:10013000C40168EE73E080E090E00E94F100089551\r\n:100140008DE061E00E9485018CE061E00E94850104\r\n:1001500008951F920F920FB60F9211242F933F9381\r\n:100160008F939F93AF93BF9380910401909105016A\r\n:10017000A0910601B0910701309108010196A11DDF\r\n:10018000B11D232F2D5F2D3720F02D570196A11D76\r\n:10019000B11D209308018093040190930501A09361\r\n:1001A0000601B09307018091000190910101A09197\r\n:1001B0000201B09103010196A11DB11D80930001C0\r\n:1001C00090930101A0930201B0930301BF91AF91FD\r\n:1001D0009F918F913F912F910F900FBE0F901F9085\r\n:1001E00018959B01AC017FB7F89480910001909124\r\n:1001F0000101A0910201B091030166B5A89B05C061\r\n:100200006F3F19F00196A11DB11D7FBFBA2FA92F15\r\n:10021000982F8827860F911DA11DB11D62E0880FC0\r\n:10022000991FAA1FBB1F6A95D1F7BC012DC0FFB74C\r\n:10023000F8948091000190910101A0910201B09188\r\n:100240000301E6B5A89B05C0EF3F19F00196A11D7B\r\n:10025000B11DFFBFBA2FA92F982F88278E0F911D90\r\n:10026000A11DB11DE2E0880F991FAA1FBB1FEA95CF\r\n:10027000D1F7861B970B885E9340C8F2215030401F\r\n:100280004040504068517C4F2115310541055105D2\r\n:1002900071F60895789484B5826084BD84B58160D8\r\n:1002A00084BD85B5826085BD85B5816085BDEEE67E\r\n:1002B000F0E0808181608083E1E8F0E0108280815D\r\n:1002C00082608083808181608083E0E8F0E08081CB\r\n:1002D00081608083E1EBF0E0808184608083E0EBEB\r\n:1002E000F0E0808181608083EAE7F0E080818460D3\r\n:1002F000808380818260808380818160808380812F\r\n:10030000806880831092C1000895CF93DF93482FB7\r\n:1003100050E0CA0186569F4FFC0134914A575F4F07\r\n:10032000FA018491882369F190E0880F991FFC01FC\r\n:10033000E859FF4FA591B491FC01EE58FF4FC591CC\r\n:10034000D491662351F42FB7F8948C91932F909504\r\n:1003500089238C93888189230BC0623061F42FB785\r\n:10036000F8948C91932F909589238C938881832B7B\r\n:1003700088832FBF06C09FB7F8948C91832B8C93F2\r\n:100380009FBFDF91CF910895482F50E0CA01825559\r\n:100390009F4FFC012491CA0186569F4FFC01949106\r\n:1003A0004A575F4FFA013491332309F440C02223A6\r\n:1003B00051F1233071F0243028F42130A1F02230A3\r\n:1003C00011F514C02630B1F02730C1F02430D9F433\r\n:1003D00004C0809180008F7703C0809180008F7D62\r\n:1003E0008093800010C084B58F7702C084B58F7D64\r\n:1003F00084BD09C08091B0008F7703C08091B000A8\r\n:100400008F7D8093B000E32FF0E0EE0FFF1FEE58DA\r\n:10041000FF4FA591B4912FB7F894662321F48C91E6\r\n:100420009095892302C08C91892B8C932FBF0895BE\r\n:10043000CF93DF930E944A010E94A000C0E0D0E069\r\n:100440000E9483002097E1F30E940000F9CFF89406\r\n:02045000FFCFDC\r\n:00000001FF\r\n';

        bitbloqSerial.autoConfig().then(function() {

            programmingBoard(sampleCode);

        }).catch(function(e) {
            console.log('autoconfig rejected');
            console.log(e);
        });

    });

};

/*
 * Initializing chrome app
 */
document.addEventListener('DOMContentLoaded', function() {
    onLoadApp();
});