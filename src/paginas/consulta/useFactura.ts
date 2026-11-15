import { useQuery } from '@tanstack/react-query'
import { obtenerFactura } from '../emitir/emision.ts'

/**
 * Carga una factura por su id (`GET /api/v1/facturas/{id}`). Sin persistencia: la caché vive solo en la pestaña
 * y una factura se vuelve a pedir al abrirla (restricción del contrato: nada de facturas en el navegador).
 */
export function useFactura(id: number) {
  return useQuery({
    queryKey: ['factura', id],
    queryFn: () => obtenerFactura(id),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}
