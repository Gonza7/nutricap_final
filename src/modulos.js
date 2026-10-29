// Lo que cambia entre los módulos Tambo y Carne, en un solo lugar.
// Lo usan el historial, los PDF y el CSV, así un cálculo guardado se muestra igual en todos lados.
import { fmt } from './utiles'

export const MODULOS = {
  tambo: { titulo: 'Tambo', subtitulo: 'Cabras lecheras', tituloPdf: 'Ración para cabra lechera' },
  carne: { titulo: 'Carne', subtitulo: 'Cabritos y recría', tituloPdf: 'Ración para producción de carne' },
}

export const ETAPAS = { lactante: 'Nacimiento a 90 días', recria: '90 días a 18 meses' }
export const SEXOS = { hembra: 'Hembra', macho: 'Macho' }

// Los cálculos guardados antes de que existiera el módulo Carne son todos de tambo
export const moduloDe = h => h.modulo || 'tambo'

const n = x => Number(String(x).replace(',', '.')) || 0

// Una línea con los datos principales del animal
export function resumenAnimal(h) {
  const d = h.datos
  if (moduloDe(h) === 'carne') {
    return `${ETAPAS[d.etapa]} · ${SEXOS[d.sexo]} · PV ${fmt(n(d.pv), 1)} kg · GDPV ${fmt(n(d.gdpv), 3)} kg/día`
  }
  return `PV ${fmt(n(d.pv), 1)} kg · ${fmt(n(d.litros), 1)} L/día · GB ${fmt(n(d.gb), 1)} %`
}

// Las filas del balance de un cálculo guardado (props para BarraBalance, más el título)
export function filasBalance(h) {
  const b = h.balance
  const filas = [
    { clave: 'pb', titulo: 'Proteína bruta', nombre: 'PB', nombreLargo: 'Proteína bruta (g)', unidad: 'g', decimales: 0, ...b.pb },
    { clave: 'em', titulo: 'Energía metabolizable', nombre: 'EM', nombreLargo: 'Energía metabolizable (Mcal)', unidad: 'Mcal', decimales: 2, ...b.em },
    { clave: 'ca', titulo: 'Calcio', nombre: 'Calcio', nombreLargo: 'Calcio (g)', unidad: 'g', decimales: 1, ...b.ca },
    { clave: 'p', titulo: 'Fósforo', nombre: 'Fósforo', nombreLargo: 'Fósforo (g)', unidad: 'g', decimales: 1, ...b.p },
  ]
  if (moduloDe(h) === 'tambo') {
    filas.push({ clave: 'fdn', titulo: 'FDN', nombre: 'FDN máx.', nombreLargo: 'FDN (% de la MS, máximo)', unidad: '% MS', decimales: 1, alReves: true, ...b.fdn })
  } else if (b.fdn) {
    filas.push({ clave: 'fdn', titulo: 'FDN mínima', nombre: 'FDN mín.', nombreLargo: 'FDN (kg, mínimo 35 % de la MS)', unidad: 'kg', decimales: 3, ...b.fdn })
  }
  return filas
}
