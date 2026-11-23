import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listarFacturas, type ParametrosListado } from './listado.ts'

/**
 * Carga una página del listado. La caché vive solo en memoria de la pestaña (nada de facturas en el navegador),
 * se conserva la página anterior mientras llega la siguiente y siempre se vuelve a pedir al montar: el estado de
 * envío de una factura recién emitida debe verse al volver.
 */
export function useListadoFacturas(parametros: ParametrosListado) {
  return useQuery({
    queryKey: ['facturas', parametros],
    queryFn: () => listarFacturas(parametros),
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}
