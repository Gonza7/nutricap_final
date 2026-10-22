// Guardar el cálculo actual en el historial o descargarlo en PDF. Lo usan los dos módulos.
import { useState } from 'react'
import { Button, Text, View } from 'react-native'
import Campo from './Campo'
import Aviso, { conAviso } from './Aviso'
import { estilos } from '../estilos'
import { guardarPdf, nombreConFecha } from '../respaldo/archivos'
import { htmlCalculo } from '../respaldo/pdf'

export default function GuardarCalculo({ guardarEnHistorial, armarEntrada, ejemploNombre }) {
  const [nombre, setNombre] = useState('')
  const [guardado, setGuardado] = useState(false)   // muestra "Guardado" un momento
  const [aviso, setAviso] = useState(null)

  const guardar = () => {
    guardarEnHistorial(nombre)
    setNombre('')
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  // PDF del cálculo que está en pantalla (no hace falta guardarlo antes en el historial)
  const pdf = () => conAviso(setAviso, async () => {
    await guardarPdf(nombreConFecha(`racion-${nombre.trim() || 'sin-nombre'}`, 'pdf'), htmlCalculo(armarEntrada(nombre)))
    return null
  })

  return (
    <View>
      <Text style={estilos.seccion}>Guardar este cálculo</Text>
      <Campo
        etiqueta="Nombre (opcional)"
        ayuda={`Por ejemplo: ${ejemploNombre}`}
        teclado="default"
        valor={nombre}
        onChange={setNombre}
      />
      <View style={{ gap: 8 }}>
        <Button title="Guardar en el historial" onPress={guardar} color="#4a6b25" />
        <Button title="Descargar PDF" onPress={pdf} color="#2d6585" />
      </View>
      {guardado ? <Text style={[estilos.ok, { marginTop: 8 }]}>Guardado. Lo ves en la pestaña Historial.</Text> : null}
      <View style={{ marginTop: 8 }}>
        <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
      </View>
    </View>
  )
}
