// Pestaña "Ración": qué alimentos come el animal y cuántos kg.
// Los alimentos se pueden buscar y sumar acá mismo, sin ir a la pestaña Alimentos.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Campo from '../componentes/Campo'
import Grilla from '../componentes/Grilla'
import { Boton, Cifras, Titulo } from '../componentes/PartesResultado'
import { estilos } from '../estilos'
import { fuentes, tema } from '../tema'
import { fmt, nombreAlimento, sinAcentos } from '../utiles'

const MAX_RESULTADOS = 8   // cuántos resultados mostrar como máximo

export default function Racion({ racion, todos, cambiarKg, agregarARacion, sacarDeRacion, totales, irAAlimentos }) {
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)   // para marcar el borde del buscador

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
      {/* 1. Alimentos de la ración, con sus kg */}
      <Titulo nota="Kilos tal cual por animal y por día.">Ración</Titulo>
      {enRacion.length === 0 ? (
        <Text style={styles.texto}>La ración está vacía. Buscá un alimento abajo para sumarlo.</Text>
      ) : null}
      {/* En la compu, hasta 3 alimentos por fila */}
      <Grilla maxColumnas={3}>
        {enRacion.map(item => (
          <View key={item.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Campo etiqueta={nombreAlimento(item.alimento)} unidad="kg" valor={item.kg} onChange={v => cambiarKg(item.id, v)} />
            </View>
            <Pressable onPress={() => sacarDeRacion(item.id)} style={styles.sacar} accessibilityLabel={`Sacar ${nombreAlimento(item.alimento)}`}>
              <Text style={estilos.quitarTexto}>Sacar</Text>
            </Pressable>
          </View>
        ))}
      </Grilla>

      {/* 2. Aportes, justo debajo, para ver al momento cómo cambian */}
      {totales.msKg > 0 ? (
        <View>
          <Titulo>Aportes de la ración</Titulo>
          <Cifras
            items={[
              { etiqueta: 'Materia seca', valor: fmt(totales.msKg, 3), unidad: 'kg por día' },
              { etiqueta: 'Proteína bruta', valor: fmt(totales.pbG, 0), unidad: 'g por día' },
              { etiqueta: 'Energía metabolizable', valor: fmt(totales.emMcal, 2), unidad: 'Mcal por día' },
              { etiqueta: 'Calcio', valor: fmt(totales.caG, 1), unidad: 'g por día' },
              { etiqueta: 'Fósforo', valor: fmt(totales.pG, 1), unidad: 'g por día' },
              { etiqueta: 'FDN', valor: fmt(totales.fdnPct, 1), unidad: '% de la MS' },
              { etiqueta: 'Costo', valor: '$ ' + fmt(totales.costo, 0), unidad: 'por día' },
            ]}
          />
        </View>
      ) : null}

      {/* 3. Buscar y sumar alimentos */}
      <Titulo>Sumar alimentos</Titulo>
      <TextInput
        style={[styles.buscar, buscando && styles.buscarEnfocado]}
        value={busqueda}
        onChangeText={setBusqueda}
        onFocus={() => setBuscando(true)}
        onBlur={() => setBuscando(false)}
        placeholder="Buscar: maíz, alfalfa, silaje…"
        placeholderTextColor={tema.tenue}
      />

      {palabras.length > 0 && resultados.length === 0 ? (
        <Text style={styles.ayuda}>No hay alimentos que coincidan (o ya están en la ración).</Text>
      ) : null}

      {resultados.length > 0 ? (
        <View style={styles.resultados}>
          {resultados.map((a, i) => (
            <Pressable
              key={a.id}
              onPress={() => sumar(a.id)}
              style={({ pressed }) => [styles.resultado, i > 0 && styles.resultadoLinea, pressed && { backgroundColor: tema.superficie }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.resultadoNombre} numberOfLines={2}>{nombreAlimento(a)}</Text>
                <Text style={styles.resultadoDetalle}>
                  MS {fmt(a.ms * 100, 1)} %   PB {fmt(a.pb * 100, 1)} %   EM {fmt(a.em, 2)}{a.precio ? `   $ ${fmt(a.precio, 0)}/kg` : ''}
                </Text>
              </View>
              <Text style={styles.mas}>+ Sumar</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {coinciden.length > MAX_RESULTADOS ? (
        <Text style={styles.ayuda}>Hay {coinciden.length - MAX_RESULTADOS} más: escribí más palabras para achicar la búsqueda.</Text>
      ) : null}

      <View style={{ marginTop: 16, alignSelf: 'flex-start' }}>
        <Boton titulo="Ver la tabla completa de alimentos" onPress={irAAlimentos} secundario />
      </View>
      <Text style={styles.ayuda}>Desde ahí también podés crear alimentos propios y cargar precios.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  texto: {
    fontFamily: fuentes.regular,
    fontSize: 16,
    color: tema.suave,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  // Alineado con la caja del campo (no con la etiqueta)
  sacar: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  buscar: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tema.linea,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    fontFamily: fuentes.regular,
    fontSize: 17,
    color: tema.tinta,
    outlineStyle: 'none',
  },
  buscarEnfocado: {
    borderColor: tema.marca,
    borderWidth: 2,
    paddingHorizontal: 11,
  },
  resultados: {
    borderWidth: 1,
    borderColor: tema.linea,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultadoLinea: {
    borderTopWidth: 1,
    borderTopColor: tema.linea,
  },
  resultadoNombre: {
    fontFamily: fuentes.medio,
    fontSize: 16,
    color: tema.tinta,
  },
  resultadoDetalle: {
    fontFamily: fuentes.regular,
    fontSize: 13,
    color: tema.tenue,
    marginTop: 1,
  },
  mas: {
    fontFamily: fuentes.semi,
    fontSize: 15,
    color: tema.marca,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: tema.tenue,
    marginTop: 6,
  },
})
