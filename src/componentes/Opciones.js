// Botones para elegir una opción entre pocas (por ejemplo Hembra / Macho)
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colores } from '../estilos'

// opciones: { valor: 'texto a mostrar', ... }
export default function Opciones({ etiqueta, opciones, valor, onChange }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {etiqueta ? <Text style={styles.etiqueta}>{etiqueta}</Text> : null}
      <View style={styles.fila}>
        {Object.entries(opciones).map(([v, texto]) => {
          const activa = v === valor
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              style={[styles.opcion, activa && styles.opcionActiva]}
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
  etiqueta: { fontWeight: '600', marginBottom: 6 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  opcionActiva: { backgroundColor: colores.verde, borderColor: colores.verde },
  texto: { fontWeight: '600', color: colores.gris },
  textoActivo: { color: '#fff' },
})
