// Colores y letras del diseño nuevo. Todo sale de acá, así se cambia en un solo lugar.
//
// Idea: la app es casi toda en grises. El color se usa solo cuando dice algo:
// rojo = falta o se pasa, verde = sobra o está bien. Así lo importante salta a la vista.

export const tema = {
  tinta: '#1d211e',      // texto principal
  suave: '#5f6660',      // texto secundario (etiquetas, unidades)
  tenue: '#8d938e',      // texto de ayuda
  linea: '#e1e4df',      // bordes y separadores
  superficie: '#f4f5f2', // fondo de las barras y zonas apagadas
  fondo: '#ffffff',
  marca: '#2f4a35',      // verde oscuro de la app (botones, pestaña activa)
  falta: '#a8432f',      // rojo apagado: falta o se pasa
  sobra: '#3d6b4a',      // verde: sobra o está dentro de lo esperado
}

// Barlow Semi Condensed: angosta y muy clara, entran más números por fila
export const fuentes = {
  regular: 'BarlowSemiCondensed_400Regular',
  medio: 'BarlowSemiCondensed_500Medium',
  semi: 'BarlowSemiCondensed_600SemiBold',
  negrita: 'BarlowSemiCondensed_700Bold',
}
