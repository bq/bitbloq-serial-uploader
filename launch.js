'use strict';
window.chrome.app.runtime.onLaunched.addListener(function(launchData) {
    window.console.log(launchData);
    window.chrome.app.window.create('index.html', {
            id: 'blink1',
            innerBounds: {
                width: 480,
                height: 320
            },
            resizable: false,
            hidden: true
        },
        function() {

        });
});