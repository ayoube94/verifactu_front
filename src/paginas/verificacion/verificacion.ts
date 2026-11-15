import { api, resultado } from '../../api/cliente.ts'
import type { VerificacionHuella } from '../../api/problemas.ts'

/**
 * Comprueba la integridad de un registro (`GET /api/v1/facturas/auditoria/verificar-huella/{huella}`).
 * El backend recalcula la huella: el frontal solo presenta el resultado.
 */
export function verificarHuella(huella: string): Promise<VerificacionHuella> {
  return resultado(() =>
    api.GET('/api/v1/facturas/auditoria/verificar-huella/{huella}', { params: { path: { huella } } }),
  ) as Promise<VerificacionHuella>
}
