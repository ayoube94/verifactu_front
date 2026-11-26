/**
 * Lleva la vista al inicio de la tabla tras cambiar de página, solo si ese inicio queda por encima de lo visible.
 * Inmediato y sin animación. No hace nada si el elemento no existe o el navegador no tiene `scrollIntoView` (jsdom).
 */
export function volverAlInicioDeLaTabla(elemento: HTMLElement | null) {
  if (!elemento || typeof elemento.scrollIntoView !== 'function') return
  if (elemento.getBoundingClientRect().top >= 0) return
  elemento.scrollIntoView({ block: 'start', behavior: 'instant' })
}
