import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

const paginaVacia = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }

describe('acceso al listado de facturas', () => {
  test('/facturas muestra su título y marca «Facturas» como sección activa', async () => {
    servidor.use(http.get('/api/v1/facturas', () => HttpResponse.json(paginaVacia)))
    renderizarRuta('/facturas')
    expect(screen.getByRole('heading', { level: 1, name: 'Facturas' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Facturas · Zefact'))
    const activa = within(screen.getByRole('navigation', { name: 'Principal' }))
      .getAllByRole('link')
      .filter((enlace) => enlace.getAttribute('aria-current') === 'page')
    expect(activa.map((enlace) => enlace.textContent)).toEqual(['Facturas'])
  })

  test('/facturas/nueva y /facturas/42 siguen siendo la emisión y la factura', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json({ detail: 'No existe' }, { status: 404 })))
    const nueva = renderizarRuta('/facturas/nueva')
    expect(screen.getByRole('heading', { level: 1, name: 'Emitir factura' })).toBeInTheDocument()
    nueva.unmount()

    renderizarRuta('/facturas/42')
    expect(screen.getByRole('heading', { level: 1, name: 'Factura' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Facturas' })).not.toBeInTheDocument()
  })

  test('desde inicio, «Listar facturas» lleva a /facturas', async () => {
    servidor.use(http.get('/api/v1/facturas', () => HttpResponse.json(paginaVacia)))
    const { router } = renderizarRuta('/')
    const enlace = within(screen.getByRole('main')).getByRole('link', { name: 'Listar facturas' })
    expect(enlace).toHaveAttribute('href', '/facturas')
    await userEvent.click(enlace)
    expect(router.state.location.pathname).toBe('/facturas')
  })
})
