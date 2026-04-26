const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Le decimos al servidor que muestre los archivos de la carpeta "public"
app.use(express.static('public'));

const PUERTO = 3000;
let cantidadJugadores = 0;
const coloresParaJugadores = ['0xff0000', '0x00ff00', '0x0000ff', '0xffff00']; // Rojo, Verde, Azul, Amarillo

io.on('connection', (socket) => {
    // 1. REGLA DEL JUEGO: Máximo 4 jugadores (Hot-Join test)
    if (cantidadJugadores >= 4) {
        console.log('Alguien intentó entrar pero la sala está llena.');
        socket.disconnect(true);
        return;
    }

    // 2. Asignamos un color según el orden de llegada
    const colorAsignado = coloresParaJugadores[cantidadJugadores];
    socket.color = colorAsignado;
    cantidadJugadores++;
    
    console.log(`¡Jugador conectado! Total en sala: ${cantidadJugadores}`);

    // Le avisamos al juego en la pantalla que dibuje un nuevo personaje
    io.emit('nuevoJugador', { idDelSocket: socket.id, color: colorAsignado });

    // 3. Escuchamos los botones que aprietan en el celular
    socket.on('message', (mensajeRecibido) => {
        try {
            const datosDelBoton = typeof mensajeRecibido === 'string' ? JSON.parse(mensajeRecibido) : mensajeRecibido;
            
            // Reenviamos ese botón apretado directo al juego para que mueva al personaje
            io.emit('inputDeJugador', {
                idDelSocket: socket.id,
                tipoDeEvento: datosDelBoton.tipo, // 'keydown' o 'keyup'
                teclaPresionada: datosDelBoton.tecla // 'ArrowRight', 'Space', etc.
            });
        } catch (error) {
            console.error("Error al leer el botón:", error);
        }
    });

    // 4. Si alguien cierra la app en el celu, lo borramos de la pantalla
    socket.on('disconnect', () => {
        cantidadJugadores--;
        console.log(`Jugador se fue. Total en sala: ${cantidadJugadores}`);
        io.emit('jugadorDesconectado', socket.id);
    });
});

http.listen(PUERTO, '0.0.0.0', () => {
    console.log(`Servidor del juego encendido. Escuchando en el puerto ${PUERTO}`);
});