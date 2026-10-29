// Pestaña "Resultados" del módulo Tambo
import { Text, View } from 'react-native'
import BarraBalance from '../componentes/BarraBalance'
import GuardarCalculo from '../componentes/GuardarCalculo'
import { Alertas, Cifras, SinPeso, Titulo } from '../componentes/PartesResultado'
import { fuentes, tema } from '../tema'
import { fmt } from '../utiles'

export default function Resultados({ r, pesoCargado, irAAnimal, guardarEnHistorial, armarEntrada }) {
  if (!pesoCargado) return <SinPeso irAAnimal={irAAnimal} />

  const req = r.requerimientos.lactancia
  const utg = r.requerimientos.ultimoTercioGestacion
  const totales = r.aportes.totales
  const bal = r.balances
  const ind = r.indicadores
  const hayRacion = totales.msKg > 0

  return (
    <View>
      {hayRacion ? (
        <View>
          {/* 1. Balance: lo primero que se mira */}
          <Titulo nota="Cuánto cubre la ración de lo que necesita la cabra. La rayita marca el 100 %.">
            Balance de la ración
          </Titulo>
          <BarraBalance nombre="Proteína bruta" unidad="g" requerido={req.pbTotal} aporte={totales.pbG} balance={bal.pbG} />
          <BarraBalance nombre="Energía metabolizable" unidad="Mcal" requerido={req.emTotalAjustado} aporte={totales.emMcal} balance={bal.emMcal} decimales={2} />
          <BarraBalance nombre="Calcio" unidad="g" requerido={req.ca} aporte={totales.caG} balance={bal.caG} decimales={1} />
          <BarraBalance nombre="Fósforo" unidad="g" requerido={req.p} aporte={totales.pG} balance={bal.pG} decimales={1} />
          <BarraBalance nombre="FDN" unidad="% de la MS" requerido={req.fdnMaxPct} aporte={totales.fdnPct} balance={bal.fdnPct} decimales={1} alReves />

          {/* 2. Qué corregir */}
          <Titulo>Para revisar</Titulo>
          <Alertas alertas={r.alertas} />

          {/* 3. Indicadores */}
          <Titulo>Indicadores</Titulo>
          <Cifras
            items={[
              { etiqueta: 'Consumo de materia seca', valor: `${fmt(ind.ctmsPctPV, 2)} %`, unidad: 'del peso vivo' },
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
      <Titulo>Requerimientos en lactancia</Titulo>
      <Cifras
        items={[
          { etiqueta: 'Proteína bruta', valor: fmt(req.pbTotal, 0), unidad: 'g por día' },
          { etiqueta: 'Energía metabolizable', valor: fmt(req.emTotalAjustado, 2), unidad: 'Mcal por día' },
          { etiqueta: 'Calcio', valor: fmt(req.ca, 1), unidad: 'g por día' },
          { etiqueta: 'Fósforo', valor: fmt(req.p, 1), unidad: 'g por día' },
        ]}
      />
      {utg ? (
        <View>
          <Titulo>Último tercio de gestación</Titulo>
          <Cifras
            items={[
              { etiqueta: 'Proteína bruta', valor: fmt(utg.pbTotal, 0), unidad: 'g por día' },
              { etiqueta: 'Energía metabolizable', valor: fmt(utg.emTotal, 2), unidad: 'Mcal por día' },
            ]}
          />
        </View>
      ) : null}

      {/* 5. Guardar, siempre al final */}
      {hayRacion ? (
        <GuardarCalculo
          guardarEnHistorial={guardarEnHistorial}
          armarEntrada={armarEntrada}
          ejemploNombre="Lote 1, Cabra Juana, Ración de invierno"
        />
      ) : null}
    </View>
  )
}
