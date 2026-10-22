// Exportar e importar en CSV: alimentos propios + precios, e historial de cálculos.
// Son funciones "puras": reciben datos y devuelven datos nuevos, no tocan la pantalla.
import { aCsv, leerCsv, numeroCsv } from './csv'
import { nombreAlimento, sinAcentos } from '../utiles'
import { MODULOS, moduloDe, resumenAnimal } from '../modulos'

// ===================== ALIMENTOS =====================
// Mismas columnas que tu archivo alimentos_mod.csv, más "tipo" e "id" al principio.
// MS va como fracción (0,88) y PB en % (9,8), igual que tu archivo.
const COLUMNAS_ALIMENTOS = ['tipo', 'id', 'grupo', 'nombre', 'forma', 'momento', 'ms', 'em', 'pb', 'fdn', 'calcio', 'fosforo', 'precio']

// lista: los alimentos elegidos (propios y/o predeterminados, con su precio ya puesto).
// Al volver a importar, de los predeterminados solo se toma el precio: sus datos no cambian.
export function alimentosACsv(lista) {
  const filas = [COLUMNAS_ALIMENTOS]
  for (const a of lista) {
    filas.push([a.predeterminado ? 'predeterminado' : 'propio', a.id, a.grupo || '', a.nombre,
      a.forma || '', a.momento || '', a.ms, a.em, a.pb * 100, a.fdn, a.ca, a.p, a.precio || ''])
  }
  return aCsv(filas)
}

// Lee un CSV de alimentos. Acepta el exportado por NutriCap y también tu formato original
// (sin columnas tipo ni id): en ese caso todos se cargan como alimentos propios.
// Nunca borra nada: agrega los nuevos y actualiza los que ya existen.
export function csvAAlimentos(texto, biblioteca, precios, base) {
  const filas = leerCsv(texto)
  if (filas.length === 0) throw new Error('El archivo está vacío.')
  if (!('nombre' in filas[0]) || !('ms' in filas[0])) {
    throw new Error('No parece un archivo de alimentos: tiene que tener al menos las columnas "nombre" y "ms".')
  }

  const nuevaBiblioteca = [...biblioteca]
  const nuevosPrecios = { ...precios }
  const resumen = { nuevos: 0, actualizados: 0, precios: 0, errores: [] }
  const clave = a => sinAcentos([a.grupo, a.nombre, a.forma, a.momento].join('|'))

  filas.forEach((f, i) => {
    const error = motivo => resumen.errores.push(`Fila ${f._fila}: ${motivo}`)
    const esBase = sinAcentos(f.tipo || '') === 'predeterminado' || String(f.id || '').startsWith('base-')

    // Predeterminado: solo se toma el precio
    if (esBase) {
      if (!base.some(a => a.id === f.id)) return error('alimento predeterminado desconocido.')
      const precio = numeroCsv(f.precio)
      if (precio === null) return
      if (Number.isNaN(precio)) return error('el precio no es un número.')
      nuevosPrecios[f.id] = String(precio)
      resumen.precios++
      return
    }

    // Propio
    if (!f.nombre) return error('falta el nombre.')
    const valores = {}
    for (const col of ['ms', 'em', 'pb', 'fdn', 'calcio', 'fosforo', 'precio']) {
      const n = numeroCsv(f[col])
      if (Number.isNaN(n)) return error(`"${f[col]}" no es un número en la columna ${col}.`)
      valores[col] = n ?? 0
    }
    let ms = valores.ms
    if (ms > 1 && ms <= 100) ms = ms / 100   // si vino en % (88) lo pasa a fracción (0,88)
    if (!(ms > 0 && ms <= 1)) return error('la materia seca tiene que ser mayor que 0.')

    const alimento = {
      id: '',
      grupo: f.grupo || '', nombre: f.nombre, forma: f.forma || '', momento: f.momento || '',
      ms, pb: valores.pb / 100, em: valores.em, ca: valores.calcio, p: valores.fosforo,
      fdn: valores.fdn, precio: valores.precio,
    }

    // ¿Ya existe? Primero por id; si el archivo no trae id, por grupo + nombre + forma + momento
    // (solo contra los alimentos que había antes de importar, así dos filas iguales del archivo no se pisan)
    let pos = f.id ? nuevaBiblioteca.findIndex(a => a.id === f.id) : -1
    if (pos < 0 && !f.id) {
      const previo = biblioteca.find(a => clave(a) === clave(alimento))
      if (previo) pos = nuevaBiblioteca.findIndex(a => a.id === previo.id)
    }

    if (pos >= 0) {
      alimento.id = nuevaBiblioteca[pos].id
      nuevaBiblioteca[pos] = alimento
      resumen.actualizados++
    } else {
      alimento.id = f.id || `imp-${Date.now()}-${i}`
      nuevaBiblioteca.push(alimento)
      resumen.nuevos++
    }
  })

  nuevaBiblioteca.sort((x, y) => x.nombre.localeCompare(y.nombre))
  return { biblioteca: nuevaBiblioteca, precios: nuevosPrecios, resumen }
}

// ===================== HISTORIAL =====================
// Columnas legibles (para abrir en Excel) + una columna "datos_completos" con todo el cálculo,
// que es la que se usa para volver a importarlo sin perder nada.
const fechaLegible = iso =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function historialACsv(historial) {
  const filas = [[
    'id', 'fecha', 'nombre', 'modulo', 'animal', 'peso_vivo_kg', 'racion', 'ms_kg_dia',
    'pb_requerida_g', 'pb_aporte_g', 'pb_balance_g',
    'em_requerida_mcal', 'em_aporte_mcal', 'em_balance_mcal',
    'ca_requerido_g', 'ca_aporte_g', 'ca_balance_g',
    'p_requerido_g', 'p_aporte_g', 'p_balance_g',
    'fdn_requerida', 'fdn_aporte', 'fdn_balance', 'costo_dia', 'alertas', 'datos_completos',
  ]]
  const r2 = x => (Number.isFinite(x) ? Math.round(x * 100) / 100 : '')   // 2 decimales, para leer en Excel
  for (const h of historial) {
    const b = {}
    for (const k of ['pb', 'em', 'ca', 'p', 'fdn']) {
      const x = h.balance[k]   // en carne lactante no hay FDN
      b[k] = x ? { requerido: r2(x.requerido), aporte: r2(x.aporte), balance: r2(x.balance) } : { requerido: '', aporte: '', balance: '' }
    }
    filas.push([
      h.id, fechaLegible(h.fecha), h.nombre,
      MODULOS[moduloDe(h)].titulo, resumenAnimal(h), Number(String(h.datos.pv).replace(',', '.')),
      h.racion.map(x => `${nombreAlimento(x.alimento)}: ${String(x.kg).replace('.', ',')} kg`).join(' | '),
      r2(h.msKg),
      b.pb.requerido, b.pb.aporte, b.pb.balance,
      b.em.requerido, b.em.aporte, b.em.balance,
      b.ca.requerido, b.ca.aporte, b.ca.balance,
      b.p.requerido, b.p.aporte, b.p.balance,
      b.fdn.requerido, b.fdn.aporte, b.fdn.balance, r2(h.costo), h.alertas.join(' | '),
      JSON.stringify(h),
    ])
  }
  return aCsv(filas)
}

export function csvAHistorial(texto, historial) {
  const filas = leerCsv(texto)
  if (filas.length === 0) throw new Error('El archivo está vacío.')
  if (!('datos_completos' in filas[0])) {
    throw new Error('Este archivo no tiene la columna "datos_completos". Solo se pueden importar historiales exportados desde NutriCap.')
  }
  const nuevo = [...historial]
  const resumen = { nuevos: 0, repetidos: 0, errores: [] }
  for (const f of filas) {
    let h
    try {
      h = JSON.parse(f.datos_completos)
    } catch {
      resumen.errores.push(`Fila ${f._fila}: los datos están dañados.`)
      continue
    }
    if (!h || !h.id || !h.fecha || !h.datos || !Array.isArray(h.racion) || !h.balance) {
      resumen.errores.push(`Fila ${f._fila}: faltan datos del cálculo.`)
      continue
    }
    if (nuevo.some(x => x.id === h.id)) { resumen.repetidos++; continue }
    nuevo.push(h)
    resumen.nuevos++
  }
  nuevo.sort((x, y) => (x.fecha < y.fecha ? 1 : -1))   // el más nuevo primero
  return { historial: nuevo, resumen }
}
