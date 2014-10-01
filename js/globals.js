'use strict';

var lineBuffer = 0;
var progmodeflag = true;
var pageIndex = 0;



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