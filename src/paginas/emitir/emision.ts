import { resultado, api } from '../../api/cliente.ts'
import type { components } from '../../api/schema.d.ts'

export type PeticionFactura = components['schemas']['FacturaCreateDto']
/**
 * Factura devuelta por POST /api/v1/facturas (201, contrato de contrato-api-openapi).
 */
export type FacturaEmitida = components['schemas']['FacturaResponseDto']

/** Envía la factura. Una sola petición: nunca se reintenta desde aquí. */
export function emitirFactura(cuerpo: PeticionFactura): Promise<FacturaEmitida> {
  return resultado(() => api.POST('/api/v1/facturas', { body: cuerpo })) as Promise<FacturaEmitida>
}

/** Busca una factura por serie y número, tal como se emitió. Sirve para saber si una emisión sin respuesta llegó a crearse. */
export function buscarPorNumero(serie: string, numero: string): Promise<FacturaEmitida> {
  return resultado(() => api.GET('/api/v1/facturas/por-numero', { params: { query: { serie, numero } } })) as Promise<FacturaEmitida>
}

/** Carga una factura por su identificador (GET /api/v1/facturas/{id}). */
export function obtenerFactura(id: number): Promise<FacturaEmitida> {
  return resultado(() => api.GET('/api/v1/facturas/{id}', { params: { path: { id } } })) as Promise<FacturaEmitida>
}
