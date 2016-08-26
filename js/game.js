/* Crea el objeto Phaser.Game:     
(1) Ancho 
(2) Alto
(3) Contexto de renderizado (recomendado AUTO, Phaser selecciona el adecuado)
(4) Identificador del elemento DOM en el que se insertará el juego (por defecto es el body)
(5) Objeto que contiene referencias a las funciones principales de Phaser */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

// Variables globales
var background;
var platforms;
var pacifiers;
var nappy;
var player; 
var cursors;
var score;
var scoreText;
var level;
var levelText;
var lives;
var livesText;
var pacifiersCounter;
var bombTimer;
var nappyInterval;

// Carga los recursos necesarios, de este modo se evitan comportamientos extraños durante la ejecución
function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('pacifier', 'assets/pacifier.png');
    game.load.image('nappy', 'assets/nappy.png', 28, 28);
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
}

// Crea los elementos del juego una vez finalizada la carga
function create() {      
    // Inicializa el sistema de física
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    // Fondo del juego
    background = game.add.sprite(0, 0, 'sky');
    
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
    pacifiers = game.add.group();
    pacifiers.enableBody = true;
    
    for (var i = 0; i < 12; i++)
    {
        // Crea una estrella dentro del grupo y establece sus propiedades
        var pacifier = pacifiers.create(i * 70, 0, 'pacifier');
        pacifier.body.gravity.y = 6;
        pacifier.body.bounce.y = 0.7 + Math.random() * 0.2;
        
        // Incrementa el contador de estrellas
        pacifiersCounter = i + 1;
    }
    
    // Crea e inicializa el marcador, el nivel y las vidas
    score = 0;
    level = 1;
    lives = 3;
    levelText = game.add.text(16, 16, 'Nivel: ' + level, { fontSize: '32px', fill: '#fff' });
    scoreText = game.add.text(game.world.centerX, 16, 'Chupetes: ' + score, { fontSize: '32px', fill: '#fff' });
    livesText = game.add.text(game.world.width - 15, 16, 'Vidas: ' + lives, { fontSize: '32px', fill: '#fff' });
    scoreText.anchor.set(0.5, 0);
    livesText.anchor.set(1, 0);
    
    // Ajusta el juego a la pantalla del dispositivo
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // EXACT_FIT; SHOW_ALL
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
        
    // Crea el timer que controla las bombas y le asigna un intervalo inicial de 10 segundos
    nappyInterval = 10000;
    bombTimer = game.time.create(false);  
    bombTimer.loop(nappyInterval, dropBomb, game); 
}

// Actualiza el estado del juego  
function update() {
    // Comprueba si hay colisión y evita que el jugador, las estrellas y los enemigos atraviesen las plataformas
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(pacifiers, platforms);
    game.physics.arcade.collide(nappy, platforms);
    
    // Comprueba si el jugador y una estrella se solapan, si es así llama a collectPacifier
    game.physics.arcade.overlap(player, pacifiers, collectPacifier, null, this);
    
    // Comprueba si el jugador y una bomba se solapan
    game.physics.arcade.overlap(player, nappy, touchBomb, null, this);
    
    // Resetea la velocidad del jugador
    player.body.velocity.x = 0;

    if (cursors.left.isDown) // Izquierda    
    {
        player.body.velocity.x = -150;
        player.animations.play('left');
    }
    else if (cursors.right.isDown) //  Derecha
    {
        player.body.velocity.x = 150;
        player.animations.play('right');
    }
    else //  Permanece inmóvil
    {
        player.animations.stop();
        player.frame = 4;
    }
    
    //  Salta si está sobre una superficie que lo permite
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }   
    
    // A partir del tercer nivel deja caer bombas desde la parte superior
    if (level >= 3) {
        // bombTimer.start();  
    }
}
   
// Elimina la estrella tras la colisión y actualiza la información  
function collectPacifier(player, pacifier) {
    // Elimina la estrella del juego y decrementa el contador
    pacifier.kill();
    pacifiersCounter--;
    
    // Actualiza el marcador
    score++;
    scoreText.text = 'Chupetes: ' + score;
    
    // Si no queda ninguna estrella se genera un nuevo nivel
    if(pacifiersCounter == 0) {
        createNewLevel();  
    }
}

// Genera nuevas estrellas y actualiza la información
function createNewLevel() {
    level++;
    levelText.text = 'Nivel: ' + level;
    
    // Crea más estrellas
    for (var i = 0; i < 12; i++)
    {
        var pacifier = pacifiers.create(Math.round(Math.random() * ((game.world.width - 20) - 0.5) + parseInt(0.5)), 0, 'pacifier');
        pacifier.body.gravity.y = Math.round(Math.random() * (100 - 10) + parseInt(10));
        pacifier.body.bounce.y = 0.7 + Math.random() * 0.2;
        
        // Incrementa el contador de estrellas
        pacifiersCounter = i + 1;
    }
}

// Genera nuevas estrellas y actualiza la información
function dropBomb() {
    nappy = game.add.sprite(Math.round(Math.random() * ((game.world.width - 20) - 0.5) + parseInt(0.5)), 0, 'nappy');
    game.physics.arcade.enable(nappy);
    nappy.enableBody = true;
    nappy.body.gravity.y = Math.round(Math.random() * (500 - 100) + parseInt(100));
}

// El jugador ha tocado una bomba 
function touchBomb() {
    
    
    // player.destroy();
    
    
    // Elimina la bomba
    nappy.kill();
    
    // Resta una vida y comprueba si el juego puede continuar
    lives--;
    
    if (lives > 0) {
        livesText.text = 'Vidas: ' + lives;
    }
    else {
        gameOver();
    }
}

// Fin del juego
function gameOver() {
    alert("Game Over");
}