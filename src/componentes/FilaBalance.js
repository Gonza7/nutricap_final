import { StyleSheet, Text, View } from 'react-native'
import { estadoBalance, fmt } from '../utiles'

const ROJO = '#a2461e'
const AZUL = '#2d6585'
const VERDE = '#2f7a3a'

// Una fila de la tabla de balances: requerido, aporte, balance y un estado de color.
// alReves: para la FDN, que es un máximo (pasarse es lo malo).
export default function FilaBalance({ nombre, unidad, requerido, aporte, balance, decimales = 0, alReves }) {
  const estado = estadoBalance(balance, requerido, alReves)
  const color = { Falta: ROJO, 'Se pasa': ROJO, Sobra: AZUL, Justo: VERDE, OK: VERDE }[estado]

  const signo = balance > 0 ? '+' : ''

  return (
    <View style={styles.fila}>
      <View style={styles.nombre}>
        <Text style={styles.nombreTexto}>{nombre} <Text style={styles.unidad}>{unidad}</Text></Text>
        <Text style={[styles.estado, { color }]}>{estado}</Text>
      </View>
      <Text style={styles.numero}>{fmt(requerido, decimales)}</Text>
      <Text style={styles.numero}>{fmt(aporte, decimales)}</Text>
      <Text style={[styles.numero, { color, fontWeight: 'bold' }]}>{signo}{fmt(balance, decimales)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  nombre: { flex: 1.4 },
  nombreTexto: { fontWeight: '600' },
  unidad: { fontWeight: 'normal', color: '#777', fontSize: 12 },
  estado: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  numero: { flex: 1, textAlign: 'right' },
})
