/** This is a bookmark that loads the bandage file. */
(function(doc, Date) {
  var script = doc.createElement('script');
  script.src = 'http://127.0.0.1:8181/javascripts/bandage.js?t=' + (new Date().getTime());
  script.type = 'text/javascript';
  doc.getElementsByTagName('head')[0].appendChild(script);
}(document, Date));
