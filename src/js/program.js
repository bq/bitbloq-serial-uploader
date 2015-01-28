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
    }
};

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
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
// Reset the board and trigger the next function
ProgramBuilder.prototype.changeSignals = function() {
    console.log('ProgramBuilder.changeSignals');
    var that = this;
    return new Promise(function(resolve, reject) {
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
            if (that.board['delay_reset']) {
                setTimeout(resolve, that.board['delay_reset']);
            } else {
                resolve();
            }
        }).
        catch (reject);
    });
};
// Send the commands to enter the programming mode
ProgramBuilder.prototype.enterProgMode = function() {
    console.log('ProgramBuilder.enterProgMode');

    return new Promise(function(resolve, reject) {
        var buffer = new Uint8Array(2);
        buffer[0] = bitbloqSU.Program.STK500.STK_ENTER_PROGMODE;
        buffer[1] = bitbloqSU.Program.STK500.CRC_EOP;
        bitbloqSU.Serial.sendData(buffer.buffer).then(function() {
            resolve();
        }).
        catch (reject);
    });
};

// Send the commands to leave the programming mode
ProgramBuilder.prototype.leaveProgMode = function() {
    console.log('ProgramBuilder.leaveProgMode');
    var buffer = new Uint8Array(2);
    buffer[0] = bitbloqSU.Program.STK500.STK_LEAVE_PROGMODE;
    buffer[1] = bitbloqSU.Program.STK500.CRC_EOP;
    return bitbloqSU.Serial.sendData(buffer.buffer);
};

// Create and send the commands needed to specify in which memory address we are writting currently
ProgramBuilder.prototype.loadAddress = function(address) {
    console.log('ProgramBuilder.loadAddress', address);
    var loadAddress = new Uint8Array(4);
    loadAddress[0] = bitbloqSU.Program.STK500.STK_LOAD_ADDRESS;
    loadAddress[1] = this.address_l[address];
    loadAddress[2] = this.address_r[address];
    loadAddress[3] = bitbloqSU.Program.STK500.CRC_EOP;
    //console.info('Accessing address', {
    //'address': address,
    //'address_l': this.address_l[address],
    //'address_r': this.address_r[address],
    //'command': loadAddress
    //});
    //console.info({
    //'address': address,
    //'address_l': this.address_l[address],
    //'address_r': this.address_r[address],
    //'command': loadAddress,
    //'loadAddress.buffer': loadAddress.buffer
    //});
    return bitbloqSU.Serial.sendData(loadAddress.buffer).then(function() {
        return address;
    });
};
// Create the command structure needed to program the current memory page
ProgramBuilder.prototype.programPage = function(it) {
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
    var that = this;
    return new Promise(function(resolve) {
        return bitbloqSU.Serial.sendData(buffer.buffer).then(function() {
            if (that.board['delay_send']) {
                setTimeout(function() {
                    resolve();
                }, that.board['delay_send']);
            } else {
                resolve();
            }
        });
    });
};

//////////////////////////////////////////////
///Composite programming functions
//////////////////////////////////////7
ProgramBuilder.prototype.resetBoard = function() {
    return this.changeSignals().then(this.changeSignals.bind(this));
};

ProgramBuilder.prototype.addWriteStep = function(promise, it) {
    var that = this;
    if (!promise) {
        return this.loadAddress(it).then(function(address) {
            return that.programPage(address);
        });
    } else {
        return promise.then(function() {
            return that.loadAddress(it).then(function(address) {
                return that.programPage(address);
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

    if (bitbloqSU.Program.SEMAPHORE) {
        //return Promise.reject('busy');
    }
    bitbloqSU.Program.SEMAPHORE = true;

    var p;
    this.transformData(code);

    if (sizeof(this.trimmedCommands) < board.max_size) {

        return Promise.resolve().then(function() {
            return bitbloqSU.Serial.connect(port, board.bitrate)
                .then(this.resetBoard.bind(this))
                .then(this.enterProgMode.bind(this))
                .
            catch (function() {
                return Promise.reject('program:error:connection');
            });
        }.bind(this)).then(function() {
            for (var i = 0; i < this.numPages; i++) {
                p = this.addWriteStep(p, i);
            }
            return p
                .then(this.leaveProgMode.bind(this))
                .then(this.resetBoard.bind(this))
                .
            catch (function() {
                return Promise.reject('program:error:write');
            });
        }.bind(this)).then(function() {
            bitbloqSU.Program.SEMAPHORE = false;
            return bitbloqSU.Serial.disconnect().then(function() {
                return 'program:ok';
            });
        }).
        catch (function(error) {
            bitbloqSU.Program.SEMAPHORE = false;
            return Promise.reject(error);
        });

    } else {
        bitbloqSU.Program.SEMAPHORE = false;
        return Promise.reject('program:error:size');
    }

};

bitbloqSU.Program.setBoard = function(board) {
    console.log('bitbloqSU.program.setBoard', board);
    bitbloqSU.Program.board = board;
    return new ProgramBuilder(board);
};

bitbloqSU.Program.testBoard = function(port, board) {
    console.log('bitbloqSU.program.setBoard', board);
    bitbloqSU.Program.board = board;
    var builder = new ProgramBuilder(board);
    return bitbloqSU.Serial.connect(port, board.bitrate)
        .then(builder.resetBoard.bind(builder))
        .then(builder.enterProgMode.bind(builder))
        .then(builder.leaveProgMode.bind(builder))
        .then(builder.resetBoard.bind(builder))
        .then(bitbloqSU.Serial.disconnect).then(function() {
            return 'connectingport:ok';
        }).
    catch (function() {
        return 'connectingport:ko';
    });
};
