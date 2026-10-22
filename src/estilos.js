// Estilos que usan varias pantallas. Así se definen una sola vez.
import { StyleSheet } from 'react-native'

export const colores = {
  verde: '#4a6b25',
  rojo: '#a2461e',
  gris: '#777',
  linea: '#ccc',
}

export const estilos = StyleSheet.create({
  seccion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
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
    color: colores.rojo,
    fontWeight: '600',
  },
  cabecera: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colores.linea,
    paddingBottom: 4,
  },
  cabeceraTexto: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: colores.gris,
  },
  alerta: {
    color: colores.rojo,
    backgroundColor: '#f6e1d6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  ok: {
    color: '#2f7a3a',
    backgroundColor: '#dcefdc',
    padding: 8,
    borderRadius: 6,
  },
  borrar: {
    marginTop: 32,
    padding: 12,
    borderWidth: 1,
    borderColor: colores.rojo,
    borderRadius: 6,
    alignItems: 'center',
  },
  borrarTexto: {
    color: colores.rojo,
    fontWeight: '600',
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
    borderColor: colores.verde,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  botonChicoTexto: {
    color: colores.verde,
    fontWeight: '600',
    fontSize: 13,
  },
  aviso: {
    color: '#2f7a3a',
    backgroundColor: '#dcefdc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  avisoError: {
    color: colores.rojo,
    backgroundColor: '#f6e1d6',
  },
})
