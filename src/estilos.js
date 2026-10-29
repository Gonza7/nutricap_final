// Estilos que usan varias pantallas. Así se definen una sola vez.
// Los colores y las letras salen de tema.js.
import { StyleSheet } from 'react-native'
import { fuentes, tema } from './tema'

// Nombres viejos, para que las pantallas que todavía los usan sigan andando
export const colores = {
  verde: tema.marca,
  rojo: tema.falta,
  gris: tema.suave,
  linea: tema.linea,
}

export const estilos = StyleSheet.create({
  seccion: {
    fontFamily: fuentes.semi,
    fontSize: 20,
    color: tema.tinta,
    marginTop: 28,
    marginBottom: 12,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quitar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  quitarTexto: {
    fontFamily: fuentes.semi,
    fontSize: 15,
    color: tema.falta,
  },
  cabecera: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: tema.linea,
    paddingBottom: 4,
  },
  cabeceraTexto: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fuentes.medio,
    fontSize: 13,
    color: tema.suave,
  },
  // Avisos: una rayita de color a la izquierda, sin fondo
  alerta: {
    fontFamily: fuentes.regular,
    fontSize: 16,
    color: tema.tinta,
    borderLeftWidth: 3,
    borderLeftColor: tema.falta,
    paddingLeft: 10,
    paddingVertical: 2,
    marginBottom: 8,
  },
  ok: {
    fontFamily: fuentes.medio,
    fontSize: 16,
    color: tema.sobra,
  },
  // Botón de "Empezar de cero": con borde rojo, porque borra
  borrar: {
    marginTop: 32,
    alignSelf: 'flex-start',   // tan ancho como su texto
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tema.falta,
    borderRadius: 8,
    alignItems: 'center',
  },
  borrarTexto: {
    fontFamily: fuentes.semi,
    fontSize: 16,
    color: tema.falta,
  },
  nota: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: tema.tenue,
    marginTop: 6,
  },
  // Botones chicos de PDF, exportar e importar
  filaBotones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  botonChico: {
    borderWidth: 1,
    borderColor: tema.marca,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  botonChicoTexto: {
    fontFamily: fuentes.semi,
    fontSize: 15,
    color: tema.marca,
  },
  aviso: {
    fontFamily: fuentes.regular,
    fontSize: 15,
    color: tema.sobra,
    borderLeftWidth: 3,
    borderLeftColor: tema.sobra,
    paddingLeft: 10,
    paddingVertical: 2,
    marginBottom: 10,
  },
  avisoError: {
    color: tema.falta,
    borderLeftColor: tema.falta,
  },
})
