// Pestaña "Alimentos": tabla con los alimentos predeterminados y los propios del usuario
import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Campo from '../componentes/Campo'
import FormAlimento from '../componentes/FormAlimento'
import TablaAlimentos from '../componentes/TablaAlimentos'
import Aviso, { conAviso, textoImportacion } from '../componentes/Aviso'
import SeleccionExportar from '../componentes/SeleccionExportar'
import { colores, estilos } from '../estilos'
import { fmt, nombreAlimento, sinAcentos } from '../utiles'
import { abrirArchivoTexto, guardarArchivo, guardarPdf, nombreConFecha } from '../respaldo/archivos'
import { htmlAlimentos } from '../respaldo/pdf'
import { alimentosACsv } from '../respaldo/respaldo'

const POR_PAGINA = 25   // alimentos por página

export default function Alimentos({
  todos, enRacion, agregarARacion, sacarDeRacion,
  guardarAlimento, borrarAlimento, precios, guardarPrecio,
  importarAlimentos, nombreModulo,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState('todos')       // filtro por grupo
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState(null)          // mensaje de importar
  const [exportando, setExportando] = useState(false) // ventana para elegir qué exportar
  const [elegidoId, setElegidoId] = useState(null)  // alimento abierto en la ficha
  const [editando, setEditando] = useState(false)
  const [creando, setCreando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  // Grupos que existen en la tabla, sin repetir, más "propios"
  const grupos = ['todos', ...new Set(todos.filter(a => a.predeterminado).map(a => a.grupo)), 'propios']

  // Busca cada palabra por separado: "maiz silaje" encuentra "Maiz (silaje · picado fino)"
  const palabras = sinAcentos(busqueda).split(' ').filter(Boolean)
  const filtrados = todos.filter(a => {
    const pasaGrupo = grupo === 'todos' || (grupo === 'propios' ? !a.predeterminado : a.grupo === grupo)
    const texto = sinAcentos(nombreAlimento(a))
    return pasaGrupo && palabras.every(p => texto.includes(p))
  })

  // Paginación: si cambia el filtro y la página ya no existe, se muestra la última
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const desde = (paginaActual - 1) * POR_PAGINA
  const visibles = filtrados.slice(desde, desde + POR_PAGINA)

  // Al buscar o cambiar de grupo se vuelve a la página 1
  const buscar = texto => { setBusqueda(texto); setPagina(1) }
  const elegirGrupo = g => { setGrupo(g); setPagina(1) }

  // ---- Exportar: se eligen los alimentos en una ventana ----
  const ids = lista => lista.map(a => a.id)
  const propios = todos.filter(a => !a.predeterminado)
  const conPrecio = todos.filter(a => a.precio > 0)
  const atajos = [
    { texto: 'Propios', ids: ids(propios) },
    { texto: 'Con precio', ids: ids(conPrecio) },
    { texto: 'Propios y con precio', ids: ids([...propios, ...conPrecio]) },
    { texto: 'Filtro actual', ids: ids(filtrados) },
    { texto: 'Todos', ids: ids(todos) },
    { texto: 'Ninguno', ids: [] },
  ]
  // Al abrir vienen marcados los propios y los que tienen precio (lo que conviene respaldar).
  // Si no hay ninguno, los del filtro actual.
  const inicial = propios.length + conPrecio.length > 0 ? ids([...propios, ...conPrecio]) : ids(filtrados)
  const itemsExportar = todos.map(a => ({
    id: a.id,
    titulo: nombreAlimento(a) + (a.predeterminado ? '' : ' · propio'),
    detalle: `MS ${fmt(a.ms * 100, 1)} % · PB ${fmt(a.pb * 100, 1)} % · EM ${fmt(a.em, 2)}${a.precio ? ` · $ ${fmt(a.precio, 0)}/kg` : ''}`,
  }))
  const elegidos = lista => todos.filter(a => lista.includes(a.id))

  const accionesExportar = [
    {
      texto: 'Exportar CSV',
      onPress: async lista => {
        await guardarArchivo(nombreConFecha('alimentos', 'csv'), alimentosACsv(elegidos(lista)))
        return `Listo: se exportaron ${lista.length} alimento(s).`
      },
    },
    {
      texto: 'Descargar PDF',
      onPress: async lista => {
        await guardarPdf(nombreConFecha('alimentos', 'pdf'),
          htmlAlimentos(elegidos(lista), `${lista.length} alimento(s) elegido(s)`), { width: 842, height: 595 })
        return null
      },
    },
  ]

  const importar = () => conAviso(setAviso, async () => {
    const texto = await abrirArchivoTexto()
    if (texto === null) return null   // canceló
    const r = importarAlimentos(texto)
    return textoImportacion([
      r.nuevos && `${r.nuevos} alimento(s) nuevo(s)`,
      r.actualizados && `${r.actualizados} actualizado(s)`,
      r.precios && `${r.precios} precio(s)`,
    ], r.errores)
  })

  const elegido = todos.find(a => a.id === elegidoId)   // siempre la versión actual
  const cerrarFicha = () => { setElegidoId(null); setEditando(false); setConfirmar(false) }

  const pedirBorrado = () => {
    if (!confirmar) {
      setConfirmar(true)
      setTimeout(() => setConfirmar(false), 4000)
      return
    }
    borrarAlimento(elegido.id)
    cerrarFicha()
  }

  return (
    <View>
      <Text style={styles.destino}>
        Agregando a la ración de: <Text style={{ fontWeight: 'bold' }}>{nombreModulo}</Text>
        {'  '}(se cambia desde la pestaña Animal, Ración o Resultados)
      </Text>

      <Pressable onPress={() => setCreando(true)} style={styles.botonNuevo}>
        <Text style={styles.botonNuevoTexto}>+ Nuevo alimento</Text>
      </Pressable>

      <View style={estilos.filaBotones}>
        <Pressable onPress={() => setExportando(true)} style={estilos.botonChico}>
          <Text style={estilos.botonChicoTexto}>Exportar (CSV o PDF)…</Text>
        </Pressable>
        <Pressable onPress={importar} style={estilos.botonChico}>
          <Text style={estilos.botonChicoTexto}>Importar CSV</Text>
        </Pressable>
      </View>
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

      <Campo etiqueta="Buscar" teclado="default" valor={busqueda} onChange={buscar} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {grupos.map(g => (
            <Pressable key={g} onPress={() => elegirGrupo(g)} style={[styles.chip, grupo === g && styles.chipActivo]}>
              <Text style={[styles.chipTexto, grupo === g && styles.chipTextoActivo]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.cuenta}>
        {filtrados.length === 0
          ? `0 de ${todos.length} alimentos`
          : `${desde + 1}–${desde + visibles.length} de ${filtrados.length} alimentos`}
        {' · '}tocá uno para ver opciones · ✓ = en la ración
      </Text>
      {filtrados.length === 0 ? (
        <Text>No hay alimentos que coincidan con la búsqueda.</Text>
      ) : (
        <TablaAlimentos alimentos={visibles} enRacion={enRacion} onTocar={a => setElegidoId(a.id)} />
      )}

      {totalPaginas > 1 ? (
        <View style={styles.paginacion}>
          <Pressable
            onPress={() => setPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            style={[styles.botonPagina, paginaActual === 1 && styles.botonPaginaInactivo]}
          >
            <Text style={styles.botonPaginaTexto}>‹ Anterior</Text>
          </Pressable>
          <Text style={styles.textoPagina}>Página {paginaActual} de {totalPaginas}</Text>
          <Pressable
            onPress={() => setPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            style={[styles.botonPagina, paginaActual === totalPaginas && styles.botonPaginaInactivo]}
          >
            <Text style={styles.botonPaginaTexto}>Siguiente ›</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Ficha de un alimento: se abre al tocar una fila */}
      <Modal visible={!!elegido} transparent animationType="slide" onRequestClose={cerrarFicha}>
        <View style={styles.fondoModal}>
          <View style={styles.hoja}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {elegido ? (
                <View>
                  <Text style={styles.etiquetaTipo}>{elegido.predeterminado ? 'Predeterminado' : 'Alimento propio'}</Text>
                  <Text style={styles.tituloFicha}>{nombreAlimento(elegido)}</Text>

                  {editando ? (
                    <FormAlimento
                      inicial={elegido}
                      onGuardar={a => { guardarAlimento(a); setEditando(false) }}
                      onCancelar={() => setEditando(false)}
                    />
                  ) : (
                    <View>
                      <Text style={styles.dato}>
                        MS {(elegido.ms * 100).toFixed(1)} % · PB {(elegido.pb * 100).toFixed(1)} % · EM {elegido.em} Mcal/kg MS
                      </Text>
                      <Text style={styles.dato}>
                        Ca {elegido.ca} g/kg · P {elegido.p} g/kg · FDN {elegido.fdn} %
                      </Text>
                      {elegido.ms <= 0 ? (
                        <Text style={[estilos.alerta, { marginTop: 8 }]}>
                          Este alimento no tiene dato de materia seca: no aporta nada a la ración.
                        </Text>
                      ) : null}

                      <View style={{ height: 12 }} />
                      {enRacion.has(elegido.id) ? (
                        <Pressable onPress={() => sacarDeRacion(elegido.id)} style={styles.botonBorde}>
                          <Text style={styles.botonBordeTexto}>✓ En la ración de {nombreModulo.toLowerCase()} · Sacar</Text>
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => { agregarARacion(elegido.id); cerrarFicha() }} style={styles.boton}>
                          <Text style={styles.botonTexto}>Agregar a la ración de {nombreModulo.toLowerCase()}</Text>
                        </Pressable>
                      )}

                      {elegido.predeterminado ? (
                        <View style={{ marginTop: 16 }}>
                          <Campo
                            etiqueta="Tu precio ($/kg tal cual)"
                            ayuda="Se guarda solo para vos. Los datos nutricionales de la tabla no se pueden cambiar."
                            valor={precios[elegido.id] || ''}
                            onChange={v => guardarPrecio(elegido.id, v)}
                          />
                        </View>
                      ) : (
                        <View style={[estilos.fila, { marginTop: 12 }]}>
                          <Pressable onPress={() => setEditando(true)} style={estilos.quitar}>
                            <Text style={{ color: colores.verde, fontWeight: '600' }}>Editar</Text>
                          </Pressable>
                          <Pressable onPress={pedirBorrado} style={estilos.quitar}>
                            <Text style={estilos.quitarTexto}>{confirmar ? '¿Seguro? Tocá de nuevo' : 'Borrar'}</Text>
                          </Pressable>
                        </View>
                      )}

                      <Pressable onPress={cerrarFicha} style={styles.cerrar}>
                        <Text style={{ color: colores.gris, fontWeight: '600' }}>Cerrar</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SeleccionExportar
        visible={exportando}
        onCerrar={() => setExportando(false)}
        titulo="Exportar alimentos"
        items={itemsExportar}
        atajos={atajos}
        inicial={inicial}
        acciones={accionesExportar}
      />

      {/* Formulario para crear un alimento propio */}
      <Modal visible={creando} transparent animationType="slide" onRequestClose={() => setCreando(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.hoja}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.tituloFicha}>Nuevo alimento</Text>
              <FormAlimento
                onGuardar={a => { guardarAlimento(a); setCreando(false); setGrupo('propios') }}
                onCancelar={() => setCreando(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  destino: {
    marginTop: 12,
    fontSize: 13,
    color: colores.gris,
  },
  paginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  botonPagina: {
    borderWidth: 1,
    borderColor: colores.verde,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botonPaginaInactivo: {
    opacity: 0.35,
  },
  botonPaginaTexto: {
    color: colores.verde,
    fontWeight: '600',
  },
  textoPagina: {
    color: colores.gris,
  },
  botonNuevo: {
    alignSelf: 'flex-start',
    backgroundColor: colores.verde,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  botonNuevoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chip: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  chipActivo: {
    backgroundColor: colores.verde,
    borderColor: colores.verde,
  },
  chipTexto: {
    color: colores.gris,
    fontWeight: '600',
  },
  chipTextoActivo: {
    color: '#fff',
  },
  cuenta: {
    fontSize: 12,
    color: colores.gris,
    marginBottom: 6,
  },
  fondoModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  hoja: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  etiquetaTipo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colores.verde,
    textTransform: 'uppercase',
  },
  tituloFicha: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 10,
  },
  dato: {
    color: '#333',
    marginBottom: 2,
  },
  boton: {
    backgroundColor: colores.verde,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonBorde: {
    borderWidth: 1,
    borderColor: colores.verde,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  botonBordeTexto: {
    color: colores.verde,
    fontWeight: 'bold',
  },
  cerrar: {
    marginTop: 16,
    padding: 10,
    alignItems: 'center',
  },
})
