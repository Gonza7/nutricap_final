// Un campo para escribir, con su etiqueta arriba.
// unidad: opcional, se muestra adentro del campo a la derecha (por ejemplo "kg").
// ayuda: texto chico opcional debajo.
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { fuentes, tema } from '../tema'

export default function Campo({ etiqueta, valor, onChange, ayuda, teclado, unidad }) {
  const [enfocado, setEnfocado] = useState(false)   // para marcar el borde mientras se escribe

  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.caja, enfocado && styles.cajaEnfocada]}>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={onChange}
          keyboardType={teclado || 'decimal-pad'}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
        />
        {unidad ? <Text style={styles.unidad}>{unidad}</Text> : null}
      </View>
      {ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  campo: {
    marginBottom: 16,
  },
  etiqueta: {
    fontFamily: fuentes.medio,
    fontSize: 15,
    color: tema.tinta,
    marginBottom: 6,
  },
  // La caja tiene el borde; adentro van el texto y la unidad
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: tema.linea,
    borderRadius: 8,
    backgroundColor: tema.fondo,
    paddingHorizontal: 12,
  },
  cajaEnfocada: {
    borderColor: tema.marca,
    borderWidth: 2,
    paddingHorizontal: 11,   // 1 menos, para que el texto no salte al engrosar el borde
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontFamily: fuentes.regular,
    fontSize: 18,
    color: tema.tinta,
    outlineStyle: 'none',    // en la web, el borde ya marca el foco
  },
  unidad: {
    fontFamily: fuentes.regular,
    fontSize: 16,
    color: tema.tenue,
    marginLeft: 8,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: tema.tenue,
    marginTop: 4,
  },
})
