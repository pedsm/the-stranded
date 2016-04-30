// quick setup server.
var gameport = process.env.PORT || 4004,
    io      = require('socket.io'),
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


// Setup socket.io
var sio = io.listen(app);

sio.configure(function() {
    sio.set('log level', 0);

    sio.set('authorization', function() {
        callback(null, true);
    });
});


// Handle a socket connection
sio.sockets.on('connection', function(client) {
    client.userid = UUID();
    client.emit('onconnected', { id: client.userid });
    console.log('\t socket.io:: player ' + client.userid + ' disconnected');

    client.on('disconnect', function() {
        console.log('\t socket.io:: player ' + client.userid + ' disconnected');
    });

});

