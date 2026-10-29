// Pestaña "Cabra": datos del animal (celdas amarillas de la hoja tambo)
import { Pressable, Text, View } from 'react-native'
import Campo from '../componentes/Campo'
import Grilla from '../componentes/Grilla'
import { estilos } from '../estilos'

export default function Cabra({ datos, cambiar, empezarDeCero, confirmarBorrado }) {
  return (
    <View>
      {/* Cada grupo va en una Grilla: en la compu los campos se reparten el ancho */}
      <Text style={estilos.seccion}>Datos de la cabra</Text>
      <Grilla maxColumnas={4}>
        <Campo etiqueta="Peso vivo" unidad="kg" valor={datos.pv} onChange={v => cambiar('pv', v)} />
        <Campo etiqueta="Grasa butirosa" unidad="%" valor={datos.gb} onChange={v => cambiar('gb', v)} />
        <Campo etiqueta="Leche" unidad="L/día" valor={datos.litros} onChange={v => cambiar('litros', v)} />
        <Campo
          etiqueta="Semana de lactancia"
          ayuda="Para predecir el consumo"
          valor={datos.semanas}
          onChange={v => cambiar('semanas', v)}
        />
      </Grilla>

      <Text style={estilos.seccion}>Actividad</Text>
      <Grilla maxColumnas={2}>
        <Campo
          etiqueta="Actividad voluntaria"
          unidad="%"
          ayuda="De 10 a 40 según el sistema"
          valor={datos.actVol}
          onChange={v => cambiar('actVol', v)}
        />
        <Campo
          etiqueta="Actividad reproductiva"
          unidad="%"
          ayuda="10 si corresponde, si no 0"
          valor={datos.actRep}
          onChange={v => cambiar('actRep', v)}
        />
      </Grilla>

      <Text style={estilos.seccion}>Cambio de peso</Text>
      <Grilla maxColumnas={2}>
        <Campo
          etiqueta="Pérdida de peso"
          unidad="kg/día"
          ayuda="Movilización de reservas, primeras 8 semanas posparto"
          valor={datos.perdida}
          onChange={v => cambiar('perdida', v)}
        />
        <Campo
          etiqueta="Ganancia de peso"
          unidad="kg/día"
          ayuda="Recuperación de reservas"
          valor={datos.ganancia}
          onChange={v => cambiar('ganancia', v)}
        />
      </Grilla>

      <Text style={estilos.seccion}>Último tercio de gestación</Text>
      <Grilla maxColumnas={3}>
        <Campo etiqueta="Peso al nacer por cría" unidad="kg" valor={datos.pnac} onChange={v => cambiar('pnac', v)} />
        <Campo etiqueta="Número de crías" valor={datos.crias} onChange={v => cambiar('crias', v)} />
        <Campo
          etiqueta="Días de gestación"
          unidad="días"
          ayuda="Dejá estos tres en 0 si no está en el último tercio"
          valor={datos.dias}
          onChange={v => cambiar('dias', v)}
        />
      </Grilla>

      <Pressable onPress={empezarDeCero} style={estilos.borrar}>
        <Text style={estilos.borrarTexto}>
          {confirmarBorrado ? '¿Seguro? Tocá de nuevo para borrar' : 'Empezar de cero'}
        </Text>
      </Pressable>
      <Text style={estilos.nota}>
        Deja los datos de la cabra en 0 y vacía la ración. Tus alimentos no se borran.
      </Text>
    </View>
  )
}
