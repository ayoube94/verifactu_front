import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

const resumen = (id: number) => ({
  id,
  numSerieFactura: `2026/${String(id).padStart(3, '0')}`,
  fechaExpedicion: '2026-03-05',
  tipoFactura: 'F1',
  clienteNif: 'B12345678',
  clienteNombre: 'Cliente SL',
  importeTotal: 1210,
  estadoEnvio: 'ACEPTADO',
  huella: 'ABC',
})

function servirTresPaginas() {
  servidor.use(
    http.get('/api/v1/facturas', ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page') ?? 0)
      return HttpResponse.json({ content: [resumen(page + 1)], page, size: 20, totalElements: 57, totalPages: 3 })
    }),
  )
}

// jsdom no implementa `scrollIntoView` y `getBoundingClientRect` devuelve ceros: se sustituyen para decidir dónde queda el inicio de la tabla.
const scrollIntoView = vi.fn<(opciones: ScrollIntoViewOptions) => void>()
let top = -300

beforeEach(() => {
  top = -300
  scrollIntoView.mockClear()
  Element.prototype.scrollIntoView = scrollIntoView
  vi.spyOn(HTMLOutputElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top }) as DOMRect)
})

afterEach(() => {
  vi.restoreAllMocks()
  // jsdom no lo define: se deja como estaba
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
})

const DESPLAZA = { block: 'start', behavior: 'instant' }

describe('vista al cambiar de página', () => {
  test('«Siguiente» con el inicio de la tabla por encima lleva la vista al inicio, sin animación', async () => {
    servirTresPaginas()
    renderizarRuta('/facturas')
    await screen.findByText('Página 1 de 3')

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(DESPLAZA)
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
  })

  test('«Anterior» también', async () => {
    servirTresPaginas()
    renderizarRuta('/facturas?page=1')
    await screen.findByText('Página 2 de 3')

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(DESPLAZA)
  })

  test('cambiar el tamaño de página lleva la vista al inicio de la tabla', async () => {
    servirTresPaginas()
    renderizarRuta('/facturas')
    await screen.findByText('Página 1 de 3')

    await userEvent.selectOptions(screen.getByLabelText('Facturas por página'), '50')

    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(DESPLAZA)
  })

  test('si el inicio de la tabla ya se ve, no se desplaza', async () => {
    top = 80
    servirTresPaginas()
    renderizarRuta('/facturas')
    await screen.findByText('Página 1 de 3')

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 3')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('filtrar no desplaza', async () => {
    servirTresPaginas()
    renderizarRuta('/facturas')
    await screen.findByText('Página 1 de 3')

    await userEvent.type(screen.getByLabelText('Serie'), 'A')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => expect(screen.getByLabelText('Serie')).toHaveValue('A'))
    await screen.findByText('Página 1 de 3')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('abrir el listado con ?page=1 no desplaza', async () => {
    servirTresPaginas()
    renderizarRuta('/facturas?page=1')
    await screen.findByText('Página 2 de 3')

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('«Volver a la primera página» del estado vacío no desplaza', async () => {
    servidor.use(
      http.get('/api/v1/facturas', ({ request }) => {
        const fuera = new URL(request.url).searchParams.get('page') === '7'
        return HttpResponse.json({ content: fuera ? [] : [resumen(1)], page: fuera ? 7 : 0, size: 20, totalElements: 5, totalPages: 1 })
      }),
    )
    renderizarRuta('/facturas?page=7')
    await userEvent.click(await screen.findByRole('button', { name: 'Volver a la primera página' }))
    await screen.findByRole('link', { name: '2026/001' })

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('el foco se queda en «Siguiente» y se puede volver a pulsar', async () => {
    servirTresPaginas()
    renderizarRuta('/facturas')
    await screen.findByText('Página 1 de 3')
    const siguiente = screen.getByRole('button', { name: 'Siguiente' })
    siguiente.focus()

    await userEvent.keyboard('{Enter}')
    await screen.findByText('Página 2 de 3')
    expect(siguiente).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument()
  })
})
