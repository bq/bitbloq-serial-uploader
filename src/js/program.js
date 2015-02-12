/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Program - Programming functionality
 ********************************************************* */
'use strict';
/* global sizeof, bitbloqSU, Promise */
/* exported bitbloqSU */
/* Board management functions */

bitbloqSU.Program = {
    // Constants being used from the STK500 protocol
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
    },
    SEMAPHORE: false
};

/**
 * ProgramBuilder with program lifecycle methods
 * @param {Object} board board object
 * @param {Number} board.bitrate board bitrate
 */
function ProgramBuilder(board) {
    this.board = board;
    // Useful parameters throughout the code:
    // trimmedCommands store the hex commands that will be passed to the board.
    this.trimmedCommands = undefined;
    // Memory addresses of the different memory pages ---> ATMega328
    this.address_l = [];
    this.address_r = [];
}

ProgramBuilder.prototype.load_hex = function(hex) {
    console.log('ProgramBuilder.load_hex');
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

/**
 * Process string-code to calculate & build pages/address
 * @param  {String} hex
 */
ProgramBuilder.prototype.transformData = function(hex) {
    console.log('ProgramBuilder.transformData');
    //load commands
    var command = this.load_hex(hex);
    //Number of memory pages for current program that is needed
    this.numPages = Math.ceil(command.length / (this.board.maxPageSize));

    //console.info(command.length);
    //console.info('Total page number', this.numPages);

    var i = 0;
    this.trimmedCommands = [];
    while (this.trimmedCommands.length < this.numPages) {
        this.trimmedCommands.push(command.slice(this.board.maxPageSize * i, (this.board.maxPageSize) * (i + 1)));
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

    console.info('Program size: ', sizeof(this.trimmedCommands), '. Max size available in the board: ', this.board.max_size);
};

/**
 * Send change singnals to board
 * @return {Promise} Returns a promise that resolves with the chansignals sended
 */
ProgramBuilder.prototype.changeSignals = function(callback) {
    console.log('ProgramBuilder.changeSignals');

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

    bitbloqSU.Serial.setControlSignals(signalControlOn, function() {
        console.info('DTR-RTS ON');
        bitbloqSU.Serial.setControlSignals(signalControlOff, function() {
            console.info('DTR-RTS OFF');
            callback({
                msg: 'ok'
            });
        });
    });

};

/**
 * Send the commands to enter the programming mode
 */
ProgramBuilder.prototype.enterProgMode = function(callback) {

    console.log('ProgramBuilder.enterProgMode');

    //Sin Espera
    var buffer = new Uint8Array(2);
    buffer[0] = bitbloqSU.Program.STK500.STK_ENTER_PROGMODE;
    buffer[1] = bitbloqSU.Program.STK500.CRC_EOP;
    bitbloqSU.Serial.sendData(buffer.buffer, callback);

};

/**
 * Send the commands to leave the programming mode
 */
ProgramBuilder.prototype.leaveProgMode = function(callback) {
    console.log('ProgramBuilder.leaveProgMode');
    var buffer = new Uint8Array(2);
    buffer[0] = bitbloqSU.Program.STK500.STK_LEAVE_PROGMODE;
    buffer[1] = bitbloqSU.Program.STK500.CRC_EOP;
    bitbloqSU.Serial.sendData(buffer.buffer, callback);
};

/**
 * Create and send the commands needed to specify in which memory address we are writting currently
 * @param  {Number} address adress index
 */
ProgramBuilder.prototype.loadAddress = function(address, callback) {
    console.log('ProgramBuilder.loadAddress', address);
    var loadAddress = new Uint8Array(4);
    loadAddress[0] = bitbloqSU.Program.STK500.STK_LOAD_ADDRESS;
    loadAddress[1] = this.address_l[address];
    loadAddress[2] = this.address_r[address];
    loadAddress[3] = bitbloqSU.Program.STK500.CRC_EOP;
    return bitbloqSU.Serial.sendData(loadAddress.buffer, callback);
};

/**
 * Create the command structure needed to program the current memory page
 * @param  {Number} it
 */
ProgramBuilder.prototype.programPage = function(it, callback) {
    console.log('ProgramBuilder.programPage', it);

    //console.info('Message length', this.trimmedCommands[it].length);

    var init_part = [
        bitbloqSU.Program.STK500.STK_PROG_PAGE,
        0x00,
        0x80,
        0x46
    ];
    this.trimmedCommands[it] = init_part.concat(this.trimmedCommands[it]);
    this.trimmedCommands[it].push(bitbloqSU.Program.STK500.CRC_EOP);

    //console.info('trimmedCommands[it]', this.trimmedCommands[it]); // log the page that it is currently programming

    var buffer = new Uint8Array(this.trimmedCommands[it].length);
    for (var i = 0; i < buffer.length; i++) {
        buffer[i] = this.trimmedCommands[it][i];
    }
    if (!buffer.buffer.byteLength) {
        console.error('bitbloqProgram.buffer.empty');
    }
    bitbloqSU.Serial.sendData(buffer.buffer, callback);
};

/**
 * Send reset to board
 * @return {Promise} A promise that resolves with the board reset
 */
ProgramBuilder.prototype.resetBoard = function(callback) {
    var that = this;
    that.changeSignals(function() {
        that.changeSignals(function() {
            setTimeout(callback, bitbloqSU.Program.board.delay_reset);
        });
    });
};

ProgramBuilder.prototype.writePage = function(it, callback) {
    var that = this;
    if (it === this.numPages) {
        callback({
            msg: 'ok'
        });
    } else {
        this.loadAddress(it, function(response) {
            if (response && response.error) {
                return callback(response);
            }
            that.programPage(it, function(response) {
                if (response && response.error) {
                    return callback(response);
                }
                that.writePage(++it, callback);
            });
        });
    }
};

/**
 * Load Trigger loading process on board
 * @param  {String} code
 * @param  {String} port
 * @param  {Object} board
 * @param  {Number} board.bitrate
 * @return {Promise}   A promise that resolves only when the programming is ok with the following mesasges:
 *                     program:ok               Programming process ok
 *                     program:error:busy       The chromapp is programming
 *                     program:error:connection Cannot connect to board in that port
 *                     program:error:write      Error while writting pages
 *                     program:error:size       Not enough spaces in board
 */
ProgramBuilder.prototype.load = function(code, port, board, callback) {

    if (bitbloqSU.Program.SEMAPHORE) {
        return callback({
            msg: 'program:error:busy'
        });
    }
    bitbloqSU.Program.SEMAPHORE = true;

    //Prepare code to write on board
    this.transformData(code);

    var that = this;

    if (sizeof(that.trimmedCommands) < bitbloqSU.Program.board.max_size) {

        bitbloqSU.Serial.connect(port, bitbloqSU.Program.board.bitrate, function(response) {

            if (response && response.error) {
                bitbloqSU.Program.SEMAPHORE = false;
                bitbloqSU.Serial.disconnect(function() {
                    callback({
                        msg: 'program:error:connection'
                    });
                });
                return;
            }

            that.resetBoard(function(response) {

                if (response && response.error) {
                    bitbloqSU.Program.SEMAPHORE = false;
                    bitbloqSU.Serial.disconnect(function() {
                        callback({
                            msg: 'program:error:connection'
                        });
                    });
                    return;
                }

                return that.enterProgMode(function(response) {

                    if (response && response.error) {
                        bitbloqSU.Program.SEMAPHORE = false;
                        bitbloqSU.Serial.disconnect(function() {
                            callback({
                                msg: 'program:error:connection'
                            });
                        });
                        return;
                    }

                    //Program pages workflow
                    that.writePage(0, function(response) {
                        if (response && response.error) {
                            bitbloqSU.Program.SEMAPHORE = false;
                            bitbloqSU.Serial.disconnect(function() {
                                callback({
                                    msg: 'program:error:write'
                                });
                            });
                            return;
                        }
                        that.leaveProgMode(function(response) {
                            if (response && response.error) {
                                bitbloqSU.Program.SEMAPHORE = false;
                                bitbloqSU.Serial.disconnect(function() {
                                    callback({
                                        msg: 'program:error:connection'
                                    });
                                });
                                return;
                            }
                            that.resetBoard(function() {
                                bitbloqSU.Program.SEMAPHORE = false;
                                bitbloqSU.Serial.disconnect(function() {
                                    callback({
                                        msg: 'program:ok'
                                    });
                                });
                                return;
                            });
                        });
                    });

                });

            });

        });

    } else {
        bitbloqSU.Program.SEMAPHORE = false;
        callback({
            msg: 'program:error:size'
        });
    }

};

/**
 * Set the board config to ProgramBuilder and returns a instance of it
 * @param {Object} board
 * @param {Number} board.bitrate
 * @return {ProgramBuilder}
 */
bitbloqSU.Program.setBoard = function(board) {
    console.log('bitbloqSU.program.setBoard', board);
    bitbloqSU.Program.board = board;
    return new ProgramBuilder(board);
};

/**
 * Tries to veify if there is a board connected in a specific port/board
 * @param  {String} port
 * @param  {Object} board
 * @param  {Number} board.bitrate
 * @return {Promise} A promise that resolves only when a board is detected in the specific config
 */
bitbloqSU.Program.testBoard = function(port, board, callback) {

    console.log('bitbloqSU.program.setBoard', board);
    bitbloqSU.Program.board = board;
    var builder = new ProgramBuilder(board);


    bitbloqSU.Serial.connect(port, bitbloqSU.Program.board.bitrate, function(response) {

        if (response && response.error) {
            bitbloqSU.Serial.disconnect(function() {
                callback({
                    msg: 'connectingport:ko'
                });
            });
            return;
        }

        builder.resetBoard(function(response) {

            if (response && response.error) {
                bitbloqSU.Serial.disconnect(function() {
                    callback({
                        msg: 'connectingport:ko'
                    });
                });
                return;
            }

            builder.enterProgMode(function(response) {

                if (response && response.error) {
                    bitbloqSU.Serial.disconnect(function() {
                        callback({
                            msg: 'connectingport:ko'
                        });
                    });
                    return;
                }

                bitbloqSU.Serial.disconnect(function() {
                    console.log('connectingport:ok');
                    callback({
                        msg: 'connectingport:ok'
                    });
                });

            });

        });

    });



};
