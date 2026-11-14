import { describe, expect, test } from 'vitest'
import { ErrorApi, errorDeRed, errorDesdeRespuesta, normalizarError } from './problemas.ts'

// Cuerpos copiados de GlobalExceptionHandler y ApiKeyFilter del backend (verifactu_web).
const validacion = {
  type: 'https://verifactu.aeat.es/errors/validation',
  title: 'Solicitud no válida',
  status: 400,
  detail: 'Error de validación en los datos de la factura',
  instance: '/api/v1/facturas',
  timestamp: '2026-11-07T19:00:00Z',
  errores: { serie: 'La serie es obligatoria', 'lineas[0].cantidad': 'La cantidad debe ser mayor que 0' },
}
const jsonIlegible = {
  type: 'https://verifactu.aeat.es/errors/malformed-body',
  title: 'Solicitud no válida',
  status: 400,
  detail: 'El cuerpo de la petición no es un JSON válido',
}
const conflicto = {
  type: 'https://verifactu.aeat.es/errors/business-conflict',
  title: 'Conflicto de negocio',
  status: 409,
  detail: 'Ya existe una factura registrada con la serie 2026 y número 001',
}
const interno = {
  type: 'https://verifactu.aeat.es/errors/internal',
  title: 'Error interno',
  status: 500,
  detail: 'Se ha producido un error inesperado en el servidor',
  errorId: '3f6c2a1e-9b7d-4c1f-8e2a-5d6b7c8d9e0f',
}
const noAutorizado =
  '{"type":"https://verifactu.aeat.es/errors/unauthorized","title":"No autorizado","status":401,"detail":"Falta la cabecera X-API-Key o la clave no es válida"}'

describe('errorDesdeRespuesta', () => {
  test('400 de validación expone el mensaje general y cada campo', () => {
    expect(errorDesdeRespuesta(400, validacion).detalle).toEqual({
      tipo: 'validacion',
      mensaje: 'Error de validación en los datos de la factura',
      campos: { serie: 'La serie es obligatoria', 'lineas[0].cantidad': 'La cantidad debe ser mayor que 0' },
    })
  })

  test('400 sin errores por campo muestra el detail como mensaje general', () => {
    expect(errorDesdeRespuesta(400, jsonIlegible).detalle).toEqual({
      tipo: 'validacion',
      mensaje: 'El cuerpo de la petición no es un JSON válido',
      campos: {},
    })
  })

  test('401 del filtro de clave, aunque llegue como texto, es no autorizado', () => {
    expect(errorDesdeRespuesta(401, noAutorizado).detalle).toEqual({ tipo: 'no-autorizado' })
  })

  test('401 del borde sin cuerpo también es no autorizado', () => {
    expect(errorDesdeRespuesta(401, '').detalle).toEqual({ tipo: 'no-autorizado' })
  })

  test('404 sin cuerpo (GET /facturas/{id}) es no encontrado', () => {
    expect(errorDesdeRespuesta(404, '').detalle).toEqual({ tipo: 'no-encontrado', mensaje: undefined })
  })

  test('404 con {"error"} (verificar huella) conserva el mensaje', () => {
    expect(errorDesdeRespuesta(404, { error: 'Registro con la huella indicada no encontrado' }).detalle).toEqual({
      tipo: 'no-encontrado',
      mensaje: 'Registro con la huella indicada no encontrado',
    })
  })

  test('409 es un conflicto con el mensaje del backend', () => {
    expect(errorDesdeRespuesta(409, conflicto).detalle).toEqual({
      tipo: 'conflicto',
      mensaje: 'Ya existe una factura registrada con la serie 2026 y número 001',
    })
  })

  test('500 es error de servidor con su errorId y sin el detail técnico', () => {
    expect(errorDesdeRespuesta(500, interno).detalle).toEqual({
      tipo: 'servidor',
      estado: 500,
      errorId: '3f6c2a1e-9b7d-4c1f-8e2a-5d6b7c8d9e0f',
    })
  })

  test('502 del borde con cuerpo HTML es error de servidor sin errorId', () => {
    expect(errorDesdeRespuesta(502, '<html>Bad Gateway</html>').detalle).toEqual({
      tipo: 'servidor',
      estado: 502,
      errorId: undefined,
    })
  })
})

describe('fallos sin respuesta', () => {
  test('un fallo de red es de tipo red y conserva la causa', () => {
    const causa = new TypeError('Failed to fetch')
    const error = errorDeRed(causa)
    expect(error.detalle).toEqual({ tipo: 'red' })
    expect(error.cause).toBe(causa)
  })

  test('normalizarError conserva un ErrorApi y convierte el resto en red', () => {
    const conocido = errorDesdeRespuesta(409, conflicto)
    expect(normalizarError(conocido)).toBe(conocido)
    expect(normalizarError(new SyntaxError('JSON inválido'))).toBeInstanceOf(ErrorApi)
    expect(normalizarError('cualquier cosa').detalle).toEqual({ tipo: 'red' })
  })
})
