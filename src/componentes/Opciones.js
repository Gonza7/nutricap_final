// Para elegir una opción entre pocas (Tambo / Carne, Hembra / Macho).
// Se dibuja como una sola barra dividida: la opción elegida queda rellena.
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fuentes, tema } from '../tema'

// opciones: { valor: 'texto a mostrar', ... }
export default function Opciones({ etiqueta, opciones, valor, onChange }) {
  const lista = Object.entries(opciones)

  return (
    <View style={{ marginBottom: etiqueta ? 16 : 0 }}>
      {etiqueta ? <Text style={styles.etiqueta}>{etiqueta}</Text> : null}
      <View style={styles.barra} accessibilityRole="radiogroup">
        {lista.map(([v, texto], i) => {
          const activa = v === valor
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              style={[styles.opcion, i > 0 && styles.separador, activa && styles.opcionActiva]}
              accessibilityRole="radio"
              accessibilityState={{ checked: activa }}
            >
              <Text style={[styles.texto, activa && styles.textoActivo]}>{texto}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  etiqueta: {
    fontFamily: fuentes.medio,
    fontSize: 15,
    color: tema.tinta,
    marginBottom: 6,
  },
  barra: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: tema.marca,
    borderRadius: 8,
    overflow: 'hidden',
  },
  opcion: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  separador: {
    borderLeftWidth: 1,
    borderLeftColor: tema.marca,
  },
  opcionActiva: {
    backgroundColor: tema.marca,
  },
  texto: {
    fontFamily: fuentes.medio,
    fontSize: 15,
    color: tema.marca,
  },
  textoActivo: {
    color: '#fff',
  },
})
