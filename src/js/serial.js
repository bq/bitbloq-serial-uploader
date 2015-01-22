/* *******************************************************
* bitbloq Serial Uploader
* bitbloqSU.Serial - Chrome.serial communication functionality
********************************************************* */
'use strict';
/* global logger, Promise, bitbloqSU*/
/* jshint unused:false */
if (!window.bitbloqSU) {
  window.bitbloqSU = {};
}


bitbloqSU.Serial = (function() {

  //connect(port,bitrate):connectionID
  //disconnect()
  //send(data):promise
  //+connection:connectionID

  bitbloqSU.SerialAPI = window.chrome.serial;
  bitbloqSU.lineBuffer = 0;
  var connectionId=-1;

  var receiverListener;

  //
  var defaultOnReceiveDataCallback = function(done) {
    return function(evt) {
      logger.info('bitbloqSU.callback');
      var str;
      if (evt.data.byteLength === 2) {
        str = String.fromCharCode.apply(null, new Uint16Array(evt.data));
      } else {
        str = String.fromCharCode.apply(null, new Uint8Array(evt.data));
      }
      var responseCode = parseInt(str.charCodeAt(0).toString(16), 10);
      logger.info({
        'SerialAPI.onReceive': responseCode
      });
      if (evt.data.byteLength !== 0) {
        logger.warn({
          'evt.data.byteLength': evt.data.byteLength
        });
        bitbloqSU.lineBuffer += evt.data.byteLength;
        logger.info({
          'lineBuffer': bitbloqSU.lineBuffer
        });
        if (bitbloqSU.lineBuffer >= 2) {
          logger.info('lineBuffer >= 2');
          if (bitbloqSU.lineBuffer) {
            bitbloqSU.lineBuffer = 0;
            logger.warn('bitbloqSU.lineBuffer set to 0');
            removeReceiveDataListener();
            logger.info('bitbloqSU.SerialAPI.onReceive.addListener removed');
            done();
          }
        } else if (bitbloqSU.lineBuffer >= 4) {
          logger.info('lineBuffer >= 4');
          if (bitbloqSU.lineBuffer) {
            bitbloqSU.lineBuffer = 0;
            logger.warn('bitbloqSU.lineBuffer set to 0');
            removeReceiveDataListener();
            logger.info('bitbloqSU.SerialAPI.onReceive.addListener removed');
            done();
          }
        }
      } else {
        logger.error('Data receive byteLength === 0');
      }
    };
  };

  var addReceiveDataListener = function(callback) {
    logger.info('bitbloqSU.addReceiveDataListener');
    receiverListener = callback;
  };
  var removeReceiveDataListener = function() {
    logger.info('bitbloqSU.removeReceiveDataListener');
    receiverListener = undefined;
  };

  var init = function() {
    logger.info('bitbloqSU.init');
    bitbloqSU.SerialAPI.onReceive.addListener(function(evt) {
      if (receiverListener) {
        receiverListener.call(this, evt);
      }
    });
    bitbloqSU.SerialAPI.onReceiveError.addListener(function(evt) {
      logger.error('Connection ' + evt.connectionId + ' received error: ' + evt.error);
      disconnect();
    });
  };

  var getConnections = function() {
    return new Promise(function(resolve) {
      bitbloqSU.SerialAPI.getConnections(function(connections) {
        resolve(connections);
      });
    });
  };

  var disconnect = function() {
    getConnections().then(function(connections) {
      if (connections.length > 0) {
        connections.forEach(function(connection) {
          bitbloqSU.SerialAPI.disconnect(connectionId, function() {
            connectionId = -1;
            logger.info('Port disconnected!');
          }); // Close port
        });
      }
    });
  };

  //First port: "/dev/ttyACM0"
  var connect = function(port,bitrate) {
    return new Promise(function(resolve, reject) {
        try {
          logger.info('Connecting to board...');
          bitbloqSU.SerialAPI.connect(port, {
            bitrate: bitrate,
            sendTimeout: 2000,
            receiveTimeout: 2000,
            //ctsFlowControl: true,
            name: 'bitbloqSerialConnection'
          }, function(info) {
            if (info.connectionId !== -1) {

              logger.info({
                'Connection board TEST OK': info
              });
              resolve(info.connectionId);
              return;
            } else {
              logger.error({
                'Connection board TEST KO': 'KO'
              });
              reject(-1);
              return;
            }
          });
        } catch (e) {
          logger.error({
            'Connection board TEST KO': e
          });
          reject(-2);
          return;
        }
    });
  };

var sendData = function(data,connectionId) {
  logger.info('Sending ' + data.byteLength + ' bytes.');
  if (data.byteLength === 0) {
    return Promise.reject();
  }
  return new Promise(function(resolveSendData, rejectSendData) {
    logger.info('Chrome is writing on board...');
      var onReceivePromise = new Promise(function(resolveOnReceive) {
        bitbloqSU.Serial.addReceiveDataListener(defaultOnReceiveDataCallback(resolveOnReceive));
      });
      window.chrome.serial.flush(connectionId, function() {
        bitbloqSU.SerialAPI.send(connectionId, data, function(sendInfo) {
          logger.info('sendInfo :', sendInfo);
          onReceivePromise.then(function() {
            resolveSendData();
          }).
          catch(function() {
            logger.eror(':(');
            rejectSendData();
          });
        });
      });
  });
};


return {
  init: init,
  sendData: sendData,
  connect: connect,
  disconnect: disconnect,
  receiverListener: receiverListener,
  defaultOnReceiveDataCallback: defaultOnReceiveDataCallback,
  addReceiveDataListener: addReceiveDataListener,
  removeReceiveDataListener: removeReceiveDataListener
};
})();
