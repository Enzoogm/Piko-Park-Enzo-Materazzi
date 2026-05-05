// ========================================
// PICO PARK CLONE - ETEC
// ========================================

const CONFIG = {
  TAMANO_BLOQUE: 50,
  VELOCIDAD_JUGADOR: 220,
  SALTO_FUERZA: 480,
  GRAVEDAD: 950,
  COLORES_JUGADORES: [
    0xff4444, 0x44ff44, 0x4488ff, 0xffff44
  ],
  MAX_JUGADORES: 4, // <-- Limitado a 4 jugadores
  TIEMPO_VICTORIA: 2500, // Tiempo de "Clean Screen" antes del nivel 2
  TOTAL_NIVELES: 2,
};

let socket = io({ query: { tipo: "pantalla" } });
let contadorColores = 0;
let nivelActual = 1;

const mapaNivel1 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,4,0],
  [1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1,1,1,2,2,2,2,2,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

const mapaNivel2 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
  [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0],
  [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
  [1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,1,0,0,0,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

function obtenerMapaActual() {
  console.log(`🗺️ Cargando NIVEL ${nivelActual}`);
  if (nivelActual === 1) return mapaNivel1;
  if (nivelActual === 2) return mapaNivel2;
  nivelActual = 1;
  return mapaNivel1;
}

class SceneGame extends Phaser.Scene {
  constructor() {
    super({ key: "SceneGame" });
    this.resetEstado();
  }

  resetEstado() {
    this.jugadoresSprites = {};
    this.equipoTieneLlave = false;
    this.jugadorConLlaveId = null;
    this.nivelSuperado = false;
    this.llaveOriginalX = 0;
    this.llaveOriginalY = 0;
    this.llave = null;
    this.puerta = null;
    this.plataformas = null;
    this.agua = null;
    this.grupoJugadores = null;
    this.txtVictoria = null;
    this.puertaAbierta = false;
    this.jugadoresAdentro = new Set();
    contadorColores = 0;
  }

  // FIX CANDADO TEXTURAS: Evita el error "Texture key already in use"
  crearTextura(key, col1, col2, col3, w, h, esPiso) {
    if (this.textures.exists(key)) return; // Si ya existe, no la crees de nuevo

    const canvas = this.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.context;
    ctx.fillStyle = col1;
    ctx.fillRect(0, 0, w, h);
    if (col2) {
      ctx.fillStyle = col2;
      ctx.fillRect(0, 0, w / 2, h / 2);
      ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
    }
    if (esPiso && col3) {
      ctx.fillStyle = col3;
      ctx.fillRect(0, 0, w, 12);
    }
    canvas.refresh();
  }

  crearTexturaJugador() {
    if (this.textures.exists("player")) return;
    const canvas = this.textures.createCanvas("player", 40, 40);
    const ctx = canvas.context;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 40, 40);
    ctx.fillStyle = "#000000";
    ctx.fillRect(8, 10, 6, 8); ctx.fillRect(26, 10, 6, 8); ctx.fillRect(15, 25, 10, 4);
    canvas.refresh();
  }

  crearTexturaLlave() {
    if (this.textures.exists("key")) return;
    const canvas = this.textures.createCanvas("key", 30, 30);
    const ctx = canvas.context;
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(5, 10, 25, 8); ctx.fillRect(5, 5, 10, 18);
    ctx.fillStyle = "#87CEEB"; ctx.fillRect(7, 9, 6, 10);
    ctx.fillStyle = "#f1c40f"; ctx.fillRect(22, 18, 4, 6); ctx.fillRect(16, 18, 4, 6);
    canvas.refresh();
  }

  crearTexturaPuerta() {
    if (this.textures.exists("door")) return;
    const canvas = this.textures.createCanvas("door", 50, 80);
    const ctx = canvas.context;
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(0, 0, 50, 80);
    ctx.fillStyle = "#9b59b6";
    ctx.fillRect(5, 5, 40, 75);
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(35, 40, 6, 6); ctx.fillRect(22, 15, 6, 6);
    canvas.refresh();
  }

  crearTexturaPuertaAbierta() {
    if (this.textures.exists("doorOpen")) return;
    const canvas = this.textures.createCanvas("doorOpen", 50, 80);
    const ctx = canvas.context;
    ctx.fillStyle = "#8e44ad"; 
    ctx.fillRect(0, 0, 50, 80);
    ctx.fillStyle = "#111111"; 
    ctx.fillRect(5, 5, 40, 75);
    ctx.fillStyle = "#333333"; ctx.fillRect(5, 55, 40, 10);
    ctx.fillStyle = "#444444"; ctx.fillRect(5, 65, 40, 10);
    canvas.refresh();
  }

  create() {
    this.resetEstado();
    this.cameras.main.setBackgroundColor("#87CEEB");

    // Generar texturas solo si no existen
    this.crearTextura("ground", "#7f8c8d", "#95a5a6", "#2ecc71", 50, 50, true);
    this.crearTextura("water", "rgba(52, 152, 219, 0.7)", "rgba(255, 255, 255, 0.4)", null, 50, 50, false);
    this.crearTexturaJugador();
    this.crearTexturaLlave();
    this.crearTexturaPuerta();
    this.crearTexturaPuertaAbierta();

    this.plataformas = this.physics.add.staticGroup();
    this.agua = this.physics.add.staticGroup();
    this.grupoJugadores = this.physics.add.group();

    const mapaActual = obtenerMapaActual();
    const tamanoBloque = CONFIG.TAMANO_BLOQUE;
    const mapaAncho = mapaActual[0].length * tamanoBloque;
    const mapaAlto = mapaActual.length * tamanoBloque;

    this.physics.world.setBounds(0, 0, mapaAncho, mapaAlto);
    this.cameras.main.setBounds(0, 0, mapaAncho, mapaAlto);

    this.add.text(20, 20, `NIVEL ${nivelActual}`, { fontSize: "20px", fill: "#FFF" }).setScrollFactor(0).setStroke("#000", 4);

    this.txtVictoria = this.add
      .text(400, 300, "", { fontSize: "48px", fill: "#00ff88", fontStyle: "bold", align: "center", stroke: "#000", strokeThickness: 8 })
      .setOrigin(0.5).setVisible(false).setScrollFactor(0).setDepth(100); 

    for (let y = 0; y < mapaActual.length; y++) {
      for (let x = 0; x < mapaActual[y].length; x++) {
        const tipo = mapaActual[y][x];
        const posX = x * tamanoBloque + tamanoBloque / 2;
        const posY = y * tamanoBloque + tamanoBloque / 2;
        if (tipo === 1) this.plataformas.create(posX, posY, "ground");
        else if (tipo === 2) {
          const a = this.agua.create(posX, posY, "water");
          a.body.setSize(50, 12); a.body.setOffset(0, 38);
        } else if (tipo === 3) {
          this.llaveOriginalX = posX; this.llaveOriginalY = posY;
          this.llave = this.physics.add.sprite(posX, posY, "key").setScale(0.8);
          this.llave.body.allowGravity = false;
        } else if (tipo === 4) {
          this.puerta = this.physics.add.staticSprite(posX, posY - 15, "door").setScale(0.9);
          this.puerta.refreshBody();
        }
      }
    }

    this.physics.add.collider(this.grupoJugadores, this.plataformas);
    this.physics.add.collider(this.grupoJugadores, this.grupoJugadores);
    this.physics.add.overlap(this.grupoJugadores, this.agua, this.respawnEquipo, null, this);

    if (this.llave) {
      this.physics.add.overlap(this.grupoJugadores, this.llave, this.agarrarLlave, null, this);
    }

    socket.off("inputDeJugador").on("inputDeJugador", this.handleInputGame.bind(this));

    socket.off("jugadorDesconectado").on("jugadorDesconectado", (id) => {
      if (this.jugadoresSprites[id]) {
        this.jugadoresAdentro.delete(id);
        this.jugadoresSprites[id].sprite.destroy();
        delete this.jugadoresSprites[id];
        contadorColores--;
      }
    });

    socket.off("nuevoJugador").on("nuevoJugador", ({ idDelSocket, color }) => {
      if (this.jugadoresSprites[idDelSocket]) return;
      const cant = Object.keys(this.jugadoresSprites).length;
      const player = this.grupoJugadores.create(100 + cant * 60, 250, "player");
      player.setData("id", idDelSocket);
      player.setTint(color).setCollideWorldBounds(true).setScale(0.9);
      
      // Hitbox normal como pediste
      player.body.setSize(40, 40);
      player.body.setOffset(0, 0);

      this.jugadoresSprites[idDelSocket] = {
        sprite: player,
        controles: { left: false, right: false, jump: false, up: false, down: false },
        adentro: false,
        upPressedLastFrame: false,
      };
      contadorColores++;
    });

    socket.off("servidorReiniciado").on("servidorReiniciado", () => {
      nivelActual = 1; this.scene.restart();
    });

    socket.emit("pedirJugadoresConectados");
  }

  handleInputGame(input) {
    const id = input.idDelSocket;
    const j = this.jugadoresSprites[id];
    if (!j || this.nivelSuperado) return;
    const activo = input.tipoDeEvento === "keydown";
    if (input.teclaPresionada === "ArrowLeft")  j.controles.left  = activo;
    if (input.teclaPresionada === "ArrowRight") j.controles.right = activo;
    if (input.teclaPresionada === "Space")      j.controles.jump  = activo;
    if (input.teclaPresionada === "ArrowUp")    j.controles.up    = activo;
    if (input.teclaPresionada === "ArrowDown")  j.controles.down  = activo;
  }

  respawnEquipo() {
    if (this.nivelSuperado) return;
    let i = 0;
    Object.values(this.jugadoresSprites).forEach((j) => {
      j.sprite.setPosition(100 + i * 25, 300).setVelocity(0, 0).setVisible(true);
      j.adentro = false; j.upPressedLastFrame = false; j.sprite.body.allowGravity = true;
      i++;
    });
    this.jugadoresAdentro.clear();
    this.equipoTieneLlave = false; this.puertaAbierta = false; this.jugadorConLlaveId = null;
    if (this.llave) { this.llave.setVisible(true).setPosition(this.llaveOriginalX, this.llaveOriginalY).body.enable = true; }
    if (this.puerta) { this.puerta.setTexture("door").refreshBody(); }
  }

  agarrarLlave(a, b) {
    if (this.equipoTieneLlave) return;
    const jSprite = a.texture.key === "player" ? a : b;
    const lSprite = a.texture.key === "key" ? a : b;
    this.equipoTieneLlave = true;
    this.jugadorConLlaveId = jSprite.getData("id");
    lSprite.setVisible(false).body.enable = false;
  }

  // LOGICA "CLEAN SCREEN" ESTILO TIC-80
  victoria() {
    if (this.nivelSuperado) return;
    this.nivelSuperado = true;

    // 1. Limpiar pantalla (Borrar mapa visualmente)
    this.plataformas.clear(true, true);
    this.agua.clear(true, true);
    if (this.llave) this.llave.destroy();
    if (this.puerta) this.puerta.destroy();

    // 2. Mostrar mensaje de felicitaciones
    const msj = nivelActual < CONFIG.TOTAL_NIVELES ? `¡NIVEL ${nivelActual} COMPLETADO!\nSiguiente nivel...` : `¡JUEGO COMPLETADO! 🎉`;
    this.txtVictoria.setText(msj).setVisible(true);

    // 3. Esperar 2.5 segundos (TIC-80 style)
    this.time.delayedCall(CONFIG.TIEMPO_VICTORIA, () => {
      if (nivelActual < CONFIG.TOTAL_NIVELES) nivelActual++;
      else nivelActual = 1;
      
      this.scene.restart(); // 4. Renderizar mapa nuevo
    });
  }

  update() {
    if (!this.jugadoresSprites || this.nivelSuperado) return;
    const jugadores = Object.entries(this.jugadoresSprites);
    const totalJugadores = jugadores.length;
    if (totalJugadores === 0) return;

    // Cámara
    const afuera = jugadores.filter(([, j]) => !j.adentro);
    if (afuera.length > 0) {
      const sumaX = afuera.reduce((s, [, j]) => s + j.sprite.x, 0);
      const mapAncho = obtenerMapaActual()[0].length * CONFIG.TAMANO_BLOQUE;
      const targetX = Phaser.Math.Clamp(sumaX / afuera.length - 400, 0, mapAncho - 800);
      this.cameras.main.scrollX += (targetX - this.cameras.main.scrollX) * 0.12;
    }

    // Llave
    if (this.equipoTieneLlave && this.llave && this.llave.visible && !this.puertaAbierta) {
      const portador = this.jugadoresSprites[this.jugadorConLlaveId];
      if (portador && !portador.adentro) this.llave.setPosition(portador.sprite.x, portador.sprite.y - 35);
    }

    for (const [id, j] of jugadores) {
      const p = j.sprite;
      if (j.adentro) {
        p.setPosition(this.puerta.x, this.puerta.y).setVelocity(0, 0);
        p.body.allowGravity = false;
        if (j.controles.down) {
          j.adentro = false; p.setVisible(true); p.body.allowGravity = true;
          this.jugadoresAdentro.delete(id);
        }
        continue; 
      }

      if (j.controles.left) p.setVelocityX(-CONFIG.VELOCIDAD_JUGADOR);
      else if (j.controles.right) p.setVelocityX(CONFIG.VELOCIDAD_JUGADOR);
      else p.setVelocityX(0);

      if (j.controles.jump && p.body.blocked.down) { p.setVelocityY(-CONFIG.SALTO_FUERZA); j.controles.jump = false; }

      // Puerta Matematica
      if (this.puerta) {
        const dist = Math.abs(p.x - this.puerta.x) < 40 && Math.abs(p.y - this.puerta.y) < 60;
        if (dist) {
          if (!this.puertaAbierta && this.equipoTieneLlave) {
            this.puertaAbierta = true; this.puerta.setTexture("doorOpen").refreshBody();
          }
          if (this.puertaAbierta && !j.adentro) {
            if (j.controles.up && !j.upPressedLastFrame) {
              j.adentro = true; p.setVisible(false); p.body.allowGravity = false; p.setVelocity(0,0);
              this.jugadoresAdentro.add(id);
            }
            j.upPressedLastFrame = j.controles.up;
          }
        } else { j.upPressedLastFrame = false; }
      }
    }

    if (this.puertaAbierta && totalJugadores > 0 && this.jugadoresAdentro.size >= totalJugadores) {
      this.victoria();
    }
  }
}

const config = {
  type: Phaser.AUTO, width: 800, height: 600, parent: "juego",
  physics: { default: "arcade", arcade: { gravity: { y: CONFIG.GRAVEDAD }, debug: false, fps: 120, overlapBias: 16 } },
  scene: [SceneGame],
};
new Phaser.Game(config);