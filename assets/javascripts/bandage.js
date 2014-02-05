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
      tracekitSetUp          = false,
      originalOnError,
      tracekit,

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

  function loadScript(src, cb) {
    var head = doc.getElementsByTagName('head')[0],
        elem = doc.createElement('script'),
        scriptDone = false;

    elem.onload = elem.onreadystatechange = function () {
      if ((elem.readyState && elem.readyState !== "complete" && elem.readyState !== "loaded") || scriptDone) {
        return false;
      }
      elem.onload = elem.onreadystatechange = null;
      scriptDone = true;
      cb();
    };
    elem.src = src;
    head.insertBefore(elem, head.firstChild);
  }

  function setupTraceKit() {
    tracekit = TraceKit.noConflict();

    // register handler, so traceKitWindowOnError will do our request
    !tracekitSetUp && tracekit.report.subscribe(handleError, true);
    tracekitSetUp = true;
  }

  function enhanceOnError(bandage) {
    if (alreadyEnhancedOnError) { return; }

    originalOnError = win.onerror;

    win.onerror = function bandageOnError(errorMessage, file, lineNum, colNum, error) {
      var args = arguments,
          self = this;

      if (Bandage.isCapturing) {
        // This will send the error to handleError
        if (error) {
          // Stack Trace will be build on server side
          makeRequest('UncaughtError', errorMessage, [], merge({}, Bandage._customData), error.stack);
        } else if (tracekit) {
          tracekit.report.traceKitWindowOnError.apply(self, args);
        } else if(Bandage.depsSrc) {
          loadScript(Bandage.depsSrc, function() {
            setupTraceKit();
            tracekit.report.traceKitWindowOnError.apply(self, args);
          });
        } else {
          // without enhancement (we call handleError by ourselves)
          handleError({
            message: errorMessage,
            stack: [{
              line: lineNum,
              url: file,
              func: '?',
              column: colNum
            }]
          });
        }
      }

      if (win.TraceKit) {
        setupTraceKit();
      }

      if (originalOnError) {
        originalOnError.call(this, arguments);
      }
    };
    alreadyEnhancedOnError = true;
  }

  function handleError(error) {
    makeRequest('UncaughtError', error.message, error.stack, merge({}, Bandage._customData));
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

  function sendRequest(url, method, data) {
    var xhr = new win.XMLHttpRequest();
    if ('withCredentials' in xhr) {
      // XHR for Chrome/Firefox/Opera/Safari.
      xhr.open(method, url, true);
    } else if (win.XDomainRequest) {
      // XDomainRequest for IE.
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      console.log("CORS not supported.");
      return;
    }

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  }

  function makeRequest(type, message, stack, customData, rawStack) {
    if (!Bandage.isCapturing) {
      return;
    }

    var viewport = calculateViewport(),
        token    = Bandage._apiKey,
        obj;

    obj = {
      time: new Date(),
      client: {
        name: 'bandage.js',
        version: '$VERSION$'
      },
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
        // url without search
        url: doc.location.href.replace(doc.location.search, ''),
        queryString: doc.location.search
      },
      data: customData,
      stackTrace: rewriteStackTrace(stack),
      rawStackTrace: rawStack || ''
    };

    sendRequest(Bandage.ENV === 'development' ? 'http://bandage.local:8181/add' : 'http://api.bandagejs.com/add', 'POST', {
      token: token,
      data: obj
    });
  }

  function sendDirectly(name, message, stack, customData, rawStack) {
    customData = merge(merge({}, Bandage._customData), customData || {});
    makeRequest(name, message, stack || [], customData, rawStack);
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
    // TODO: test this also without tracekit
    send: function(name, message, customData) {
      if (typeof name === 'object') { // It should be an Error Object
        var errorObj = name;
        customData = message;
        if (tracekit) {
          var error = tracekit.computeStackTrace(errorObj);
          sendDirectly(error.name, error.message, error.stack || [], customData, errorObj.stack);
        } else if(Bandage.depsSrc) {
          loadScript(Bandage.depsSrc, function() {
            setupTraceKit();
            var error = tracekit.computeStackTrace(errorObj);
            sendDirectly(error.name, error.message, error.stack || [], customData, errorObj.stack);
          });
        } else {
          // NOTE: Without tracekit it's really code intensive to get a unified stacktrace
          sendDirectly(errorObj.name, errorObj.message, /*errorObj.stack ||*/ [], customData, errorObj.stack);
        }
      } else { // it is a string
        if (typeof message !== 'string') {
          customData = message;
          message = name;
          name = 'SimpleError';
        }
        sendDirectly(name, message, [], customData);
      }
    }
  };


  win.Bandage = Bandage;
}(window, document, navigator));
