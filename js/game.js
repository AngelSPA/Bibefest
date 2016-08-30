/* Crea el objeto Phaser.Game:
(1) Ancho 
(2) Alto
(3) Contexto de renderizado (recomendado AUTO, Phaser selecciona el adecuado)
(4) Identificador del elemento DOM en el que se insertará el juego (por defecto es el body)
(5) Objeto que contiene referencias a las funciones principales de Phaser */

/*// Obtiene la proporción de la pantalla 
var gameRatio = window.innerWidth / window.innerHeight;
var worldWidth = Math.ceil(640 * gameRatio);*/

var worldWidth = 800;
var worldHeight = 600;

// Crea el objeto teniendo en cuenta la proporción
var game = new Phaser.Game(worldWidth, worldHeight, Phaser.AUTO, '', {preload: preload, create: create, update: update});

// Constantes
const maxLives = 3;
const tenSeconds = 10000;
const oneMinute = 60000;

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
var nappyTimer;
var feedingBottleTimer;
var nappyInterval;
var feedingBottleInterval;
var messageText;
var emitter;
var textAttributes;
var usedMessage;
var feedingBottle;

// Carga los recursos necesarios, de este modo se evitan comportamientos extraños durante la ejecución
function preload() {
    game.load.image('sky', 'assets/images/sky.png');
    game.load.image('ground', 'assets/images/platform.png');
    game.load.image('pacifier', 'assets/images/pacifier.png');
    game.load.image('nappy', 'assets/images/nappy.png', 28, 28);
    game.load.image('feedingBottle', 'assets/images/feedingBottle.png');
    game.load.spritesheet('dude', 'assets/images/dude.png', 32, 48);
    game.load.spritesheet('baddie', 'assets/images/baddie.png', 32, 32);
    game.load.spritesheet('explosion', 'assets/images/explosion.png', 24, 24);
}

// Crea los elementos del juego una vez finalizada la carga
function create() {     
    // Inicializa el sistema de física
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    // Fondo del juego
    background = game.add.sprite(0, 0, 'sky');
    background.width = worldWidth;
    
    // Crea un grupo para el suelo y las dos plataformas, ya que su comportamiento es el mismo
    platforms = game.add.group();
    
    // Activa la física del grupo
    platforms.enableBody = true;
        
    // Crea el suelo y lo reescala para cubrir el ancho del juego
    var ground = platforms.create(0, game.world.height - 64, 'ground');
    ground.width = worldWidth;
    ground.height *= 2; 
    
    // Evita que pueda ser traspasado
    ground.body.immovable = true;
    
    // Crea las dos plataformas y evita que pueda caerse a través de ellas
    var ledge = platforms.create(400, 400, 'ground');
    
    /*
    // Redimensiona la plataforma inferior para que llegue hasta el extremo derecho
    // ledge.width += worldWidth - 400;
    */
    
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
    
    // Establece los atributos del texto
    textAttributes = {font: '32px Marker Felt', fill: '#fff', align: 'center'};
    
    // Crea e inicializa el marcador, el nivel y las vidas
    score = 0;
    level = 0;
    lives = 3;
    levelText = game.add.text(16, 16, 'Nivel: ' + level, textAttributes);
    levelText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 0);
    scoreText = game.add.text(game.world.centerX, 16, 'Chupetes: ' + score, textAttributes);
    scoreText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 0);
    livesText = game.add.text(game.world.width - 15, 16, 'Vidas: ' + lives, textAttributes);
    livesText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 0);
    scoreText.anchor.set(0.5, 0);
    livesText.anchor.set(1, 0);
    
    // Ajusta el juego a la pantalla del dispositivo
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // EXACT_FIT; SHOW_ALL
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    
    // Crea el timer que genera los pañales y le asigna un intervalo inicial de 10 segundos
    nappyInterval = tenSeconds;
    nappyTimer = game.time.create(false);  
    nappyTimer.loop(nappyInterval, dropNappy, this); 
    
    // Crea el timer que genera los biberones y le asigna un intervalo inicial de 1 minuto
    feedingBottleInterval = oneMinute;
    feedingBottleTimer = game.time.create(false);  
    feedingBottleTimer.loop(feedingBottleInterval, dropFeedingBottle, this); 
    feedingBottleTimer.start();
        
     // Muestra el texto introductorio
    usedMessage = false;
    showMessage('Ayuda a Pokitrón a conseguir chupetes.\n\nControles:  ←  ↑  → \n\nToca para cerrar.');   
            
    // Crea el primer nivel
    pacifiers = game.add.group();
    pacifiers.enableBody = true;
    
    createNewLevel();
}

// Actualiza el estado del juego  
function update() {
    // Comprueba si hay colisiones
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(pacifiers, platforms);
    game.physics.arcade.collide(nappy, platforms);
    game.physics.arcade.collide(feedingBottle, platforms);    
    
    // Comprueba si hay colisión entre el jugador y un chupete
    game.physics.arcade.overlap(player, pacifiers, collectPacifier, null, this);
    
    // Comprueba si hay colisión entre el jugador y un pañal
    game.physics.arcade.overlap(player, nappy, touchNappy, null, this);
    
    // Comprueba si hay colisión entre el jugador y un biberón
    game.physics.arcade.overlap(player, feedingBottle, touchFeedingBottle, null, this);
    
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
        
    // A partir del segundo nivel deja caer pañales desde la parte superior
    if (level == 2) {
        nappyTimer.start(); 
        
        // Evita que el mensaje se muestre indefinidamente
        if(!usedMessage) {
            showMessage('¡Evita los peligrosos pañales\ny recoge biberones para recuperar vidas!\n\nToca para cerrar.');
        }
        
        usedMessage = true;
    }
}
   
// Elimina el chupete tras la colisión y actualiza la información  
function collectPacifier(player, pacifier) {
    // Elimina el chupete del juego y decrementa el contador
    pacifier.kill();
    pacifiersCounter--;
    
    // Actualiza el marcador
    score++;
    scoreText.text = 'Chupetes: ' + score;
    
    // Si no queda ningún chupete se genera un nuevo nivel
    if(pacifiersCounter == 0) {
        createNewLevel();  
    }
}

// Genera nuevos chupetes y actualiza la información
function createNewLevel() {
    level++;
    levelText.text = 'Nivel: ' + level;
    
    // Crea más chupetes
    for (var i = 0; i < 12; i++)
    {
        var pacifier = pacifiers.create(Math.round(Math.random() * ((game.world.width - 30) - 0.5) + parseInt(0.5)), 0, 'pacifier');
        pacifier.body.gravity.y = Math.round(Math.random() * (100 - 10) + parseInt(10));
        pacifier.body.bounce.y = 0.7 + Math.random() * 0.2;
        
        // Incrementa el contador de chupetes
        pacifiersCounter = i + 1;
    }
}

// Deja caer un biberón
function dropFeedingBottle() {
    if(lives < maxLives) {
        // Genera un nuevo biberón
        feedingBottle = game.add.sprite(Math.round(Math.random() * ((game.world.width - 20) - 0.5) + parseInt(0.5)), 0, 'feedingBottle');
        game.physics.arcade.enable(feedingBottle);
        feedingBottle.enableBody = true;
        feedingBottle.body.gravity.y = 300;
    }
}

// El jugador ha colisionado con un biberón 
function touchFeedingBottle() {
    // Elimina el biberon
    feedingBottle.kill();
    
    // Incrementa una vida
    lives++;
    livesText.text = 'Vidas: ' + lives;
}

// Deja caer un pañal
function dropNappy() {
    // Si existe un pañal previo lo elimina
    if(nappy) {
        nappy.kill();
    }
     
    // Genera un nuevo pañal
    nappy = game.add.sprite(Math.round(Math.random() * ((game.world.width - 20) - 0.5) + parseInt(0.5)), 0, 'nappy');
    game.physics.arcade.enable(nappy);
    nappy.enableBody = true;
    nappy.body.gravity.y = Math.round(Math.random() * (500 - 100) + parseInt(100));
}

// El jugador ha colisionado con un pañal 
function touchNappy() {
    // Elimina el pañal
    nappy.kill();
    
    // Explosión del jugador
    emitter = game.add.emitter(0, 0, 100);
    emitter.makeParticles('explosion');
    emitter.gravity = 200;  
    emitter.x = player.x;
    emitter.y = player.y;
    emitter.start(true, 4000, null, 10);
    game.time.events.add(2000, destroyEmitter, this);
    
    // Inicializa la posición del jugador
    player.reset(32, game.world.height - 150);
    
    // Resta una vida y comprueba si el juego puede continuar
    lives--;
    livesText.text = 'Vidas: ' + lives;
    
    if (lives <= 0) {
        gameOver();
    }
}

// Destruye el emisor de partículas durante la explosión
function destroyEmitter() {
    emitter.destroy();
}

// Pausa el juego y muestra el mensaje en pantalla
function showMessage(message) {
    // Detiene el juego
    game.paused = true;
    
    // Oculta el jugador
    player.visible = false;
       
    // Muestra el mensaje en pantalla
    messageText = game.add.text(game.world.centerX, game.world.centerY, message, textAttributes);
    messageText.anchor.setTo(0.5, 0.5);
    messageText.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 0);
 
    // Espera a que se haga clic sobre el mensaje para cerrarlo
    game.input.onDown.addOnce(removeText, this);
}

// Elimina el mensaje y activa el juego
function removeText() {
    // Elimina el mensaje
    messageText.destroy();
   
    // Vuelve a mostrar el jugador
    player.visible = true;
    
    // Activa el juego
    game.paused = false;
}

// Fin del juego
function gameOver() {
    nappyTimer.stop();
    feedingBottleTimer.stop();
    player.destroy();
    showMessage('Fin del juego.\n\nToca para volver a jugar.');
    
    // Espera a que se haga clic sobre el mensaje para cerrarlo
    game.input.onDown.addOnce(restartGame, this);
}

// Reinicia el juego
function restartGame() {
    create();
}