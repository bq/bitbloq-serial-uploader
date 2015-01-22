'use strict';
/* global require, mochaPhantomJS, mocha, $, chai, chaiAsPromised */
/* jshint unused:false */


mocha.ui('bdd');
mocha.reporter('html');

chai.config.includeStack = true;

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

// Mocha starter
$(function() {

    if (window.mochaPhantomJS) {
        mochaPhantomJS.run();
    } else {
        mocha.run();
    }

});
