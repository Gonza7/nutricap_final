// Acomoda campos en columnas según el ancho de la pantalla:
// en el celular uno abajo del otro, en la compu varios por fila ocupando todo el ancho.
//
// maxColumnas: cuántas columnas como máximo (por ejemplo 2 para un grupo de 2 campos).
import { Children, useState } from 'react'
import { View } from 'react-native'

const ANCHO_MINIMO = 240   // ancho mínimo de cada columna, en píxeles
const SEPARACION = 16      // espacio entre columnas

export default function Grilla({ children, maxColumnas = 3 }) {
  const [ancho, setAncho] = useState(0)

  // Cuántas columnas entran sin que ninguna quede más angosta que ANCHO_MINIMO
  const entran = Math.floor((ancho + SEPARACION) / (ANCHO_MINIMO + SEPARACION))
  const columnas = Math.max(1, Math.min(maxColumnas, entran))
  const anchoColumna = (ancho - SEPARACION * (columnas - 1)) / columnas

  return (
    <View
      onLayout={e => setAncho(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: SEPARACION }}
    >
      {/* Hasta saber el ancho, cada campo ocupa toda la fila */}
      {Children.map(children, hijo =>
        hijo ? <View style={{ width: ancho ? anchoColumna : '100%' }}>{hijo}</View> : null
      )}
    </View>
  )
}
