import { StyleSheet, Text, TextInput, View } from 'react-native'

export default function Campo({ etiqueta, valor, onChange, ayuda, teclado }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChange}
        keyboardType={teclado || 'decimal-pad'}
      />
      {ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  campo: { marginBottom: 14 },
  etiqueta: { fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  ayuda: { fontSize: 12, color: '#777', marginTop: 3 },
})