/**
 * Secciones de la navegación principal. Solo se añaden cuando la pantalla existe
 * (spec estructura-interfaz: nunca enlaces a secciones que aún no existen).
 *  */
export interface Seccion {
  ruta: string
  etiqueta: string
}

export const secciones: readonly Seccion[] = [
  { ruta: '/', etiqueta: 'Inicio' },
  { ruta: '/facturas', etiqueta: 'Facturas' },
  { ruta: '/facturas/nueva', etiqueta: 'Emitir factura' },
  { ruta: '/consultar', etiqueta: 'Consultar factura' },
  { ruta: '/verificar-huella', etiqueta: 'Verificar huella' },
]
