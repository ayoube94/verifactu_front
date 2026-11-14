import { resultado, api } from '../../api/cliente.ts'
import type { components } from '../../api/schema.d.ts'

export type PeticionFactura = components['schemas']['FacturaCreateDto']
/**
 * Factura devuelta por POST /api/v1/facturas. El contrato actual la declara como 200 (sin tipar);
 * el grupo 8 la toma del contrato con 201 cuando el backend lo publique.
 */
export type FacturaEmitida = components['schemas']['FacturaResponseDto']

/** Envía la factura. Una sola petición: nunca se reintenta desde aquí. */
export function emitirFactura(cuerpo: PeticionFactura): Promise<FacturaEmitida> {
  return resultado(() => api.POST('/api/v1/facturas', { body: cuerpo })) as Promise<FacturaEmitida>
}
