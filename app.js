"use strict";
// quick setup server.
var gameport = process.env.PORT || 4004,
    app = require('express')(),
    server = require('http').Server(app),
    io      = require('socket.io')(server),
    UUID    = require('node-uuid'),
    verbose = false,
    update_delta = 30, //ms
    list_of_zombies = [],
    zombies_puser_pmin = 3,
    zombie_velocity = 50,
    zombies = [];


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

// Recieve a connection from a game client
io.on('connection', function(socket) {
    socket.userid = ids_given++;
    socket.emit( 'userid', { id: socket.userid } );
    console.log('player number ' + socket.userid + ' connected');

    socket.on('disconnect', function() {
        io.sockets.emit('user-dc', {id: socket.userid});
        console.log('player number ' + socket.userid + ' disconnected');
    });

    socket.on('state', function(data) {
        socket.x = data.x;
        socket.y = data.y;
        socket.rotation = data.rotation;
        socket.skin = data.skin;
    });


});

function collect_userstates() {
    var states = [];
    Object.keys(io.sockets.sockets).forEach(function(id) {
        var socket = io.sockets.connected[id];
        states.push({x: socket.x, y: socket.y, rotation: socket.rotation, id: socket.userid, skin:socket.skin});
    })
    return states;

}

function collect_zombiestates() {
    for (var z = 0; z < zombies.length; z++) {
        zombies[z].update();
    }
    return zombies;
}

function collect_gamestate() {
    return collect_userstates().concat(collect_zombiestates());
}
    
setInterval(function(){
    io.sockets.emit('gamestate', collect_gamestate());
}, 100);

class Zombie {

    constructor() {
        this.id = ids_given++;
        this.x = 500;
        this.y = 500;
        this.rotation = 0;

        // Costume id for a zombie
        this.costume = 5;
    }

    nearest_user() {
        sockets = collect_userstates();
        min_distance = Number.MAX_SAFE_INTEGER;
        closest_user = null;
        for (var i = 0; i<sockets.length; i++) {
            socket = sockets[i];
            distance = Math.sqrt(socket.x * socket.x + socket.y * socket.y);
            if (distance < max_distance) {
                max_distance = distance;
                closest_user = socket;

            }

        }
        
        return socket;
    }

    update() {
        var timedelta = update_delta / 1000;
        this.x = this.x + (zombie_velocity * timedelta);
    }

}

// Create new zombies
setInterval(function() {
   console.log('Generating ' + collect_userstates().length +  ' zombies.');
   var zombie = new Zombie();
   zombies.push(zombie);
}, 60000 / zombies_puser_pmin );

