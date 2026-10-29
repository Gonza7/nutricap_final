/**
 * NutriCap · Cálculos de producción de carne (cabritos y cabras en recría)
 * ----------------------------------------------------------------------------
 * Traducción de las 4 hojas de carne del Excel "Formulador_dietas_NutriCap":
 *   - "carne H (nacimiento a 90 días)"   - "carne M (nacimiento a 90 días)"
 *   - "carne H (90 días a 18 meses)"     - "carne M (90 días a 18 meses)"
 * Cada cálculo indica entre corchetes la celda de origen (por ejemplo [D6]).
 *
 * Las 4 hojas usan las mismas fórmulas; solo cambian algunos coeficientes según
 * la edad y el sexo. Por eso están todos juntos en la tabla COEFICIENTES.
 *
 * Los aportes de la ración se calculan igual que en tambo (misma función).
 */
const { aportesRacion, coma } = require('./tambo');

// ============================================================================
// Coeficientes de cada hoja
// ----------------------------------------------------------------------------
//   PB (g/día)    = pbPM · PV^0,75 + pbG · GDPV                       [D6]
//   EM (Mcal/día) = emPM · PV^0,75 + emG · GDPV                       [E6]
//   Ca (g/día)    = 0,13 · PV^0,75 + 3,5 · GDPV   (igual en las 4)    [F6]
//   P  (g/día)    = 0,09 · PV^0,75 + 2,8 · GDPV   (igual en las 4)    [G6]
// ============================================================================
const COEFICIENTES = {
  lactante: {   // nacimiento a 90 días
    hembra: { pbPM: 4.75, pbG: 420, emPM: 0.107, emG: 3.6 },
    macho:  { pbPM: 4.5,  pbG: 460, emPM: 0.125, emG: 3.5 },
  },
  recria: {     // 90 días a 18 meses
    hembra: { pbPM: 3.925, pbG: 300, emPM: 0.128, emG: 6 },
    macho:  { pbPM: 3.925, pbG: 340, emPM: 0.149, emG: 5.8 },
  },
};

// Valores de referencia de las hojas
const REFERENCIAS_CARNE = {
  ctmsPctPV: 4,                       // [D26] / [D29] consumo de MS de referencia, % del PV
  relCaPMin: 2,                       // relación Ca/P mínima (misma referencia que tambo)
  fdnFraccionMS: 0.35,                // [H6] (90 d a 18 m) FDN mínima = 35 % de la MS consumida
  // El extracto etéreo (EE) de las hojas no se usa por ahora: la tabla de alimentos no tiene ese dato.
};

// ============================================================================
// Datos del animal
// ----------------------------------------------------------------------------
//   etapa   'lactante' (nacimiento a 90 días) o 'recria' (90 días a 18 meses)
//   sexo    'hembra' o 'macho'
//   pv      kg de peso vivo                                        [A6]
//   gdpv    kg de ganancia diaria de peso vivo (0,1 = 100 g/día)    [C6]
// ============================================================================

function requerimientosCarne(animal, msTotalRacion = 0) {
  const { etapa, sexo, pv, gdpv = 0 } = animal;
  const k = COEFICIENTES[etapa] && COEFICIENTES[etapa][sexo];
  if (!k) throw new Error(`Etapa o sexo desconocido: ${etapa} / ${sexo}`);

  const pesoMetabolico = Math.pow(pv, 0.75);                     // [B6]
  return {
    pesoMetabolico,
    pb: k.pbPM * pesoMetabolico + k.pbG * gdpv,                   // [D6] g/día
    em: k.emPM * pesoMetabolico + k.emG * gdpv,                   // [E6] Mcal/día
    ca: 0.13 * pesoMetabolico + 3.5 * gdpv,                       // [F6] g/día
    p: 0.09 * pesoMetabolico + 2.8 * gdpv,                        // [G6] g/día
    // [H6] solo en recría: FDN mínima en kg = 35 % de la MS que come el animal
    fdnKg: etapa === 'recria' ? msTotalRacion * REFERENCIAS_CARNE.fdnFraccionMS : null,
  };
}

// ============================================================================
// Cálculo completo: requerimientos, aportes, balances, indicadores y alertas
// racion = [{ alimento, kgTalCual }] (mismo formato que tambo)
// ============================================================================
function calcularCarne(animal, racion) {
  const { filas, totales: ap } = aportesRacion(racion);
  const req = requerimientosCarne(animal, ap.msKg);
  const fdnKgAporte = ap.msKg * ap.fdnPct / 100;                  // [N27] kg de FDN

  // Balances = aporte − requerimiento                              [F25:L25] / [F28:N28]
  const balances = {
    pbG: ap.pbG - req.pb,
    emMcal: ap.emMcal - req.em,
    caG: ap.caG - req.ca,
    pG: ap.pG - req.p,
    fdnKg: req.fdnKg === null ? null : fdnKgAporte - req.fdnKg,
  };

  const indicadores = {
    ctmsPctPV: animal.pv > 0 ? ap.msKg / animal.pv * 100 : 0,     // [D25] / [D28]
    ctmsReferenciaPct: REFERENCIAS_CARNE.ctmsPctPV,               // [D26] / [D29]
    relacionCaP: ap.pG > 0 ? ap.caG / ap.pG : null,               // [K26] / [K29]
    fdnKgAporte,
  };

  const alertas = [];
  if (ap.msKg > 0) {
    if (balances.pbG < 0) alertas.push(`Falta proteína: ${coma(-balances.pbG, 0)} g PB/día.`);
    if (balances.emMcal < 0) alertas.push(`Falta energía: ${coma(-balances.emMcal, 2)} Mcal EM/día.`);
    if (balances.caG < 0) alertas.push(`Falta calcio: ${coma(-balances.caG, 1)} g/día.`);
    if (balances.pG < 0) alertas.push(`Falta fósforo: ${coma(-balances.pG, 1)} g/día.`);
    if (balances.fdnKg !== null && balances.fdnKg < 0) {
      alertas.push(`La FDN no llega al ${REFERENCIAS_CARNE.fdnFraccionMS * 100} % de la MS: faltan ${coma(-balances.fdnKg * 1000, 0)} g/día.`);
    }
    if (indicadores.relacionCaP !== null && indicadores.relacionCaP < REFERENCIAS_CARNE.relCaPMin) {
      alertas.push(`Relación Ca/P por debajo de ${REFERENCIAS_CARNE.relCaPMin}:1.`);
    }
  }

  return { requerimientos: req, aportes: { porAlimento: filas, totales: ap }, balances, indicadores, alertas };
}

// ============================================================================
// Verificación contra el Excel: node src/calculos/carne.js
// ============================================================================
if (typeof module !== 'undefined') {
  module.exports = { COEFICIENTES, REFERENCIAS_CARNE, requerimientosCarne, calcularCarne };

  if (require.main === module) {
    // Valores que trae cargados cada hoja del Excel: [hoja, datos, B6, D6, E6, F6, G6]
    const casos = [
      ['carne H (nacimiento a 90 días)', { etapa: 'lactante', sexo: 'hembra', pv: 10, gdpv: 0.1 }, 5.623413, 68.711213, 0.961705, 1.081044, 0.786107],
      ['carne M (nacimiento a 90 días)', { etapa: 'lactante', sexo: 'macho', pv: 9, gdpv: 0.1 }, 5.196152, 69.382686, 0.999519, 1.0255, 0.747654],
      ['carne H (90 días a 18 meses)', { etapa: 'recria', sexo: 'hembra', pv: 30, gdpv: 0.1 }, 12.81861, 80.313045, 2.240782, 2.016419, 1.433675],
      ['carne M (90 días a 18 meses)', { etapa: 'recria', sexo: 'macho', pv: 18, gdpv: 0.1 }, 8.738852, 68.299994, 1.882089, 1.486051, 1.066497],
    ];
    let ok = true;
    for (const [hoja, animal, ...esperado] of casos) {
      const r = requerimientosCarne(animal);
      const obtenido = [r.pesoMetabolico, r.pb, r.em, r.ca, r.p];
      const bien = obtenido.every((v, i) => Math.abs(v - esperado[i]) < 1e-5);
      ok = ok && bien;
      console.log(`${bien ? 'OK ' : 'DIF'} ${hoja.padEnd(32)} PB ${r.pb.toFixed(2)} g · EM ${r.em.toFixed(3)} Mcal · Ca ${r.ca.toFixed(2)} g · P ${r.p.toFixed(2)} g`);
    }

    // Ración de prueba (recría hembra 30 kg, 100 g/día) con alimentos del Excel
    const alimento = (nombre, ms, pb, em, ca, p, fdn) => ({ nombre, ms, pb, em, ca, p, fdn });
    const r = calcularCarne(
      { etapa: 'recria', sexo: 'hembra', pv: 30, gdpv: 0.1 },
      [
        { alimento: alimento('Maíz', 0.87, 0.09, 3.39, 0.2, 2, 15.7), kgTalCual: 0.3 },
        { alimento: alimento('Heno de alfalfa', 0.85, 0.138, 2.0, 13, 2.4, 47), kgTalCual: 0.8 },
      ],
    );
    // Cuentas a mano: MS = 0,261 + 0,68 = 0,941 kg; PB = 23,49 + 93,84 = 117,33 g;
    // EM = 0,885 + 1,36 = 2,245 Mcal; FDN = 0,041 + 0,3196 = 0,3606 kg; FDN req = 0,941 × 0,35 = 0,329 kg
    const manual = [['MS kg', r.aportes.totales.msKg, 0.941], ['PB g', r.aportes.totales.pbG, 117.33],
      ['EM Mcal', r.aportes.totales.emMcal, 2.2447], ['FDN kg', r.indicadores.fdnKgAporte, 0.360677],
      ['FDN req kg', r.requerimientos.fdnKg, 0.32935], ['balance PB', r.balances.pbG, 117.33 - 80.313045]];
    for (const [n, v, e] of manual) {
      const bien = Math.abs(v - e) < 1e-3;
      ok = ok && bien;
      console.log(`${bien ? 'OK ' : 'DIF'} ración de prueba: ${n.padEnd(11)} ${v.toFixed(4)} (esperado ${e})`);
    }
    console.log('\nAlertas de la ración de prueba:', r.alertas);
    console.log(ok ? '\nTodo coincide con el Excel.' : '\nHay diferencias con el Excel.');
  }
}
