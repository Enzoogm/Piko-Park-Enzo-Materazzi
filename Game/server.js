const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const os = require("os");

app.use(express.static("public"));

const PUERTO = 3000;
let cantidadJugadores = 0;
const coloresParaJugadores = ["0xff0000", "0x00ff00", "0x0000ff", "0xffff00"];

// 🔥 DETECTOR ROBUSTO DE IP LOCAL (SIN HARDCODE)
function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();

  let mejorIP = null;

  for (let nombre in interfaces) {
    for (let net of interfaces[nombre]) {
      if (net.family !== "IPv4" || net.internal) continue;

      const ip = net.address;

      // ❌ ignorar redes virtuales comunes
      if (
        nombre.toLowerCase().includes("virtual") ||
        nombre.toLowerCase().includes("vmware") ||
        nombre.toLowerCase().includes("hyper-v") ||
        nombre.toLowerCase().includes("wsl")
      ) {
        continue;
      }

      // ✅ prioridad alta: redes privadas reales
      if (
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        (ip.startsWith("172.") &&
          parseInt(ip.split(".")[1]) >= 16 &&
          parseInt(ip.split(".")[1]) <= 31)
      ) {
        return ip;
      }

      // fallback
      if (!mejorIP) mejorIP = ip;
    }
  }

  return mejorIP || "localhost";
}

const ip = obtenerIPLocal();

// endpoint para frontend
app.get("/ip", (req, res) => {
  res.json({ ip });
});

io.on("connection", (socket) => {
  if (cantidadJugadores >= 4) {
    socket.disconnect(true);
    return;
  }

  const colorAsignado = coloresParaJugadores[cantidadJugadores];
  cantidadJugadores++;

  console.log(`Jugador conectado. Total: ${cantidadJugadores}`);

  io.emit("nuevoJugador", {
    idDelSocket: socket.id,
    color: colorAsignado,
  });

  socket.on("message", (msg) => {
    io.emit("inputDeJugador", {
      idDelSocket: socket.id,
      tipoDeEvento: msg.tipo,
      teclaPresionada: msg.tecla,
    });
  });

  socket.on("disconnect", () => {
    cantidadJugadores--;
    console.log(`Jugador desconectado. Total: ${cantidadJugadores}`);
    io.emit("jugadorDesconectado", socket.id);
  });
});

http.listen(PUERTO, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://${ip}:${PUERTO}`);
});
