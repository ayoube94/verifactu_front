/**
 * Estado de envío ante la AEAT (EstadoEnvio del backend) en palabras y con un tono.
 * El tono decide el color; el texto siempre se muestra. Solo `exito` es éxito: todo lo demás es incidencia o pendiente.
 */
export type EstadoEnvio = 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'ACEPTADO_CON_ERRORES' | 'RECHAZADO' | 'ERROR_CONEXION'

export type TonoEstado = 'exito' | 'aviso' | 'incidencia' | 'pendiente'

export interface PresentacionEstado {
  texto: string
  tono: TonoEstado
}

const PRESENTACION: Record<EstadoEnvio, PresentacionEstado> = {
  ACEPTADO: { texto: 'Aceptada por la AEAT', tono: 'exito' },
  ACEPTADO_CON_ERRORES: { texto: 'Aceptada con errores', tono: 'aviso' },
  RECHAZADO: { texto: 'Rechazada por la AEAT', tono: 'incidencia' },
  ERROR_CONEXION: { texto: 'Error de conexión con la AEAT', tono: 'incidencia' },
  PENDIENTE: { texto: 'Pendiente de envío', tono: 'pendiente' },
  ENVIADO: { texto: 'Enviada, sin respuesta', tono: 'pendiente' },
}

export function presentarEstado(estado: EstadoEnvio): PresentacionEstado {
  return PRESENTACION[estado]
}
