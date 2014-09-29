'use strict';
window.chrome.app.runtime.onLaunched.addListener(function(launchData) {

    console.log(launchData);

    window.chrome.app.window.create('index.html', {
        bounds: {
            width: 400,
            height: 200
        },
        resizable: false
    });
});