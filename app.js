// quick setup server.
var gameport = process.env.PORT || 4004,
    app = require('express')(),
    server = require('http').Server(app),
    io      = require('socket.io')(server),
    UUID    = require('node-uuid'),
    verbose = false,
    updates_per_second = 10;


// Setup express
server.listen(gameport);

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

var ids_given = 0;

io.on('connection', function(socket) {
    socket.userid = ids_given++;
    socket.emit( 'onconnected', { id: socket.userid } );
    console.log('player number ' + socket.userid + ' connected');

    socket.on('disconnect', function() {
        console.log('player number ' + socket.userid + ' disconnected');
    });

    socket.on('state', function(data) {
        console.log('User ' + socket.userid + ' reporting location ('
            + data.x + ', ' + data.y + ')');
    });


});

function collect_gamestates() {
    var states = [];
    var clients = io.sockets.clients();
    for (var i = 0; i < clients.length; i++) {
        states.push(clients[i]);
    }
    return states;
}
    
setInterval(function(){
    io.sockets.emit(collect_gamestates(), 'everyone');
}, 1000 / updates_per_second);

