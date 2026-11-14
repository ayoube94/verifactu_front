import { describe, expect, test } from 'vitest'
import { presentarEstado, type EstadoEnvio } from './estadoEnvio.ts'

const todos: EstadoEnvio[] = ['PENDIENTE', 'ENVIADO', 'ACEPTADO', 'ACEPTADO_CON_ERRORES', 'RECHAZADO', 'ERROR_CONEXION']

describe('presentarEstado', () => {
  test('cubre los seis estados con texto no vacío', () => {
    for (const estado of todos) expect(presentarEstado(estado).texto.length).toBeGreaterThan(0)
  })

  test('solo ACEPTADO es éxito', () => {
    const exitos = todos.filter((e) => presentarEstado(e).tono === 'exito')
    expect(exitos).toEqual(['ACEPTADO'])
  })

  test('RECHAZADO y ERROR_CONEXION son incidencias, nunca éxito', () => {
    expect(presentarEstado('RECHAZADO')).toEqual({ texto: 'Rechazada por la AEAT', tono: 'incidencia' })
    expect(presentarEstado('ERROR_CONEXION')).toEqual({ texto: 'Error de conexión con la AEAT', tono: 'incidencia' })
  })
})
