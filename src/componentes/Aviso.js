// Mensaje de resultado (verde) o de error (rojo). Se cierra tocándolo.
import { Pressable, Text } from 'react-native'
import { estilos } from '../estilos'

export default function Aviso({ aviso, onCerrar }) {
  if (!aviso) return null
  return (
    <Pressable onPress={onCerrar}>
      <Text style={[estilos.aviso, aviso.error && estilos.avisoError]}>{aviso.texto}  ✕</Text>
    </Pressable>
  )
}

// Ejecuta una tarea que puede tardar o fallar (guardar, importar) y arma el aviso.
// tarea: función async que devuelve el texto de éxito (o null para no mostrar nada).
export async function conAviso(setAviso, tarea) {
  try {
    const texto = await tarea()
    setAviso(texto ? { texto } : null)
  } catch (e) {
    setAviso({ error: true, texto: e.message || 'Algo salió mal.' })
  }
}

// Resumen de una importación en una frase, con los primeros errores
export function textoImportacion(partes, errores) {
  const hecho = partes.filter(Boolean).join(', ') || 'no había nada para importar'
  let texto = `Importación lista: ${hecho}.`
  if (errores.length) {
    texto += `\n${errores.length} fila(s) no se importaron:\n` + errores.slice(0, 5).join('\n')
    if (errores.length > 5) texto += `\n… y ${errores.length - 5} más.`
  }
  return texto
}
