// Pestaña "Resultados" del módulo Carne
import { Text, View } from 'react-native'
import BarraBalance from '../componentes/BarraBalance'
import GuardarCalculo from '../componentes/GuardarCalculo'
import { Alertas, Cifras, SinPeso, Titulo } from '../componentes/PartesResultado'
import { fuentes, tema } from '../tema'
import { fmt } from '../utiles'

export default function ResultadosCarne({ r, pesoCargado, irAAnimal, guardarEnHistorial, armarEntrada }) {
  if (!pesoCargado) return <SinPeso irAAnimal={irAAnimal} />

  const req = r.requerimientos
  const totales = r.aportes.totales
  const bal = r.balances
  const ind = r.indicadores
  const hayRacion = totales.msKg > 0

  // Requerimientos. La FDN solo existe en recría y depende de lo que coma.
  const itemsReq = [
    { etiqueta: 'Proteína bruta', valor: fmt(req.pb, 1), unidad: 'g por día' },
    { etiqueta: 'Energía metabolizable', valor: fmt(req.em, 3), unidad: 'Mcal por día' },
    { etiqueta: 'Calcio', valor: fmt(req.ca, 2), unidad: 'g por día' },
    { etiqueta: 'Fósforo', valor: fmt(req.p, 2), unidad: 'g por día' },
  ]
  if (req.fdnKg !== null) {
    itemsReq.push(
      hayRacion
        ? { etiqueta: 'FDN mínima', valor: fmt(req.fdnKg, 3), unidad: 'kg por día (35 % de la MS)' }
        : { etiqueta: 'FDN mínima', valor: '35 %', unidad: 'de la MS que coma' }
    )
  }

  return (
    <View>
      {hayRacion ? (
        <View>
          {/* 1. Balance */}
          <Titulo nota="Cuánto cubre la ración de lo que necesita el animal. La rayita marca el 100 %.">
            Balance de la ración
          </Titulo>
          <BarraBalance nombre="Proteína bruta" unidad="g" requerido={req.pb} aporte={totales.pbG} balance={bal.pbG} />
          <BarraBalance nombre="Energía metabolizable" unidad="Mcal" requerido={req.em} aporte={totales.emMcal} balance={bal.emMcal} decimales={2} />
          <BarraBalance nombre="Calcio" unidad="g" requerido={req.ca} aporte={totales.caG} balance={bal.caG} decimales={2} />
          <BarraBalance nombre="Fósforo" unidad="g" requerido={req.p} aporte={totales.pG} balance={bal.pG} decimales={2} />
          {req.fdnKg !== null ? (
            <BarraBalance nombre="FDN mínima" unidad="kg" requerido={req.fdnKg} aporte={ind.fdnKgAporte} balance={bal.fdnKg} decimales={3} />
          ) : null}

          {/* 2. Qué corregir */}
          <Titulo>Para revisar</Titulo>
          <Alertas alertas={r.alertas} />

          {/* 3. Indicadores */}
          <Titulo>Indicadores</Titulo>
          <Cifras
            items={[
              {
                etiqueta: 'Consumo de materia seca',
                valor: `${fmt(ind.ctmsPctPV, 2)} %`,
                unidad: `del peso vivo (referencia ${ind.ctmsReferenciaPct} %)`,
              },
              {
                etiqueta: 'Relación calcio / fósforo',
                valor: ind.relacionCaP ? fmt(ind.relacionCaP, 2) : '–',
                unidad: 'mínimo 2',
                alerta: ind.relacionCaP > 0 && ind.relacionCaP < 2,
              },
            ]}
          />
        </View>
      ) : (
        <View>
          <Titulo>Balance de la ración</Titulo>
          <Text style={{ fontFamily: fuentes.regular, fontSize: 16, color: tema.suave }}>
            Cargá los kg de algún alimento en la pestaña Ración para ver el balance.
          </Text>
        </View>
      )}

      {/* 4. Requerimientos */}
      <Titulo nota={`Peso metabólico (PV⁰·⁷⁵): ${fmt(req.pesoMetabolico, 2)} kg`}>Requerimientos</Titulo>
      <Cifras items={itemsReq} />

      {/* 5. Guardar, siempre al final */}
      {hayRacion ? (
        <GuardarCalculo
          guardarEnHistorial={guardarEnHistorial}
          armarEntrada={armarEntrada}
          ejemploNombre="Cabritos lote 2, Recría otoño"
        />
      ) : null}
    </View>
  )
}
