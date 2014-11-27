/* *******************************************************
 * bitbloq Serial Uploader
 * bitbloqSU.Program - Programming functionality
 ********************************************************* */
'use strict';
/* global sizeof, bitbloqSU, logger, Promise */
/* exported bitbloqSU */
/* Board management functions */
bitbloqSU.Program = (function() {
    var lineBuffer = 0;
    var progmodeflag = false;
    //var pageIndex = 0;
    //Useful parameters throughout the code:
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
    // Memory addresses of the different memory pages ---> ATMega328
    var address_l = [];
    var address_r = [];
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
        var page_number = Math.ceil(command.length / (bitbloqSU.Serial.getDeviceInfo().boardInfo.maxPageSize));
        logger.info(command.length);
        logger.info({
            'Total page number': page_number
        });
        var i = 0;
        trimmed_commands = [];
        while (trimmed_commands.length < page_number) {
            trimmed_commands.push(command.slice(bitbloqSU.Serial.getDeviceInfo().boardInfo.maxPageSize * i, (bitbloqSU.Serial.getDeviceInfo().boardInfo.maxPageSize) * (i + 1)));
            i += 1;
        }
        // init adresses
        for (i = 0; i < page_number / 4; i++) {
            address_l.push(0x00);
            address_l.push(0x40);
            address_l.push(0x80);
            address_l.push(0xc0);
            address_r.push(i);
            address_r.push(i);
            address_r.push(i);
            address_r.push(i);
        }
        return page_number;
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    // Reset the board and trigger the next function
    function changeSignals() {
        logger.warn('*** Reset arduino ***');
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
                logger.warn('DTR-RTS ON');
                return bitbloqSU.Serial.setControlSignals(signalControlOff);
            }).then(function() {
                logger.warn('DTR-RTS OFF');
                setTimeout(resolve, 200);
            });
        });
    }
    // Send the commands to enter the programming mode
    function enter_progmode() {
        return new Promise(function(resolve) {
            logger.warn('*** Entering progmode ***');
            var buffer = new Uint8Array(2);
            buffer[0] = STK500.STK_ENTER_PROGMODE;
            buffer[1] = STK500.CRC_EOP;
            bitbloqSU.Serial.sendData(buffer.buffer).then(function() {
                setTimeout(resolve, 200);
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
            logger.info('Accessing address', {
                'address': address,
                'address_l': address_l[address],
                'address_r': address_r[address],
                'command': load_address
            });
            logger.info({
                'address': address,
                'address_l': address_l[address],
                'address_r': address_r[address],
                'command': load_address,
                'load_address.buffer': load_address.buffer
            });
            bitbloqSU.Serial.sendData(load_address.buffer).then(function() {
                resolve(address);
            });
        });
    }
    // Create the command structure needed to program the current memory page
    function program_page(it) {
        return new Promise(function(resolve) {
            logger.info({
                'Message length': trimmed_commands[it].length
            });
            var init_part = [STK500.STK_PROG_PAGE, 0x00, 0x80, 0x46];
            logger.info({
                'Programming page ': it
            });
            trimmed_commands[it] = init_part.concat(trimmed_commands[it]);
            trimmed_commands[it].push(STK500.CRC_EOP);
            logger.info({
                'trimmed_commands[it]': trimmed_commands[it]
            }); // log the page that it is currently programming
            var buffer = new Uint8Array(trimmed_commands[it].length);
            for (var i = 0; i < buffer.length; i++) {
                buffer[i] = trimmed_commands[it][i];
            }
            if (!buffer.buffer.byteLength) {
                logger.error('bitbloqProgram.buffer.empty');
            }
            bitbloqSU.Serial.sendData(buffer.buffer).then(function() {
                resolve();
            });
        });
    }
    // Send the commands to leave the programming mode
    function leave_progmode() {
        return new Promise(function(resolve) {
            logger.info('*** Leaving progmode ***');
            var leaveProgmodeValue = new Uint8Array(2);
            leaveProgmodeValue[0] = STK500.STK_LEAVE_PROGMODE;
            leaveProgmodeValue[1] = STK500.CRC_EOP;
            bitbloqSU.Serial.sendData(leaveProgmodeValue.buffer).then(function() {
                logger.info('leave_progmode finished');
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

    function addWriteStep(promise, it) {
        if (!promise) {
            return load_address(it).then(function(address) {
                return program_page(address);
            });
        } else {
            return promise.then(function() {
                return load_address(it).then(function(address) {
                    return program_page(address);
                });
            });
        }
    }
    /**
     * [load Trigger loading process on board]
     * @date        2014-09-27
     * @anotherdate 2014-09-27T10:22:13+0100
     * @param       {[type]}                 code [description]
     * @return      {[type]}                      [description]
     */
    var load = function(code) {
        lineBuffer = 0;
        progmodeflag = true;
        var p;
        return new Promise(function(resolve, reject) {
            var numberOfCurrentProgramPages = transform_data(code);
            logger.info('Program size: ', sizeof(trimmed_commands), '. Max size available in the board: ', bitbloqSU.Serial.getDeviceInfo().boardInfo.max_size);
            if (sizeof(trimmed_commands) < bitbloqSU.Serial.getDeviceInfo().boardInfo.max_size) {
                resetBoard().then(function() {
                    logger.info('enter_progmode');
                    return enter_progmode();
                }).then(function() {
                    for (var i = 0; i < numberOfCurrentProgramPages; i++) {
                        p = addWriteStep(p, i);
                    }
                    return p;
                }).then(function() {
                    logger.info('leave_progmode');
                    return leave_progmode();
                }).then(function() {
                    return resetBoard();
                }).then(function() {
                    bitbloqSU.Serial.disconnect();
                    resolve();
                }).
                catch (function() {
                    logger.error('program flow error ', arguments);
                    bitbloqSU.Serial.disconnectTimerFunc(1000);
                });
            } else {
                reject();
                logger.info('ERROR: program larger than available memory');
                bitbloqSU.Serial.disconnectTimerFunc(1000);
            }
        });
        progmodeflag=false;
    };
    return {
        load: load,
        progmodeflag: progmodeflag
    };
})();
