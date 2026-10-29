import { useState } from 'react'
import { Text, View } from 'react-native'
import Campo from './Campo'
import { Boton } from './PartesResultado'
import { fuentes, tema } from '../tema'
import { num } from '../utiles'

const VACIO = { nombre: '', grupo: '', forma: '', momento: '', ms: '', pb: '', em: '', ca: '', p: '', fdn: '', precio: '' }

// Pasa un alimento guardado al formato del formulario (texto y porcentajes)
const aFormulario = a => ({
  nombre: a.nombre,
  grupo: a.grupo || '',
  forma: a.forma || '',
  momento: a.momento || '',
  ms: String(+(a.ms * 100).toFixed(2)),   // 0.87 → '87'
  pb: String(+(a.pb * 100).toFixed(2)),   // 0.09 → '9'
  em: a.em ? String(a.em) : '',
  ca: a.ca ? String(a.ca) : '',
  p: a.p ? String(a.p) : '',
  fdn: a.fdn ? String(a.fdn) : '',
  precio: a.precio ? String(a.precio) : '',
})

// Sirve para agregar un alimento nuevo o, si le pasás `inicial`, para editar uno existente
export default function FormAlimento({ inicial, onGuardar, onCancelar }) {
  const [f, setF] = useState(inicial ? aFormulario(inicial) : VACIO)
  const [error, setError] = useState('')
  const cambiar = (campo, valor) => setF({ ...f, [campo]: valor })

  const guardar = () => {
    if (!f.nombre.trim()) return setError('Poné un nombre para el alimento.')
    if (!(num(f.ms) > 0 && num(f.ms) <= 100)) return setError('La materia seca tiene que estar entre 1 y 100 %.')

    onGuardar({
      id: inicial ? inicial.id : Date.now().toString(),   // si edita, conserva el mismo id
      nombre: f.nombre.trim(),
      grupo: f.grupo.trim(),
      forma: f.forma.trim(),
      momento: f.momento.trim(),
      ms: num(f.ms) / 100,   // tambo.js espera fracción: 87 % → 0.87
      pb: num(f.pb) / 100,   // 9 % → 0.09
      em: num(f.em),
      ca: num(f.ca),
      p: num(f.p),
      fdn: num(f.fdn),
      precio: num(f.precio),
    })
    if (!inicial) setF(VACIO)   // si era nuevo, vacía el formulario
    setError('')
  }

  return (
    <View>
      <Campo etiqueta="Nombre" teclado="default" valor={f.nombre} onChange={v => cambiar('nombre', v)} />
      <Campo etiqueta="Grupo" ayuda="Opcional. Ej.: grano, fardo, silaje" teclado="default" valor={f.grupo} onChange={v => cambiar('grupo', v)} />
      <Campo etiqueta="Forma" ayuda="Opcional. Ej.: entero, picado fino" teclado="default" valor={f.forma} onChange={v => cambiar('forma', v)} />
      <Campo etiqueta="Momento" ayuda="Opcional. Ej.: grano pastoso, enero - marzo" teclado="default" valor={f.momento} onChange={v => cambiar('momento', v)} />
      <Campo etiqueta="Materia seca (%)" valor={f.ms} onChange={v => cambiar('ms', v)} />
      <Campo etiqueta="PB (% de la MS)" valor={f.pb} onChange={v => cambiar('pb', v)} />
      <Campo etiqueta="EM (Mcal/kg MS)" valor={f.em} onChange={v => cambiar('em', v)} />
      <Campo etiqueta="Ca (g/kg MS)" valor={f.ca} onChange={v => cambiar('ca', v)} />
      <Campo etiqueta="P (g/kg MS)" valor={f.p} onChange={v => cambiar('p', v)} />
      <Campo etiqueta="FDN (% de la MS)" valor={f.fdn} onChange={v => cambiar('fdn', v)} />
      <Campo etiqueta="Precio ($/kg tal cual)" ayuda="Opcional" valor={f.precio} onChange={v => cambiar('precio', v)} />
      {error ? (
        <Text style={{ fontFamily: fuentes.medio, fontSize: 15, color: tema.falta, marginBottom: 10 }}>{error}</Text>
      ) : null}
      <View style={{ gap: 8 }}>
        <Boton titulo={inicial ? 'Guardar cambios' : 'Agregar alimento'} onPress={guardar} />
        {onCancelar ? <Boton titulo="Cancelar" onPress={onCancelar} secundario /> : null}
      </View>
    </View>
  )
}
