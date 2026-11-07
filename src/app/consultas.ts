import { QueryClient } from '@tanstack/react-query'

/**
 * Caché de peticiones en memoria (nunca persistida: sin datos de facturación en el navegador).
 * Las mutaciones no se reintentan nunca: una emisión encadena una huella y no puede repetirse sola.
 */
export function crearClienteConsultas() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1 },
      mutations: { retry: false },
    },
  })
}
