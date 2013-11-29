/**
 * Bandage error handler, send error messages to server
 * Set bandage.data to have additional information send to the server
 * Needs JSON.stringify to send data to server
 */
(function(win, doc, navigator) {
  "use strict";

  var docElement = doc.documentElement,
      body       = doc.getElementsByTagName('body')[0],

      alreadyEnhancedOnError = false,
      originalOnError        = win.onerror,

      Bandage;

  function calculateViewport() {
    var width = win.innerWidth || docElement.clientWidth || body.clientWidth,
        height = win.innerHeight || docElement.clientHeight || body.clientHeight;
    return { width: width, height: height };
  }

  function merge(obj1, obj2) {
    for (var key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        obj1[key] = obj2[key];
      }
    }
    return obj1;
  }

  function enhanceOnError(bandage) {
    if (alreadyEnhancedOnError) { return; }

    win.onerror = function(errorMessage, file, lineNum) {
      if (bandage.isCapturing) {
        bandage.send(errorMessage, file, lineNum);
      }

      if (originalOnError) {
        originalOnError.call(this, arguments);
      }
    };
  }


  Bandage = {
    isCapturing: false,
    _customData: {},

    setup: function(apiKey) {
      if (apiKey) {
        this._apiKey = apiKey;
      }

      enhanceOnError(this);
      this.start();
    },
    start: function() {
      if (!this._apiKey) { return; }
      this.isCapturing = true;
    },
    stop: function() {
      this.isCapturing = false;
    },
    customData: function(data) {
      merge(this._customData, data);
    },
    send: function(error, file, lineNum, customData) {
      var viewport = calculateViewport(),
          image    = new Image(),
          obj;

      customData = {};

      if (typeof file === 'object') {
        customData = file;
        file = null;
        lineNum = null;
      } else if (typeof lineNum === 'object') {
        customData = lineNum;
        lineNum = null;
      }

      obj = {
        time: new Date(),
        type: 'Bandage JavaScriptError',
        error: {
          message: error.message || error,
          file: error.file || file || '',
          lineNum: error.lineNum || lineNum || 0
        },
        environment: {
          userLanguage: navigator.userLanguage,
          // IE document mode
          documentMode: doc.documentMode,
          // browser data
          browserWidth: viewport.width,
          browserHeight: viewport.height,
          screenWidth: win.screen.width || 0,
          screenHeight: win.screen.height || 0,
          browser: navigator.appCodeName,
          browserName: navigator.appName,
          browserVersion: navigator.appVersion,
          userAgent: navigator.userAgent,
          cookieEnabled: navigator.cookieEnabled,
          platform: navigator.platform
        },
        request: {
          url: doc.location.href,
          queryString: doc.location.search
        },
        data: merge(merge({}, this._customData), customData),
        stackTracke: error.stack || ''
      };

      image.src = 'http://api.bandagejs.com/add?data=' + encodeURIComponent(JSON.stringify(obj));
    }
  };


  win.Bandage = Bandage;
}(window, document, navigator));
