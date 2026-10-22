// Arma el HTML de los PDF: un cálculo de ración y la tabla de alimentos.
import { estadoBalance, fmt, mayuscula, nombreAlimento } from '../utiles'
import { ETAPAS, MODULOS, SEXOS, filasBalance, moduloDe } from '../modulos'

// Evita que un nombre con "<" o "&" rompa el HTML
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fechaLegible = iso =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const ESTILO = `
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1f2a1c; font-size: 11pt; margin: 0; }
  h1 { font-size: 18pt; margin: 0; color: #4a6b25; }
  h2 { font-size: 12pt; margin: 18px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
  .sub { color: #666; margin: 2px 0 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th { text-align: left; background: #eef1e8; color: #555; font-size: 9pt; padding: 5px 6px; }
  td { padding: 4px 6px; border-bottom: 1px solid #e6e6e6; vertical-align: top; }
  .n { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr.total td { font-weight: bold; border-top: 1px solid #999; }
  .Falta, .Se {  color: #a2461e; font-weight: bold; }
  .Sobra { color: #2d6585; font-weight: bold; }
  .Justo, .OK { color: #2f7a3a; font-weight: bold; }
  ul { margin: 4px 0; padding-left: 18px; }
  .pie { margin-top: 24px; color: #888; font-size: 8pt; }
  .datos td:first-child { color: #555; width: 45%; }
`

const pagina = (titulo, cuerpo) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(titulo)}</title>
<style>${ESTILO}</style></head><body>${cuerpo}
<p class="pie">Generado con NutriCap el ${fechaLegible(new Date().toISOString())} ·
Fórmulas de la hoja tambo (FEDNA 2009, Elizondo 2002, NRC 1981).</p></body></html>`

// ---------- Cálculo de ración (actual o del historial) ----------
function cuerpoCalculo(h) {
  const d = h.datos
  const n = x => Number(String(x).replace(',', '.')) || 0

  const carne = moduloDe(h) === 'carne'
  const filasDatos = carne ? [
    ['Edad', ETAPAS[d.etapa]],
    ['Sexo', SEXOS[d.sexo]],
    ['Peso vivo', `${fmt(n(d.pv), 1)} kg`],
    ['Ganancia diaria de peso', `${fmt(n(d.gdpv), 3)} kg/día`],
  ] : [
    ['Peso vivo', `${fmt(n(d.pv), 1)} kg`],
    ['Grasa butirosa', `${fmt(n(d.gb), 1)} %`],
    ['Leche', `${fmt(n(d.litros), 1)} L/día`],
    ['Semana de lactancia', d.semanas],
    ['Actividad voluntaria', `${d.actVol} %`],
    ['Actividad reproductiva', `${d.actRep} %`],
  ]
  if (!carne && n(d.perdida) > 0) filasDatos.push(['Pérdida de peso', `${fmt(n(d.perdida), 2)} kg/día`])
  if (!carne && n(d.ganancia) > 0) filasDatos.push(['Ganancia de peso', `${fmt(n(d.ganancia), 2)} kg/día`])
  if (!carne && n(d.dias) > 0) filasDatos.push(['Gestación', `${d.crias} cría(s) de ${d.pnac} kg · día ${d.dias}`])

  let tot = { kg: 0, ms: 0, pb: 0, em: 0, costo: 0 }
  const filasRacion = h.racion.map(({ alimento: a, kg }) => {
    const k = n(kg), ms = k * a.ms, pb = ms * a.pb * 1000, em = ms * a.em, costo = k * (a.precio || 0)
    tot = { kg: tot.kg + k, ms: tot.ms + ms, pb: tot.pb + pb, em: tot.em + em, costo: tot.costo + costo }
    return `<tr><td>${esc(nombreAlimento(a))}</td><td class="n">${fmt(k, 2)}</td><td class="n">${fmt(ms, 3)}</td>
      <td class="n">${fmt(pb, 0)}</td><td class="n">${fmt(em, 2)}</td><td class="n">$ ${fmt(costo, 0)}</td></tr>`
  }).join('')

  const filaBal = f => {
    const estado = estadoBalance(f.balance, f.requerido, f.alReves)
    return `<tr><td>${f.nombreLargo}</td><td class="n">${fmt(f.requerido, f.decimales)}</td><td class="n">${fmt(f.aporte, f.decimales)}</td>
      <td class="n">${f.balance > 0 ? '+' : ''}${fmt(f.balance, f.decimales)}</td><td class="${estado}">${estado}</td></tr>`
  }

  const utg = h.utg ? `<h2>Último tercio de gestación</h2><table class="datos">
      <tr><td>PB total</td><td class="n">${fmt(h.utg.pbTotal, 0)} g/día</td></tr>
      <tr><td>EM total</td><td class="n">${fmt(h.utg.emTotal, 2)} Mcal/día</td></tr>
      <tr><td>Consumo de MS</td><td class="n">${fmt(h.utg.ctmsPctPV, 2)} % PV</td></tr></table>` : ''

  const cuerpo = `
    <h1>${MODULOS[moduloDe(h)].tituloPdf}</h1>
    <p class="sub">${h.nombre ? `<b>${esc(h.nombre)}</b> · ` : ''}${fechaLegible(h.fecha)}</p>

    <h2>Datos del animal</h2>
    <table class="datos">${filasDatos.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>

    <h2>Ración diaria</h2>
    <table>
      <tr><th>Alimento</th><th class="n">kg tal cual</th><th class="n">kg MS</th><th class="n">PB g</th><th class="n">EM Mcal</th><th class="n">Costo</th></tr>
      ${filasRacion}
      <tr class="total"><td>Total</td><td class="n">${fmt(tot.kg, 2)}</td><td class="n">${fmt(tot.ms, 3)}</td>
        <td class="n">${fmt(tot.pb, 0)}</td><td class="n">${fmt(tot.em, 2)}</td><td class="n">$ ${fmt(tot.costo, 0)}</td></tr>
    </table>

    <h2>Balance</h2>
    <table>
      <tr><th>Nutriente</th><th class="n">Requiere</th><th class="n">Aporta</th><th class="n">Balance</th><th>Estado</th></tr>
      ${filasBalance(h).map(filaBal).join('')}
    </table>

    <h2>Indicadores</h2>
    <table class="datos">
      <tr><td>Consumo de MS</td><td>${fmt(h.ctmsPctPV, 2)} % del peso vivo${h.ctmsReferenciaPct ? ` (referencia ${h.ctmsReferenciaPct} %)` : ''}</td></tr>
      <tr><td>Relación Ca/P</td><td>${h.relacionCaP ? fmt(h.relacionCaP, 2) : '–'} (mínimo 2)</td></tr>
      <tr><td>Costo</td><td>$ ${fmt(h.costo, 0)} por cabra por día</td></tr>
    </table>

    <h2>Alertas</h2>
    ${h.alertas.length ? `<ul>${h.alertas.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : '<p>La ración cubre los requerimientos.</p>'}
    ${utg}`
  return cuerpo
}

// Un cálculo
export const htmlCalculo = h => pagina(`Ración ${h.nombre || ''}`.trim(), cuerpoCalculo(h))

// Varios cálculos en un solo PDF, cada uno en su hoja
export const htmlCalculos = lista =>
  pagina('Raciones', lista.map(cuerpoCalculo).join('<div style="page-break-after: always"></div>'))

// ---------- Tabla de alimentos ----------
export function htmlAlimentos(lista, descripcion) {
  const filas = lista.map(a => `<tr>
      <td><b>${esc(mayuscula(a.nombre))}</b>${a.predeterminado ? '' : ' <i>(propio)</i>'}</td>
      <td>${esc(a.grupo || '–')}</td><td>${esc(a.forma || '–')}</td><td>${esc(a.momento || '–')}</td>
      <td class="n">${fmt(a.ms * 100, 1)}</td><td class="n">${fmt(a.pb * 100, 1)}</td><td class="n">${fmt(a.em, 2)}</td>
      <td class="n">${fmt(a.ca, 1)}</td><td class="n">${fmt(a.p, 1)}</td><td class="n">${fmt(a.fdn, 1)}</td>
      <td class="n">${a.precio ? '$ ' + fmt(a.precio, 0) : '–'}</td></tr>`).join('')
  const cuerpo = `
    <h1>Tabla de alimentos</h1>
    <p class="sub">${esc(descripcion)} · ${lista.length} alimentos</p>
    <table style="margin-top:10px">
      <tr><th>Alimento</th><th>Grupo</th><th>Forma</th><th>Momento</th><th class="n">MS %</th><th class="n">PB %</th>
        <th class="n">EM Mcal/kg</th><th class="n">Ca g/kg</th><th class="n">P g/kg</th><th class="n">FDN %</th><th class="n">$/kg</th></tr>
      ${filas}
    </table>`
  return pagina('Tabla de alimentos', cuerpo).replace('@page { margin: 14mm; }', '@page { size: A4 landscape; margin: 10mm; }')
}

