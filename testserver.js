var connect     = require('connect'),
    dispatch    = require('dispatch'),
    quip        = require('quip');

var router = dispatch({
  '/': function(req, res, next) {
    res.text("TODO");
  },
  '/add': function(req, res, next) {
    var data = req.query.data ? JSON.parse(req.query.data) : req.body;
    console.log("RETRIEVED:", data);
    res.plain("created");
  }
});

var app = connect()
  .use(connect.static(__dirname + '/assets'))
  .use(connect.bodyParser())
  .use(connect.query())
  .use(quip())
  .use(router);

app.listen(8181);
console.log("server started on http://127.0.0.1:8181");
