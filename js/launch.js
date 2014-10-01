'use strict';
window.chrome.app.runtime.onLaunched.addListener(function(launchData) {
    console.log(launchData);
    if (launchData.id === 'launcher') {
        window.chrome.app.window.create('index.html', {
            id: 'bitbloqSSU',
            resizable: false,
            hidden: true,
            state: 'minimized'
        });
    } else {
        console.warn('Extension open from chrome extensions page');
        window.chrome.app.window.create('index.html', {
            id: 'bitbloqSSU'
        });
    }
});