import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import { Feather } from '@expo/vector-icons';
// IMPORTANTE: Ahora usamos el mismo "idioma" que la PC
import { io } from 'socket.io-client'; 

export default function App() {
  useKeepAwake();

  const [direccionIp, setDireccionIp] = useState('192.168.1.39'); // Ya te dejé tu IP por defecto!
  const [estaConectado, setEstaConectado] = useState(false);
  const [estadoDeConexion, setEstadoDeConexion] = useState('Desconectado');
  
  const socketRef = useRef(null);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const conectarAlServidor = () => {
    if (!direccionIp) return;
    setEstadoDeConexion('Conectando...');
    
    // Conexión usando socket.io-client
    const urlSocket = `http://${direccionIp}:3000`;
    socketRef.current = io(urlSocket, {
      transports: ['websocket'] // Fuerza la mejor conexión
    });

    socketRef.current.on('connect', () => {
      setEstaConectado(true);
      setEstadoDeConexion('Conectado');
    });

    socketRef.current.on('disconnect', () => {
      setEstaConectado(false);
      setEstadoDeConexion('Desconectado');
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('Error de red:', error);
      setEstaConectado(false);
      setEstadoDeConexion('Bloqueado por el Firewall de Windows');
    });
  };

  const desconectarDelServidor = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const enviarEventoPresionar = (tecla) => {
    if (socketRef.current && estaConectado) {
      socketRef.current.emit('message', { tipo: 'keydown', tecla: tecla });
    }
  };

  const enviarEventoSoltar = (tecla) => {
    if (socketRef.current && estaConectado) {
      socketRef.current.emit('message', { tipo: 'keyup', tecla: tecla });
    }
  };

  if (!estaConectado) {
    return (
      <SafeAreaView style={styles.contenedorCentro}>
        <StatusBar style="dark" hidden={true} />
        <Text style={styles.tituloSecundario}>Vincular Gamepad</Text>
        
        <TextInput
          style={styles.inputIp}
          placeholder="Ej: 192.168.1.39"
          value={direccionIp}
          onChangeText={setDireccionIp}
          keyboardType="numeric"
        />
        
        <TouchableOpacity style={styles.botonConectar} onPress={conectarAlServidor}>
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
          <View style={[styles.led, estaConectado ? styles.ledEncendido : styles.ledApagado]} />
          <Text style={styles.textoLed}>{estadoDeConexion}</Text>
        </View>

        <TouchableOpacity onPress={desconectarDelServidor} style={styles.botonDesconectar}>
          <Text style={styles.textoDesconectar}>Desconectar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zonaControles}>
        <View style={styles.zonaDPad}>
          <View style={styles.filaDPad}>
            <TouchableOpacity 
              style={styles.botonDireccion}
              onPressIn={() => enviarEventoPresionar('ArrowUp')}
              onPressOut={() => enviarEventoSoltar('ArrowUp')}
            >
              <Feather name="chevron-up" size={40} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filaCentroDPad}>
            <TouchableOpacity 
              style={styles.botonDireccion}
              onPressIn={() => enviarEventoPresionar('ArrowLeft')}
              onPressOut={() => enviarEventoSoltar('ArrowLeft')}
            >
              <Feather name="chevron-left" size={40} color="white" />
            </TouchableOpacity>
            
            <View style={styles.centroDPadVacio} />
            
            <TouchableOpacity 
              style={styles.botonDireccion}
              onPressIn={() => enviarEventoPresionar('ArrowRight')}
              onPressOut={() => enviarEventoSoltar('ArrowRight')}
            >
              <Feather name="chevron-right" size={40} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filaDPad}>
            <TouchableOpacity 
              style={styles.botonDireccion}
              onPressIn={() => enviarEventoPresionar('ArrowDown')}
              onPressOut={() => enviarEventoSoltar('ArrowDown')}
            >
              <Feather name="chevron-down" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.zonaAccion}>
          <TouchableOpacity 
            style={styles.botonAccion}
            onPressIn={() => enviarEventoPresionar('Space')}
            onPressOut={() => enviarEventoSoltar('Space')}
          >
            <Text style={styles.textoBotonAccion}>A</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorCentro: { flex: 1, backgroundColor: '#1e1e1e', justifyContent: 'center', alignItems: 'center' },
  tituloSecundario: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  inputIp: { backgroundColor: '#333', color: '#fff', width: 250, padding: 15, borderRadius: 8, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  botonConectar: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 8 },
  textoBotonSecundario: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  textoEstado: { color: '#aaa', marginTop: 20 },
  contenedorGamepad: { flex: 1, backgroundColor: '#121212' },
  barraSuperior: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  indicadorLed: { flexDirection: 'row', alignItems: 'center' },
  led: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  ledEncendido: { backgroundColor: '#00FF00', shadowColor: '#00FF00', shadowOpacity: 0.8, shadowRadius: 10 },
  ledApagado: { backgroundColor: '#FF0000' },
  textoLed: { color: '#fff', fontWeight: 'bold' },
  botonDesconectar: { padding: 8, backgroundColor: '#333', borderRadius: 5 },
  textoDesconectar: { color: '#fff', fontSize: 12 },
  zonaControles: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 50, paddingBottom: 20 },
  zonaDPad: { alignItems: 'center', justifyContent: 'center' },
  filaDPad: { flexDirection: 'row', justifyContent: 'center' },
  filaCentroDPad: { flexDirection: 'row', alignItems: 'center' },
  botonDireccion: { width: 60, height: 60, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', margin: 5, borderRadius: 10 },
  centroDPadVacio: { width: 60, height: 60, margin: 5 },
  zonaAccion: { alignItems: 'center', justifyContent: 'center' },
  botonAccion: { width: 90, height: 90, backgroundColor: '#E74C3C', borderRadius: 45, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 8 },
  textoBotonAccion: { color: '#fff', fontSize: 36, fontWeight: '900' }
});