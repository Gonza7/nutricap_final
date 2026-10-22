// Pestaña "Resultados" del módulo Carne
import { Button, Text, View } from 'react-native'
import FilaBalance from '../componentes/FilaBalance'
import GuardarCalculo from '../componentes/GuardarCalculo'
import Tarjetas from '../componentes/Tarjetas'
import { estilos } from '../estilos'
import { fmt } from '../utiles'

export default function ResultadosCarne({ r, pesoCargado, irAAnimal, guardarEnHistorial, armarEntrada }) {
  // Sin peso vivo no se muestran resultados
  if (!pesoCargado) {
    return (
      <View>
        <Text style={estilos.seccion}>Resultados</Text>
        <Text style={estilos.alerta}>Cargá el peso vivo del animal para ver los requerimientos y el balance.</Text>
        <Button title="Ir a la pestaña Animal" onPress={irAAnimal} color="#4a6b25" />
      </View>
    )
  }

  const req = r.requerimientos
  const totales = r.aportes.totales
  const bal = r.balances
  const ind = r.indicadores

  // Tarjetas de requerimientos. La FDN solo existe en recría.
  const itemsReq = [
    { etiqueta: 'Proteína (PB)', valor: fmt(req.pb, 1), unidad: 'g/día' },
    { etiqueta: 'Energía (EM)', valor: fmt(req.em, 3), unidad: 'Mcal/día' },
    { etiqueta: 'Calcio', valor: fmt(req.ca, 2), unidad: 'g/día' },
    { etiqueta: 'Fósforo', valor: fmt(req.p, 2), unidad: 'g/día' },
  ]
  if (req.fdnKg !== null) {
    itemsReq.push(
      totales.msKg > 0
        ? { etiqueta: 'FDN mínima', valor: fmt(req.fdnKg, 3), unidad: 'kg/día (35 % de la MS)' }
        : { etiqueta: 'FDN mínima', valor: '35 %', unidad: 'de la MS que coma' }
    )
  }

  return (
    <View>
      {/* 1. Lo que necesita el animal */}
      <Tarjetas
        titulo="Requerimientos"
        nota={`Peso metabólico (PV⁰·⁷⁵): ${fmt(req.pesoMetabolico, 2)} kg`}
        items={itemsReq}
      />

      {/* 2. Lo que aporta la ración comparado con lo que necesita */}
      {totales.msKg > 0 ? (
        <View>
          <Text style={estilos.seccion}>Balance de la ración</Text>
          <View style={estilos.cabecera}>
            <Text style={{ flex: 1.4 }} />
            <Text style={estilos.cabeceraTexto}>Requiere</Text>
            <Text style={estilos.cabeceraTexto}>Aporta</Text>
            <Text style={estilos.cabeceraTexto}>Balance</Text>
          </View>
          <FilaBalance nombre="PB" unidad="g" requerido={req.pb} aporte={totales.pbG} balance={bal.pbG} />
          <FilaBalance nombre="EM" unidad="Mcal" requerido={req.em} aporte={totales.emMcal} balance={bal.emMcal} decimales={2} />
          <FilaBalance nombre="Calcio" unidad="g" requerido={req.ca} aporte={totales.caG} balance={bal.caG} decimales={1} />
          <FilaBalance nombre="Fósforo" unidad="g" requerido={req.p} aporte={totales.pG} balance={bal.pG} decimales={1} />
          {req.fdnKg !== null ? (
            <FilaBalance nombre="FDN mín." unidad="kg" requerido={req.fdnKg} aporte={ind.fdnKgAporte} balance={bal.fdnKg} decimales={3} />
          ) : null}

          <Tarjetas
            titulo="Indicadores"
            tono="indicador"
            items={[
              {
                etiqueta: 'Consumo de MS',
                valor: fmt(ind.ctmsPctPV, 2) + ' %',
                unidad: `del peso vivo (referencia ${ind.ctmsReferenciaPct} %)`,
              },
              {
                etiqueta: 'Relación Ca/P',
                valor: ind.relacionCaP ? fmt(ind.relacionCaP, 2) : '–',
                unidad: 'mínimo 2',
                alerta: ind.relacionCaP > 0 && ind.relacionCaP < 2,
              },
            ]}
          />

          <Text style={estilos.seccion}>Alertas</Text>
          {r.alertas.length === 0 ? (
            <Text style={estilos.ok}>La ración cubre los requerimientos.</Text>
          ) : (
            r.alertas.map(a => <Text key={a} style={estilos.alerta}>{a}</Text>)
          )}

          {/* 3. Guardar, siempre al final */}
          <GuardarCalculo
            guardarEnHistorial={guardarEnHistorial}
            armarEntrada={armarEntrada}
            ejemploNombre="Cabritos lote 2, Recría otoño"
          />
        </View>
      ) : (
        <View>
          <Text style={estilos.seccion}>Balance de la ración</Text>
          <Text>Cargá los kg de algún alimento en la pestaña Ración para ver el balance.</Text>
        </View>
      )}
    </View>
  )
}
