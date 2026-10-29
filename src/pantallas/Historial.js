// Pestaña "Historial": cálculos guardados. Cada uno es una "foto" del momento en que se guardó.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import BarraBalance from '../componentes/BarraBalance'
import Aviso, { conAviso, textoImportacion } from '../componentes/Aviso'
import SeleccionExportar from '../componentes/SeleccionExportar'
import { estilos } from '../estilos'
import { fuentes, tema } from '../tema'
import { fmt, nombreAlimento } from '../utiles'
import { MODULOS, filasBalance, moduloDe, resumenAnimal } from '../modulos'
import { abrirArchivoTexto, guardarArchivo, guardarPdf, nombreConFecha } from '../respaldo/archivos'
import { htmlCalculo, htmlCalculos } from '../respaldo/pdf'
import { historialACsv } from '../respaldo/respaldo'

const formatoFecha = iso =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Historial({ historial, cargarDelHistorial, borrarDelHistorial, importarHistorial }) {
  const [abierto, setAbierto] = useState(null)      // id del cálculo que muestra el detalle
  const [confirmar, setConfirmar] = useState(null)  // id del cálculo a punto de borrarse
  const [aviso, setAviso] = useState(null)
  const [exportando, setExportando] = useState(false)   // ventana para elegir qué cálculos exportar

  const pdf = h => conAviso(setAviso, async () => {
    await guardarPdf(nombreConFecha(`racion-${h.nombre || 'sin-nombre'}`, 'pdf'), htmlCalculo(h))
    return null
  })

  // ---- Exportar: se eligen los cálculos en una ventana ----
  const elegidos = lista => historial.filter(h => lista.includes(h.id))
  const itemsExportar = historial.map(h => ({
    id: h.id,
    titulo: `${h.nombre || 'Sin nombre'} · ${MODULOS[moduloDe(h)].titulo}`,
    detalle: `${formatoFecha(h.fecha)} · PB ${h.balance.pb.balance > 0 ? '+' : ''}${fmt(h.balance.pb.balance, 0)} g · EM ${h.balance.em.balance > 0 ? '+' : ''}${fmt(h.balance.em.balance, 2)} Mcal`,
  }))
  const hace30dias = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const atajos = [
    { texto: 'Todos', ids: historial.map(h => h.id) },
    { texto: 'Últimos 30 días', ids: historial.filter(h => h.fecha >= hace30dias).map(h => h.id) },
    { texto: 'Ninguno', ids: [] },
  ]
  const accionesExportar = [
    {
      texto: 'Exportar CSV',
      onPress: async lista => {
        await guardarArchivo(nombreConFecha('historial', 'csv'), historialACsv(elegidos(lista)))
        return `Listo: se exportaron ${lista.length} cálculo(s).`
      },
    },
    {
      texto: 'Descargar PDF',
      onPress: async lista => {
        await guardarPdf(nombreConFecha('raciones', 'pdf'), htmlCalculos(elegidos(lista)))
        return null
      },
    },
  ]

  const importar = () => conAviso(setAviso, async () => {
    const texto = await abrirArchivoTexto()
    if (texto === null) return null
    const r = importarHistorial(texto)
    return textoImportacion([
      r.nuevos && `${r.nuevos} cálculo(s) nuevo(s)`,
      r.repetidos && `${r.repetidos} ya estaban`,
    ], r.errores)
  })

  // Botones de exportar e importar (se muestran también con el historial vacío, para poder importar)
  const botones = (
    <View>
      <View style={estilos.filaBotones}>
        {historial.length > 0 ? (
          <Pressable onPress={() => setExportando(true)} style={estilos.botonChico}>
            <Text style={estilos.botonChicoTexto}>Exportar (CSV o PDF)…</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={importar} style={estilos.botonChico}>
          <Text style={estilos.botonChicoTexto}>Importar CSV</Text>
        </Pressable>
      </View>
      <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
      <SeleccionExportar
        visible={exportando}
        onCerrar={() => setExportando(false)}
        titulo="Exportar cálculos"
        items={itemsExportar}
        atajos={atajos}
        inicial={historial.map(h => h.id)}
        acciones={accionesExportar}
      />
    </View>
  )

  const pedirBorrado = id => {
    if (confirmar !== id) {
      setConfirmar(id)
      setTimeout(() => setConfirmar(null), 4000)
      return
    }
    borrarDelHistorial(id)
    setConfirmar(null)
  }

  if (historial.length === 0) {
    return (
      <View>
        <Text style={estilos.seccion}>Historial</Text>
        {botones}
        <Text style={styles.vacio}>
          Todavía no guardaste cálculos. Armá una ración y tocá "Guardar en el historial" en la pestaña Resultados.
        </Text>
      </View>
    )
  }

  return (
    <View>
      <Text style={estilos.seccion}>Historial ({historial.length})</Text>
      {botones}
      {historial.map(h => {
        const b = h.balance
        const signo = x => (x > 0 ? '+' : '')
        return (
          <View key={h.id} style={styles.tarjeta}>
            <View style={styles.cabeza}>
              <Text style={styles.nombre}>{h.nombre || 'Sin nombre'}</Text>
              <Text style={styles.modulo}>{MODULOS[moduloDe(h)].titulo}</Text>
            </View>
            <Text style={styles.detalle}>{formatoFecha(h.fecha)}</Text>
            <Text style={styles.detalle}>{resumenAnimal(h)}</Text>

            {/* Resumen: tres números en fila */}
            <View style={styles.resumen}>
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>PB</Text>
                <Text style={[styles.datoValor, { color: b.pb.balance < 0 ? tema.falta : tema.sobra }]}>
                  {signo(b.pb.balance)}{fmt(b.pb.balance, 0)} <Text style={styles.datoUnidad}>g</Text>
                </Text>
              </View>
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>EM</Text>
                <Text style={[styles.datoValor, { color: b.em.balance < 0 ? tema.falta : tema.sobra }]}>
                  {signo(b.em.balance)}{fmt(b.em.balance, 2)} <Text style={styles.datoUnidad}>Mcal</Text>
                </Text>
              </View>
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>Costo</Text>
                <Text style={styles.datoValor}>
                  $ {fmt(h.costo, 0)} <Text style={styles.datoUnidad}>por día</Text>
                </Text>
              </View>
            </View>

            {abierto === h.id ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.subtitulo}>Ración</Text>
                {h.racion.map(x => (
                  <View key={x.alimento.id} style={styles.renglon}>
                    <Text style={styles.renglonNombre}>{nombreAlimento(x.alimento)}</Text>
                    <Text style={styles.renglonKg}>{fmt(Number(x.kg), 2)} kg</Text>
                  </View>
                ))}
                <Text style={styles.subtitulo}>Balance</Text>
                {filasBalance(h).map(f => <BarraBalance key={f.clave} {...f} nombre={f.titulo} />)}
                <Text style={[styles.detalle, { marginTop: 8 }]}>
                  Consumo de MS: {fmt(h.ctmsPctPV, 2)} % del peso vivo. Relación Ca/P: {h.relacionCaP ? fmt(h.relacionCaP, 2) : '–'}.
                </Text>
                {h.alertas.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    {h.alertas.map(a => <Text key={a} style={estilos.alerta}>{a}</Text>)}
                  </View>
                ) : (
                  <Text style={[estilos.ok, { marginTop: 8 }]}>La ración cubría los requerimientos.</Text>
                )}
              </View>
            ) : null}

            <View style={[estilos.fila, { flexWrap: 'wrap', marginTop: 4 }]}>
              <Pressable onPress={() => setAbierto(abierto === h.id ? null : h.id)} style={estilos.quitar}>
                <Text style={styles.accion}>{abierto === h.id ? 'Ocultar detalle' : 'Ver detalle'}</Text>
              </Pressable>
              <Pressable onPress={() => cargarDelHistorial(h)} style={estilos.quitar}>
                <Text style={styles.accion}>Cargar</Text>
              </Pressable>
              <Pressable onPress={() => pdf(h)} style={estilos.quitar}>
                <Text style={styles.accion}>PDF</Text>
              </Pressable>
              <Pressable onPress={() => pedirBorrado(h.id)} style={estilos.quitar}>
                <Text style={estilos.quitarTexto}>{confirmar === h.id ? '¿Seguro? Tocá de nuevo' : 'Borrar'}</Text>
              </Pressable>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  vacio: {
    fontFamily: fuentes.regular,
    fontSize: 16,
    color: tema.suave,
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: tema.linea,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cabeza: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  nombre: {
    fontFamily: fuentes.semi,
    fontSize: 19,
    color: tema.tinta,
    flexShrink: 1,
  },
  modulo: {
    fontFamily: fuentes.medio,
    fontSize: 14,
    color: tema.marca,
  },
  detalle: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: tema.suave,
  },
  resumen: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: tema.linea,
  },
  dato: {
    flex: 1,
  },
  datoEtiqueta: {
    fontFamily: fuentes.medio,
    fontSize: 13,
    color: tema.suave,
  },
  datoValor: {
    fontFamily: fuentes.semi,
    fontSize: 18,
    color: tema.tinta,
    fontVariant: ['tabular-nums'],
  },
  datoUnidad: {
    fontFamily: fuentes.regular,
    fontSize: 13,
    color: tema.tenue,
  },
  subtitulo: {
    fontFamily: fuentes.semi,
    fontSize: 16,
    color: tema.tinta,
    marginTop: 14,
    marginBottom: 4,
  },
  renglon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  renglonNombre: {
    fontFamily: fuentes.regular,
    fontSize: 15,
    color: tema.tinta,
    flexShrink: 1,
  },
  renglonKg: {
    fontFamily: fuentes.medio,
    fontSize: 15,
    color: tema.tinta,
    fontVariant: ['tabular-nums'],
  },
  accion: {
    fontFamily: fuentes.semi,
    fontSize: 15,
    color: tema.marca,
  },
})
