import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

describe('rutas de consulta y verificación', () => {
  test.each([
    ['/consultar', 'Consultar factura', 'Consultar factura · Zefact'],
    ['/facturas/42', 'Factura', 'Factura · Zefact'],
    ['/verificar-huella', 'Verificar huella', 'Verificar huella · Zefact'],
  ])('%s muestra su título y marca su sección activa', async (ruta, titulo, documento) => {
    // La ruta de factura pide la factura al montarse: se simula un 404 para que la prueba termine limpia
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json({ detail: 'No existe' }, { status: 404 })))
    renderizarRuta(ruta)
    expect(screen.getByRole('heading', { level: 1, name: titulo })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe(documento))
    const navegacion = screen.getByRole('navigation', { name: 'Principal' })
    const activa = within(navegacion)
      .getAllByRole('link')
      .filter((enlace) => enlace.getAttribute('aria-current') === 'page')
    expect(activa).toHaveLength(ruta === '/facturas/42' ? 0 : 1)
  })

  test('desde inicio se llega a «Consultar factura» y «Verificar huella»', async () => {
    const { router } = renderizarRuta('/')
    await userEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Consultar factura' }))
    expect(router.state.location.pathname).toBe('/consultar')
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Verificar huella' }))
    expect(router.state.location.pathname).toBe('/verificar-huella')
  })
})
