import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

describe('formulario de consulta por id', () => {
  test('un id válido navega a /facturas/:id', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json({ detail: 'No existe' }, { status: 404 })))
    const { router } = renderizarRuta('/consultar')
    await userEvent.type(screen.getByLabelText('Id de la factura'), '42')
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/facturas/42'))
    expect(await screen.findByText('No existe ninguna factura con el id 42.')).toBeInTheDocument()
  })

  test('un id no numérico muestra el error junto al campo y no hace ninguna petición', async () => {
    const peticion = vi.fn<() => Response>(() => HttpResponse.json({}))
    servidor.use(http.get('/api/v1/facturas/:id', peticion))
    const { router } = renderizarRuta('/consultar')

    await userEvent.type(screen.getByLabelText('Id de la factura'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }))

    const campo = screen.getByLabelText('Id de la factura')
    expect(await screen.findByText('El id debe ser un número entero positivo')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAttribute('aria-describedby', expect.stringContaining('id-factura-error'))
    expect(router.state.location.pathname).toBe('/consultar')
    expect(peticion).not.toHaveBeenCalled()
  })

  test.each(['0', '-3', '1.5'])('el id %s no es un entero positivo y no navega', async (valor) => {
    const { router } = renderizarRuta('/consultar')
    await userEvent.type(screen.getByLabelText('Id de la factura'), valor)
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }))
    expect(await screen.findByText('El id debe ser un número entero positivo')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/consultar')
  })
})
