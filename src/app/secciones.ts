/**
 * Secciones de la navegación principal. Solo se añaden cuando la pantalla existe
 * (spec estructura-interfaz: nunca enlaces a secciones que aún no existen).
 * Próximas: «Emitir factura» (fase 2), «Consultar factura» y «Verificar huella» (fase 3).
 */
export interface Seccion {
  ruta: string
  etiqueta: string
}

export const secciones: readonly Seccion[] = [{ ruta: '/', etiqueta: 'Inicio' }]
