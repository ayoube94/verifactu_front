import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

const HUELLA = 'b826df163a9c0e4571d288f0a6b39c21fe0d4a5b7c6d8e9f0a1b2c3d4e5f6a7b'
const HUELLA_ANTERIOR = '4f1c9a0e77b2d3c108aa5e6f1290bc4478de0f12ab34cd56ef78901234567890'

const verificacion = (integridadValida: boolean, extra: Record<string, unknown> = {}) => ({
  huella: HUELLA,
  huellaAnterior: HUELLA_ANTERIOR,
  fechaGeneracion: '2026-10-14T20:00:00+02:00',
  cadenaCanonica: 'IDEmisorFactura=A98765432&NumSerieFactura=2026-001',
  integridadValida,
  mensaje: integridadValida ? 'La huella coincide con la guardada' : 'La huella no coincide',
  ...extra,
})

describe('formulario de verificación de huella', () => {
  test('una huella con formato incorrecto muestra el error y no hace ninguna petición', async () => {
    const peticion = vi.fn<() => Response>(() => HttpResponse.json(verificacion(true)))
    servidor.use(http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', peticion))
    renderizarRuta('/verificar-huella')

    await userEvent.type(screen.getByLabelText('Huella del registro'), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(await screen.findByText('La huella tiene 64 caracteres hexadecimales')).toBeInTheDocument()
    expect(screen.getByLabelText('Huella del registro')).toHaveAttribute('aria-invalid', 'true')
    expect(peticion).not.toHaveBeenCalled()
  })

  test('una huella válida en mayúsculas se envía en minúsculas', async () => {
    const pedidas: string[] = []
    servidor.use(
      http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', ({ params }) => {
        pedidas.push(String(params.huella))
        return HttpResponse.json(verificacion(true))
      }),
    )
    renderizarRuta('/verificar-huella')

    await userEvent.type(screen.getByLabelText('Huella del registro'), HUELLA.toUpperCase())
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(await screen.findByText('Integridad válida: el registro no ha sido alterado.')).toBeInTheDocument()
    expect(pedidas).toEqual([HUELLA])
  })
})

describe('resultado de la verificación', () => {
  test('integridad válida: lo dice y muestra el mensaje de la API', async () => {
    servidor.use(http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', () => HttpResponse.json(verificacion(true))))
    renderizarRuta(`/verificar-huella?huella=${HUELLA}`)
    expect(await screen.findByText('Integridad válida: el registro no ha sido alterado.')).toBeInTheDocument()
    expect(screen.getByText('La huella coincide con la guardada')).toBeInTheDocument()
    // Hay otro role="status" en la cabecera (estado del servicio): se acota a la pantalla
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Integridad válida')
  })

  test('integridad no válida: alerta con la explicación y el mensaje de la API', async () => {
    servidor.use(http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', () => HttpResponse.json(verificacion(false))))
    renderizarRuta(`/verificar-huella?huella=${HUELLA}`)
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Integridad no válida: la huella recalculada no coincide con la guardada.')
    expect(screen.getByText('La huella no coincide')).toBeInTheDocument()
  })

  test('el detalle técnico incluye la huella anterior, la fecha, la cadena canónica y la huella de este registro', async () => {
    servidor.use(http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', () => HttpResponse.json(verificacion(true))))
    renderizarRuta(`/verificar-huella?huella=${HUELLA}`)
    await screen.findByText('Resultado')
    const detalle = screen.getByText('Detalle técnico').closest('details')!
    expect(within(detalle).getByText(HUELLA_ANTERIOR)).toBeInTheDocument()
    expect(within(detalle).getByText('14/10/2026 20:00:00')).toBeInTheDocument()
    expect(within(detalle).getByText('IDEmisorFactura=A98765432&NumSerieFactura=2026-001')).toBeInTheDocument()
    expect(within(detalle).getByText(HUELLA)).toBeInTheDocument()
  })

  test('sin huella anterior se indica el primer registro de la cadena', async () => {
    servidor.use(
      http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', () =>
        HttpResponse.json(verificacion(true, { huellaAnterior: '' })),
      ),
    )
    renderizarRuta(`/verificar-huella?huella=${HUELLA}`)
    expect(await screen.findByText('Primer registro de la cadena')).toBeInTheDocument()
  })

  test('404: «No existe ningún registro con esa huella», sin mensaje técnico', async () => {
    servidor.use(
      http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', () =>
        HttpResponse.json({ detail: 'Map key not found' }, { status: 404 }),
      ),
    )
    renderizarRuta(`/verificar-huella?huella=${HUELLA}`)
    expect(await screen.findByText('No existe ningún registro con esa huella.')).toBeInTheDocument()
    expect(screen.queryByText('Map key not found')).not.toBeInTheDocument()
  })

  test('sin conexión: lo indica y permite reintentar', async () => {
    servidor.use(http.get('/api/v1/facturas/auditoria/verificar-huella/:huella', () => HttpResponse.error()))
    renderizarRuta(`/verificar-huella?huella=${HUELLA}`)
    expect(await screen.findByText('Sin conexión con el servicio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
