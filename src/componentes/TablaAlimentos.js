// Tabla de alimentos que se adapta al ancho disponible:
// - Ancha (compu, tablet): todas las columnas visibles, incluidas grupo, forma y momento.
// - Angosta (celular): la columna del nombre queda fija y el resto se desliza de costado.
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colores } from '../estilos'
import { detalleAlimento, mayuscula } from '../utiles'

const ANCHO_MINIMO_COMPLETA = 760   // desde este ancho (en píxeles) se muestra la tabla completa
const ALTO = 50                     // alto de fila en la vista angosta (igual en las dos partes)
const ANCHO_NOMBRE = 150

const corto = x => String(+Number(x).toFixed(2))   // 3.00 → '3', 0.25 → '0.25'

// Columnas de texto: solo en la vista ancha
const COLUMNAS_TEXTO = [
  { titulo: 'Grupo', flex: 0.8, valor: a => a.grupo || '–' },
  { titulo: 'Forma', flex: 1, valor: a => a.forma || '–' },
  { titulo: 'Momento', flex: 1.4, valor: a => a.momento || '–' },
]

// Columnas numéricas: en las dos vistas
const COLUMNAS = [
  { titulo: 'MS %', ancho: 54, valor: a => (a.ms * 100).toFixed(1) },
  { titulo: 'PB %', ancho: 54, valor: a => (a.pb * 100).toFixed(1) },
  { titulo: 'EM', ancho: 48, valor: a => a.em.toFixed(2) },
  { titulo: 'Ca', ancho: 48, valor: a => corto(a.ca) },
  { titulo: 'P', ancho: 48, valor: a => corto(a.p) },
  { titulo: 'FDN %', ancho: 54, valor: a => corto(a.fdn) },
  { titulo: '$/kg', ancho: 58, valor: a => (a.precio ? corto(a.precio) : '–') },
]

const fondo = i => (i % 2 === 0 ? '#fff' : '#f6f7f3')   // filas alternadas para leer mejor

// Nombre con el ✓ si está en la ración y la marca "propio"
function Nombre({ a, enRacion }) {
  return (
    <Text style={styles.nombre} numberOfLines={1}>
      {enRacion.has(a.id) ? <Text style={{ color: colores.verde }}>✓ </Text> : null}
      {mayuscula(a.nombre)}
      {a.predeterminado ? null : <Text style={styles.propio}>  propio</Text>}
    </Text>
  )
}

export default function TablaAlimentos({ alimentos, enRacion, onTocar }) {
  const [ancho, setAncho] = useState(0)   // ancho real que tiene la tabla en pantalla
  const completa = ancho >= ANCHO_MINIMO_COMPLETA

  return (
    // onLayout avisa el tamaño del contenedor cada vez que cambia (por ejemplo, al girar el celular)
    <View onLayout={e => setAncho(e.nativeEvent.layout.width)}>
      {ancho === 0 ? null : completa ? (
        <TablaCompleta alimentos={alimentos} enRacion={enRacion} onTocar={onTocar} />
      ) : (
        <TablaAngosta alimentos={alimentos} enRacion={enRacion} onTocar={onTocar} />
      )}
    </View>
  )
}

// ---------- Vista ancha: una sola tabla, las columnas se reparten el ancho ----------
function TablaCompleta({ alimentos, enRacion, onTocar }) {
  return (
    <View style={styles.tabla}>
      <View style={[styles.fila, styles.filaCabecera]}>
        <Text style={[styles.cabecera, styles.celdaTexto, { flex: 1.3 }]}>Alimento</Text>
        {COLUMNAS_TEXTO.map(c => (
          <Text key={c.titulo} style={[styles.cabecera, styles.celdaTexto, { flex: c.flex }]}>{c.titulo}</Text>
        ))}
        {COLUMNAS.map(c => (
          <Text key={c.titulo} style={[styles.cabecera, styles.celdaNumero, { minWidth: c.ancho }]}>{c.titulo}</Text>
        ))}
      </View>
      {alimentos.map((a, i) => (
        <Pressable key={a.id} onPress={() => onTocar(a)} style={[styles.fila, styles.filaAncha, { backgroundColor: fondo(i) }]}>
          <View style={[styles.celdaTexto, { flex: 1.3 }]}>
            <Nombre a={a} enRacion={enRacion} />
          </View>
          {COLUMNAS_TEXTO.map(c => (
            <Text key={c.titulo} style={[styles.texto, styles.celdaTexto, { flex: c.flex }]}>{c.valor(a)}</Text>
          ))}
          {COLUMNAS.map(c => (
            <Text key={c.titulo} style={[styles.numero, styles.celdaNumero, { minWidth: c.ancho }]}>{c.valor(a)}</Text>
          ))}
        </Pressable>
      ))}
    </View>
  )
}

// ---------- Vista angosta: nombre fijo a la izquierda, números deslizables ----------
function TablaAngosta({ alimentos, enRacion, onTocar }) {
  return (
    <View style={[styles.tabla, { flexDirection: 'row' }]}>
      <View style={{ width: ANCHO_NOMBRE }}>
        <View style={[styles.celdaCabecera, { alignItems: 'flex-start' }]}>
          <Text style={styles.cabecera}>Alimento</Text>
        </View>
        {alimentos.map((a, i) => (
          <Pressable key={a.id} onPress={() => onTocar(a)} style={[styles.celdaNombre, { backgroundColor: fondo(i) }]}>
            <Nombre a={a} enRacion={enRacion} />
            <Text style={styles.detalle} numberOfLines={1}>{detalleAlimento(a) || '–'}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal style={{ flex: 1 }}>
        <View>
          <View style={styles.fila}>
            {COLUMNAS.map(c => (
              <View key={c.titulo} style={[styles.celdaCabecera, { width: c.ancho }]}>
                <Text style={styles.cabecera}>{c.titulo}</Text>
              </View>
            ))}
          </View>
          {alimentos.map((a, i) => (
            <Pressable key={a.id} onPress={() => onTocar(a)} style={[styles.fila, { backgroundColor: fondo(i) }]}>
              {COLUMNAS.map(c => (
                <View key={c.titulo} style={[styles.celda, { width: c.ancho }]}>
                  <Text style={styles.numero}>{c.valor(a)}</Text>
                </View>
              ))}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  tabla: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
  },
  // Vista ancha
  filaCabecera: {
    backgroundColor: '#eef1e8',
    borderBottomWidth: 1,
    borderBottomColor: colores.linea,
    paddingVertical: 8,
  },
  filaAncha: {
    alignItems: 'center',
    paddingVertical: 9,
  },
  celdaTexto: {
    paddingHorizontal: 8,
  },
  celdaNumero: {
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  texto: {
    color: '#444',
  },
  // Vista angosta
  celdaCabecera: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    backgroundColor: '#eef1e8',
    borderBottomWidth: 1,
    borderBottomColor: colores.linea,
  },
  celdaNombre: {
    height: ALTO,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colores.linea,
  },
  celda: {
    height: ALTO,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  detalle: {
    fontSize: 11,
    color: colores.gris,
  },
  // Comunes
  cabecera: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colores.gris,
  },
  nombre: {
    fontWeight: '600',
  },
  propio: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2d6585',
  },
  numero: {
    fontVariant: ['tabular-nums'],
  },
})