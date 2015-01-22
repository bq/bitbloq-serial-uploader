/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Program - Programming functionality
 ********************************************************* */
'use strict';
/* global sizeof, bitbloqSU, logger, Promise */
/* exported bitbloqSU */
/* Board management functions */

bitbloqSU.Program = {
    // constants being used from the STK500 protocol
    STK500: {
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
    }
};

function ProgramBuilder(board) {
    this.board = board;
    // Useful parameters throughout the code:
    // trimmed_commands store the hex commands that will be passed to the board.
    this.trimmed_commands = undefined;
    // Memory addresses of the different memory pages ---> ATMega328
    this.address_l = [];
    this.address_r = [];
}

ProgramBuilder.prototype.load_hex = function(hex) {
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
};

ProgramBuilder.prototype.transform_data = function(hex) {
    //load commands
    var command = this.load_hex(hex);
    //Number of memory pages for current program that is needed
    this.numPages = Math.ceil(command.length / (this.board.maxPageSize));
    console.info(command.length);
    console.info({
        'Total page number': this.numPages
    });
    var i = 0;
    this.trimmed_commands = [];
    while (this.trimmed_commands.length < this.numPages) {
        this.trimmed_commands.push(command.slice(this.board.maxPageSize * i, (this.board.maxPageSize) * (i + 1)));
        i += 1;
    }
    // init adresses
    for (i = 0; i < this.numPages; i++) {
        this.address_l.push(0x00);
        this.address_l.push(0x40);
        this.address_l.push(0x80);
        this.address_l.push(0xc0);
        this.address_r.push(i);
        this.address_r.push(i);
        this.address_r.push(i);
        this.address_r.push(i);
    }
};
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
// Reset the board and trigger the next function
ProgramBuilder.prototype.changeSignals = function() {
    console.info('*** Reset arduino ***');
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
        bitbloqSU.Serial.setControlSignals(signalControlOn).then(function() {
            console.info('DTR-RTS ON');
            return bitbloqSU.Serial.setControlSignals(signalControlOff);
        }).then(function() {
            console.info('DTR-RTS OFF');
            setTimeout(resolve, 200);
        });
    });
};
// Send the commands to enter the programming mode
ProgramBuilder.prototype.enter_progmode = function() {
    return new Promise(function(resolve) {
        console.warn('*** Entering progmode ***');
        var buffer = new Uint8Array(2);
        buffer[0] = bitbloqSU.Program.STK500.STK_ENTER_PROGMODE;
        buffer[1] = bitbloqSU.Program.STK500.CRC_EOP;
        bitbloqSU.Serial.sendData(buffer.buffer).then(function() {
            setTimeout(resolve, 200);
        });
    });
};
// Create and send the commands needed to specify in which memory address we are writting currently
ProgramBuilder.prototype.load_address = function(address) {
    return new Promise(function(resolve) {
        var load_address = new Uint8Array(4);
        load_address[0] = bitbloqSU.Program.STK500.STK_LOAD_ADDRESS;
        load_address[1] = this.address_l[address];
        load_address[2] = this.address_r[address];
        load_address[3] = bitbloqSU.Program.STK500.CRC_EOP;
        console.info('Accessing address', {
            'address': address,
            'address_l': this.address_l[address],
            'address_r': this.address_r[address],
            'command': load_address
        });
        console.info({
            'address': address,
            'address_l': this.address_l[address],
            'address_r': this.address_r[address],
            'command': load_address,
            'load_address.buffer': load_address.buffer
        });
        bitbloqSU.Serial.sendData(load_address.buffer).then(function() {
            resolve(address);
        });
    });
};
// Create the command structure needed to program the current memory page
ProgramBuilder.prototype.program_page = function(it) {
    return new Promise(function(resolve) {
        console.info({
            'Message length': this.trimmed_commands[it].length
        });
        var init_part = [bitbloqSU.Program.STK500.STK_PROG_PAGE, 0x00, 0x80, 0x46];
        console.info({
            'Programming page ': it
        });
        this.trimmed_commands[it] = init_part.concat(this.trimmed_commands[it]);
        this.trimmed_commands[it].push(bitbloqSU.Program.STK500.CRC_EOP);
        console.info({
            'trimmed_commands[it]': this.trimmed_commands[it]
        }); // log the page that it is currently programming
        var buffer = new Uint8Array(this.trimmed_commands[it].length);
        for (var i = 0; i < buffer.length; i++) {
            buffer[i] = this.trimmed_commands[it][i];
        }
        if (!buffer.buffer.byteLength) {
            console.error('bitbloqProgram.buffer.empty');
        }
        bitbloqSU.Serial.sendData(buffer.buffer).then(function() {
            resolve();
        });
    });
};
// Send the commands to leave the programming mode
ProgramBuilder.prototype.leave_progmode = function() {
    return new Promise(function(resolve) {
        console.info('*** Leaving progmode ***');
        var leaveProgmodeValue = new Uint8Array(2);
        leaveProgmodeValue[0] = bitbloqSU.Program.STK500.STK_LEAVE_PROGMODE;
        leaveProgmodeValue[1] = bitbloqSU.Program.STK500.CRC_EOP;
        bitbloqSU.Serial.sendData(leaveProgmodeValue.buffer).then(function() {
            console.info('leave_progmode finished');
            resolve();
        });
    });
};
//////////////////////////////////////////////
///Composite programming functions
//////////////////////////////////////7
ProgramBuilder.prototype.resetBoard = function() {
    return this.changeSignals().then(this.changeSignals);
};

ProgramBuilder.prototype.addWriteStep = function(promise, it) {
    if (!promise) {
        return this.load_address(it).then(function(address) {
            return this.program_page(address);
        });
    } else {
        return promise.then(function() {
            return this.load_address(it).then(function(address) {
                return this.program_page(address);
            });
        });
    }
};

/**
 * Load Trigger loading process on board
 * @param  {String} code  [description]
 * @param  {String} port  [description]
 * @param  {Object} board [description]
 * @return {Promise}       [description]
 */
ProgramBuilder.prototype.load = function(code, port, board) {
    var p;
    this.transform_data(code); // init()
    console.info('Program size: ', sizeof(this.trimmed_commands), '. Max size available in the board: ', bitbloqSU.Serial.getDeviceInfo().boardInfo.max_size);

    if (sizeof(this.trimmed_commands) < board.max_size) {

        return bitbloqSU.Serial.connect(port, {
                bitrate: board.bitrate
            })
            .then(this.resetBoard.bind(this))
            .then(this.enter_progmode.bind(this))
            .then(function() {
                for (var i = 0; i < this.numPages; i++) {
                    p = this.addWriteStep(p, i);
                }
                return p;
            }.bind(this))
            .then(this.leave_progmode.bind(this))
            .then(this.resetBoard.bind(this))
            .then(bitbloqSU.Serial.disconnect)
            .catch(function(error) {
                bitbloqSU.Serial.disconnect();
                return Promise.reject(error);
            });

    } else {
        return Promise.reject('program:size:overflow');
    }

};

bitbloqSU.Program.setBoard = function(board) {
    bitbloqSU.Program.board = board;
    return new ProgramBuilder(board);
};
