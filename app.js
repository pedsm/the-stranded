// quick setup server.
var gameport = process.env.PORT || 4004,
    express = require('express'),
    UUID    = require('node-uuid'),
    verbose = false,
    app = express();


// Setup express
app.listen(gameport);
console.log('Listening on port ' + gameport);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});


// Serve static files
app.get('/static/*', function(req, res, next) {
    var file = req.params[0];

    if(verbose) console.log('\t :: Express :: file requested : ' + file);

    res.sendfile(__dirname + '/static/' + file);
});

