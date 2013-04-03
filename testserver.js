var connect     = require('connect');

var app = connect()
  .use(connect.static(__dirname + '/assets'))
  .use(connect.bodyParser());

app.listen(8181);
console.log("server started on http://127.0.0.1:8181");
