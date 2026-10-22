// Pestaña "Resultados": requerimientos, balances, indicadores, alertas y guardar
import { Button, Text, View } from 'react-native'
import FilaBalance from '../componentes/FilaBalance'
import GuardarCalculo from '../componentes/GuardarCalculo'
import Tarjetas from '../componentes/Tarjetas'
import { estilos } from '../estilos'
import { fmt } from '../utiles'

export default function Resultados({ r, pesoCargado, irAAnimal, guardarEnHistorial, armarEntrada }) {
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

  const req = r.requerimientos.lactancia
  const utg = r.requerimientos.ultimoTercioGestacion
  const totales = r.aportes.totales
  const bal = r.balances

  return (
    <View>
      {/* 1. Lo que necesita el animal */}
      <Tarjetas
        titulo="Requerimientos en lactancia"
        items={[
          { etiqueta: 'Proteína (PB)', valor: fmt(req.pbTotal, 0), unidad: 'g/día' },
          { etiqueta: 'Energía (EM)', valor: fmt(req.emTotalAjustado, 2), unidad: 'Mcal/día' },
          { etiqueta: 'Calcio', valor: fmt(req.ca, 1), unidad: 'g/día' },
          { etiqueta: 'Fósforo', valor: fmt(req.p, 1), unidad: 'g/día' },
        ]}
      />
      {utg ? (
        <Tarjetas
          titulo="Requerimientos en último tercio de gestación"
          items={[
            { etiqueta: 'Proteína (PB)', valor: fmt(utg.pbTotal, 0), unidad: 'g/día' },
            { etiqueta: 'Energía (EM)', valor: fmt(utg.emTotal, 2), unidad: 'Mcal/día' },
          ]}
        />
      ) : null}

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
          <FilaBalance nombre="PB" unidad="g" requerido={req.pbTotal} aporte={totales.pbG} balance={bal.pbG} />
          <FilaBalance nombre="EM" unidad="Mcal" requerido={req.emTotalAjustado} aporte={totales.emMcal} balance={bal.emMcal} decimales={2} />
          <FilaBalance nombre="Calcio" unidad="g" requerido={req.ca} aporte={totales.caG} balance={bal.caG} decimales={1} />
          <FilaBalance nombre="Fósforo" unidad="g" requerido={req.p} aporte={totales.pG} balance={bal.pG} decimales={1} />
          <FilaBalance nombre="FDN máx." unidad="% MS" requerido={req.fdnMaxPct} aporte={totales.fdnPct} balance={bal.fdnPct} decimales={1} alReves />

          <Tarjetas
            titulo="Indicadores"
            tono="indicador"
            items={[
              { etiqueta: 'Consumo de MS', valor: fmt(r.indicadores.ctmsPctPV, 2) + ' %', unidad: 'del peso vivo' },
              {
                etiqueta: 'Relación Ca/P',
                valor: r.indicadores.relacionCaP ? fmt(r.indicadores.relacionCaP, 2) : '–',
                unidad: 'mínimo 2',
                alerta: r.indicadores.relacionCaP > 0 && r.indicadores.relacionCaP < 2,
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
            ejemploNombre="Lote 1, Cabra Juana, Ración de invierno"
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
