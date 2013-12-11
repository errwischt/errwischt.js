/**
 * Bandage error handler, send error messages to server
 * Set bandage.data to have additional information send to the server
 * Needs JSON.stringify to send data to server
 */
(function(win, doc, navigator, tracekit) {
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
      if (Bandage.isCapturing) {
        // This will send the error to handleError
        tracekit.report.traceKitWindowOnError.apply(this, arguments);
      }

      if (originalOnError) {
        originalOnError.call(this, arguments);
      }
    };
  }

  function handleError(error) {
    makeRequest('UncaughtError', error.message, error.stack, merge(merge({}, Bandage._customData)));
  }

  function rewriteStackTrace(stack) {
    var trace = [];
    for (var i=0; i<stack.length; ++i) {
      trace.push({
        column: stack[i].column,
        lineNumber: stack[i].line,
        methodName: stack[i].func,
        file: stack[i].url
      });
    }
    return trace;
  }

  function makeRequest(type, message, stack, customData) {
    if (!Bandage.isCapturing) {
      return;
    }

    var viewport = calculateViewport(),
        image    = new Image(),
        token    = Bandage._apiKey,
        obj;

    obj = {
      time: new Date(),
      type: 'Bandage JavaScriptError',
      error: {
        type: type,
        message: message
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
      data: customData,
      stackTrace: rewriteStackTrace(stack)
    };

    // TODO: Use CORS instead of an image
    image.src = 'http://api.bandagejs.com/add?token=' + encodeURIComponent(token) + 'data=' + encodeURIComponent(JSON.stringify(obj));

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
      tracekit.report.subscribe(handleError, true);
    },
    stop: function() {
      tracekit.report.unsubscribe(handleError);
      this.isCapturing = false;
    },
    customData: function(data) {
      merge(this._customData, data);
    },
    send: function(name, message, customData) {

      if (typeof name === 'object') { // It should be an Error Object
        customData = message;
        var error = tracekit.computeStackTrace(name);
        customData = merge(merge({}, this._customData), customData || {});
        makeRequest(error.name, error.message, error.stack || [], customData);
      } else { // it is a string
        if (typeof message !== 'string') {
          customData = message;
          message = name;
          name = 'SimpleError';
        }
        customData = merge(merge({}, this._customData), customData || {});
        makeRequest(name, message, [], customData);
      }
    }
  };


  win.Bandage = Bandage;
}(window, document, navigator, TraceKit.noConflict()));
