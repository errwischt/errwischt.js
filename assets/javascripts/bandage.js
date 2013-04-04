(function(win, doc, navigator) {
  "use strict";
  var docElement = doc.documentElement,
      body       = doc.getElementsByTagName('body')[0],
      defaultOnError = win.onerror,

      viewport;

  function createViewport() {
    var width = window.innerWidth || docElement.clientWidth || body.clientWidth,
        height = window.innerHeight || docElement.clientHeight || body.clientHeight;
    viewport = { width: width, height: height };
  }

  window.onerror = function(errorMessage, file, lineNum) {
    createViewport();
    var obj = {
      time: new Date(),
      error: {
        message: errorMessage,
        file: file,
        lineNum: lineNum
      },
      environment: {
        userLanguage: navigator.userLanguage,
        // IE document mode
        documentMode: document.documentMode,
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
        queryString: doc.location.searc
      }
    };
    console.log("bandage", obj);

    if (defaultOnError) {
      defaultOnError(errorMessage, file, lineNum);
    }
  };
}(window, document, navigator));
