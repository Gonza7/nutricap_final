// Bloque de "tarjetas": un título y varios números grandes, cada uno en su cajita.
// Se usa para los requerimientos (azul), los aportes de la ración (verde) y los indicadores (violeta).
//
// items: [{ etiqueta: 'PB', valor: '251', unidad: 'g/día', alerta: false, ok: false }, ...]
//   alerta: true pinta esa cajita de rojo (por ejemplo, Ca/P por debajo de 2)
//   ok: true la pinta de verde (por ejemplo, un balance que alcanza)
// tono: 'requiere', 'aporta', 'indicador' o 'balance' (cambia el color)
// nota: texto chico opcional debajo del título
// compacta: versión más chica, para que entren 4 en una fila del celular
import { StyleSheet, Text, View } from 'react-native'

const TONOS = {
  requiere: { color: '#2d6585', fondo: '#e8f0f6' },
  aporta: { color: '#4a6b25', fondo: '#eef3e6' },
  indicador: { color: '#5b5470', fondo: '#efedf3' },
  balance: { color: '#4f5a49', fondo: '#f0f1ee' },
}

// Colores de cada cajita según el estado
const ESTADOS = {
  alerta: { color: '#a2461e', fondo: '#f8e6dd' },
  ok: { color: '#2f7a3a', fondo: '#e3f1e3' },
}

export default function Tarjetas({ titulo, nota, items, tono = 'requiere', compacta = false }) {
  const { color, fondo } = TONOS[tono]

  return (
    <View style={[styles.bloque, { borderColor: color }]}>
      <View style={[styles.cabecera, compacta && styles.cabeceraCompacta, { backgroundColor: color }]}>
        <Text style={[styles.titulo, compacta && styles.tituloCompacto]}>{titulo}</Text>
      </View>
      {nota ? <Text style={styles.nota}>{nota}</Text> : null}

      <View style={styles.grilla}>
        {items.map(item => {
          // Si la cajita tiene estado (alerta u ok) usa esos colores; si no, los del bloque
          const estado = item.alerta ? ESTADOS.alerta : item.ok ? ESTADOS.ok : { color, fondo }
          return (
            <View key={item.etiqueta} style={[styles.tarjeta, compacta && styles.tarjetaCompacta, { backgroundColor: estado.fondo }]}>
              <Text style={styles.etiqueta}>{item.etiqueta}</Text>
              <Text style={[styles.valor, compacta && styles.valorCompacto, { color: estado.color }]}>{item.valor}</Text>
              <Text style={styles.unidad}>{item.unidad}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bloque: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 4,
  },
  cabecera: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  titulo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  nota: {
    fontSize: 12,
    color: '#777',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  // flexWrap: las tarjetas se acomodan solas, 2 por fila en el celular y más en la compu
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
  },
  tarjeta: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 120,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  valor: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  unidad: {
    fontSize: 12,
    color: '#777',
  },
  // Versión compacta (la franja de balance de arriba)
  cabeceraCompacta: {
    paddingVertical: 4,
  },
  tituloCompacto: {
    fontSize: 13,
  },
  tarjetaCompacta: {
    flexBasis: 70,
    minWidth: 70,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  valorCompacto: {
    fontSize: 18,
  },
})
