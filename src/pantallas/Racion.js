// Pestaña "Ración": qué alimentos come el animal y cuántos kg.
// Los alimentos se pueden buscar y sumar acá mismo, sin ir a la pestaña Alimentos.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Campo from '../componentes/Campo'
import Tarjetas from '../componentes/Tarjetas'
import { colores, estilos } from '../estilos'
import { fmt, nombreAlimento, sinAcentos } from '../utiles'

const MAX_RESULTADOS = 8   // cuántos resultados mostrar como máximo

export default function Racion({ racion, todos, cambiarKg, agregarARacion, sacarDeRacion, totales, irAAlimentos }) {
  const [busqueda, setBusqueda] = useState('')

  // Cada elemento de la ración con los datos completos de su alimento
  const enRacion = racion
    .map(item => ({ ...item, alimento: todos.find(a => a.id === item.id) }))
    .filter(item => item.alimento)   // por si el alimento se borró

  // Buscador: alimentos que coinciden con todas las palabras y que todavía no están en la ración
  const palabras = sinAcentos(busqueda).split(' ').filter(Boolean)
  const coinciden = palabras.length === 0 ? [] : todos.filter(a => {
    if (racion.some(item => item.id === a.id)) return false
    const texto = sinAcentos(nombreAlimento(a))
    return palabras.every(p => texto.includes(p))
  })
  const resultados = coinciden.slice(0, MAX_RESULTADOS)

  const sumar = id => {
    agregarARacion(id)
    setBusqueda('')   // listo para buscar el siguiente
  }

  return (
    <View>
      <Text style={estilos.seccion}>Ración (kg tal cual por día)</Text>
      {enRacion.length === 0 ? <Text>La ración está vacía. Buscá un alimento abajo para sumarlo.</Text> : null}
      {enRacion.map(item => (
        <View key={item.id} style={estilos.fila}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta={nombreAlimento(item.alimento)} valor={item.kg} onChange={v => cambiarKg(item.id, v)} />
          </View>
          <Pressable onPress={() => sacarDeRacion(item.id)} style={estilos.quitar}>
            <Text style={estilos.quitarTexto}>Sacar</Text>
          </Pressable>
        </View>
      ))}

      {/* Aportes justo debajo de la ración, para ver al momento cómo cambian */}
      {totales.msKg > 0 ? (
        <Tarjetas
          titulo="Aportes de la ración"
          tono="aporta"
          items={[
            { etiqueta: 'Materia seca', valor: fmt(totales.msKg, 3), unidad: 'kg/día' },
            { etiqueta: 'Proteína (PB)', valor: fmt(totales.pbG, 0), unidad: 'g/día' },
            { etiqueta: 'Energía (EM)', valor: fmt(totales.emMcal, 2), unidad: 'Mcal/día' },
            { etiqueta: 'Calcio', valor: fmt(totales.caG, 1), unidad: 'g/día' },
            { etiqueta: 'Fósforo', valor: fmt(totales.pG, 1), unidad: 'g/día' },
            { etiqueta: 'FDN', valor: fmt(totales.fdnPct, 1), unidad: '% de la MS' },
            { etiqueta: 'Costo', valor: '$ ' + fmt(totales.costo, 0), unidad: 'por día' },
          ]}
        />
      ) : null}

      <Text style={estilos.seccion}>Sumar alimentos</Text>
      <TextInput
        style={styles.buscar}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar: maíz, alfalfa, silaje…"
        placeholderTextColor={colores.gris}
      />

      {palabras.length > 0 && resultados.length === 0 ? (
        <Text style={styles.ayuda}>No hay alimentos que coincidan (o ya están en la ración).</Text>
      ) : null}

      {resultados.map(a => (
        <Pressable key={a.id} onPress={() => sumar(a.id)} style={styles.resultado}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultadoNombre} numberOfLines={2}>{nombreAlimento(a)}</Text>
            <Text style={styles.resultadoDetalle}>
              MS {fmt(a.ms * 100, 1)} % · PB {fmt(a.pb * 100, 1)} % · EM {fmt(a.em, 2)}{a.precio ? ` · $ ${fmt(a.precio, 0)}/kg` : ''}
            </Text>
          </View>
          <Text style={styles.mas}>+ Sumar</Text>
        </Pressable>
      ))}
      {coinciden.length > MAX_RESULTADOS ? (
        <Text style={styles.ayuda}>Hay {coinciden.length - MAX_RESULTADOS} más: escribí más palabras para achicar la búsqueda.</Text>
      ) : null}

      <Pressable onPress={irAAlimentos} style={styles.botonBorde}>
        <Text style={styles.botonBordeTexto}>Ver la tabla completa de alimentos</Text>
      </Pressable>
      <Text style={styles.ayuda}>Desde ahí también podés crear alimentos propios y cargar precios.</Text>

    </View>
  )
}

const styles = StyleSheet.create({
  buscar: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 6,
    marginBottom: 6,
  },
  resultadoNombre: {
    fontWeight: '600',
  },
  resultadoDetalle: {
    fontSize: 12,
    color: colores.gris,
  },
  mas: {
    color: colores.verde,
    fontWeight: 'bold',
  },
  botonBorde: {
    borderWidth: 1,
    borderColor: colores.verde,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  botonBordeTexto: {
    color: colores.verde,
    fontWeight: 'bold',
  },
  ayuda: {
    fontSize: 12,
    color: colores.gris,
    marginTop: 4,
  },
})
