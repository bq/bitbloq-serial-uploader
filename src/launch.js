/* *******************************************************
 * bitbloq Serial Uploader
 * Chrome App Launcher
 ********************************************************* */

'use strict';

var AppWindow = {
    current: null,
    defaultConfig: {
        frame: 'none',
        id: 'bitbloqSU',
        resizable: false,
        hidden: false,
        outerBounds: {
            width: 400,
            height: 300,
            left: 0,
            top: 0
        }
    },
    set: function(createdWindow) {
        this.current = createdWindow;

        this.current.minimize();

        //this.current.hide();
        //this.current.clearAttention();

        this.addWindowListerners();
    },
    get: function() {
        return this.current;
    },
    initialize: function(params) {
        var appList = window.chrome.app.window.getAll();

        for (var i = 0; i < appList.length; i++) {
            console.log('appInfo', appList[i]);

            if (appList[i].id === 'bitbloqSU') {
                window.console.warn('bitbloqSU is alredy running');
                return false;
            }

        }

        //attributes rewrite
        if (params) {
            for (var param in params) {
                this.defaultConfig.param = params[param];
            }
        }

        window.chrome.app.window.create('index.html', this.defaultConfig, this.set.bind(this));

    },
    addWindowListerners: function() {

        this.current.onClosed.addListener(function(data) {
            window.console.warn('bitbloqSU closed', data);
        });

    }

};

//Live cycle handler
window.chrome.app.runtime.onLaunched.addListener(function(launchData) {
    window.console.log(launchData);
    if (launchData.id !== 'launcher') {
        window.console.warn('Extension open from chrome extensions page');
    }
    AppWindow.initialize();
});

window.chrome.app.runtime.onRestarted.addListener(function(data) {
    window.console.log('onRestarted event', data);
    AppWindow.initialize();
});

window.chrome.runtime.onUpdateAvailable.addListener(function(data) {
    window.console.log('onUpdateAvailable event', data);
    window.chrome.runtime.reload();
});
