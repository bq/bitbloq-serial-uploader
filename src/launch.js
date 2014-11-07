'use strict';

var createCustomWin = function(params) {
    var appList = window.chrome.app.window.getAll();
    var currentWin = null;
    console.log(appList);
    for (var i = 0; i < appList.length; i++) {
        console.log('appInfo', appList[i]);
        currentWin = appList[i];
        if (appList[i].id === 'bitbloqSSU') {
            window.console.warn('bitbloqSSU is alredy running');
            return false;
        }
    }
    var _params = {
        frame: 'none',
        id: 'bitbloqSSU',
        resizable: false,
        hidden: false,
        outerBounds: {
            width: 300,
            height: 180,
            left: 0,
            top: 0
        }
    };
    //attributes rewrite
    for (var param in params) {
        _params.param = params[param];
    }

    window.chrome.app.window.create('index.html', _params);

    if (!currentWin) {
        currentWin = window.chrome.app.window.get('bitbloqSSU');
        currentWin.resizeTo(400, 300);
        currentWin.onClosed.addListener(function(data) {
            window.console.warn('bitbloqSSU closed', data);
            createCustomWin({
                'hidden': true
            });
        });
    }

};


//Live cycle handler

window.chrome.app.runtime.onLaunched.addListener(function(launchData) {
    window.console.log(launchData);
    if (launchData.id === 'launcher') {
        createCustomWin();
    } else {
        window.console.warn('Extension open from chrome extensions page');
        createCustomWin();
    }
});

window.chrome.app.runtime.onRestarted.addListener(function(data) {
    window.console.log('onRestarted event', data);
    createCustomWin();
});
