import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../pruebas/renderizar.tsx'
import { servidor } from '../pruebas/servidor.ts'

describe('página de inicio', () => {
  test('explica para qué sirve; solo Emitir factura es enlace y el resto anuncia la fase', () => {
    renderizarRuta('/')

    const principal = screen.getByRole('main')
    expect(within(principal).getByRole('heading', { level: 1, name: 'Facturación VeriFactu' })).toBeInTheDocument()
    expect(within(principal).getByRole('link', { name: 'Emitir factura' })).toHaveAttribute('href', '/facturas/nueva')
    for (const operacion of ['Consultar factura', 'Verificar huella']) {
      expect(within(principal).getByText(operacion)).toBeInTheDocument()
      // Aún no existen: se nombran, pero no son enlaces
      expect(within(principal).queryByRole('link', { name: operacion })).not.toBeInTheDocument()
    }
    expect(within(principal).queryAllByRole('link')).toHaveLength(1)
  })

  test('la navegación solo contiene secciones existentes', () => {
    renderizarRuta('/')
    const enlaces = within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link')
    expect(enlaces.map((enlace) => enlace.textContent)).toEqual(['Inicio', 'Emitir factura'])
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
