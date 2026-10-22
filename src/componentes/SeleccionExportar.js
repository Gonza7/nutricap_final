// Ventana para elegir qué exportar: una lista con casillas, buscador, atajos y botones de acción.
// La usan la pestaña Alimentos y la pestaña Historial.
import { useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Aviso, { conAviso } from './Aviso'
import { colores, estilos } from '../estilos'
import { sinAcentos } from '../utiles'

// items:    [{ id, titulo, detalle }]
// atajos:   [{ texto, ids }]  → botones para marcar un grupo de una vez
// inicial:  ids marcados al abrir
// acciones: [{ texto, onPress: async ids => texto del aviso }]
export default function SeleccionExportar({ visible, onCerrar, titulo, items, atajos, inicial, acciones }) {
  const [seleccion, setSeleccion] = useState(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [aviso, setAviso] = useState(null)

  // Cada vez que se abre, arranca con la selección inicial
  useEffect(() => {
    if (visible) {
      setSeleccion(new Set(inicial))
      setBusqueda('')
      setAviso(null)
    }
  }, [visible])

  const palabras = sinAcentos(busqueda).split(' ').filter(Boolean)
  const visibles = items.filter(it => {
    const texto = sinAcentos(`${it.titulo} ${it.detalle || ''}`)
    return palabras.every(p => texto.includes(p))
  })

  // Se usa la forma "prev => ..." de setSeleccion para partir siempre de la selección más reciente.
  // En React no se modifica el estado: se crea un Set nuevo.
  const alternar = id => setSeleccion(prev => {
    const nueva = new Set(prev)
    if (nueva.has(id)) nueva.delete(id)
    else nueva.add(id)
    return nueva
  })

  const ejecutar = accion => conAviso(setAviso, async () => {
    const ids = items.filter(it => seleccion.has(it.id)).map(it => it.id)   // en el orden de la lista
    if (ids.length === 0) throw new Error('Marcá al menos uno.')
    return await accion.onPress(ids)
  })

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={styles.hoja}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.cuenta}>{seleccion.size} de {items.length} marcados</Text>

          <View style={styles.atajos}>
            {atajos.map(a => (
              <Pressable key={a.texto} onPress={() => setSeleccion(new Set(a.ids))} style={styles.atajo}>
                <Text style={styles.atajoTexto}>{a.texto}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.buscar}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar…"
            placeholderTextColor={colores.gris}
          />

          <FlatList
            style={styles.lista}
            data={visibles}
            extraData={seleccion}   // le avisa a la lista que se vuelva a dibujar cuando cambian las casillas
            keyExtractor={it => it.id}
            ListEmptyComponent={<Text style={styles.vacio}>No hay resultados.</Text>}
            renderItem={({ item }) => {
              const marcado = seleccion.has(item.id)
              return (
                <Pressable onPress={() => alternar(item.id)} style={styles.fila} accessibilityRole="checkbox" accessibilityState={{ checked: marcado }}>
                  <View style={[styles.casilla, marcado && styles.casillaMarcada]}>
                    {marcado ? <Text style={styles.tilde}>✓</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo} numberOfLines={1}>{item.titulo}</Text>
                    {item.detalle ? <Text style={styles.itemDetalle} numberOfLines={1}>{item.detalle}</Text> : null}
                  </View>
                </Pressable>
              )
            }}
          />

          <View style={{ marginTop: 10 }}>
            <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
          </View>
          <View style={styles.acciones}>
            {acciones.map(a => (
              <Pressable key={a.texto} onPress={() => ejecutar(a)} style={styles.accion}>
                <Text style={styles.accionTexto}>{a.texto}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onCerrar} style={styles.cerrar}>
            <Text style={{ color: colores.gris, fontWeight: '600' }}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  hoja: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
    paddingBottom: 28,
    height: '88%',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cuenta: {
    color: colores.gris,
    marginBottom: 8,
  },
  atajos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  atajo: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  atajoTexto: {
    color: colores.verde,
    fontWeight: '600',
    fontSize: 13,
  },
  buscar: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  lista: {
    flex: 1,
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 6,
  },
  vacio: {
    padding: 12,
    color: colores.gris,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  casilla: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colores.verde,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: {
    backgroundColor: colores.verde,
  },
  tilde: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 16,
  },
  itemTitulo: {
    fontWeight: '600',
  },
  itemDetalle: {
    fontSize: 12,
    color: colores.gris,
  },
  acciones: {
    flexDirection: 'row',
    gap: 8,
  },
  accion: {
    flex: 1,
    backgroundColor: colores.verde,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  accionTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cerrar: {
    marginTop: 6,
    padding: 8,
    alignItems: 'center',
  },
})
