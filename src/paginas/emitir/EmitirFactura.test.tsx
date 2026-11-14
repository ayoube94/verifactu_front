import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'

describe('ruta /facturas/nueva', () => {
  test('la navegación muestra «Inicio» y «Emitir factura» y marca la activa', () => {
    renderizarRuta('/facturas/nueva')
    const navegacion = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(navegacion).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
    expect(within(navegacion).getByRole('link', { name: 'Emitir factura' })).toHaveAttribute('aria-current', 'page')
  })

  test('la pantalla tiene su título en el documento', async () => {
    renderizarRuta('/facturas/nueva')
    expect(screen.getByRole('heading', { level: 1, name: 'Emitir factura' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Emitir factura · Zefact'))
  })
})

describe('enlace desde inicio', () => {
  test('«Emitir factura» en inicio navega a /facturas/nueva', async () => {
    const { router } = renderizarRuta('/')
    // «Emitir factura» aparece también en la navegación: el enlace de la lista de operaciones está en <main>
    await userEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Emitir factura' }))
    expect(router.state.location.pathname).toBe('/facturas/nueva')
    expect(await screen.findByRole('heading', { level: 1, name: 'Emitir factura' })).toBeInTheDocument()
  })
})
