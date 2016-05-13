//

// Connect to server
var socket = io();

//Variable declarations
//map objects
var crates = [90,510,186,104,496,372,384,564]

var debug = false;
var ui = [];
var objects;
var leaderboard;
var mapsize = 6500;
var game;
var starArray = new Array()
var stars;
var velocity = 250;
var fireRate = 1000;
var bulletSpeed = 2000;
var hitBox = 25;
var poi = [];
var nextFire = 0;
var prevUpdate;
var gamestate = [];
var zombiestate = [];
var ztext = [];
var user_id;
var ggCounter = 0;
var ggLimit = 100;
var state = 
{
    x:mapsize/2,
    y:mapsize/2,
    rotation:0,
    skin:0,
    name:"",
    score:0
}
var player;
var cursors;
var lastUpdate;
function makegame()
{
    state.name = document.getElementById("name").value;
    if(state.name == "")
    {
        state.name = 'The zombo killer';
    }
    document.getElementById("menu").remove();
    game = new Phaser.Game(document.body.clientWidth, document.body.clientHeight, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });
    
}
//Preloads(Sprites)
function preload() {
    //loading skins
    game.load.image('skin0', '/static/assets/players/hitman1_gun.png');
    game.load.image('skin1', '/static/assets/players/manBlue_gun.png');
    game.load.image('skin2', '/static/assets/players/manBrown_gun.png');
    game.load.image('skin3', '/static/assets/players/manOld_gun.png');
    game.load.image('skin4', '/static/assets/players/robot_gun.png');
    game.load.image('skin5', '/static/assets/players/soldier_gun.png');
    game.load.image('skin6', '/static/assets/players/survivor_gun.png');
    game.load.image('skin7', '/static/assets/players/womanGreen_gun.png');
    game.load.image('zSkin', '/static/assets/players/zombie1_hold.png');
    //loading map assets
    game.load.image('dessert', '/static/assets/PNG/tile_06.png');
    game.load.image('grass', '/static/assets/PNG/tile_03.png');
    game.load.image('bullet', '/static/assets/bullet.png');
    game.load.image('camp1', '/static/assets/map/camp1.png')
    game.load.image('camp1Top', '/static/assets/map/camp1Top.png')
    //loading map objects
    game.load.image('crate', '/static/assets/objects/crate.png');
    //ui elements
    game.load.image('barBG', '/static/assets/progressBG.png');
    game.load.image('bar', '/static/assets/progress.png');
}
//Creating
function create() {
    //CREATING FLOOR
    var j = 0;
    while(j < mapsize/64)
    {
        var k = 0;
        while(k < mapsize/64)
        {
            game.add.sprite(64*k,64*j,matrixFloor(k,j));
            k++;
        }
        j++;
    }
    //Creating Points of intrest
    poi[0] = game.add.sprite(mapsize/2-300,mapsize/2-300, 'camp1');
    //creating player
    game.physics.startSystem(Phaser.Physics.ARCADE);
    player = game.add.sprite(state.x, state.y, 'skin1');
    game.physics.enable(player,Phaser.Physics.ARCADE);
    player.collideWorldBounds = true;
    
    costume = Math.floor((Math.random() * 7)+1);
    player.loadTexture('skin' + (costume));
    state.skin = costume;

    cursors = game.input.keyboard.createCursorKeys();
    player.anchor.setTo(0.5,0.5);
    nameText = game.add.text(state.x, state.y, state.name, {align: "center",fontSize: '20px', fill: '#000' });
    nameText.anchor.x = 0;
    nameText.x = nameText.x + nameText.width/2
    
    //creating groups
    stars = game.add.group(); 
    objects = game.add.physicsGroup();
    game.physics.enable(objects, Phaser.Physics.ARCADE);
    otext = game.add.group();
    Oplayer = game.add.physicsGroup();
    game.physics.enable(Oplayer, Phaser.Physics.ARCADE);
    zombies = game.add.physicsGroup();
    game.physics.enable(zombies, Phaser.Physics.ARCADE);
    bullets = game.add.physicsGroup();
    game.physics.enable(bullets, Phaser.Physics.ARCADE);
    bullets.enableBody = true;
    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);

    //Create top Points of interest
    poi[1] = game.add.sprite(mapsize/2-300,mapsize/2-300, 'camp1Top');
    for(i=0; i < 8; i += 2)
    {
        makeCrate(mapsize/2-300 + crates[i],mapsize/2-300 + crates[i+1]);
    }

    //creating UI elements
    ui[0] = game.add.text(15, 15, 'Score:0', {align: "left",fontSize: '20px', fill: '#000' });
    ui[0].fixedToCamera = true;
    ui[1] = game.add.text(document.body.clientWidth - 170,15, 'Leaderboard:',{align:"center",fontSize: '20px', fill:'#000'});
    ui[1].fixedToCamera = true;
    ui[3] = game.add.sprite(15,30, 'bar');
    ui[3].fixedToCamera = true;
    ui[3].width = 80;
    ui[2] = game.add.sprite(15,30,'barBG');
    ui[2].fixedToCamera = true;
    ui[2].width = 80;
    
    //adding WASD support
    this.leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    this.upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    this.downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);

    //Camera follow
    game.camera.follow(player);
    game.world.setBounds(0, 0, mapsize, mapsize);
    //z fixes
    nameText.bringToTop();
}

function update() {
    //makeStar(0,0);
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    state.x = player.x;
    state.y = player.y;
    state.rotation = player.rotation;
    playerCollision();
    rotatePlayer();
    var delta = game.time.now - lastUpdate; 
    if (this.leftKey.isDown || cursors.left.isDown)
    {
        //player.body.velocity.x = -velocity;
        player.body.x -= velocity * delta/1000;
    }
    if (this.rightKey.isDown|| cursors.right.isDown)
    {
        //player.body.velocity.x = velocity;
        player.body.x += velocity * delta/1000;
    }
    if (this.upKey.isDown || cursors.up.isDown)
    {
        //player.body.velocity.y = -velocity;
        player.body.y -= velocity * delta/1000;
    }
    if (this.downKey.isDown || cursors.down.isDown)
    {
        //player.body.velocity.y = velocity;
        player.body.y += velocity * delta/1000;
    }
    if (game.input.activePointer.isDown)
    {
       fire();
    } 

    //generate local instances of all players
    for(i=0; i <  gamestate.length; i++)
    {
        generate(i);
    }
    //generate local instances of zombies
    for(i=0; i < zombiestate.length; i++)
    {
        generateZombie(i);
    }
    //cleanUP to sync local registers
    if(gamestate.length < Oplayer.children.length || zombiestate.length < zombies.children.length)
    {
        cleanUP();
    }
    //gg collision detection
    collisionChecker();
    nameUpdate();
    uiUpdate();
    game.physics.arcade.collide(player, objects, boom, null, this);
    game.physics.arcade.collide(player, Oplayer, boom, null, this);
    game.physics.arcade.collide(zombies, objects, boom, null, this);
    game.physics.arcade.overlap(bullets, zombies, killZombie, null, this);
    
    lastUpdate = game.time.now;
}
function boom()
{
    console.log('contact');
}
function uiUpdate()
{
    ui[0].text = "Score:" + state.score;
    ui[1].text = "Leaderboard:\n" + leaderboard;
    ui[1].x = document.body.clientWidth - 170;
    if(game.time.now > nextFire)
    {
        ui[3].width = 80;
    }else{
        ui[3].width = 80 - ((nextFire - game.time.now)/fireRate * 80);
    }
    game.scale.setGameSize(document.body.clientWidth,document.body.clientHeight);

}
function nameUpdate()
{
    nameText.x = player.x;
    nameText.x = nameText.x;// + nameText.width/2;
    nameText.anchor.x = 0.5;
    nameText.y = player.y - 70;
    if(otext.children.length > gamestate.length)
    {
        otext.children.splice(0,1);
    }
}
function cleanUP()
{
    if(Oplayer.children.length > gamestate.length)
    {
        Oplayer.children.splice(0, 1);   
    }
    if(zombies.children.length > zombiestate.length)
    {
        zombies.children.splice(0, 1);
    }
}
function killZombie(bullet, zombie)
{
    if(zombie.isZombie == true)
    {
        console.log('hit zombie id: '+zombie.name );
        bullet.kill();
        bullet.x = 100000;
        bullet.y = 100000;
        zombie.x = 100000;
        zombie.y = 100000;
        zombie.isZombie = false;
        var id = zombie.name;
        socket.emit('kill', id);
    }
}
function collisionChecker()
{
    /*bullets.forEach(function(item){
        zombies.forEach(function(item2)
            {
                //console.log(item.x);
                if(item.x > item2.x - hitBox && item.x < item2.x + hitBox)
                {
                   if(item.y > item2.y-hitBox && item.y < item2.y+hitBox)
                   {
                       console.log('hit zombie id: '+item2.name );
                       item.kill();
                       item.x = 100000;
                       item.y = 100000;
                       item2.x = 100000;
                       item2.y = 100000;
                       item2.isZombie = false;
                       var id = item2.name;
                       socket.emit('kill', id);
                   } 
                }
            })
    });*/
    zombies.forEach(function(item3)
            {
                if(item3.x > player.x - hitBox && item3.x < player.x + hitBox)
                {
                    if(item3.y > player.y - hitBox && item3.y < player.y + hitBox)
                    {
                        console.log('Player killed');
                        game.destroy();
                        socket.disconnect();
                    }
                }
            });
}
function makeCrate(x,y,rot)
{
    var temp = objects.create(x,y,'crate');
    temp.anchor.setTo(0.5,0.5);  
    temp.rotation = rot; 
    temp.body.immovable =  true;
}
function matrixFloor(x,y)
{
    floor = [2,2,1,1,1,1,1,1,1,
             1,2,1,1,2,2,2,2,1,
             1,1,2,2,2,2,1,1,1,
             1,2,2,2,2,2,1,1,1];
    if (floor[(9*y+x)%floor.length] == 1)
    {
        return 'grass';
    }
    else
    {
        return 'dessert';
    }
}
function playerCollision()
{
    if(player.x < 0)
    {
        player.x = 0;
    }
    if(player.y < 0)
    {
        player.y = 0;
    }
    if(player.x > game.world.width)
    {
        player.x = game.world.width;
    }
    if( player.y > game.world.height)
    {
        player.y = game.world.height;
    }
}
function generateZombie(localID)
{
    if(zombieExists(localID))
    {
        zombies.children[localID].x = zombiestate[localID].x;
        zombies.children[localID].y = zombiestate[localID].y;
        //t = game.add.tween(zombies.children[localID]);
        //t.to({x:zombiestate[localID.x], y:zombiestate[localID.y]}, 100);
        //t.start();
        zombies.children[localID].rotation = zombiestate[localID].rotation;
        zombies.children[localID].name = zombiestate[localID].id;
        //debug name 
    }else{
        zombies.children.addChild =createZombie(zombiestate[localID].x,zombiestate[localID].y,zombiestate[localID].rotation,zombiestate[localID].id);
    }
}
function zombieExists(localID)
{
    if(zombies.children.length > localID)
    {
        return true;
    }else
    {
        return false;
    }
}
function generate(localID)
{
    if(opExists(localID))
    {
        Oplayer.children[localID].x = gamestate[localID].x;
        Oplayer.children[localID].y = gamestate[localID].y;
        //t = game.add.tween(Oplayer.children[localID]);
        //t.to({x:gamestate[localID.x], y:gamestate[localID.y]},100);
        //t.start();
        Oplayer.children[localID].rotation = gamestate[localID].rotation;
        Oplayer.children[localID].frame = (gamestate[localID].skin * 6)-1; 
        Oplayer.children[localID].name = gamestate[localID].id;
        //make name for oplayer
        otext.children[localID].reset();
        otext.children[localID].x = gamestate[localID].x;
        otext.children[localID].anchor.x = 0.5;
        otext.children[localID].y = gamestate[localID].y - 70;
        otext.children[localID].text = gamestate[localID].name;
    }else{
        Oplayer.children[localID] =  createOPlayer(gamestate[localID].x,gamestate[localID].y,gamestate[localID].rotation,gamestate[localID].id,gamestate[localID].skin);
        game.add.text(gamestate[localID].x, gamestate[localID].y, gamestate[localID].name, {align: "center",fontSize: '15px', fill: '#000' }, otext);
    }
}
function opExists(localID)
{
    if (Oplayer.children.length >  localID)
    {
        return true;
    }else{
        return false;
    }
}

function fire()
{
    if(game.time.now > nextFire && bullets.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;
        var bullet = bullets.getFirstDead();
        bullet.reset(player.x - 8, player.y - 8);
        game.physics.arcade.moveToPointer(bullet, bulletSpeed); 
    }   
}

function killAllS()
{
    //console.log(stars.length);
    for (i = 0; i < stars.length; i++) {
        var tempStar = stars.getFirstAlive();

        if(tempStar)
        {
            tempStar.kill();
        }
    }
    
}

function makeStar(xCord, yCord)
{
    stars.create(xCord,yCord, 'star');
}

function rotatePlayer()
{
        var x2 , x1, y2, y1;
        x2 = game.input.worldX;
        x1 = player.x;
        y2 = game.input.worldY;
        y1 = player.y;

        player.rotation = Math.atan2((y2-y1),(x2-x1));
}
function createZombie(x,y,rot, id)
{
    var temp = zombies.create(x,y,'zSkin');
    temp.rotation = rot;
    temp.name = id;
    temp.loadTexture('zSkin');
    temp.anchor.setTo(0.5,0.5);
    temp.isZombie = true;
}
//creates a new Oplayer
function createOPlayer(x,y,rot,id,skin)
{
    var temp = Oplayer.create(x,y,'skin1');
    temp.rotation = rot;
    temp.name = id;
    temp.anchor.setTo(0.5,0.5);
    temp.immovable = true;
    if(skin == 11)
    {
        temp.frame = 25;
    }else
    {
        temp.loadTexture('skin' + (skin));
    }   
    return temp;
}
//create a new Oplayer by id on gamestate

function render() {
    //game.debug.bodyInfo(player,16, 24);
        //camera follow function debugging info
        //game.debug.cameraInfo(game.camera, 32, 32);
        //game.debug.spriteCoords(player, 32, 500); 
}
// Socket.io stuff

socket.on('userid', function(data) {
    user_id = data.id;
});

socket.on('gamestate', function(data) {
    gamestate = data.players;
    zombiestate = data.zombies;
    for (var i = 0; i<gamestate.length; i++) {
        if (gamestate[i].id == user_id) {
            state.score = gamestate[i].score;
            gamestate.splice(i, 1);
        }
    }
});


setInterval(function() {
    socket.emit('state', state);
}, 30);

