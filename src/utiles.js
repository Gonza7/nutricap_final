export const num = texto => parseFloat(String(texto).replace(',', '.')) || 0

// Primera letra en mayúscula: 'maiz' → 'Maiz'
export const mayuscula = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '')

// Grupo, forma y momento juntos: 'silaje · picado fino · grano pastoso'
export const detalleAlimento = a => [a.grupo, a.forma, a.momento].filter(Boolean).join(' · ')

// Nombre para mostrar en la ración y el historial: 'Maiz (silaje · picado fino · grano pastoso)'
export const nombreAlimento = a => {
  const detalle = detalleAlimento(a)
  return detalle ? `${mayuscula(a.nombre)} (${detalle})` : mayuscula(a.nombre)
}

// Para buscar sin importar acentos ni mayúsculas: 'Maíz' y 'maiz' coinciden
export const sinAcentos = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Número con formato argentino: 1234.5 → '1.234,50'
export const fmt = (x, decimales = 2) =>
  Number.isFinite(x) ? x.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) : '–'

// Estado de un balance: 'Falta', 'Justo', 'Sobra' (o 'OK' / 'Se pasa' para máximos como la FDN)
export const estadoBalance = (balance, requerido, alReves) => {
  if (alReves) return balance > 0 ? 'Se pasa' : 'OK'
  const tolerancia = Math.abs(requerido) * 0.03   // ±3 % se considera "justo"
  if (balance < -tolerancia) return 'Falta'
  if (balance > tolerancia) return 'Sobra'
  return 'Justo'
}
