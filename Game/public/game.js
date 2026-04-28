const socket = io();

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "juego",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

new Phaser.Game(config);

let jugadores = {};
let plataformas;
let llave;
let puerta;
let jugadorConLlave = null;

function preload() {
  this.add
    .graphics()
    .fillStyle(0xffffff)
    .fillRect(0, 0, 40, 40)
    .generateTexture("player", 40, 40);
  this.add
    .graphics()
    .fillStyle(0x666666)
    .fillRect(0, 0, 800, 40)
    .generateTexture("ground", 800, 40);
  this.add
    .graphics()
    .fillStyle(0xffd700)
    .fillRect(0, 0, 20, 20)
    .generateTexture("key", 20, 20);
  this.add
    .graphics()
    .fillStyle(0x8b4513)
    .fillRect(0, 0, 60, 80)
    .generateTexture("door", 60, 80);
}

function create() {
  plataformas = this.physics.add.staticGroup();
  plataformas.create(400, 580, "ground");

  plataformas.create(200, 420, "ground").setScale(0.3, 1).refreshBody();

  llave = this.physics.add.sprite(200, 350, "key");
  llave.body.allowGravity = false;

  puerta = this.physics.add.staticSprite(750, 500, "door");

  socket.on("nuevoJugador", (data) => {
    const player = this.physics.add.sprite(50, 500, "player");
    player.setTint(data.color);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, plataformas);

    Object.values(jugadores).forEach((j) => {
      this.physics.add.collider(player, j.sprite);
    });

    this.physics.add.overlap(player, llave, () => {
      if (!jugadorConLlave) {
        jugadorConLlave = player;
      }
    });

    jugadores[data.idDelSocket] = {
      sprite: player,
      controles: { left: false, right: false, jump: false },
    };
  });

  socket.on("jugadorDesconectado", (id) => {
    if (jugadores[id]) {
      jugadores[id].sprite.destroy();
      delete jugadores[id];

      if (jugadorConLlave === jugadores[id]?.sprite) {
        jugadorConLlave = null;
        llave.setPosition(200, 350);
      }
    }
  });

  socket.on("inputDeJugador", (input) => {
    const j = jugadores[input.idDelSocket];
    if (!j) return;

    const activo = input.tipoDeEvento === "keydown";

    if (input.teclaPresionada === "ArrowLeft") j.controles.left = activo;
    if (input.teclaPresionada === "ArrowRight") j.controles.right = activo;
    if (input.teclaPresionada === "Space") j.controles.jump = activo;
  });
}

function update() {
  Object.values(jugadores).forEach((j) => {
    const p = j.sprite;

    if (j.controles.left) p.setVelocityX(-200);
    else if (j.controles.right) p.setVelocityX(200);
    else p.setVelocityX(0);

    if (j.controles.jump && p.body.touching.down) {
      p.setVelocityY(-450);
    }
  });
  if (jugadorConLlave) {
    llave.setPosition(jugadorConLlave.x, jugadorConLlave.y - 30);
  }

  logica();
}

function logica() {
  const lista = Object.values(jugadores);
  if (lista.length < 3) return;

  let puertaAbierta = false;

  if (
    jugadorConLlave &&
    Phaser.Geom.Intersects.RectangleToRectangle(
      jugadorConLlave.getBounds(),
      puerta.getBounds(),
    )
  ) {
    puertaAbierta = true;
  }

  if (puertaAbierta) {
    const todos = lista.every((j) =>
      Phaser.Geom.Intersects.RectangleToRectangle(
        j.sprite.getBounds(),
        puerta.getBounds(),
      ),
    );

    if (todos) {
      console.log("GANARON");
    }
  }
}
