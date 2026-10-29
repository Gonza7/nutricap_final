// Piezas que usan las dos pantallas de Resultados (tambo y carne), con el diseño nuevo.
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fuentes, tema } from '../tema'

// Título de una sección, con una explicación corta opcional debajo
export function Titulo({ children, nota }) {
  return (
    <View style={styles.titulo}>
      <Text style={styles.tituloTexto}>{children}</Text>
      {nota ? <Text style={styles.nota}>{nota}</Text> : null}
    </View>
  )
}

// Grilla de cifras: etiqueta chica, número grande y unidad.
// items: [{ etiqueta, valor, unidad, alerta }]
export function Cifras({ items }) {
  return (
    <View style={styles.cifras}>
      {items.map(item => (
        <View key={item.etiqueta} style={styles.cifra}>
          <Text style={styles.cifraEtiqueta}>{item.etiqueta}</Text>
          <Text style={[styles.cifraValor, item.alerta && { color: tema.falta }]}>{item.valor}</Text>
          <Text style={styles.cifraUnidad}>{item.unidad}</Text>
        </View>
      ))}
    </View>
  )
}

// Lista de cosas para corregir. Si no hay, un mensaje en verde.
export function Alertas({ alertas }) {
  if (alertas.length === 0) {
    return <Text style={styles.todoBien}>La ración cubre los requerimientos.</Text>
  }
  return (
    <View style={{ gap: 8 }}>
      {alertas.map(a => (
        <View key={a} style={styles.alerta}>
          <Text style={styles.alertaTexto}>{a}</Text>
        </View>
      ))}
    </View>
  )
}

// Pantalla cuando falta el peso vivo
export function SinPeso({ irAAnimal }) {
  return (
    <View style={styles.vacio}>
      <Text style={styles.vacioTitulo}>Falta el peso vivo</Text>
      <Text style={styles.vacioTexto}>Cargalo en la pestaña Animal para ver los requerimientos y el balance.</Text>
      <Boton titulo="Ir a Animal" onPress={irAAnimal} />
    </View>
  )
}

// Botón: lleno (principal) o con borde (secundario)
export function Boton({ titulo, onPress, secundario }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.boton, secundario && styles.botonSecundario, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.botonTexto, secundario && { color: tema.marca }]}>{titulo}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  titulo: {
    marginTop: 28,
    marginBottom: 4,
  },
  tituloTexto: {
    fontFamily: fuentes.semi,
    fontSize: 20,
    color: tema.tinta,
  },
  nota: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: tema.tenue,
    marginTop: 2,
  },

  // Cifras: celdas separadas por líneas finas, sin cajas de color
  cifras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: tema.linea,
    marginTop: 8,
  },
  cifra: {
    flexGrow: 1,
    flexBasis: 140,
    paddingVertical: 12,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: tema.linea,
  },
  cifraEtiqueta: {
    fontFamily: fuentes.medio,
    fontSize: 14,
    color: tema.suave,
  },
  cifraValor: {
    fontFamily: fuentes.semi,
    fontSize: 30,
    color: tema.tinta,
    fontVariant: ['tabular-nums'],
    marginVertical: 1,
  },
  cifraUnidad: {
    fontFamily: fuentes.regular,
    fontSize: 13,
    color: tema.tenue,
  },

  alerta: {
    borderLeftWidth: 3,
    borderLeftColor: tema.falta,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  alertaTexto: {
    fontFamily: fuentes.regular,
    fontSize: 16,
    color: tema.tinta,
  },
  todoBien: {
    fontFamily: fuentes.medio,
    fontSize: 16,
    color: tema.sobra,
  },

  vacio: {
    marginTop: 32,
    gap: 8,
    alignItems: 'flex-start',
  },
  vacioTitulo: {
    fontFamily: fuentes.semi,
    fontSize: 22,
    color: tema.tinta,
  },
  vacioTexto: {
    fontFamily: fuentes.regular,
    fontSize: 16,
    color: tema.suave,
    marginBottom: 8,
  },

  boton: {
    backgroundColor: tema.marca,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tema.marca,
  },
  botonTexto: {
    fontFamily: fuentes.semi,
    fontSize: 16,
    color: '#fff',
  },
})
