'use strict';
window.chrome.app.runtime.onLaunched.addListener(function(launchData) {
    window.console.log(launchData);
    if (launchData.id === 'launcher') {
        var appList = window.chrome.app.window.getAll();
        console.log(appList);
        for (var i = 0; i < appList.length; i++) {
            console.log('appInfo', appList[i]);
            if (appList[i].id === 'bitbloqSSU') {
                window.console.warn('bitbloqSSU is alredy running');
                return false;
            }
        }
        window.chrome.app.window.create('index.html', {
            id: 'bitbloqSSU',
            resizable: false,
            hidden: true,
            state: 'minimized'
        });
    } else {
        window.console.warn('Extension open from chrome extensions page');
        window.chrome.app.window.create('index.html', {
            id: 'bitbloqSSU'
        });
    }

});