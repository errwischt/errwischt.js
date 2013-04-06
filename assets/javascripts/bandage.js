/**
 * Bandage error handler, send error messages to server
 * Set bandage.data to have additional information send to the server
 * Needs JSON.stringify to send data to server
 */
(function(win, doc, navigator) {
  "use strict";
  var docElement = doc.documentElement,
      body       = doc.getElementsByTagName('body')[0],
      defaultOnError = win.onerror,

      bandage = win.bandage || {},

      viewport;

  function createViewport() {
    var width = window.innerWidth || docElement.clientWidth || body.clientWidth,
        height = window.innerHeight || docElement.clientHeight || body.clientHeight;
    viewport = { width: width, height: height };
  }

  function send(errorMessage, file, lineNum) {
    if (!bandage.server) {
      throw "BandageError: Please set the server url via bandage.server";
    }
    createViewport();
    var obj = {
      time: new Date(),
      type: 'Bandage JavaScriptError',
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
        queryString: doc.location.search
      },
      data: bandage.data || null
    };

    var image = new Image();
    image.src = bandage.server + '/add?data=' + encodeURIComponent(JSON.stringify(obj));
  }

  window.onerror = function(errorMessage, file, lineNum) {
    bandage.send(errorMessage, file, lineNum);

    if (defaultOnError) {
      defaultOnError(errorMessage, file, lineNum);
    }
  };

  bandage.send = send;
}(window, document, navigator));
