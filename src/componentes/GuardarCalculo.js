// Guardar el cálculo actual en el historial o descargarlo en PDF. Lo usan los dos módulos.
import { useState } from 'react'
import { Text, View } from 'react-native'
import Campo from './Campo'
import Aviso, { conAviso } from './Aviso'
import { Boton, Titulo } from './PartesResultado'
import { fuentes, tema } from '../tema'
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
      <Titulo>Guardar este cálculo</Titulo>
      <Campo
        etiqueta="Nombre (opcional)"
        ayuda={`Por ejemplo: ${ejemploNombre}`}
        teclado="default"
        valor={nombre}
        onChange={setNombre}
      />
      <View style={{ gap: 8, marginTop: 4 }}>
        <Boton titulo="Guardar en el historial" onPress={guardar} />
        <Boton titulo="Descargar PDF" onPress={pdf} secundario />
      </View>
      {guardado ? (
        <Text style={{ fontFamily: fuentes.medio, fontSize: 15, color: tema.sobra, marginTop: 8 }}>
          Guardado. Lo ves en la pestaña Historial.
        </Text>
      ) : null}
      <View style={{ marginTop: 8 }}>
        <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
      </View>
    </View>
  )
}
