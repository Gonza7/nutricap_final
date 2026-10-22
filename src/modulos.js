// Lo que cambia entre los módulos Tambo y Carne, en un solo lugar.
// Lo usan el historial, los PDF y el CSV, así un cálculo guardado se muestra igual en todos lados.
import { fmt } from './utiles'

export const MODULOS = {
  tambo: { titulo: 'Tambo', subtitulo: 'Tambo · cabras lecheras', tituloPdf: 'Ración para cabra lechera' },
  carne: { titulo: 'Carne', subtitulo: 'Carne · cabritos y recría', tituloPdf: 'Ración para producción de carne' },
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

// Las filas de la tabla de balance de un cálculo guardado (props para FilaBalance)
export function filasBalance(h) {
  const b = h.balance
  const filas = [
    { clave: 'pb', nombre: 'PB', nombreLargo: 'Proteína bruta (g)', unidad: 'g', decimales: 0, ...b.pb },
    { clave: 'em', nombre: 'EM', nombreLargo: 'Energía metabolizable (Mcal)', unidad: 'Mcal', decimales: 2, ...b.em },
    { clave: 'ca', nombre: 'Calcio', nombreLargo: 'Calcio (g)', unidad: 'g', decimales: 1, ...b.ca },
    { clave: 'p', nombre: 'Fósforo', nombreLargo: 'Fósforo (g)', unidad: 'g', decimales: 1, ...b.p },
  ]
  if (moduloDe(h) === 'tambo') {
    filas.push({ clave: 'fdn', nombre: 'FDN máx.', nombreLargo: 'FDN (% de la MS, máximo)', unidad: '% MS', decimales: 1, alReves: true, ...b.fdn })
  } else if (b.fdn) {
    filas.push({ clave: 'fdn', nombre: 'FDN mín.', nombreLargo: 'FDN (kg, mínimo 35 % de la MS)', unidad: 'kg', decimales: 3, ...b.fdn })
  }
  return filas
}
