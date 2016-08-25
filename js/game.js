/* Crea el objeto Phaser.Game:     
(1) Ancho 
(2) Alto
(3) Contexto de renderizado (recomendado AUTO, Phaser selecciona el adecuado)
(4) Identificador del elemento DOM en el que se insertará el juego (por defecto es el body)
(5) Objeto que contiene referencias a las funciones principales de Phaser */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

// Variables globales
var platforms;
var stars;
var player; 
var enemies;    
var cursors;
var score;
var scoreText;
var level;
var levelText;
var lives;
var livesText;
var starsCounter;

// Carga los recursos necesarios, de este modo se evitan comportamientos extraños durante la ejecución
function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
}

// Crea los elementos del juego una vez finalizada la carga
function create() {    
    // Inicializa el sistema de física
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    // Fondo del juego
    game.add.sprite(0, 0, 'sky');
    
    // Crea un grupo para el suelo y las dos plataformas, ya que su comportamiento es el mismo
    platforms = game.add.group();
    
    // Activa la física del grupo
    platforms.enableBody = true;
    
    // Crea el suelo y lo reescala para cubrir el ancho del juego
    var ground = platforms.create(0, game.world.height - 64, 'ground');
    ground.scale.setTo(2, 2);
    
    // Evita que pueda ser traspasado
    ground.body.immovable = true;
    
    // Crea las dos plataformas y evita que pueda caerse a través de ellas
    var ledge = platforms.create(400, 400, 'ground');
    ledge.body.immovable = true;
    ledge = platforms.create(-150, 250, 'ground');
    ledge.body.immovable = true;    
    
    // Crea al jugardor
    player = game.add.sprite(32, game.world.height - 150, 'dude');
    
    // Activa la física del jugador y establece algunas de sus propiedades
    game.physics.arcade.enable(player);
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;
    
    // Establece las animaciones del jugador
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    
    // Controles
    cursors = game.input.keyboard.createCursorKeys();
    
    // Crea las estrellas
    stars = game.add.group();
    stars.enableBody = true;
    
    for (var i = 0; i < 12; i++)
    {
        // Crea una estrella dentro del grupo y establece sus propiedades
        var star = stars.create(i * 70, 0, 'star');
        star.body.gravity.y = 6;
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
        
        // Incrementa el contador de estrellas
        starsCounter = i + 1;
    }
    
    // Crea e inicializa el marcador, el nivel y las vidas
    score = 0;
    level = 1;
    lives = 3;
    levelText = game.add.text(16, 16, 'Nivel:  ' + level, { fontSize: '32px', fill: '#fff' });
    scoreText = game.add.text(16, 40, 'Bibes: ' + score, { fontSize: '32px', fill: '#fff' });
    livesText = game.add.text(16, 64, 'Vidas: ' + lives, { fontSize: '32px', fill: '#fff' });

    // Ajusta el juego a la pantalla del dispositivo
    game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT; // EXACT_FIT; SHOW_ALL
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    
    /*
    // Crea el primer enemigo y lo asigna al grupo
    enemies = game.add.group();
    enemies.enableBody = true;
    
    var enemy = enemies.create(0, game.world.height - 100, 'baddie');  
    
    // Aplica gravedad
    enemy.body.gravity.y = 100;
    enemy.body.collideWorldBounds = true;
    
    // Animaciones: caminar a izquierda y derecha
    enemy.animations.add('left', [0, 1], 10, true);
    enemy.animations.add('right', [3, 4], 10, true);
    
    //game.physics.arcade.enable(enemy);
    */
}

    
function update() {
    // Comprueba si hay colisión y evita que el jugador, las estrellas y los enemigos atraviese las plataformas
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);
    game.physics.arcade.collide(enemies, platforms);
    
    // Comprueba si el jugador y la estrella se solapan, si es así llama a collectStar
    game.physics.arcade.overlap(player, stars, collectStar, null, this);
    
    // Resetea la velocidad del jugador
    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        // Izquierda
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Derecha
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else
    {
        //  Permanece inmóvil
        player.animations.stop();

        player.frame = 4;
    }
    
    //  Salta si está sobre una superficie que lo permite
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }
    
    /*// Movimiento de los enemigos

        enemies.body.velocity.x = 150;

        enemies.animations.play('right');
    */
}
   
    
function collectStar (player, star) {
    // Elimina la estrella del juego y decrementa el contador
    star.kill();
    starsCounter--;
    
    // Actualiza el marcador
    score++;
    scoreText.text = 'Bibes: ' + score;
    
    if(starsCounter == 0) {
        createNewLevel();  
    }
}

function createNewLevel() {
    level++;
    levelText.text = 'Nivel:  ' + level;
    
    // Crea más estrellas
    for (var i = 0; i < 12; i++)
    {
        // Crea una estrella dentro del grupo
        var star = stars.create(Math.round(Math.random() * ((game.world.width - 20) - 0.5) + parseInt(0.5)), 0, 'star');

        // Aplica gravedad
        star.body.gravity.y = Math.round(Math.random() * (100 - 10) + parseInt(10));

        //  Aplica un valor de rebote
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
        
        // Incrementa el contador de estrellas
        starsCounter = i + 1;
    }
    
    if (level == 3) {
       
    }        
}
