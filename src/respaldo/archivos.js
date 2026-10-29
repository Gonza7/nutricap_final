// Guardar, compartir, abrir e imprimir archivos. Funciona distinto en la web y en el celular:
// - Web: el archivo se descarga y el PDF se arma con la ventana de impresión del navegador.
// - Celular: el archivo se crea en la memoria de la app y se abre el menú "Compartir"
//   (guardar en Archivos, mandar por WhatsApp o mail, subir a Drive, etc.).
import { Platform } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

const esWeb = Platform.OS === 'web'

// Nombre de archivo con la fecha: 'nutricap-alimentos-2026-10-21.csv'.
// Cambia espacios y símbolos raros por guiones para que sea un nombre válido en cualquier sistema.
export const nombreConFecha = (base, extension) => {
  const limpio = base.replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ_-]+/g, '-')
  return `nutricap-${limpio}-${new Date().toISOString().slice(0, 10)}.${extension}`
}

// Guarda un texto como archivo (CSV) y lo ofrece para descargar o compartir
export async function guardarArchivo(nombre, contenido, tipo = 'text/csv') {
  if (esWeb) {
    const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = nombre
    enlace.click()
    URL.revokeObjectURL(enlace.href)
    return
  }
  const archivo = new File(Paths.cache, nombre)
  archivo.create({ overwrite: true })
  archivo.write(contenido)
  await Sharing.shareAsync(archivo.uri, { mimeType: tipo, dialogTitle: nombre })
}

// Abre el selector de archivos y devuelve el texto del archivo elegido (o null si cancela)
export async function abrirArchivoTexto() {
  if (esWeb) {
    const resultado = await DocumentPicker.getDocumentAsync({ type: '*/*' })
    if (resultado.canceled) return null
    return await resultado.assets[0].file.text()
  }

  // Celular: se usa el selector de expo-file-system, que le da a la app permiso para leer
  // el archivo elegido (venga de WhatsApp, Descargas, Drive, etc.)
  const resultado = await File.pickFileAsync({ mimeTypes: '*/*' })
  if (resultado.canceled) return null
  const archivo = resultado.result
  try {
    return await archivo.text()
  } catch {
    try {
      // Plan B: leerlo como lo haría un navegador
      const respuesta = await fetch(archivo.uri)
      return await respuesta.text()
    } catch {
      throw new Error('No se pudo leer el archivo. Guardalo primero en Descargas o en Archivos y elegilo desde ahí.')
    }
  }
}

// Convierte un HTML en PDF. opciones: { width, height } en puntos (A4 vertical = 595 x 842)
// Espera a que cargue la hoja de estilos de Google Fonts y después la letra del PDF
async function esperarLetra(doc) {
  try {
    const link = doc.querySelector('link[rel="stylesheet"]')
    if (link && !link.sheet) {
      await new Promise(r => { link.onload = r; link.onerror = r })
    }
    await doc.fonts.load('16px "Barlow Semi Condensed"')
    await doc.fonts.load('600 16px "Barlow Semi Condensed"')
    await doc.fonts.ready
  } catch {
    // sin internet: se imprime con la letra de la computadora
  }
}

export async function guardarPdf(nombre, html, opciones = {}) {
  if (esWeb) {
    // Se arma un marco invisible con el documento y se abre la ventana de impresión,
    // donde se elige "Guardar como PDF" como destino.
    const marco = document.createElement('iframe')
    marco.style.position = 'fixed'
    marco.style.width = '0'
    marco.style.height = '0'
    marco.style.border = '0'
    document.body.appendChild(marco)
    marco.contentDocument.open()
    marco.contentDocument.write(html)
    marco.contentDocument.close()
    marco.contentDocument.title = nombre.replace('.pdf', '')   // nombre sugerido del PDF
    // Antes de imprimir se espera a que baje la letra (como mucho 3 segundos; si no llega, imprime igual)
    await Promise.race([esperarLetra(marco.contentDocument), new Promise(r => setTimeout(r, 3000))])
    setTimeout(() => {
      marco.contentWindow.focus()
      marco.contentWindow.print()
      setTimeout(() => marco.remove(), 1000)
    }, 100)
    return
  }
  // El PDF se pide en base64 (como texto) y se escribe en la carpeta propia de la app.
  // No se mueve el archivo que crea expo-print porque en Expo Go está en una carpeta
  // que la app no tiene permiso de tocar (era el error de permisos).
  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true, ...opciones })
  let compartir = uri
  try {
    const destino = new File(Paths.cache, nombre)   // con un nombre legible
    destino.create({ overwrite: true })
    destino.write(base64, { encoding: 'base64' })
    compartir = destino.uri
  } catch {
    // si no se pudo copiar, se comparte el original (con el nombre que le puso el sistema)
  }
  await Sharing.shareAsync(compartir, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: nombre })
}
