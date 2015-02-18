'use strict';
/* global require, mochaPhantomJS, mocha */
/* jshint unused:false, camelcase:false */
require.config({
    deps: [],
    baseUrl: 'js',
    paths: {
        bower_components: '../bower_components/',
        scripts: '.',
        spec: '../spec',
        requirejs: '../bower_components/requirejs/require',
        jquery: '../src/bower_components/jquery/dist/jquery.min',
        mocha: '../bower_components/mocha/mocha',
        chai: '../bower_components/chai/chai',
        'chai-as-promised': '../bower_components/chai-as-promised/lib/chai-as-promised',
        sinonjs: '../bower_components/sinonjs/sinon',
        i18n: 'lib/i18n',
        sizeof: 'lib/sizeof',
        chrome_serial_mock: 'lib/chrome.serial.mock',
        bitbloqSU_program_mock: 'lib/bitbloqSU.program.mock',
        serial: 'serial',
        program: 'program',
        messages: 'messages',
        bitbloqSU: 'init'
    },
    shim: {
        mocha: {
            exports: 'mocha'
        },
        'chai-as-promised': {
            deps: [
                'chai'
            ]
        },
        program: {
            deps: ['serial', 'chrome_serial_mock', 'bitbloqSU_program_mock']
        },
        bitbloqSU: {
            exports: 'bitbloqSU',
            deps: ['i18n', 'sizeof', 'program', 'messages']
        }
    }
});

/* require test suite */
require([
        'jquery',
        'sinonjs',
        'mocha',
        'chai',
        'chai-as-promised',
        'spec/testSuite',
        'bitbloqSU'
    ],
    function($, sinonjs, mocha, chai, chaiAsPromised, testSuite) {

        mocha.ui('bdd');
        mocha.reporter('html');

        chai.Assertion.includeStack = true;

        // https://github.com/chaijs/chai/issues/107
        var should = chai.should();
        window.expect = chai.expect;
        window.assert = chai.assert;

        chaiAsPromised.transferPromiseness = function(assertion, promise) {
            // This is all you get by default
            assertion.then = promise.then.bind(promise);
            assertion['finally'] = promise['finally'].bind(promise);
            assertion.done = promise.done.bind(promise);
            assertion['catch'] = promise['catch'].bind(promise);
        };

        chai.use(chaiAsPromised);

        /* on dom ready require all specs and run */
        $(function() {
            require(testSuite.specs, function() {

                if (window.mochaPhantomJS) {
                    mochaPhantomJS.run();
                } else {
                    mocha.run();
                }

            });
        });
    });
