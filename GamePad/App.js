import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useKeepAwake } from "expo-keep-awake";
import { Feather } from "@expo/vector-icons";
import { io } from "socket.io-client";

export default function App() {
  useKeepAwake();

  const [direccionIp, setDireccionIp] = useState("192.168.1.39:3000");
  const [estaConectado, setEstaConectado] = useState(false);
  const [estadoDeConexion, setEstadoDeConexion] = useState("Desconectado");

  const socketRef = useRef(null);

  const teclasActivasRef = useRef(new Set());

  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
    );
    return () => ScreenOrientation.unlockAsync();
  }, []);

  const conectarAlServidor = useCallback(() => {
    if (!direccionIp || socketRef.current) {
      if (socketRef.current) socketRef.current.disconnect();
      return;
    }
    setEstadoDeConexion("Conectando...");
    socketRef.current = io(`http://${direccionIp}`, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      setEstaConectado(true);
      setEstadoDeConexion("Conectado");
    });
    socketRef.current.on("disconnect", () => {
      setEstaConectado(false);
      setEstadoDeConexion("Desconectado");
      teclasActivasRef.current.clear();
    });
    socketRef.current.on("connect_error", () => {
      setEstaConectado(false);
      setEstadoDeConexion("Error de red");
    });
  }, [direccionIp]);

  const desconectarDelServidor = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setEstaConectado(false);
    setEstadoDeConexion("Desconectado");
    teclasActivasRef.current.clear();
  };

  const enviarEventoPresionar = (tecla) => {
    if (socketRef.current && estaConectado) {
      socketRef.current.emit("message", { tipo: "keydown", tecla });
    }
  };

  const enviarEventoSoltar = (tecla) => {
    if (socketRef.current && estaConectado) {
      socketRef.current.emit("message", { tipo: "keyup", tecla });
    }
  };

  const procesarToquesGlobables = (e) => {
    const touches = e.nativeEvent.touches;

    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;

    let nuevasTeclas = new Set();

    for (let i = 0; i < touches.length; i++) {
      const { pageX, pageY } = touches[i];

      if (pageX > screenWidth / 2) {
        nuevasTeclas.add("Space");
      } else {
        const centroX = 150;
        const centroY = screenHeight - 120;

        const diffX = pageX - centroX;
        const diffY = pageY - centroY;

        if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) continue;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) nuevasTeclas.add("ArrowRight");
          else nuevasTeclas.add("ArrowLeft");
        } else {
          if (diffY > 0) nuevasTeclas.add("ArrowDown");
          else nuevasTeclas.add("ArrowUp");
        }
      }
    }

    teclasActivasRef.current.forEach((teclaVieja) => {
      if (!nuevasTeclas.has(teclaVieja)) {
        enviarEventoSoltar(teclaVieja);
      }
    });
    nuevasTeclas.forEach((teclaNueva) => {
      if (!teclasActivasRef.current.has(teclaNueva)) {
        enviarEventoPresionar(teclaNueva);
      }
    });
    teclasActivasRef.current = nuevasTeclas;
  };

  if (!estaConectado) {
    return (
      <SafeAreaView style={styles.contenedorCentro}>
        <StatusBar style="dark" hidden={true} />
        <Text style={styles.tituloSecundario}>Vincular Gamepad</Text>
        <TextInput
          style={styles.inputIp}
          placeholder="Ej: 192.168.1.39:3000"
          value={direccionIp}
          onChangeText={setDireccionIp}
          keyboardType="default"
        />
        <TouchableOpacity
          style={styles.botonConectar}
          onPress={conectarAlServidor}
        >
          <Text style={styles.textoBotonSecundario}>Conectar</Text>
        </TouchableOpacity>
        <Text style={styles.textoEstado}>{estadoDeConexion}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedorGamepad}>
      <StatusBar hidden={true} />
      <View style={styles.barraSuperior}>
        <View style={styles.indicadorLed}>
          <View
            style={[
              styles.led,
              estaConectado ? styles.ledEncendido : styles.ledApagado,
            ]}
          />
          <Text style={styles.textoLed}>{estadoDeConexion}</Text>
        </View>
        <TouchableOpacity
          onPress={desconectarDelServidor}
          style={styles.botonDesconectar}
        >
          <Text style={styles.textoDesconectar}>Desconectar</Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.zonaControles}
        onTouchStart={procesarToquesGlobables}
        onTouchMove={procesarToquesGlobables}
        onTouchEnd={procesarToquesGlobables}
        onTouchCancel={procesarToquesGlobables}
      >
        <View style={styles.capaVisualFantasmal} pointerEvents="none">
          <View style={styles.zonaDPad}>
            <View style={styles.filaDPad}>
              <View style={styles.botonDireccion}>
                <Feather name="chevron-up" size={42} color="white" />
              </View>
            </View>
            <View style={styles.filaCentroDPad}>
              <View style={styles.botonDireccion}>
                <Feather name="chevron-left" size={42} color="white" />
              </View>
              <View style={styles.centroDPadVacio} />
              <View style={styles.botonDireccion}>
                <Feather name="chevron-right" size={42} color="white" />
              </View>
            </View>
            <View style={styles.filaDPad}>
              <View style={styles.botonDireccion}>
                <Feather name="chevron-down" size={42} color="white" />
              </View>
            </View>
          </View>

          <View style={styles.zonaAccion}>
            <View style={styles.botonAccion}>
              <Text style={styles.textoBotonAccion}>A</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorCentro: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    justifyContent: "center",
    alignItems: "center",
  },
  tituloSecundario: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputIp: {
    backgroundColor: "#333",
    color: "#fff",
    width: 250,
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  botonConectar: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  textoBotonSecundario: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  textoEstado: { color: "#aaa", marginTop: 20 },
  contenedorGamepad: { flex: 1, backgroundColor: "#121212" },

  barraSuperior: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 15,
    zIndex: 10,
  },
  indicadorLed: { flexDirection: "row", alignItems: "center" },
  led: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  ledEncendido: {
    backgroundColor: "#00FF00",
    shadowColor: "#00FF00",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  ledApagado: { backgroundColor: "#FF0000" },
  textoLed: { color: "#fff", fontWeight: "bold" },
  botonDesconectar: { padding: 8, backgroundColor: "#333", borderRadius: 5 },
  textoDesconectar: { color: "#fff", fontSize: 12 },

  zonaControles: { flex: 1, position: "relative" },

  capaVisualFantasmal: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 50,
    paddingBottom: 20,
  },

  zonaDPad: { alignItems: "center", justifyContent: "center" },
  filaDPad: { flexDirection: "row", justifyContent: "center" },
  filaCentroDPad: { flexDirection: "row", alignItems: "center" },
  botonDireccion: {
    width: 70,
    height: 70,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 15,
  },
  centroDPadVacio: { width: 70, height: 70, margin: 5 },

  zonaAccion: { alignItems: "center", justifyContent: "center" },
  botonAccion: {
    width: 95,
    height: 95,
    backgroundColor: "#E74C3C",
    borderRadius: 47.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  textoBotonAccion: { color: "#fff", fontSize: 36, fontWeight: "900" },
});
