// Pestaña "Animal" del módulo Carne: etapa, sexo, peso vivo y ganancia diaria
import { Pressable, Text, View } from 'react-native'
import Campo from '../componentes/Campo'
import Opciones from '../componentes/Opciones'
import { estilos } from '../estilos'
import { ETAPAS, SEXOS } from '../modulos'

export default function AnimalCarne({ datos, cambiar, empezarDeCero, confirmarBorrado }) {
  return (
    <View>
      <Text style={estilos.seccion}>Datos del animal</Text>
      <Opciones etiqueta="Edad" opciones={ETAPAS} valor={datos.etapa} onChange={v => cambiar('etapa', v)} />
      <Opciones etiqueta="Sexo" opciones={SEXOS} valor={datos.sexo} onChange={v => cambiar('sexo', v)} />
      <Campo etiqueta="Peso vivo (kg)" valor={datos.pv} onChange={v => cambiar('pv', v)} />
      <Campo
        etiqueta="Ganancia diaria de peso (kg/día)"
        ayuda="Por ejemplo 0,1 = 100 g por día"
        valor={datos.gdpv}
        onChange={v => cambiar('gdpv', v)}
      />

      <Pressable onPress={empezarDeCero} style={estilos.borrar}>
        <Text style={estilos.borrarTexto}>
          {confirmarBorrado ? '¿Seguro? Tocá de nuevo para borrar' : 'Empezar de cero'}
        </Text>
      </Pressable>
      <Text style={{ fontSize: 12, color: '#777', marginTop: 6, textAlign: 'center' }}>
        Deja los datos del animal en 0 y vacía la ración de carne. Tus alimentos no se borran.
      </Text>
    </View>
  )
}
