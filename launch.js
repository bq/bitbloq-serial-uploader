'use strict';
window.chrome.app.runtime.onLaunched.addListener(function() {
    window.chrome.app.window.create('index.html', {
        id: 'bitbloq_serial_uploader',
        innerBounds: {
            width: 320,
            height: 100
        },
        resizable: false
    });
});