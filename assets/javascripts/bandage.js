(function(win) {
  "use strict";
  var defaultOnError = win.onerror;

  window.onerror = function(errorMessage, url, lineNum) {
    console.log("bandage", arguments);

    if (defaultOnError) {
      defaultOnError(errorMessage, url, lineNum);
    }
  };
}(window));
