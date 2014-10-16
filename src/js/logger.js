'use strict';
/* logs function
 * debug mode:
 * 0: Debug mode disable
 * 1: Simple debug mode
 * 2: Debug mode with trace
 */
var logger = {
    debugmode: 0,
    check: function(value, code) {
        if (!this.debugmode || !arguments.length) {
            return;
        } else if (typeof value === 'object') { //Only one argument
            for (var i in value) {
                switch (code) {
                case 0:
                    console.info(i + '->');
                    console.info(value[i]);
                    break;
                case 1:
                    console.info(i + '->');
                    console.warn(value[i]);
                    break;
                case 2:
                    console.info(i + '->');
                    console.error(value[i]);
                    break;
                default:
                    console.log(value[i]);
                }
            }
        } else {
            switch (code) {
            case 0:
                console.info(value);
                break;
            case 1:
                console.warn(value);
                break;
            case 2:
                console.error(value);
                break;
            default:
                console.log(value);
            }

        }
        if (console.trace && logger.debugmode === 2) {
            console.trace();
        }
    },
    error: function(value) {
        this.check(value, 2);
    },
    warn: function(value) {
        this.check(value, 1);
    },
    info: function(value) {
        this.check(value, 0);
    }
};
