import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { servidor } from '../pruebas/servidor.ts'
import { api, resultado } from './cliente.ts'
import { ErrorApi } from './problemas.ts'

const obtenerFactura = (id: number) => resultado(() => api.GET('/api/v1/facturas/{id}', { params: { path: { id } } }))

describe('cliente de la API', () => {
  test('llama a una ruta relativa del mismo origen y sin X-API-Key', async () => {
    let peticion: Request | undefined
    servidor.use(
      http.get('/api/v1/facturas/:id', ({ request }) => {
        peticion = request
        return HttpResponse.json({ id: 42, numSerieFactura: '2026-001' })
      }),
    )

    const factura = await obtenerFactura(42)

    expect(factura).toMatchObject({ id: 42, numSerieFactura: '2026-001' })
    expect(new URL(peticion!.url).origin).toBe(window.location.origin)
    expect(new URL(peticion!.url).pathname).toBe('/api/v1/facturas/42')
    expect(peticion!.headers.has('X-API-Key')).toBe(false)
    expect(peticion!.headers.has('Authorization')).toBe(false)
  })

  test('un 404 sin cuerpo se lanza como no encontrado', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => new HttpResponse(null, { status: 404 })))

    await expect(obtenerFactura(999999)).rejects.toMatchObject({ detalle: { tipo: 'no-encontrado' } })
  })

  test('un ProblemDetail de 409 se lanza como conflicto', async () => {
    servidor.use(
      http.get('/api/v1/facturas/:id', () =>
        HttpResponse.json({ status: 409, title: 'Conflicto de negocio', detail: 'Duplicada' }, { status: 409 }),
      ),
    )

    await expect(obtenerFactura(1)).rejects.toMatchObject({ detalle: { tipo: 'conflicto', mensaje: 'Duplicada' } })
  })

  test('un fallo de red se lanza como error de red', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.error()))

    const error = await obtenerFactura(1).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect((error as ErrorApi).detalle).toEqual({ tipo: 'red' })
  })
})
