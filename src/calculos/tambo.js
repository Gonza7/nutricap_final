/**
 * NutriCap · Cálculos de la hoja "tambo" (cabras en producción de leche)
 * ----------------------------------------------------------------------------
 * Traducción directa del Excel "Formulador_dietas_NutriCap._2025_1_1.xlsx",
 * hoja "tambo". Cada cálculo indica entre corchetes la celda de origen.
 *
 * Colores del Excel → secciones de este archivo:
 *   AMARILLO     → datos de entrada (animal + kg tal cual de cada alimento)
 *   NARANJA      → cálculos secundarios
 *   VERDE OSCURO → requerimientos en lactancia
 *   VERDE CLARO  → requerimientos en último tercio de gestación (UTG)
 *   FUCSIA       → datos nutricionales de los alimentos (tabla editable)
 *   ROSA         → aportes totales de la ración
 *   CELESTE      → balances (aporte − requerimiento)
 *   ROJO         → no se usa (lípidos %, EE, FDN efectiva)
 *
 * Uso:
 *   const r = calcularTambo(datosAnimal, racion);        // ver ejemplo al final
 *   r.requerimientos.lactancia.pbTotal  // g PB/día
 *   r.balances.em                       // Mcal EM/día (+ sobra / − falta)
 *
 * Sin dependencias: funciona igual en el navegador o en Node.
 */

// ============================================================================
// FUCSIA · Formato de un alimento
// ----------------------------------------------------------------------------
// Los alimentos vienen de tu tabla externa o los carga el usuario; este archivo
// no trae ninguno. Cada alimento es un objeto con estas unidades (las del Excel):
//   nombre
//   ms     fracción de materia seca (0,87 = 87 %)          [col C]
//   pb     fracción de proteína bruta en la MS (0,09 = 9 %) [col E]
//   em     Mcal EM por kg de MS                            [col G]
//   ca     g de Ca por kg de MS                            [col I]
//   p      g de P por kg de MS                             [col K]
//   fdn    % de FDN en la MS                               [col M]
//   precio $ por kg tal cual, lo carga cada usuario        [col Q]
//          (opcional: si no lo carga, el costo da 0)
// ============================================================================

/** Valida y completa un alimento cargado por el usuario (campos vacíos = 0). */
function crearAlimento({ id, nombre, ms, pb = 0, em = 0, ca = 0, p = 0, fdn = 0, precio = 0 }) {
  if (!nombre) throw new Error('El alimento necesita un nombre.');
  if (!(ms > 0 && ms <= 1)) throw new Error(`"${nombre}": la materia seca va como fracción entre 0 y 1 (ej. 0,87 para 87 %).`);
  if (pb < 0 || pb > 1) throw new Error(`"${nombre}": la proteína bruta va como fracción entre 0 y 1 (ej. 0,16 para 16 %).`);
  return { id: id || nombre.toLowerCase().replace(/\s+/g, '_'), nombre, ms, pb, em, ca, p, fdn, precio };
}

// ============================================================================
// Valores de referencia (verde oscuro fijos en el Excel)
// ============================================================================
// Número con coma decimal para los textos de las alertas: 0.57 → '0,57'
function coma(x, decimales) {
  return x.toFixed(decimales).replace('.', ',');
}

const REFERENCIAS = {
  fdnMaxPct: 40,           // [R7] FDN total máxima, % de la MS
  balanceEnergNegMaxPct: 30, // [nota H43] no superar 25–30 % de balance negativo (riesgo de cetosis)
  relCaPMin: 2,            // [nota K43] relación Ca/P mínima 2:1
};

// ============================================================================
// AMARILLO · Datos del animal
// ----------------------------------------------------------------------------
//   pv                   kg de peso vivo                                  [A7]
//   gb                   % de grasa butirosa                               [B7]
//   litros               litros de leche por cabra por día                 [C7]
//   actVoluntaria        % (10 a 40 según sistema)                         [B9]
//   actReproductiva      % (10 si corresponde, si no 0)                    [B10]
//   perdidaPV            kg/día perdidos por movilización de reservas      [B12]
//                        (primeras 8 semanas posparto)
//   gananciaPV           kg/día ganados en recuperación de reservas       [B13]
//   pesoNacimiento       kg estimados por cabrito (UTG)                    [B15]
//   numeroCrias          1, 2 o 3 (UTG)                                    [B16]
//   diasGestacion        días de gestación (UTG)                           [B17]
//   semanasLactancia     semana de lactancia (para CTMS 2008 y 2003)       [D47]
// ============================================================================

// ============================================================================
// Requerimientos en lactancia (VERDE OSCURO) + cálculos secundarios (NARANJA)
// ============================================================================
function requerimientosLactancia(a, msTotalRacion) {
  const { pv, gb, litros, actVoluntaria = 0, actReproductiva = 0, perdidaPV = 0, gananciaPV = 0 } = a;

  // --- Proteína bruta (g/día)
  const pbMant          = 15.667 + 1.1315 * pv;                       // [D7]
  const pbMantAjustado  = pbMant + pbMant * actReproductiva / 100;    // [E7]
  const pbProduccion    = litros * (36.905 + 8.9048 * gb);            // [F7]
  const pbTotal         = pbMantAjustado + pbProduccion;              // [G7]

  // --- Energía metabolizable (Mcal/día)
  const emMant          = 0.4 + 0.0289 * pv;                          // [H7]
  const emMantAjustado  = emMant
                        + emMant * actVoluntaria / 100
                        + emMant * actReproductiva / 100;             // [I7]
  const emProduccion    = (1.1192 + 0.0317 * gb) * litros;            // [J7]
  const emTotal         = emMantAjustado + emProduccion;              // [L7]
  const emMovilizacion  = 9.98 * perdidaPV;                           // [M7] EM aportada por reservas (perdidaPV en kg/día)
  const emRecuperacion  = 10.51 * gananciaPV;                         // [N7] EM extra para recuperar peso (gananciaPV en kg/día)
  const emTotalAjustado = emTotal - emMovilizacion + emRecuperacion;  // [K7]

  // --- Minerales (g/día). Dependen de la MS total de la ración [D41].
  const ca = ((0.623 * msTotalRacion) + 0.228) / 0.45 + (1.4 * litros) / 0.45;  // [O7]
  const p  = (0.081 + (0.88 * msTotalRacion) / 0.65) + (1 * litros) / 0.65;    // [P7] tal cual la planilla (confirmado: el 0,081 no se divide por 0,65)

  return {
    pbMant, pbMantAjustado, pbProduccion, pbTotal,
    emMant, emMantAjustado, emProduccion, emTotal,
    emMovilizacion, emRecuperacion, emTotalAjustado,
    ca, p,
    fdnMaxPct: REFERENCIAS.fdnMaxPct,                                 // [R7]
  };
}

// ============================================================================
// VERDE CLARO · Último tercio de gestación (UTG)
// Ecuaciones polinómicas en función de peso al nacer (PENC), n.º de crías (NC)
// y días de gestación (D). Ya incluyen el mantenimiento.
// Solo tienen sentido con datos de gestación cargados: si falta alguno → null.
// ============================================================================
function requerimientosUTG(a, lact) {
  const PENC = a.pesoNacimiento, NC = a.numeroCrias, D = a.diasGestacion;
  if (!(PENC > 0 && NC > 0 && D > 0)) return null;

  // [B18] PB (g/día): (ecuación de PB retenida / 0,65) + PB mantenimiento [D7]
  const pbGestacion = (-155.62 - 8.6668 * PENC + 2.6495 * D + 0.0041667 * NC
                     - 0.011049 * D * D + 0.097691 * PENC * D - 12.136 * PENC * NC
                     + 0.14631 * PENC * D * NC) / 0.65;
  const pbTotal = pbGestacion + lact.pbMant;

  // [B19] EM (Mcal/día): ecuación en MJ × 0,239 + EM mantenimiento ajustada [I7]
  const emGestacionMJ = -15.467 - 1.1439 * PENC + 0.26316 * D - 0.0021667 * NC
                      - 0.0010963 * D * D + 0.011772 * PENC * D - 0.98352 * PENC * NC
                      + 0.011735 * PENC * D * NC;
  const emGestacion = emGestacionMJ * 0.239;
  const emTotal = emGestacion + lact.emMantAjustado;

  // [F45] Consumo de MS en UTG, % del peso vivo
  const ctmsPctPV = 2 + (0.25 * NC - 1);

  return { pbGestacion, pbTotal, emGestacion, emTotal, ctmsPctPV };
}

// ============================================================================
// Predicciones de consumo de materia seca (CTMS), % del peso vivo
// ============================================================================
function prediccionesConsumo(a) {
  const { pv, litros, semanasLactancia } = a;
  const pv075 = Math.pow(pv, 0.75);
  const r = {
    // [D43] (1) estimación inicio de lactancia — verde oscuro
    inicioLactancia: ((165 + 368.6 * litros + 34.8 * pv075) / 1000) / pv * 100,
    // [D44] (2) estimación mitad de lactancia — verde oscuro
    mitadLactancia: ((533 + 305.2 * litros + 13.3 * pv) / 1000) / pv * 100,
  };
  // [D45] (3) CTMS 2008 y [D46] (4) CTMS 2003 — necesitan la semana de lactancia [D47]
  if (semanasLactancia > 0) {
    r.ctms2008 = (0.111 * pv075) * (1 - Math.exp(-0.8 * semanasLactancia)) / pv * 100;
    r.ctms2003 = (0.222 * litros + 0.107 * pv075) * (1 - Math.exp(-0.444 * (semanasLactancia + 7.221))) / pv * 100;
  }
  return r;
}

// ============================================================================
// Aportes por alimento (FUCSIA) y totales de la ración (ROSA)
// racion = [{ alimento: <objeto de la tabla>, kgTalCual: número }, ...]
// ============================================================================
function aportesRacion(racion) {
  const filas = racion
    .filter(r => r.kgTalCual > 0)
    .map(({ alimento: f, kgTalCual }) => {
      const msKg = kgTalCual * f.ms;                    // [D]
      return {
        nombre: f.nombre,
        kgTalCual,                                      // [B]
        msKg,
        pbG:     msKg * f.pb * 1000,                    // [F]  g PB
        emMcal:  msKg * f.em,                           // [H]  Mcal EM
        caG:     msKg * f.ca,                           // [J]  g Ca
        pG:      msKg * f.p,                            // [L]  g P
        fdnKg:   msKg * f.fdn / 100,                    // [N]  kg FDN
        costo:   kgTalCual * (f.precio || 0),           // [R]  $ (precio por kg tal cual, cargado por el usuario)
      };
    });

  const suma = k => filas.reduce((s, x) => s + x[k], 0);
  const msKg = suma('msKg');
  const totales = {
    kgTalCual: suma('kgTalCual'),                       // [B41]
    msKg,                                               // [D41]
    pbG:       suma('pbG'),                             // [F41]
    emMcal:    suma('emMcal'),                          // [H41]
    caG:       suma('caG'),                             // [J41]
    pG:        suma('pG'),                              // [L41]
    fdnPct:    msKg > 0 ? suma('fdnKg') / msKg * 100 : 0, // [N41] % FDN en la MS
    costo:     suma('costo'),                           // [R41]
  };
  return { filas, totales };
}

// ============================================================================
// Cálculo completo de la hoja
// ============================================================================
function calcularTambo(animal, racion) {
  const { filas, totales: ap } = aportesRacion(racion);
  const lact = requerimientosLactancia(animal, ap.msKg);
  const utg  = requerimientosUTG(animal, lact);
  const consumo = prediccionesConsumo(animal);

  // CELESTE · Balances = aporte − requerimiento (positivo sobra, negativo falta)
  const balances = {
    pbG:    ap.pbG    - lact.pbTotal,             // [F42]
    emMcal: ap.emMcal - lact.emTotalAjustado,     // [H42]
    caG:    ap.caG    - lact.ca,                  // [J42]
    pG:     ap.pG     - lact.p,                   // [L42]
    fdnPct: ap.fdnPct - lact.fdnMaxPct,           // [N42] positivo = se pasa del máximo
  };

  // Indicadores (naranja / rosa)
  const indicadores = {
    ctmsPctPV: ap.msKg / animal.pv * 100,                                   // [D42]
    balanceEnergeticoPct: ap.emMcal > 0
      ? (lact.emTotalAjustado - lact.emTotal) / ap.emMcal * 100 : 0,         // [H43]
    relacionCaP: ap.pG > 0 ? ap.caG / ap.pG : null,                         // [K43]
  };

  // Alertas según las notas del Excel [A90–A92]
  const alertas = [];
  if (balances.pbG < 0)    alertas.push(`Falta proteína: ${coma(-balances.pbG, 0)} g PB/día.`);
  if (balances.emMcal < 0) alertas.push(`Falta energía: ${coma(-balances.emMcal, 2)} Mcal EM/día.`);
  if (balances.caG < 0)    alertas.push(`Falta calcio: ${coma(-balances.caG, 1)} g/día.`);
  if (balances.pG < 0)     alertas.push(`Falta fósforo: ${coma(-balances.pG, 1)} g/día.`);
  if (balances.fdnPct > 0) alertas.push(`La FDN supera el ${REFERENCIAS.fdnMaxPct} % de la MS.`);
  if (indicadores.relacionCaP !== null && indicadores.relacionCaP < REFERENCIAS.relCaPMin)
    alertas.push(`Relación Ca/P por debajo de ${REFERENCIAS.relCaPMin}:1.`);
  if (Math.abs(indicadores.balanceEnergeticoPct) > REFERENCIAS.balanceEnergNegMaxPct && animal.perdidaPV > 0)
    alertas.push(`El balance energético negativo supera el ${REFERENCIAS.balanceEnergNegMaxPct} %: riesgo de cetosis.`);

  return {
    requerimientos: { lactancia: lact, ultimoTercioGestacion: utg },
    consumo,
    aportes: { porAlimento: filas, totales: ap },
    balances,
    indicadores,
    alertas,
  };
}

// ============================================================================
// Ejemplo y verificación: mismos datos que trae cargados el Excel
// (node calculos-tambo.js → compara con los valores de la planilla)
// ============================================================================
const EJEMPLO_ANIMAL = {
  pv: 50, gb: 3.9, litros: 2.5,
  actVoluntaria: 10, actReproductiva: 0,
  perdidaPV: 0, gananciaPV: 0,
  pesoNacimiento: 0, numeroCrias: 0, diasGestacion: 0,
  semanasLactancia: 9,
};
// Alimentos solo para la prueba: los mismos valores que usa el Excel de ejemplo
const EJEMPLO_RACION = [
  { alimento: crearAlimento({ nombre: 'Maíz',                 ms: 0.87, pb: 0.09,  em: 3.39, ca: 0.2, p: 2, fdn: 15.7 }), kgTalCual: 0.5 },
  { alimento: crearAlimento({ nombre: 'Pastura base alfalfa', ms: 0.25, pb: 0.135, em: 2.5,  ca: 12,  p: 6, fdn: 42 }),   kgTalCual: 3 },
  { alimento: crearAlimento({ nombre: 'Balanceado comercial', ms: 0.90, pb: 0.16,  em: 2.7,  ca: 7,   p: 6, fdn: 30 }),   kgTalCual: 0.5 },
];

if (typeof module !== 'undefined') {
  module.exports = {
    REFERENCIAS, crearAlimento, coma,
    requerimientosLactancia, requerimientosUTG, prediccionesConsumo,
    aportesRacion, calcularTambo, EJEMPLO_ANIMAL, EJEMPLO_RACION,
  };
  if (require.main === module) {
    const r = calcularTambo(EJEMPLO_ANIMAL, EJEMPLO_RACION);
    const L = r.requerimientos.lactancia, A = r.aportes.totales;
    // Valores del Excel (celda: valor)
    const excel = [
      ['D7 PB mant',          L.pbMant,               72.242],
      ['F7 PB producción',    L.pbProduccion,         179.0843],
      ['G7 PB total',         L.pbTotal,              251.3263],
      ['I7 EM mant ajust.',   L.emMantAjustado,       2.0295],
      ['J7 EM producción',    L.emProduccion,         3.107075],
      ['K7 EM total ajust.',  L.emTotalAjustado,      5.136575],
      ['O7 Ca',               L.ca,                   10.548011],
      ['P7 P',                L.p,                    6.140692],
      ['D41 MS total',        A.msKg,                 1.635],
      ['F41 PB aporte',       A.pbG,                  212.4],
      ['H41 EM aporte',       A.emMcal,               4.56465],
      ['N41 FDN %',           A.fdnPct,               31.7],
      ['F42 balance PB',      r.balances.pbG,        -38.9263],
      ['H42 balance EM',      r.balances.emMcal,     -0.571925],
      ['J42 balance Ca',      r.balances.caG,         1.688989],
      ['L42 balance P',       r.balances.pG,          1.929308],
      ['D42 CTMS/PV',         r.indicadores.ctmsPctPV, 3.27],
      ['K43 Ca/P',            r.indicadores.relacionCaP, 1.516357],
      ['D43 CTMS inicio',     r.consumo.inicioLactancia, 3.481690],
      ['D44 CTMS mitad',      r.consumo.mitadLactancia,  3.922],
      ['D45 CTMS 2008',       r.consumo.ctms2008,        4.171153],
      ['D46 CTMS 2003',       r.consumo.ctms2003,        5.130021],
    ];
    let ok = true;
    for (const [n, v, e] of excel) {
      const bien = Math.abs(v - e) < 1e-4;
      ok = ok && bien;
      console.log(`${bien ? 'OK ' : 'DIF'} ${n.padEnd(20)} ${v.toFixed(4).padStart(10)}  (Excel ${e})`);
    }
    // UTG: con datos en cero el Excel da -167.17 / -1.667 (sin sentido); acá devuelve null
    const utg = calcularTambo({ ...EJEMPLO_ANIMAL, pesoNacimiento: 3, numeroCrias: 2, diasGestacion: 130 }, EJEMPLO_RACION)
      .requerimientos.ultimoTercioGestacion;
    console.log('\nUTG de prueba (3 kg, 2 crías, día 130):', utg);
    console.log('\nAlertas del ejemplo:', r.alertas);
    console.log(ok ? '\nTodo coincide con el Excel.' : '\nHay diferencias con el Excel.');
  }
}
