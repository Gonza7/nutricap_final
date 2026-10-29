import { StatusBar } from 'expo-status-bar'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  useFonts,
  BarlowSemiCondensed_400Regular,
  BarlowSemiCondensed_500Medium,
  BarlowSemiCondensed_600SemiBold,
  BarlowSemiCondensed_700Bold,
} from '@expo-google-fonts/barlow-semi-condensed'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { calcularTambo } from './src/calculos/tambo'
import { calcularCarne } from './src/calculos/carne'
import { fmt, num } from './src/utiles'
import { ALIMENTOS_BASE } from './src/datos/alimentosBase'
import { csvAAlimentos, csvAHistorial } from './src/respaldo/respaldo'
import { fuentes, tema } from './src/tema'
import Cabra from './src/pantallas/Cabra'
import Racion from './src/pantallas/Racion'
import Alimentos from './src/pantallas/Alimentos'
import Historial from './src/pantallas/Historial'
import Resultados from './src/pantallas/Resultados'
import AnimalCarne from './src/pantallas/AnimalCarne'
import ResultadosCarne from './src/pantallas/ResultadosCarne'
import Opciones from './src/componentes/Opciones'
import { MODULOS, moduloDe } from './src/modulos'

// Nombres con los que se guardan los datos en el dispositivo
const CLAVE = 'nutricap:tambo'                 // datos de la cabra y ración del día
const CLAVE_ALIMENTOS = 'nutricap:alimentos'   // biblioteca de alimentos (no se borra con "Empezar de cero")
const CLAVE_HISTORIAL = 'nutricap:historial'   // cálculos guardados (tampoco se borra con "Empezar de cero")
const CLAVE_PRECIOS = 'nutricap:precios'       // precios que pone el usuario a los alimentos predeterminados

// Valores con los que arranca el módulo Tambo (peso, grasa, leche y semana en 0: los carga el usuario)
const DATOS_INICIALES = {
  pv: '0',
  gb: '0',
  litros: '0',
  semanas: '0',
  actVol: '10',
  actRep: '0',
  perdida: '0',
  ganancia: '0',
  pnac: '0',
  crias: '0',
  dias: '0',
}

// Valores con los que arranca el módulo Carne (peso y ganancia en 0: los carga el usuario)
const DATOS_CARNE_INICIALES = {
  etapa: 'recria',   // 'lactante' (nacimiento a 90 días) o 'recria' (90 días a 18 meses)
  sexo: 'hembra',
  pv: '0',
  gdpv: '0',
}

// Las pestañas de abajo
// icono: nombre del ícono de Ionicons (https://icons.expo.fyi). La pestaña activa usa el relleno.
const PESTANAS = [
  { id: 'cabra', texto: 'Animal', icono: 'paw' },
  { id: 'racion', texto: 'Ración', icono: 'nutrition' },
  { id: 'alimentos', texto: 'Alimentos', icono: 'leaf' },
  { id: 'resultados', texto: 'Resultados', icono: 'bar-chart' },
  { id: 'historial', texto: 'Historial', icono: 'time' },
]

export default function App () {
  // 1. Estado
  const [modulo, setModulo] = useState('tambo')   // 'tambo' o 'carne'
  const [datos, setDatos] = useState(DATOS_INICIALES)                  // cabra lechera
  const [datosCarne, setDatosCarne] = useState(DATOS_CARNE_INICIALES)  // cabrito o recría
  const [biblioteca, setBiblioteca] = useState([]) // alimentos propios del usuario
  const [precios, setPrecios] = useState({})       // precio de cada alimento predeterminado: { id: '350' }
  const [raciones, setRaciones] = useState({ tambo: [], carne: [] })   // una ración por módulo: [{ id, kg }]
  const [historial, setHistorial] = useState([])   // cálculos guardados, el más nuevo primero
  const [cargado, setCargado] = useState(false)    // ¿ya se leyó lo guardado?
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [pestana, setPestana] = useState('cabra')  // qué pestaña se está viendo
  // Letras del diseño nuevo. fuentesListas pasa a true cuando terminan de cargar.
  const [fuentesListas] = useFonts({
    BarlowSemiCondensed_400Regular,
    BarlowSemiCondensed_500Medium,
    BarlowSemiCondensed_600SemiBold,
    BarlowSemiCondensed_700Bold,
  })

  // Al abrir la app: leer lo guardado (una sola vez). Promise.all lee las dos claves a la vez.
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CLAVE),
      AsyncStorage.getItem(CLAVE_ALIMENTOS),
      AsyncStorage.getItem(CLAVE_HISTORIAL),
      AsyncStorage.getItem(CLAVE_PRECIOS),
    ])
      .then(([textoTambo, textoAlimentos, textoHistorial, textoPrecios]) => {
        if (textoHistorial) setHistorial(JSON.parse(textoHistorial))
        if (textoPrecios) setPrecios(JSON.parse(textoPrecios))

        const tambo = textoTambo ? JSON.parse(textoTambo) : {}
        if (tambo.modulo) setModulo(tambo.modulo)
        if (tambo.datos) setDatos(tambo.datos)
        if (tambo.datosCarne) setDatosCarne(tambo.datosCarne)

        if (textoAlimentos) {
          setBiblioteca(JSON.parse(textoAlimentos))
        } else if (tambo.alimentos) {
          setBiblioteca(tambo.alimentos)   // versión anterior: los alimentos pasan a la biblioteca
        }

        if (tambo.raciones) {
          setRaciones({ tambo: [], carne: [], ...tambo.raciones })
        } else if (tambo.racion) {
          setRaciones({ tambo: tambo.racion, carne: [] })   // versión anterior: una sola ración, de tambo
        } else if (tambo.alimentos) {
          // versión más vieja: todos los alimentos estaban en la ración, con sus kg en `kg`
          setRaciones({ tambo: tambo.alimentos.map(a => ({ id: a.id, kg: (tambo.kg && tambo.kg[a.id]) || '' })), carne: [] })
        }
      })
      .catch(() => {})                 // si falla la lectura, arranca vacía
      .finally(() => setCargado(true))
  }, [])

  // Guardar el módulo elegido, los datos de los animales y las raciones cada vez que cambian
  useEffect(() => {
    if (!cargado) return   // no guardar antes de haber leído, o se pisa lo guardado
    AsyncStorage.setItem(CLAVE, JSON.stringify({ modulo, datos, datosCarne, raciones })).catch(() => {})
  }, [modulo, datos, datosCarne, raciones, cargado])

  // Guardar la biblioteca de alimentos cada vez que cambia
  useEffect(() => {
    if (!cargado) return
    AsyncStorage.setItem(CLAVE_ALIMENTOS, JSON.stringify(biblioteca)).catch(() => {})
  }, [biblioteca, cargado])

  // Guardar los precios cada vez que cambian
  useEffect(() => {
    if (!cargado) return
    AsyncStorage.setItem(CLAVE_PRECIOS, JSON.stringify(precios)).catch(() => {})
  }, [precios, cargado])

  // Guardar el historial cada vez que cambia
  useEffect(() => {
    if (!cargado) return
    AsyncStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial)).catch(() => {})
  }, [historial, cargado])

  // 2. Funciones que cambian el estado (se las pasamos a las pantallas)
  const cambiar = (campo, valor) => setDatos({ ...datos, [campo]: valor })
  const cambiarCarne = (campo, valor) => setDatosCarne({ ...datosCarne, [campo]: valor })

  // La ración del módulo que se está usando
  const racion = raciones[modulo]
  const setRacion = nueva => setRaciones({ ...raciones, [modulo]: nueva })

  // Biblioteca de alimentos
  const guardarAlimento = a => {
    const existe = biblioteca.some(x => x.id === a.id)
    const lista = existe
      ? biblioteca.map(x => (x.id === a.id ? a : x))   // editar: reemplaza el que tiene el mismo id
      : [...biblioteca, a]                              // nuevo: lo agrega al final
    setBiblioteca(lista.sort((x, y) => x.nombre.localeCompare(y.nombre)))   // orden alfabético
  }
  const borrarAlimento = id => {
    setBiblioteca(biblioteca.filter(x => x.id !== id))
    // si estaba en alguna ración (de tambo o de carne), también sale
    setRaciones({ tambo: raciones.tambo.filter(x => x.id !== id), carne: raciones.carne.filter(x => x.id !== id) })
  }

  const guardarPrecio = (id, texto) => setPrecios({ ...precios, [id]: texto })

  // Todos los alimentos: primero los predeterminados (con el precio del usuario), después los propios
  const todos = [
    ...ALIMENTOS_BASE.map(a => ({ ...a, precio: num(precios[a.id]) })),
    ...biblioteca,
  ]
  const enRacion = new Set(racion.map(item => item.id))   // para saber rápido si un alimento está en la ración

  // Ración del día
  const agregarARacion = id => {
    if (enRacion.has(id)) return   // ya está
    setRacion([...racion, { id, kg: '' }])
  }
  const sacarDeRacion = id => setRacion(racion.filter(item => item.id !== id))   // el alimento sigue en la biblioteca
  const cambiarKg = (id, kg) => setRacion(racion.map(item => (item.id === id ? { ...item, kg } : item)))

  // Borra todo con dos toques: el primero pide confirmación, el segundo borra
  const empezarDeCero = () => {
    if (!confirmarBorrado) {
      setConfirmarBorrado(true)
      setTimeout(() => setConfirmarBorrado(false), 4000)   // si no confirma en 4 s, se cancela
      return
    }
    // Solo el animal y la ración del módulo actual; alimentos, precios e historial quedan
    if (modulo === 'tambo') setDatos(DATOS_INICIALES)
    else setDatosCarne(DATOS_CARNE_INICIALES)
    setRacion([])
    setConfirmarBorrado(false)
  }

  // 3. Datos convertidos a número, con los nombres que espera tambo.js
  const cabra = {
    pv: num(datos.pv),
    gb: num(datos.gb),
    litros: num(datos.litros),
    semanasLactancia: num(datos.semanas),
    actVoluntaria: num(datos.actVol),
    actReproductiva: num(datos.actRep),
    perdidaPV: num(datos.perdida),
    gananciaPV: num(datos.ganancia),
    pesoNacimiento: num(datos.pnac),
    numeroCrias: num(datos.crias),
    diasGestacion: num(datos.dias),
  }

  // 4. Cálculos
  // Arma la ración con los datos completos de cada alimento, como la espera tambo.js
  const racionCalculo = racion
    .map(item => ({ alimento: todos.find(a => a.id === item.id), kgTalCual: num(item.kg) }))
    .filter(x => x.alimento)   // por si se borró un alimento
  const animalCarne = {
    etapa: datosCarne.etapa,
    sexo: datosCarne.sexo,
    pv: num(datosCarne.pv),
    gdpv: num(datosCarne.gdpv),
  }
  const r = modulo === 'tambo' ? calcularTambo(cabra, racionCalculo) : calcularCarne(animalCarne, racionCalculo)
  const hayRacion = r.aportes.totales.msKg > 0
  // Sin peso vivo los cálculos no tienen sentido (hay divisiones por el peso): se pide cargarlo primero
  const pesoCargado = (modulo === 'tambo' ? cabra.pv : animalCarne.pv) > 0

  // Arma una "foto" del cálculo actual. Copia los alimentos completos, así el registro
  // no cambia aunque después edites o borres un alimento. La usan el historial y el PDF.
  const armarEntrada = nombre => {
    const tot = r.aportes.totales
    const bal = r.balances
    const comun = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      nombre: nombre.trim(),
      modulo,
      racion: racionCalculo.map(x => ({ alimento: { ...x.alimento }, kg: x.kgTalCual })),
      msKg: tot.msKg,
      costo: tot.costo,
      ctmsPctPV: r.indicadores.ctmsPctPV,
      relacionCaP: r.indicadores.relacionCaP,
      alertas: r.alertas,
    }
    if (modulo === 'carne') {
      const req = r.requerimientos
      return {
        ...comun,
        datos: { ...datosCarne },
        balance: {
          pb: { requerido: req.pb, aporte: tot.pbG, balance: bal.pbG },
          em: { requerido: req.em, aporte: tot.emMcal, balance: bal.emMcal },
          ca: { requerido: req.ca, aporte: tot.caG, balance: bal.caG },
          p: { requerido: req.p, aporte: tot.pG, balance: bal.pG },
          // FDN mínima en kg, solo en recría
          fdn: req.fdnKg === null ? null : { requerido: req.fdnKg, aporte: r.indicadores.fdnKgAporte, balance: bal.fdnKg },
        },
        ctmsReferenciaPct: r.indicadores.ctmsReferenciaPct,
      }
    }
    const req = r.requerimientos.lactancia
    return {
      ...comun,
      datos: { ...datos },
      balance: {
        pb: { requerido: req.pbTotal, aporte: tot.pbG, balance: bal.pbG },
        em: { requerido: req.emTotalAjustado, aporte: tot.emMcal, balance: bal.emMcal },
        ca: { requerido: req.ca, aporte: tot.caG, balance: bal.caG },
        p: { requerido: req.p, aporte: tot.pG, balance: bal.pG },
        fdn: { requerido: req.fdnMaxPct, aporte: tot.fdnPct, balance: bal.fdnPct },
      },
      utg: r.requerimientos.ultimoTercioGestacion,   // null si no hay datos de gestación
    }
  }

  const guardarEnHistorial = nombre => {
    setHistorial([armarEntrada(nombre), ...historial])   // el más nuevo, primero
  }

  const borrarDelHistorial = id => setHistorial(historial.filter(h => h.id !== id))

  // Respaldo en CSV: importar (exportar lo hace cada pantalla con lo que elige el usuario)
  const importarAlimentos = texto => {
    const r = csvAAlimentos(texto, biblioteca, precios, ALIMENTOS_BASE)
    setBiblioteca(r.biblioteca)
    setPrecios(r.precios)
    return r.resumen
  }
  const importarHistorial = texto => {
    const r = csvAHistorial(texto, historial)
    setHistorial(r.historial)
    return r.resumen
  }

  // Vuelve a poner en la calculadora los datos y la ración de un cálculo guardado
  const cargarDelHistorial = h => {
    // Si algún alimento propio de esa ración ya no está, lo vuelve a agregar
    const faltan = h.racion
      .map(x => x.alimento)
      .filter(a => !a.predeterminado && !biblioteca.some(b => b.id === a.id))
    if (faltan.length > 0) {
      setBiblioteca([...biblioteca, ...faltan].sort((x, y) => x.nombre.localeCompare(y.nombre)))
    }
    const mod = moduloDe(h)
    if (mod === 'carne') setDatosCarne(h.datos)
    else setDatos(h.datos)
    setModulo(mod)
    setRaciones({ ...raciones, [mod]: h.racion.map(x => ({ id: x.alimento.id, kg: String(x.kg) })) })
    setPestana('resultados')
  }

  // 5. Pantalla
  if (!cargado || !fuentesListas) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 48 }}>Cargando…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Encabezado y resumen, con el mismo ancho máximo que el contenido */}
      <View style={styles.columna}>
        {/* Encabezado fijo: nombre a la izquierda, Tambo / Carne a la derecha */}
        <View style={styles.encabezado}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.titulo}>NutriCap</Text>
            <Text style={styles.subtitulo}>{MODULOS[modulo].subtitulo}</Text>
          </View>
          {/* El selector de módulo solo aparece donde cambia algo: Animal, Ración y Resultados */}
          {['cabra', 'racion', 'resultados'].includes(pestana) ? (
            <Opciones
              opciones={{ tambo: 'Tambo', carne: 'Carne' }}
              valor={modulo}
              onChange={setModulo}
            />
          ) : null}
        </View>

        {/* Resumen del balance, en todas las pestañas menos Resultados (ahí ya está completo).
            Al tocarlo se va a Resultados. */}
        {hayRacion && pesoCargado && pestana !== 'resultados' ? (
          <Pressable
            onPress={() => setPestana('resultados')}
            style={styles.resumen}
            accessibilityRole="button"
            accessibilityLabel="Balance de la ración. Tocá para ver los resultados."
          >
            <ItemResumen etiqueta="PB" valor={r.balances.pbG} decimales={0} unidad="g" />
            <ItemResumen etiqueta="EM" valor={r.balances.emMcal} decimales={2} unidad="Mcal" />
            <ItemResumen etiqueta="Ca" valor={r.balances.caG} decimales={1} unidad="g" />
            <ItemResumen etiqueta="P" valor={r.balances.pG} decimales={1} unidad="g" />
          </Pressable>
        ) : null}
      </View>

      {/* Contenido de la pestaña elegida. key={pestana} hace que al cambiar de pestaña vuelva arriba */}
      <ScrollView key={`${pestana}-${modulo}`} contentContainerStyle={[styles.columna, { padding: 16, paddingTop: 0 }]}>
        {pestana === 'cabra' && modulo === 'tambo' ? (
          <Cabra
            datos={datos}
            cambiar={cambiar}
            empezarDeCero={empezarDeCero}
            confirmarBorrado={confirmarBorrado}
          />
        ) : null}
        {pestana === 'cabra' && modulo === 'carne' ? (
          <AnimalCarne
            datos={datosCarne}
            cambiar={cambiarCarne}
            empezarDeCero={empezarDeCero}
            confirmarBorrado={confirmarBorrado}
          />
        ) : null}
        {pestana === 'racion' ? (
          <Racion
            racion={racion}
            todos={todos}
            cambiarKg={cambiarKg}
            agregarARacion={agregarARacion}
            sacarDeRacion={sacarDeRacion}
            totales={r.aportes.totales}
            irAAlimentos={() => setPestana('alimentos')}
          />
        ) : null}
        {pestana === 'alimentos' ? (
          <Alimentos
            todos={todos}
            enRacion={enRacion}
            agregarARacion={agregarARacion}
            sacarDeRacion={sacarDeRacion}
            guardarAlimento={guardarAlimento}
            borrarAlimento={borrarAlimento}
            precios={precios}
            guardarPrecio={guardarPrecio}
            importarAlimentos={importarAlimentos}
            nombreModulo={MODULOS[modulo].titulo}
          />
        ) : null}
        {pestana === 'resultados' && modulo === 'tambo' ? (
          <Resultados r={r} pesoCargado={pesoCargado} irAAnimal={() => setPestana('cabra')} guardarEnHistorial={guardarEnHistorial} armarEntrada={armarEntrada} />
        ) : null}
        {pestana === 'resultados' && modulo === 'carne' ? (
          <ResultadosCarne r={r} pesoCargado={pesoCargado} irAAnimal={() => setPestana('cabra')} guardarEnHistorial={guardarEnHistorial} armarEntrada={armarEntrada} />
        ) : null}
        {pestana === 'historial' ? (
          <Historial
            historial={historial}
            cargarDelHistorial={cargarDelHistorial}
            borrarDelHistorial={borrarDelHistorial}
            importarHistorial={importarHistorial}
          />
        ) : null}
      </ScrollView>

      {/* Barra de pestañas */}
      <View style={styles.barra}>
        <View style={[styles.columna, { flexDirection: 'row' }]}>
          {PESTANAS.map(p => {
            const activa = p.id === pestana
            return (
              <Pressable
                key={p.id}
                onPress={() => setPestana(p.id)}
                style={styles.pestana}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
              >
                <Ionicons
                  name={activa ? p.icono : `${p.icono}-outline`}
                  size={22}
                  color={activa ? tema.marca : tema.tenue}
                />
                <Text style={[styles.pestanaTexto, activa && styles.pestanaTextoActiva]}>{p.texto}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  )
}

// Un número del resumen de arriba: rojo si falta, verde si alcanza
function ItemResumen({ etiqueta, valor, decimales, unidad }) {
  const signo = valor > 0 ? '+' : ''
  return (
    <View style={styles.resumenItem}>
      <Text style={styles.resumenEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.resumenValor, { color: valor < 0 ? tema.falta : tema.sobra }]}>
        {signo}{fmt(valor, decimales)}
        <Text style={styles.resumenUnidad}> {unidad}</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tema.fondo,
  },
  columna: {
    width: '100%',
    maxWidth: 1100,      // en pantallas grandes el contenido no se estira de punta a punta
    alignSelf: 'center',
  },
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  titulo: {
    fontFamily: fuentes.negrita,
    fontSize: 28,
    color: tema.tinta,
    lineHeight: 32,
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: 15,
    color: tema.suave,
  },
  // Resumen: cuatro números en fila, entre dos líneas finas
  resumen: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tema.linea,
    paddingVertical: 8,
  },
  resumenItem: {
    flex: 1,
  },
  resumenEtiqueta: {
    fontFamily: fuentes.medio,
    fontSize: 13,
    color: tema.suave,
  },
  resumenValor: {
    fontFamily: fuentes.semi,
    fontSize: 19,
    fontVariant: ['tabular-nums'],
  },
  resumenUnidad: {
    fontFamily: fuentes.regular,
    fontSize: 13,
    color: tema.tenue,
  },
  barra: {
    borderTopWidth: 1,
    borderTopColor: tema.linea,
    paddingTop: 8,
    paddingBottom: 24,   // espacio para la barra de gestos del celular
    backgroundColor: tema.fondo,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  pestanaTexto: {
    fontFamily: fuentes.medio,
    fontSize: 13,   // chico para que entren las 5 pestañas
    color: tema.tenue,
  },
  pestanaTextoActiva: {
    color: tema.marca,
  },
})
