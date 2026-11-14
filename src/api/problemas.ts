import type { components } from './schema.d.ts'

/**
 * Cuerpo RFC 7807 de los errores, tomado del contrato OpenAPI del backend (schema.d.ts).
 * Los campos extra dependen del tipo de error: `errores` (400), `facturaId` (409) y `errorId` (500).
 */
export type ProblemDetail = components['schemas']['ProblemDetail'] &
  Partial<components['schemas']['ProblemaValidacion'] & components['schemas']['ProblemaFacturaDuplicada'] & components['schemas']['ProblemaErrorInterno']>

/** Respuesta de GET /api/v1/facturas/auditoria/verificar-huella/{huella}. */
export type VerificacionHuella = components['schemas']['VerificacionHuellaDto']

/** Error de la API traducido a lo que la pantalla necesita para explicarlo. */
export type DetalleError =
  | { tipo: 'validacion'; mensaje: string; campos: Record<string, string> }
  | { tipo: 'conflicto'; mensaje: string; facturaId?: number }
  | { tipo: 'no-encontrado'; mensaje?: string }
  | { tipo: 'no-autorizado' }
  | { tipo: 'servidor'; estado: number; errorId?: string }
  | { tipo: 'red' }

/** Error que lanzan las llamadas a la API. Las pantallas lo presentan con <MensajeError>. */
export class ErrorApi extends Error {
  readonly detalle: DetalleError

  constructor(detalle: DetalleError, opciones?: { cause?: unknown }) {
    super(`Error de API: ${detalle.tipo}`, opciones)
    this.name = 'ErrorApi'
    this.detalle = detalle
  }
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)

/** Interpreta el cuerpo de error, venga ya parseado o como texto JSON. */
function comoProblema(cuerpo: unknown): ProblemDetail & { error?: string } {
  if (typeof cuerpo === 'string') {
    try {
      return comoProblema(JSON.parse(cuerpo))
    } catch {
      return {}
    }
  }
  return esObjeto(cuerpo) ? (cuerpo as ProblemDetail & { error?: string }) : {}
}

function camposDe(errores: unknown): Record<string, string> {
  if (!esObjeto(errores)) return {}
  return Object.fromEntries(
    Object.entries(errores).filter((entrada): entrada is [string, string] => typeof entrada[1] === 'string'),
  )
}

/** Traduce una respuesta HTTP de error (status >= 400) a un ErrorApi. */
export function errorDesdeRespuesta(estado: number, cuerpo: unknown): ErrorApi {
  const problema = comoProblema(cuerpo)
  const detalle = typeof problema.detail === 'string' && problema.detail.trim() ? problema.detail : undefined

  switch (true) {
    case estado === 400:
      return new ErrorApi({
        tipo: 'validacion',
        mensaje: detalle ?? 'Los datos enviados no son válidos.',
        campos: camposDe(problema.errores),
      })
    case estado === 401:
      return new ErrorApi({ tipo: 'no-autorizado' })
    case estado === 404:
      return new ErrorApi({ tipo: 'no-encontrado', mensaje: detalle ?? problema.error })
    case estado === 409:
      return new ErrorApi({
        tipo: 'conflicto',
        mensaje: detalle ?? 'La operación entra en conflicto con datos existentes.',
        facturaId: typeof problema.facturaId === 'number' ? problema.facturaId : undefined,
      })
    default:
      // 5xx y cualquier otro código inesperado: mensaje genérico, sin detalles técnicos
      return new ErrorApi({
        tipo: 'servidor',
        estado,
        errorId: typeof problema.errorId === 'string' ? problema.errorId : undefined,
      })
  }
}

/** Fallo sin respuesta HTTP utilizable: red caída, servidor inaccesible o cuerpo no interpretable. */
export function errorDeRed(causa?: unknown): ErrorApi {
  return new ErrorApi({ tipo: 'red' }, { cause: causa })
}

/** Convierte cualquier valor lanzado en un ErrorApi, conservando los que ya lo son. */
export function normalizarError(error: unknown): ErrorApi {
  return error instanceof ErrorApi ? error : errorDeRed(error)
}
