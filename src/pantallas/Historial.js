// Pestaña "Historial": cálculos guardados. Cada uno es una "foto" del momento en que se guardó.
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import FilaBalance from '../componentes/FilaBalance'
import Aviso, { conAviso, textoImportacion } from '../componentes/Aviso'
import SeleccionExportar from '../componentes/SeleccionExportar'
import { colores, estilos } from '../estilos'
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
        <Text>Todavía no guardaste cálculos. Armá una ración y tocá "Guardar en el historial" en la pestaña Resultados.</Text>
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
            <Text style={styles.modulo}>{MODULOS[moduloDe(h)].titulo}</Text>
            <Text style={styles.nombre}>{h.nombre || 'Sin nombre'}</Text>
            <Text style={styles.detalle}>{formatoFecha(h.fecha)}</Text>
            <Text style={styles.detalle}>{resumenAnimal(h)}</Text>
            <Text style={styles.resumen}>
              <Text style={{ color: b.pb.balance < 0 ? colores.rojo : '#2f7a3a' }}>
                PB {signo(b.pb.balance)}{b.pb.balance.toFixed(0)} g
              </Text>
              {'  ·  '}
              <Text style={{ color: b.em.balance < 0 ? colores.rojo : '#2f7a3a' }}>
                EM {signo(b.em.balance)}{b.em.balance.toFixed(2)} Mcal
              </Text>
              {'  ·  '}${h.costo.toFixed(0)}/día
            </Text>

            {abierto === h.id ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.subtitulo}>Ración</Text>
                {h.racion.map(x => (
                  <Text key={x.alimento.id} style={styles.detalle}>• {nombreAlimento(x.alimento)}: {x.kg} kg</Text>
                ))}
                <Text style={styles.subtitulo}>Balance</Text>
                {filasBalance(h).map(f => <FilaBalance key={f.clave} {...f} />)}
                <Text style={[styles.detalle, { marginTop: 6 }]}>
                  Consumo de MS {h.ctmsPctPV.toFixed(2)} % PV · Ca/P {h.relacionCaP ? h.relacionCaP.toFixed(2) : '–'}
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
  tarjeta: {
    borderWidth: 1,
    borderColor: colores.linea,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  modulo: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colores.verde,
    textTransform: 'uppercase',
  },
  detalle: {
    color: colores.gris,
    fontSize: 13,
  },
  resumen: {
    fontWeight: '600',
    marginTop: 4,
  },
  subtitulo: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  accion: {
    color: colores.verde,
    fontWeight: '600',
  },
})
