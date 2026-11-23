import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, test } from 'vitest'
import { ErrorApi } from '../../api/problemas.ts'
import { servidor } from '../../pruebas/servidor.ts'
import { useListadoFacturas } from './useListadoFacturas.ts'

const pagina = {
  content: [
    { id: 42, numSerieFactura: '2026/001', fechaExpedicion: '2026-03-05', tipoFactura: 'F1', clienteNif: 'B12345678', clienteNombre: 'Cliente SL', importeTotal: 1210, estadoEnvio: 'ACEPTADO', huella: 'ABC' },
  ],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
}

function usar(parametros: Parameters<typeof useListadoFacturas>[0]) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const envoltorio = ({ children }: { children: ReactNode }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  return renderHook(() => useListadoFacturas(parametros), { wrapper: envoltorio })
}

describe('useListadoFacturas', () => {
  test('200: devuelve la página y la petición lleva exactamente los parámetros indicados', async () => {
    let url: URL | undefined
    servidor.use(
      http.get('/api/v1/facturas', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(pagina)
      }),
    )
    const { result } = usar({ serie: 'A', fechaDesde: '2026-03-01', fechaHasta: '2026-03-31', estadoEnvio: 'RECHAZADO', page: 1, size: 50 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content?.[0]?.numSerieFactura).toBe('2026/001')
    expect(Object.fromEntries(url!.searchParams)).toEqual({ serie: 'A', fechaDesde: '2026-03-01', fechaHasta: '2026-03-31', estadoEnvio: 'RECHAZADO', page: '1', size: '50' })
  })

  test('sin filtros solo envía página y tamaño', async () => {
    let url: URL | undefined
    servidor.use(
      http.get('/api/v1/facturas', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(pagina)
      }),
    )
    const { result } = usar({ page: 0, size: 20 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Object.fromEntries(url!.searchParams)).toEqual({ page: '0', size: '20' })
  })

  test('400 con errores: ErrorApi de validación con los campos', async () => {
    servidor.use(
      http.get('/api/v1/facturas', () => HttpResponse.json({ status: 400, detail: 'Parámetro no válido', errores: { size: 'debe ser como máximo 100' } }, { status: 400 })),
    )
    const { result } = usar({ page: 0, size: 20 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ErrorApi)
    expect((result.current.error as ErrorApi).detalle).toMatchObject({ tipo: 'validacion', campos: { size: 'debe ser como máximo 100' } })
  })

  test('500 con errorId', async () => {
    servidor.use(http.get('/api/v1/facturas', () => HttpResponse.json({ status: 500, errorId: 'abc-123' }, { status: 500 })))
    const { result } = usar({ page: 0, size: 20 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ErrorApi).detalle).toMatchObject({ tipo: 'servidor', estado: 500, errorId: 'abc-123' })
  })

  test('sin respuesta: error de red', async () => {
    servidor.use(http.get('/api/v1/facturas', () => HttpResponse.error()))
    const { result } = usar({ page: 0, size: 20 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ErrorApi).detalle.tipo).toBe('red')
  })
})
