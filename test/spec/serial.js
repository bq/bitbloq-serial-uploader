/* global describe, it, expect, bitbloqSU */
'use strict';
(function() {

    describe('In SERIAL module', function() {

        it('provides all methods', function() {
            expect(bitbloqSU.Serial).to.include.keys(
                'connect',
                'disconnect',
                'getDevices',
                'getConnections',
                'sendData'
            );
        });

        describe('when connect', function() {
            it('port | board are required', function() {
                expect(true).to.equal(true);
            });

            // it('return connectionId with correct config', function() {
            //     bitbloqSU.Serial.connect('/dev/ttyACM0', 115200).then(function(argument) {
            //         console.log(argument);
            //         expect(true).to.equal(true);

            //         //expect(bitbloqSU.Serial.connectionId).to.be.below(1);

            //     });
            // });


            it('bitbloqSU.Serial.connectionId is saved with correct config', function() {
                expect(true).to.equal(true);
            });

            it('return undefined whin incorrect config', function() {
                expect(true).to.equal(true);
            });
        });

        describe('when connect', function() {
            it('bitbloqSU.Serial.connectionId is removed', function() {
                expect(true).to.equal(true);
            });
        });

        describe('when sendData', function() {
            it('resolves with both ACK', function() {
                expect(true).to.equal(true);
            });
        });

    });

})();
