// Arma el HTML de los PDF: un cálculo de ración y la tabla de alimentos.
// Usa los mismos colores y la misma letra que la app (sale de tema.js).
import { estadoBalance, fmt, mayuscula, nombreAlimento } from '../utiles'
import { ETAPAS, MODULOS, SEXOS, filasBalance, moduloDe } from '../modulos'
import { tema } from '../tema'

// Evita que un nombre con "<" o "&" rompa el HTML
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fechaLegible = iso =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// La letra se baja de Google Fonts. Si no hay internet, usa una parecida de la computadora.
const FUENTE = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@400;500;600;700&display=swap">`

const ESTILO = `
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }   /* para que se impriman las barras */
  body {
    font-family: 'Barlow Semi Condensed', 'Arial Narrow', Helvetica, Arial, sans-serif;
    color: ${tema.tinta}; font-size: 11pt; line-height: 1.35; margin: 0;
  }
  .marca { font-weight: 700; font-size: 11pt; color: ${tema.marca}; margin: 0; }
  h1 { font-weight: 600; font-size: 22pt; line-height: 1.1; margin: 2px 0 0; }
  h2 { font-weight: 600; font-size: 13pt; margin: 20px 0 6px; padding-bottom: 4px; border-bottom: 1px solid ${tema.linea}; }
  .sub { color: ${tema.suave}; margin: 2px 0 0; }
  .num { font-variant-numeric: tabular-nums; }

  /* Datos y cifras: grilla de etiqueta + valor */
  .grilla { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 16px; }
  .grilla.dos { grid-template-columns: repeat(2, 1fr); }
  .celda { padding: 5px 0; border-bottom: 1px solid ${tema.linea}; }
  .etiqueta { color: ${tema.suave}; font-size: 10pt; }
  .valor { font-weight: 500; font-size: 12pt; }
  .valor.grande { font-weight: 600; font-size: 18pt; line-height: 1.1; }
  .unidad { color: ${tema.tenue}; font-size: 9pt; }

  /* Barras del balance */
  .barra { padding: 7px 0; border-bottom: 1px solid ${tema.linea}; break-inside: avoid; }
  .barra .arriba, .barra .abajo { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .barra .nombre { font-weight: 500; font-size: 12pt; }
  .barra .pct { font-weight: 600; font-size: 15pt; }
  .pista { position: relative; height: 7px; border-radius: 4px; background: ${tema.superficie}; margin: 4px 0; overflow: hidden; }
  .relleno { height: 100%; border-radius: 4px; }
  .cien { position: absolute; top: 0; bottom: 0; width: 2px; background: ${tema.tinta}; left: ${(100 / 150) * 100}%; }
  .barra .detalle { color: ${tema.suave}; font-size: 10pt; }
  .barra .estado { font-weight: 600; font-size: 10pt; }

  /* Para revisar */
  .alerta { border-left: 3px solid ${tema.falta}; padding: 1px 0 1px 8px; margin: 4px 0; }
  .ok { color: ${tema.sobra}; font-weight: 500; }

  /* Tablas */
  table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
  th { text-align: left; font-weight: 500; color: ${tema.suave}; font-size: 9.5pt; padding: 5px 6px; border-bottom: 1px solid ${tema.tinta}; }
  td { padding: 5px 6px; border-bottom: 1px solid ${tema.linea}; vertical-align: top; }
  tr { break-inside: avoid; }
  .n { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr.total td { font-weight: 600; border-top: 1px solid ${tema.tinta}; border-bottom: 0; }
  .tenue { color: ${tema.tenue}; }

  .fuente { margin-top: 18px; color: ${tema.tenue}; font-size: 9pt; }
  .pie { margin-top: 6px; color: ${tema.tenue}; font-size: 9pt; }
  .hoja + .hoja { break-before: page; }
  .junto { break-inside: avoid; }   /* un título con su contenido no se separan entre hojas */
  h2 { break-after: avoid; }
`

const pagina = (titulo, cuerpo) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(titulo)}</title>
${FUENTE}<style>${ESTILO}</style></head><body>${cuerpo}
<p class="pie">Generado con NutriCap el ${fechaLegible(new Date().toISOString())}</p></body></html>`

// Una celda de la grilla: etiqueta arriba, valor abajo
const celda = (etiqueta, valor, unidad = '', grande = false) => `
  <div class="celda"><div class="etiqueta">${etiqueta}</div>
  <div class="valor num${grande ? ' grande' : ''}">${valor}${unidad ? ` <span class="unidad">${unidad}</span>` : ''}</div></div>`

// Una barra del balance, igual que en la pantalla de Resultados
function barra(f) {
  const estado = estadoBalance(f.balance, f.requerido, f.alReves)
  const color = { Falta: tema.falta, 'Se pasa': tema.falta, Sobra: tema.sobra, OK: tema.sobra, Justo: tema.tinta }[estado]
  const pct = f.requerido > 0 ? (f.aporte / f.requerido) * 100 : 0
  const ancho = Math.min(pct, 150) / 150 * 100
  const cuanto = `${fmt(Math.abs(f.balance), f.decimales)} ${f.unidad}`
  const texto = { Falta: `Faltan ${cuanto}`, Sobra: `Sobran ${cuanto}`, Justo: 'Justo', OK: 'Dentro del máximo', 'Se pasa': `Se pasa ${cuanto}` }[estado]
  const detalle = f.alReves
    ? `Tiene ${fmt(f.aporte, f.decimales)} ${f.unidad}, máximo ${fmt(f.requerido, f.decimales)}`
    : `Aporta ${fmt(f.aporte, f.decimales)} de ${fmt(f.requerido, f.decimales)} ${f.unidad}`
  return `<div class="barra">
    <div class="arriba"><span class="nombre">${f.titulo}</span><span class="pct num" style="color:${color}">${fmt(pct, 0)} %</span></div>
    <div class="pista"><div class="relleno" style="width:${ancho}%;background:${color}"></div><div class="cien"></div></div>
    <div class="abajo"><span class="detalle num">${detalle}</span><span class="estado" style="color:${color}">${texto}</span></div>
  </div>`
}

// ---------- Cálculo de ración (actual o del historial) ----------
function cuerpoCalculo(h) {
  const d = h.datos
  const n = x => Number(String(x).replace(',', '.')) || 0
  const carne = moduloDe(h) === 'carne'

  // Datos del animal
  const datos = carne ? [
    ['Edad', ETAPAS[d.etapa]],
    ['Sexo', SEXOS[d.sexo]],
    ['Peso vivo', fmt(n(d.pv), 1), 'kg'],
    ['Ganancia diaria de peso', fmt(n(d.gdpv), 3), 'kg/día'],
  ] : [
    ['Peso vivo', fmt(n(d.pv), 1), 'kg'],
    ['Grasa butirosa', fmt(n(d.gb), 1), '%'],
    ['Leche', fmt(n(d.litros), 1), 'L/día'],
    ['Semana de lactancia', esc(d.semanas)],
    ['Actividad voluntaria', esc(d.actVol), '%'],
    ['Actividad reproductiva', esc(d.actRep), '%'],
  ]
  if (!carne && n(d.perdida) > 0) datos.push(['Pérdida de peso', fmt(n(d.perdida), 2), 'kg/día'])
  if (!carne && n(d.ganancia) > 0) datos.push(['Ganancia de peso', fmt(n(d.ganancia), 2), 'kg/día'])
  if (!carne && n(d.dias) > 0) datos.push(['Gestación', `${esc(d.crias)} cría(s) de ${esc(d.pnac)} kg`, `día ${esc(d.dias)}`])

  // Ración con totales
  let tot = { kg: 0, ms: 0, pb: 0, em: 0, costo: 0 }
  const filasRacion = h.racion.map(({ alimento: a, kg }) => {
    const k = n(kg), ms = k * a.ms, pb = ms * a.pb * 1000, em = ms * a.em, costo = k * (a.precio || 0)
    tot = { kg: tot.kg + k, ms: tot.ms + ms, pb: tot.pb + pb, em: tot.em + em, costo: tot.costo + costo }
    return `<tr><td>${esc(nombreAlimento(a))}</td><td class="n">${fmt(k, 2)}</td><td class="n">${fmt(ms, 3)}</td>
      <td class="n">${fmt(pb, 0)}</td><td class="n">${fmt(em, 2)}</td><td class="n">${costo ? '$ ' + fmt(costo, 0) : '<span class="tenue">–</span>'}</td></tr>`
  }).join('')

  const caPBaja = h.relacionCaP > 0 && h.relacionCaP < 2

  const utg = h.utg ? `<div class="junto">
    <h2>Último tercio de gestación</h2>
    <div class="grilla">
      ${celda('Proteína bruta', fmt(h.utg.pbTotal, 0), 'g por día')}
      ${celda('Energía metabolizable', fmt(h.utg.emTotal, 2), 'Mcal por día')}
      ${celda('Consumo de MS', fmt(h.utg.ctmsPctPV, 2), '% del peso vivo')}
    </div></div>` : ''

  const fuente = carne
    ? 'Fórmulas de las hojas de carne del formulador NutriCap.'
    : 'Fórmulas de la hoja tambo (FEDNA 2009, Elizondo 2002, NRC 1981).'

  return `<section class="hoja">
    <p class="marca">NutriCap</p>
    <h1>${MODULOS[moduloDe(h)].tituloPdf}</h1>
    ${h.nombre ? `<p class="sub"><b>${esc(h.nombre)}</b></p>` : ''}
    <p class="sub">${fechaLegible(h.fecha)}</p>

    <div class="junto">
      <h2>Datos del animal</h2>
      <div class="grilla">${datos.map(([e, v, u]) => celda(e, v, u)).join('')}</div>
    </div>

    <h2>Balance de la ración</h2>
    <p class="sub" style="margin:0 0 2px">Cuánto cubre la ración de lo que necesita el animal. La rayita marca el 100 %.</p>
    ${filasBalance(h).map(barra).join('')}

    <div class="junto">
      <h2>Para revisar</h2>
      ${h.alertas.length ? h.alertas.map(a => `<div class="alerta">${esc(a)}</div>`).join('') : '<p class="ok">La ración cubre los requerimientos.</p>'}
    </div>

    <div class="junto">
    <h2>Indicadores</h2>
    <div class="grilla">
      ${celda('Consumo de materia seca', `${fmt(h.ctmsPctPV, 2)} %`, `del peso vivo${h.ctmsReferenciaPct ? ` (referencia ${h.ctmsReferenciaPct} %)` : ''}`, true)}
      ${celda('Relación calcio / fósforo', `<span style="color:${caPBaja ? tema.falta : tema.tinta}">${h.relacionCaP ? fmt(h.relacionCaP, 2) : '–'}</span>`, 'mínimo 2', true)}
      ${celda('Costo', `$ ${fmt(h.costo, 0)}`, 'por animal por día', true)}
    </div>
    </div>

    <h2>Ración diaria</h2>
    <table>
      <tr><th>Alimento</th><th class="n">kg tal cual</th><th class="n">kg MS</th><th class="n">PB g</th><th class="n">EM Mcal</th><th class="n">Costo</th></tr>
      ${filasRacion}
      <tr class="total"><td>Total</td><td class="n">${fmt(tot.kg, 2)}</td><td class="n">${fmt(tot.ms, 3)}</td>
        <td class="n">${fmt(tot.pb, 0)}</td><td class="n">${fmt(tot.em, 2)}</td><td class="n">$ ${fmt(tot.costo, 0)}</td></tr>
    </table>
    ${utg}
    <p class="fuente">${fuente}</p>
  </section>`
}

// Un cálculo
export const htmlCalculo = h => pagina(`Ración ${h.nombre || ''}`.trim(), cuerpoCalculo(h))

// Varios cálculos en un solo PDF, cada uno en su hoja
export const htmlCalculos = lista => pagina('Raciones', lista.map(cuerpoCalculo).join(''))

// ---------- Tabla de alimentos ----------
export function htmlAlimentos(lista, descripcion) {
  const filas = lista.map(a => `<tr>
      <td><b style="font-weight:500">${esc(mayuscula(a.nombre))}</b>${a.predeterminado ? '' : ' <span class="tenue">propio</span>'}</td>
      <td>${esc(a.grupo || '–')}</td><td>${esc(a.forma || '–')}</td><td>${esc(a.momento || '–')}</td>
      <td class="n">${fmt(a.ms * 100, 1)}</td><td class="n">${fmt(a.pb * 100, 1)}</td><td class="n">${fmt(a.em, 2)}</td>
      <td class="n">${fmt(a.ca, 1)}</td><td class="n">${fmt(a.p, 1)}</td><td class="n">${fmt(a.fdn, 1)}</td>
      <td class="n">${a.precio ? '$ ' + fmt(a.precio, 0) : '<span class="tenue">–</span>'}</td></tr>`).join('')
  const cuerpo = `
    <p class="marca">NutriCap</p>
    <h1>Tabla de alimentos</h1>
    <p class="sub">${esc(descripcion)}</p>
    <table style="margin-top:12px">
      <tr><th>Alimento</th><th>Grupo</th><th>Forma</th><th>Momento</th><th class="n">MS %</th><th class="n">PB %</th>
        <th class="n">EM Mcal/kg</th><th class="n">Ca g/kg</th><th class="n">P g/kg</th><th class="n">FDN %</th><th class="n">$/kg</th></tr>
      ${filas}
    </table>`
  return pagina('Tabla de alimentos', cuerpo).replace('@page { margin: 14mm; }', '@page { size: A4 landscape; margin: 10mm; }')
}
