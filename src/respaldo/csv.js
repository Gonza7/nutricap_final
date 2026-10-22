// Leer y escribir CSV con el formato que usa Excel en español: separador ";" y coma decimal.

// Un valor listo para el CSV: números con coma decimal; texto entre comillas si hace falta
const celda = valor => {
  if (valor === null || valor === undefined) return ''
  let texto = typeof valor === 'number' ? String(+valor.toFixed(6)).replace('.', ',') : String(valor)
  if (/[;"\r\n]/.test(texto)) texto = '"' + texto.replace(/"/g, '""') + '"'
  return texto
}

// filas: [['titulo1', 'titulo2'], [valor, valor], ...] → texto CSV
// El "\uFEFF" del principio hace que Excel reconozca los acentos.
export const aCsv = filas => '\uFEFF' + filas.map(f => f.map(celda).join(';')).join('\r\n') + '\r\n'

// Texto CSV → lista de objetos usando la primera fila como nombres de columna.
// Acepta ";" o "," como separador, comillas, y saltos de línea dentro de una celda.
export function leerCsv(texto) {
  texto = texto.replace(/^\uFEFF/, '')
  const primeraLinea = texto.split(/\r?\n/)[0] || ''
  const sep = (primeraLinea.match(/;/g) || []).length >= (primeraLinea.match(/,/g) || []).length ? ';' : ','

  const filas = []
  let fila = [], actual = '', entreComillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') { actual += '"'; i++ }
      else if (c === '"') entreComillas = false
      else actual += c
    } else if (c === '"') entreComillas = true
    else if (c === sep) { fila.push(actual); actual = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(actual); filas.push(fila); fila = []; actual = ''
    } else actual += c
  }
  if (actual !== '' || fila.length > 0) { fila.push(actual); filas.push(fila) }

  const utiles = filas.filter(f => f.some(v => v.trim() !== ''))   // saca filas vacías
  if (utiles.length === 0) return []
  const titulos = utiles[0].map(t => normalizarTitulo(t))
  return utiles.slice(1).map((f, i) => {
    const obj = { _fila: i + 2 }   // número de fila en el archivo, para los mensajes de error
    titulos.forEach((t, j) => { obj[t] = (f[j] ?? '').trim() })
    return obj
  })
}

// 'Fósforo ' → 'fosforo'
const normalizarTitulo = t =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, '_')

// '0,88' o '0.88' → 0.88 ; vacío → null
export const numeroCsv = t => {
  const limpio = String(t ?? '').trim().replace(/\s/g, '').replace(',', '.')
  if (limpio === '') return null
  const n = Number(limpio)
  return Number.isFinite(n) ? n : NaN
}
