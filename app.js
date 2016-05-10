"use strict";

//
// App.js - The main server file for 'The Stranded'.
//

// Setup global game variables.
var gameport        = process.env.PORT || 4004,
    app             = require('express')(),
    server          = require('http').Server(app),
    io              = require('socket.io')(server),
    verbose         = false,
    update_delta    = 30, //ms
    list_of_zombies = [],
    zombies_puser_pmin = 10,
    zombie_velocity = 70,
    zombies = [];


// Start server.
server.listen(gameport);
console.log(':: Listening on port ' + gameport);


// Serve 'index.html' at the root.
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});


// Serve static files
app.get('/static/*', function(req, res, next) {
    var file = req.params[0];

    if(verbose) console.log('\t :: Express :: file requested : ' + file);

    res.sendfile(__dirname + '/static/' + file);
});


// Return a list of user states.
function collect_userstates() {
    var states = [];
    Object.keys(io.sockets.sockets).forEach(function(id) {
        var socket = io.sockets.connected[id];
        var state = socket.state;
        if (socket.state) {
            state.isZombie = false;
            state.id = socket.userid;
            states.push(state);
        }
    })
    return states;

}

// Return a list of zombies states.
function collect_zombiestates() {
    for (var z = 0; z < zombies.length; z++) {
        zombies[z].update();
    }
    return zombies;
}

// Return the states of all game objects.
function collect_gamestate() {
    return collect_userstates().concat(collect_zombiestates());
}

// A continuously incremented variable containing the number of IDs given to
// game objects. It can be used as a unique ID for a new object as long as it
// is incremented immediately
var ids_given = 0;

// Socket.IO
// Once a client has connected...
io.on('connection', function(socket) {
    socket.userid = ids_given++;

    // Assign them a unique ID.
    socket.emit( 'userid', { id: socket.userid } );
    console.log('Player ' + socket.userid + ' connected.');

    // Handle the user disconnecting.
    socket.on('disconnect', function() {
        var num_users = collect_userstates().length;
        if (!num_users && zombies.length) {
            zombies = [];
            console.log('No users present. Deleting all zombies');
        }

        console.log('Player ' + socket.userid + ' disconnected');
            
    });

    // Handling the client sending its state. At the moment, we trust it
    // blindly.
    socket.on('state', function(data) {
        socket.state = data;
    });

    // Handle kill notifications (where ID is the ID of the zombie killed)
    socket.on('kill', function(data) {
        for (var i=0; i<zombies.length; i++) {
            if (zombies[i].id == parseInt(data)) {
                zombies.splice(i, 1);
                console.log('Player ' + socket.userid + ' killed a zombie.');
            }
        }
    });


});


// Continuously send _ALL_ clients a copy of the gamestate.
setInterval(function(){
    io.sockets.emit('gamestate', {'players': collect_userstates(), 'zombies': collect_zombiestates()});
}, 30);

// The Zombie class
class Zombie {

    constructor() {
        this.id = ids_given++;
        this.x = Math.floor(Math.random() * 1920);
        this.y = Math.floor(Math.random() * 1920);
        this.rotation = 0;
        this.isZombie = true;

        // Costume id for a zombie
        this.skin = 11;
    }

    // Return the user nearest to the Zombie. The zombies are very stupid
    // and will just gravitate towards the nearest user :).
    nearest_user() {
        var sockets = collect_userstates();
        var min_distance = Number.MAX_SAFE_INTEGER;
        var closest_user = null;
        for (var i = 0; i<sockets.length; i++) {
            var socket = sockets[i];

            var diff_x = socket.x - this.x;
            var diff_y = socket.y - this.y;

            var distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
            if (distance < min_distance) {
                min_distance = distance;
                closest_user = socket;
            }
        }
        return closest_user;
    }

    // Run an update. This causes the zombie to turn towards the nearest user
    // and make a movement towards them relative to the standard zombie
    // velocity.
    update() {
        var timedelta = update_delta / 1000;
        var user = this.nearest_user();

        // Handle case when there are no users. This shouldn't happen but it
        // does occasionally anyway.
        if (user == null) {
            return;
        }

        var diff_x = user.x - this.x;
        var diff_y = user.y - this.y;
        var total_dist = Math.sqrt(diff_y * diff_y + diff_x * diff_x);
        var dist_div = total_dist / (zombie_velocity * 30 / 1000);
        
        var delta_x = diff_x / dist_div;
        var delta_y = diff_y / dist_div;

        // Update the rotation and position of the Zombie.
        this.rotation = Math.atan2(diff_y, diff_x);
        this.x = this.x + delta_x;
        this.y = this.y + delta_y;
    }

}

// Periodically create new zombies at a steady rate.
setInterval(function() {
   var zombie = new Zombie();
   zombies.push(zombie);
}, 60000 / zombies_puser_pmin);

