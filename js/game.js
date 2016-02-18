<!-- 
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
    
    /* MUSIC AND SOUNDS*/
    game.load.audio('backgroundmusic', ['assets/music/tf2remix.ogg']);
    game.load.audio('mariojump', ['assets/sound effects/mariojump.ogg']);
    
    /* SPRITES AND TILEMAPS */
    
    game.load.tilemap('map', 'assets/tilemaps/tutorial.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/tilemaps/simple_tiles.png');
    
    // spritesheet function parameters (name, locations, width, height)
    game.load.spritesheet('mario', 'assets/entity/mario.png', 28, 36);
    
    /*
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    */   
}

/* MAP VARIABLES */    
var map;
var layer;
var goal;
var win = false;

/* SOUND VARIABLES */
var music;
var jumpSound;

var player;
var cursors;
    
var stars;
var diamonds = 0;
var scoreText;
var timer;

//MY ADDED VARIABLES
var pdg = 400;  //Player Default Gravity
var pwg = 15;   //Player Wall Gravity

/* GAME LOGIC TRACKER */
var lastKey;        // General Directional tracking
var walljump;       // Walljump  Directional tracking
var walljumpLock;
var jumpToggle;     // Checks if jump key is pressed from the ground

/* LEFT HANDED MOVEMENT CONTROLS */
var leftKey;
var rightKey;
var jumpKey;

function create() {
    /* GAME  VISUALS*/
    map = game.add.tilemap('map');
    map.addTilesetImage('simple_tiles','tiles');
    
    layer = map.createLayer('world');
    goal = map.createLayer('goal');
    
    layer.resizeWorld();
    
    map.setCollisionBetween(0,2);
    
    /* LAYER COLLISION DEBUGGER*/
    //layer.debug = true;
    //goal.debug = true;
    
    game.physics.startSystem(Phaser.Physics.Arcade);
    
    // The player and its settings
    player = game.add.sprite(64, game.world.height - 200, 'mario');
    
    //  We need to enable physics on the player
    game.physics.arcade.enable(player);
    game.camera.follow(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0;
    player.body.gravity.y = pdg;
    player.body.collideWorldBounds = true;
    player.body.setSize(22, 28, 3, 8);

    //  Player Animations
    player.animations.add('r-run', [0, 1, 2, 3, 4, 5, 6, 7], 10, true);
    player.animations.add('l-run', [8, 9, 10, 11, 12, 13, 14, 15], 10, true);
    player.animations.add('r-stand', [16, 17], 3, true);
    player.animations.add('l-stand', [18, 19], 3, true);
    player.animations.add('r-push', [24, 25, 26, 27, 28, 29], 5, true);
    player.animations.add('l-push', [30, 31, 32, 33, 34, 35], 5, true);
    player.animations.add('victory', [38, 39], 3, true);
    
    /* GAME AUDIO */
    music = game.add.audio('backgroundmusic');
    music.play('', 0, .25, false, true);
    jumpSound = game.add.audio('mariojump');
    
    /* TIMERS */
    timer = game.time.create(false);
    timer.add(100, jumpDelay, this, null);
    
    //  The score
    //scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#FFF' });
    
    //  Directional Controls
    cursors = game.input.keyboard.createCursorKeys();
    
    // Standard Controls
    upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    
    jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function update() {
    //game.debug.body(player);
    
    game.physics.arcade.collide(player, layer);
    game.physics.arcade.collide(player, goal);
    
    // Collide the player and the stars with the platforms
    //game.physics.arcade.collide(stars, platforms);
    
    //  Checks to see if the player overlaps with any of the stars, if it does call the collectstar function
    //game.physics.arcade.overlap(player, stars, collectstar, null, this);
    
    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;
    if (!win) {
    if (cursors.left.isDown || leftKey.isDown) {
        //  Move to the left
        if (walljump !== 'left') {
            setPlayerVelocity(-150, 0, true, false);
            lastKey = 'left';
        }
        else {
            setPlayerVelocity(150, 0, true, false);
            lastKey = 'right';
        }
        
        if (!player.body.blocked.down) {
            if (player.body.blocked.left) {
                //SLOW CHARACTER DOWN WHEN HUGGING WALL
                if (player.body.velocity.y < 0)
                    setPlayerVelocity(0, 0, false, true);
                else
                    player.body.gravity.y = pwg;
                player.frame = 21;
            }
            else {
                if (walljump !== 'left')
                    gravityFreezeFrame(pdg, 14);
                else
                    gravityFreezeFrame(pdg, 6);
            }
        }
        else {
            if (player.body.blocked.left)
                player.animations.play('l-push');
            else
                player.animations.play('l-run');
        }
    }
    else if (cursors.right.isDown || rightKey.isDown) {
        //  Move to the right
        if (walljump !== 'right') {
            setPlayerVelocity(150, 0, true, false);
            lastKey = 'right';
        }
        else {
            setPlayerVelocity(-150, 0, true, false);
            lastKey = 'left';
        }
        
        if (!player.body.blocked.down){
            if (player.body.blocked.right) {
                //SLOW CHARACTER DOWN WHEN HUGGING WALL
                if (player.body.velocity.y < 0 && !walljumpLock)
                    setPlayerVelocity(0, 0, false, true);
                else
                    player.body.gravity.y = pwg;
                player.frame = 20;
            }
            else {
                if (walljump !== 'right')
                    gravityFreezeFrame(pdg, 6);
                else
                    gravityFreezeFrame(pdg, 14)
            }
        }
        else {
            if (player.body.blocked.right)
                player.animations.play('r-push');
            else
                player.animations.play('r-run');
        }
    }
    /* STATIONARY */
    else {
        if (lastKey === 'left') {
            if (!player.body.blocked.down)      //PLAYER IS IN THE AIR AND HAS STOPPED INPUT KEYS 
                gravityFreezeFrame(pdg, 23);
            else {
                if (cursors.down.isDown || downKey.isDown)
                    player.frame = 37;
                else
                    player.animations.play('l-stand');
            }
        }
        else {
            if (!player.body.blocked.down)
                gravityFreezeFrame(pdg, 22);
            else {
                if (cursors.down.isDown || downKey.isDown)
                    player.frame = 36;
                else
                    player.animations.play('r-stand');
            }
        }
    }
    
    /* JUMP AND WALL REBOUND SECTION */
    
    //  Allow the player to jump if they are touching the ground.
    if (player.body.blocked.down) {
        if (cursors.up.isDown || jumpKey.isDown){
            setPlayerVelocity(0, -250, false, true);
            jumpToggle = true;
            jumpPlay();
        }
        walljump = '';
        walljumpLock = false;
    }
    else if ((cursors.up.isDown || jumpKey.isDown) && !player.body.blocked.down && !walljumpLock) {
        if (!jumpToggle) {
            if (player.body.blocked.left) {
                walljump = 'left';
                setPlayerVelocity(250, -200, false, false);
                jumpPlay();
            }
            else if (player.body.blocked.right) {
                walljump = 'right';
                setPlayerVelocity(-250, -200, false, false);
                jumpPlay();
            }
        }
        jumpToggle = true;
    }
    else if (cursors.up.onUp || jumpKey.onUp) {
        if (!player.body.blocked.down)
            jumpToggle = false;
    }
    
    if ((cursors.right.onUp || rightKey.onUp || cursors.left.onUp || leftKey.onUp) && !player.body.touching.down)
        timer.start();
}
    
}

function collectdiamond (player, diamond) {
    // Removes the star from the screen
    star.kill();

    //  Add and update the score
    score -= 1;
    scoreText.text = 'Diamonds Remaining: ' + score;
}

// function setPlayerVelocity (int, int, boolean, boolean)
function setPlayerVelocity(xspeed, yspeed, hMove, vMove) {
    if (hMove)
        player.body.velocity.x = xspeed;
    else if (vMove)
        player.body.velocity.y = yspeed;
    else {
        player.body.velocity.x = xspeed;
        player.body.velocity.y = yspeed;
    }
}

// function gravityFreezeFrame (changeGravity, freezeFrame)
function gravityFreezeFrame(newGravity, freezeFrame) {
    player.body.gravity.y = newGravity;
    player.animations.stop();
    player.frame = freezeFrame;
}

function jumpPlay(){
    jumpSound.play('', 0, 0.35, false, true);   
}
      
//Testing    
function victory(player, goal){
    win = true;
    player.animations.play('victory');
}
    
function jumpDelay(){
    walljump = '';
}
->