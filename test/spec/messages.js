/* global describe, it, expect, Messages */
'use strict';
(function() {

    describe('In Message module', function() {

        it('provides all methods in Messages object', function() {

            expect(Messages).to.include.keys(
                'setPort',
                'program',
                'getPorts',
                'close'
            );

        });
        //No se puede automatizar
        // it('provides all response messages', function() {

        //     expect(Handler).to.include.keys(
        //         'setPort',
        //         'program',
        //         'getPorts',
        //         'close',
        //         'setBoard',
        //         'testBoard'
        //     );

        // });


    });

})();
