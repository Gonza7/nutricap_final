// Una fila del balance: cuánto cubre la ración de lo que necesita el animal, con una barra.
//
//   Proteína bruta                 65 %
//   [██████████████░░░░░░░░|░░░░░░░░]     ← la rayita marca el 100 %
//   Aporta 164 de 251 g      Faltan 88 g
//
// alReves: para la FDN de tambo, que es un máximo (pasarse es lo malo).
import { StyleSheet, Text, View } from 'react-native'
import { fuentes, tema } from '../tema'
import { estadoBalance, fmt } from '../utiles'

const TOPE = 150   // la barra llega hasta 150 %; más que eso se dibuja llena

export default function BarraBalance({ nombre, unidad, requerido, aporte, balance, decimales = 0, alReves }) {
  const estado = estadoBalance(balance, requerido, alReves)
  const color = { Falta: tema.falta, 'Se pasa': tema.falta, Sobra: tema.sobra, OK: tema.sobra, Justo: tema.tinta }[estado]

  const pct = requerido > 0 ? (aporte / requerido) * 100 : 0
  const ancho = Math.min(pct, TOPE) / TOPE * 100   // % del ancho de la barra

  // Lo que se lee abajo a la derecha, en palabras
  const cuanto = `${fmt(Math.abs(balance), decimales)} ${unidad}`
  const texto = {
    Falta: `Faltan ${cuanto}`,
    Sobra: `Sobran ${cuanto}`,
    Justo: 'Justo',
    OK: 'Dentro del máximo',
    'Se pasa': `Se pasa ${cuanto}`,
  }[estado]

  return (
    <View style={styles.fila}>
      <View style={styles.arriba}>
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={[styles.pct, { color }]}>{fmt(pct, 0)} %</Text>
      </View>

      <View style={styles.pista}>
        <View style={[styles.relleno, { width: `${ancho}%`, backgroundColor: color }]} />
        <View style={styles.marca100} />
      </View>

      <View style={styles.abajo}>
        <Text style={styles.detalle}>
          {alReves
            ? `Tiene ${fmt(aporte, decimales)} ${unidad}, máximo ${fmt(requerido, decimales)}`
            : `Aporta ${fmt(aporte, decimales)} de ${fmt(requerido, decimales)} ${unidad}`}
        </Text>
        <Text style={[styles.estado, { color }]}>{texto}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tema.linea,
  },
  arriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  nombre: {
    fontFamily: fuentes.medio,
    fontSize: 17,
    color: tema.tinta,
  },
  pct: {
    fontFamily: fuentes.semi,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  pista: {
    height: 10,
    borderRadius: 5,
    backgroundColor: tema.superficie,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: 5,
  },
  // Rayita fija en el 100 %: 100 / 150 del ancho
  marca100: {
    position: 'absolute',
    left: `${(100 / TOPE) * 100}%`,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: tema.tinta,
  },
  abajo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  detalle: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: tema.suave,
    flexShrink: 1,
  },
  estado: {
    fontFamily: fuentes.semi,
    fontSize: 14,
  },
})
