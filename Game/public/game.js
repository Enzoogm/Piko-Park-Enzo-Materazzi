const socketConexion = io();

const configuracionDelJuego = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 }, // Gravedad fuerte para que caigan rápido
            debug: false // Ponelo en true si querés ver las cajas verdes de colisión
        }
    },
    scene: { 
        preload: cargarGraficos, 
        create: crearEscenario, 
        update: actualizarFisicas 
    }
};

const juego = new Phaser.Game(configuracionDelJuego);

// Variables globales del nivel
let diccionarioDeJugadores = {}; // Guarda a todos los que entran
let grupoDeParedes;
let objetoPuerta;
let objetoLlave;
let jugadorQueTieneLaLlave = null;
let zonaDeVictoria;

// 1. Dibujamos los gráficos básicos (para no usar imágenes externas)
function cargarGraficos() {
    this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 40, 40).generateTexture('texturaCubo', 40, 40);
    this.add.graphics().fillStyle(0x666666).fillRect(0, 0, 800, 40).generateTexture('texturaPiso', 800, 40);
    this.add.graphics().fillStyle(0xffd700).fillRect(0, 0, 20, 20).generateTexture('texturaLlave', 20, 20);
    this.add.graphics().fillStyle(0x8B4513).fillRect(0, 0, 60, 80).generateTexture('texturaPuerta', 60, 80);
}

// 2. Armamos el nivel
function crearEscenario() {
    grupoDeParedes = this.physics.add.staticGroup();
    
    // El piso principal
    grupoDeParedes.create(400, 580, 'texturaPiso');
    
    // Plataformas (Nivel 2 - Apilarse)
    grupoDeParedes.create(200, 420, 'texturaPiso').setScale(0.3, 1).refreshBody();
    grupoDeParedes.create(650, 250, 'texturaPiso').setScale(0.4, 1).refreshBody();

    // La Puerta de salida
    objetoPuerta = this.physics.add.staticSprite(720, 190, 'texturaPuerta');
    zonaDeVictoria = this.add.zone(720, 190, 80, 100);
    this.physics.add.existing(zonaDeVictoria, true);

    // La Llave (arriba a la izquierda, obliga a apilarse)
    objetoLlave = this.physics.add.sprite(200, 350, 'texturaLlave');
    this.physics.add.collider(objetoLlave, grupoDeParedes);

    // --- MANEJO DE RED ---

    // Entra un nuevo jugador
    socketConexion.on('nuevoJugador', (datos) => {
        // Creamos el cuadradito
        const nuevoSprite = this.physics.add.sprite(50, 500, 'texturaCubo');
        nuevoSprite.setTint(datos.color);
        nuevoSprite.setCollideWorldBounds(true); // No pueden salir de la pantalla (Wall Hug Test)
        
        // Choca contra el piso
        this.physics.add.collider(nuevoSprite, grupoDeParedes);
        
        // Magia para Apilarse: hacemos que choque contra los demás jugadores
        const listaDeSpritesDeJugadores = Object.values(diccionarioDeJugadores).map(j => j.personaje);
        this.physics.add.collider(nuevoSprite, listaDeSpritesDeJugadores); 

        // Si toca la llave, se la apropia
        this.physics.add.overlap(nuevoSprite, objetoLlave, () => {
            if (!jugadorQueTieneLaLlave) {
                jugadorQueTieneLaLlave = nuevoSprite;
            }
        });

        // Guardamos su estado
        diccionarioDeJugadores[datos.idDelSocket] = {
            personaje: nuevoSprite,
            botones: { izquierda: false, derecha: false, saltar: false }
        };
    });

    // Se va un jugador
    socketConexion.on('jugadorDesconectado', (idDelSocket) => {
        if (diccionarioDeJugadores[idDelSocket]) {
            // Si el que se fue tenía la llave, la soltamos donde estaba originalmente
            if (jugadorQueTieneLaLlave === diccionarioDeJugadores[idDelSocket].personaje) {
                jugadorQueTieneLaLlave = null;
                objetoLlave.setPosition(200, 350);
            }
            // Borramos el muñeco de la pantalla
            diccionarioDeJugadores[idDelSocket].personaje.destroy();
            delete diccionarioDeJugadores[idDelSocket];
        }
    });

    // El celular mandó un comando
    socketConexion.on('inputDeJugador', (datosDelBoton) => {
        const jugador = diccionarioDeJugadores[datosDelBoton.idDelSocket];
        if (!jugador) return;

        const estaApretando = datosDelBoton.tipoDeEvento === 'keydown';

        if (datosDelBoton.teclaPresionada === 'ArrowLeft') jugador.botones.izquierda = estaApretando;
        if (datosDelBoton.teclaPresionada === 'ArrowRight') jugador.botones.derecha = estaApretando;
        if (datosDelBoton.teclaPresionada === 'Space' || datosDelBoton.teclaPresionada === 'ArrowUp') jugador.botones.saltar = estaApretando;
    });
}

// 3. Calculamos la física 60 veces por segundo
function actualizarFisicas() {
    // Movemos a cada jugador según lo que aprieta en su celular
    Object.values(diccionarioDeJugadores).forEach(jugador => {
        const sprite = jugador.personaje;
        const botones = jugador.botones;
        const velocidadMovimiento = 250;

        // Izquierda / Derecha
        if (botones.izquierda) {
            sprite.setVelocityX(-velocidadMovimiento);
        } else if (botones.derecha) {
            sprite.setVelocityX(velocidadMovimiento);
        } else {
            sprite.setVelocityX(0); // Frena al instante
        }

        // Salto (Solo si está pisando algo sólido abajo)
        if (botones.saltar && sprite.body.touching.down) {
            sprite.setVelocityY(-480);
        }
    });

    // Si alguien tiene la llave, la hacemos flotar arriba de su cabeza
    if (jugadorQueTieneLaLlave) {
        objetoLlave.setPosition(jugadorQueTieneLaLlave.x, jugadorQueTieneLaLlave.y - 30);
        objetoLlave.setVelocity(0, 0);
        objetoLlave.body.allowGravity = false;
    }

    // Vemos si ganaron
    comprobarSiGanaronElNivel(this);
}

// 4. Lógica para ganar el nivel
function comprobarSiGanaronElNivel(escena) {
    const cantidadTotal = Object.keys(diccionarioDeJugadores).length;
    if (cantidadTotal === 0) return; // Si no hay nadie, no hacemos nada

    // PASO A: La puerta solo se abre si el que tiene la llave se acerca
    let laPuertaEstaAbierta = false;
    if (jugadorQueTieneLaLlave && escena.physics.overlap(jugadorQueTieneLaLlave, zonaDeVictoria)) {
        laPuertaEstaAbierta = true;
        objetoPuerta.setTint(0x00FF00); // Se pone verde
    } else {
        objetoPuerta.clearTint(); // Vuelve a ser marrón
    }

    // PASO B: Si la puerta está verde, exigimos que TODOS estén ahí
    if (laPuertaEstaAbierta) {
        let estanTodosAdentro = true;
        Object.values(diccionarioDeJugadores).forEach(jugador => {
            if (!escena.physics.overlap(jugador.personaje, zonaDeVictoria)) {
                estanTodosAdentro = false;
            }
        });

        // Si están todos y la puerta está abierta... ¡Ganaron!
        if (estanTodosAdentro) {
            console.log("¡GANARON EL NIVEL!");
            // Se le podría poner un texto gigante en la pantalla acá
        }
    }
}