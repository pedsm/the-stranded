"use strict";
// quick setup server.
var gameport = process.env.PORT || 4004,
    app = require('express')(),
    server = require('http').Server(app), io      = require('socket.io')(server),
    UUID    = require('node-uuid'),
    verbose = false,
    update_delta = 30, //ms
    list_of_zombies = [],
    zombies_puser_pmin = 10,
    zombie_velocity = 70,
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
        if (collect_userstates().length == 0) {
            console.log('Deleting all zombies');
            
        }
            
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
        this.skin = 5;
    }

    nearest_user() {
        var sockets = collect_userstates();
        var min_distance = Number.MAX_SAFE_INTEGER;
        var closest_user = null;
        for (var i = 0; i<sockets.length; i++) {
            var socket = sockets[i];
            var distance = Math.sqrt(socket.x * socket.x + socket.y * socket.y);
            if (distance < min_distance) {
                min_distance = distance;
                closest_user = socket;

            }

        }
        
        return socket;
    }

    update() {
        var timedelta = update_delta / 1000;
        var user = this.nearest_user();

        var diff_x = user.x - this.x;
        var diff_y = user.y - this.y;
        var total_dist = Math.sqrt(diff_y * diff_y + diff_x * diff_x);
        var dist_div = total_dist / (zombie_velocity * 30 / 1000);
        
        var delta_x = diff_x / dist_div;
        var delta_y = diff_y / dist_div;

        this.rotation = Math.atan2(diff_y, diff_x);

        this.x = this.x + delta_x;
        this.y = this.y + delta_y;
    }

}

// Create new zombies
setInterval(function() {
   var zombie = new Zombie();
   zombies.push(zombie);
}, 60000 / zombies_puser_pmin );

