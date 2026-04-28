const socket = io({ query: { tipo: "pantalla" } });

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
      fps: 120,
      overlapBias: 16,
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
let grupoJugadores;
let plataformas;
let agua;
let llave;
let puerta;
let equipoTieneLlave = false;
let nivelSuperado = false;
let textoVictoria;
let llaveOriginalX = 0;
let llaveOriginalY = 0;

const mapaCooperativo = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0],
  [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];

function preload() {
  let cPiso = this.textures.createCanvas("ground", 50, 50).context;
  cPiso.fillStyle = "#7f8c8d";
  cPiso.fillRect(0, 0, 50, 50);
  cPiso.fillStyle = "#95a5a6";
  cPiso.fillRect(0, 0, 25, 25);
  cPiso.fillRect(25, 25, 25, 25);
  cPiso.fillStyle = "#2ecc71";
  cPiso.fillRect(0, 0, 50, 12);
  this.textures.get("ground").refresh();

  let cAgua = this.textures.createCanvas("water", 50, 50).context;
  cAgua.fillStyle = "rgba(52, 152, 219, 0.7)";
  cAgua.fillRect(0, 0, 50, 50);
  cAgua.fillStyle = "rgba(255, 255, 255, 0.4)";
  cAgua.fillRect(10, 10, 15, 3);
  cAgua.fillRect(30, 25, 10, 3);
  this.textures.get("water").refresh();

  let cJug = this.textures.createCanvas("player", 40, 40).context;
  cJug.fillStyle = "#FFFFFF";
  cJug.fillRect(0, 0, 40, 40);
  cJug.fillStyle = "#000000";
  cJug.fillRect(8, 10, 6, 8);
  cJug.fillRect(26, 10, 6, 8);
  cJug.fillRect(15, 25, 10, 4);
  this.textures.get("player").refresh();

  let cLlave = this.textures.createCanvas("key", 30, 30).context;
  cLlave.fillStyle = "#f1c40f";
  cLlave.fillRect(5, 10, 25, 8);
  cLlave.fillRect(5, 5, 10, 18);
  cLlave.fillStyle = "#87CEEB";
  cLlave.fillRect(7, 9, 6, 10);
  cLlave.fillStyle = "#f1c40f";
  cLlave.fillRect(22, 18, 4, 6);
  cLlave.fillRect(16, 18, 4, 6);
  this.textures.get("key").refresh();

  let cPuerta = this.textures.createCanvas("door", 50, 80).context;
  cPuerta.fillStyle = "#8e44ad";
  cPuerta.fillRect(0, 0, 50, 80);
  cPuerta.fillStyle = "#9b59b6";
  cPuerta.fillRect(5, 5, 40, 75);
  cPuerta.fillStyle = "#f1c40f";
  cPuerta.fillRect(35, 40, 6, 6);
  cPuerta.fillRect(22, 15, 6, 6);
  this.textures.get("door").refresh();
}

function create() {
  this.cameras.main.setBackgroundColor("#87CEEB");

  plataformas = this.physics.add.staticGroup();
  agua = this.physics.add.staticGroup();
  grupoJugadores = this.physics.add.group();

  const tamanoBloque = 50;

  for (let y = 0; y < mapaCooperativo.length; y++) {
    for (let x = 0; x < mapaCooperativo[y].length; x++) {
      let tipo = mapaCooperativo[y][x];
      let posX = x * tamanoBloque + tamanoBloque / 2;
      let posY = y * tamanoBloque + tamanoBloque / 2;

      if (tipo === 1) {
        plataformas.create(posX, posY, "ground");
      } else if (tipo === 2) {
        let bloqueAgua = agua.create(posX, posY, "water");
        bloqueAgua.body.setSize(50, 10);
        bloqueAgua.body.setOffset(0, 40);
      } else if (tipo === 3) {
        llaveOriginalX = posX;
        llaveOriginalY = posY;
        llave = this.physics.add.sprite(posX, posY, "key");
        llave.body.allowGravity = false;
      } else if (tipo === 4) {
        puerta = this.physics.add.staticSprite(posX, posY - 15, "door");
      }
    }
  }

  const plataformaMedio = plataformas
    .create(400, 425, "ground")
    .setScale(3.5, 0.5)
    .refreshBody();
  plataformaMedio.setTint(0x999999);

  textoVictoria = this.add
    .text(400, 200, "¡NIVEL SUPERADO!", {
      fontSize: "64px",
      fill: "#FFF",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setStroke("#000", 8)
    .setVisible(false);

  this.physics.add.collider(grupoJugadores, plataformas);
  this.physics.add.collider(grupoJugadores, grupoJugadores);

  this.physics.add.overlap(grupoJugadores, agua, () => {
    let index = 0;
    Object.values(jugadores).forEach((j) => {
      j.sprite.setPosition(100 + index * 20, 300);
      j.sprite.setVelocity(0, 0);
      index++;
    });

    equipoTieneLlave = false;
    llave.enableBody(true, llaveOriginalX, llaveOriginalY, true, true);
    puerta.clearTint();
  });

  this.physics.add.overlap(grupoJugadores, llave, (jugador, objLlave) => {
    if (!equipoTieneLlave) {
      objLlave.disableBody(true, true);
      equipoTieneLlave = true;
      puerta.setTint(0x00ff00);
    }
  });

  socket.on("nuevoJugador", (data) => {
    const player = grupoJugadores.create(
      100 + Object.keys(jugadores).length * 20,
      300,
      "player",
    );
    player.setTint(parseInt(data.color));
    player.setCollideWorldBounds(true);

    jugadores[data.idDelSocket] = {
      sprite: player,
      controles: { left: false, right: false, jump: false },
    };
  });

  socket.on("jugadorDesconectado", (id) => {
    if (jugadores[id]) {
      jugadores[id].sprite.destroy();
      delete jugadores[id];
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
  if (nivelSuperado) return;

  Object.values(jugadores).forEach((j) => {
    const p = j.sprite;

    if (j.controles.left) p.setVelocityX(-200);
    else if (j.controles.right) p.setVelocityX(200);
    else p.setVelocityX(0);

    if (j.controles.jump && p.body.touching.down) {
      p.setVelocityY(-475);
      j.controles.jump = false;
    }
  });

  logicaVictoria();
}

function logicaVictoria() {
  const lista = Object.values(jugadores);
  if (lista.length < 1) return;
  if (!equipoTieneLlave) return;

  const todosEnPuerta = lista.every((j) =>
    Phaser.Geom.Intersects.RectangleToRectangle(
      j.sprite.getBounds(),
      puerta.getBounds(),
    ),
  );

  if (todosEnPuerta) {
    nivelSuperado = true;
    textoVictoria.setVisible(true);
    lista.forEach((j) => j.sprite.setVelocity(0, 0));
  }
}
