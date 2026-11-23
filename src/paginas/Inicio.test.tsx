import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../pruebas/renderizar.tsx'
import { servidor } from '../pruebas/servidor.ts'

describe('página de inicio', () => {
  test('explica para qué sirve y cada operación es enlace a su pantalla', () => {
    renderizarRuta('/')

    const principal = screen.getByRole('main')
    expect(within(principal).getByRole('heading', { level: 1, name: 'Facturación VeriFactu' })).toBeInTheDocument()
    expect(within(principal).getByRole('link', { name: 'Listar facturas' })).toHaveAttribute('href', '/facturas')
    expect(within(principal).getByRole('link', { name: 'Emitir factura' })).toHaveAttribute('href', '/facturas/nueva')
    expect(within(principal).getByRole('link', { name: 'Consultar factura' })).toHaveAttribute('href', '/consultar')
    expect(within(principal).getByRole('link', { name: 'Verificar huella' })).toHaveAttribute('href', '/verificar-huella')
    expect(within(principal).queryByText('Próxima fase')).not.toBeInTheDocument()
  })

  test('la navegación solo contiene secciones existentes', () => {
    renderizarRuta('/')
    const enlaces = within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link')
    expect(enlaces.map((enlace) => enlace.textContent)).toEqual(['Inicio', 'Facturas', 'Emitir factura', 'Consultar factura', 'Verificar huella'])
  })

  test('muestra el servicio operativo', async () => {
    renderizarRuta('/')
    expect(await within(screen.getByRole('complementary')).findByText('Operativo')).toBeInTheDocument()
  })

  test('con el servicio caído lo explica y permite comprobarlo de nuevo', async () => {
    let llamadas = 0
    servidor.use(
      http.get('/actuator/health', () => {
        llamadas += 1
        return llamadas === 1 ? HttpResponse.json({ status: 'DOWN' }, { status: 503 }) : HttpResponse.json({ status: 'UP' })
      }),
    )
    renderizarRuta('/')
    const lateral = screen.getByRole('complementary')

    expect(await within(lateral).findByText('No disponible')).toBeInTheDocument()
    await userEvent.click(within(lateral).getByRole('button', { name: 'Comprobar de nuevo' }))
    expect(await within(lateral).findByText('Operativo')).toBeInTheDocument()
  })
})
