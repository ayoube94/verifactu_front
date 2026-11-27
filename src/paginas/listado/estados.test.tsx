import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
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

interface Pagina {
  content?: object[]
  page?: number
  size?: number
  totalElements: number
  totalPages: number
}

/** Sirve el listado: cada petición devuelve lo que decide `respuesta` a partir de su query. */
function servir(respuesta: (query: Record<string, string>) => Pagina) {
  const peticiones: Record<string, string>[] = []
  servidor.use(
    http.get('/api/v1/facturas', ({ request }) => {
      const query = Object.fromEntries(new URL(request.url).searchParams)
      peticiones.push(query)
      const { content = [], page = Number(query.page ?? 0), size = Number(query.size ?? 20), ...resto } = respuesta(query)
      return HttpResponse.json({ content, page, size, ...resto })
    }),
  )
  return peticiones
}

const ultima = (peticiones: Record<string, string>[]) => peticiones[peticiones.length - 1]

describe('paginación', () => {
  test('«Siguiente» pide la página 1 y se muestra «Página 2 de 3» y «57 facturas»', async () => {
    const peticiones = servir((query) => ({ content: [resumen(1)], totalElements: 57, totalPages: 3, page: Number(query.page) }))
    const { router } = renderizarRuta('/facturas')
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByText('57 facturas')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(ultima(peticiones)).toEqual({ page: '1', size: '20' })
    expect(router.state.location.search).toBe('?page=1')
  })

  test('en la primera página «Anterior» está deshabilitado y en la última lo está «Siguiente»', async () => {
    servir((query) => ({ content: [resumen(1)], totalElements: 57, totalPages: 3, page: Number(query.page) }))
    renderizarRuta('/facturas')
    await screen.findByText('Página 1 de 3')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 3 de 3')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  test('cambiar el tamaño pide la página 0 con ese size', async () => {
    const peticiones = servir((query) => ({ content: [resumen(1)], totalElements: 57, totalPages: 3, page: Number(query.page) }))
    renderizarRuta('/facturas?page=2')
    await screen.findByText('Página 3 de 3')

    expect(within(screen.getByLabelText('Facturas por página')).getAllByRole('option').map((o) => o.textContent)).toEqual(['10', '20', '50', '100'])
    await userEvent.selectOptions(screen.getByLabelText('Facturas por página'), '50')

    await waitFor(() => expect(ultima(peticiones)).toEqual({ page: '0', size: '50' }))
  })

  test('con una sola página no hay controles de página pero sí el total', async () => {
    servir(() => ({ content: [resumen(1)], totalElements: 1, totalPages: 1 }))
    renderizarRuta('/facturas')
    expect(await screen.findByText('1 factura')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Página \d+ de/)).not.toBeInTheDocument()
  })
})

describe('estados vacíos', () => {
  test('sin facturas ni filtros: «Todavía no hay facturas» con enlace a emitir', async () => {
    servir(() => ({ totalElements: 0, totalPages: 0 }))
    renderizarRuta('/facturas')
    expect(await screen.findByText('Todavía no hay facturas')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Emitir factura' })).toHaveAttribute('href', '/facturas/nueva')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('con filtros y sin resultados: «Ninguna factura cumple los filtros» y «Quitar filtros»', async () => {
    const peticiones = servir((query) => (query.serie ? { totalElements: 0, totalPages: 0 } : { content: [resumen(1)], totalElements: 1, totalPages: 1 }))
    renderizarRuta('/facturas?serie=Z')
    expect(await screen.findByText('Ninguna factura cumple los filtros')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay facturas')).not.toBeInTheDocument()

    // Un único «Quitar filtros»: el del estado vacío; el formulario no lo muestra
    expect(screen.getAllByRole('button', { name: 'Quitar filtros' })).toHaveLength(1)
    expect(within(screen.getByRole('form', { name: 'Filtros de facturas' })).queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument()

    const vacio = screen.getByText('Ninguna factura cumple los filtros').closest('section, div')!
    await userEvent.click(within(vacio as HTMLElement).getByRole('button', { name: 'Quitar filtros' }))

    expect(await screen.findByRole('link', { name: '2026/001' })).toBeInTheDocument()
    expect(ultima(peticiones)).toEqual({ page: '0', size: '20' })
  })

  test('con filtros y con resultados: «Quitar filtros» está solo en el formulario y no hay estado vacío', async () => {
    servir(() => ({ content: [resumen(1)], totalElements: 1, totalPages: 1 }))
    renderizarRuta('/facturas?serie=A')
    expect(await screen.findByRole('link', { name: '2026/001' })).toBeInTheDocument()

    expect(screen.getAllByRole('button', { name: 'Quitar filtros' })).toHaveLength(1)
    expect(within(screen.getByRole('form', { name: 'Filtros de facturas' })).getByRole('button', { name: 'Quitar filtros' })).toBeInTheDocument()
    expect(screen.queryByText('Ninguna factura cumple los filtros')).not.toBeInTheDocument()
  })

  test('página fuera de rango: ofrece volver a la primera en vez de «Todavía no hay facturas»', async () => {
    const peticiones = servir((query) => (query.page === '0' ? { content: [resumen(1)], totalElements: 5, totalPages: 1 } : { content: [], totalElements: 5, totalPages: 1 }))
    renderizarRuta('/facturas?page=7')
    expect(await screen.findByText('Esta página no existe')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay facturas')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Volver a la primera página' }))

    expect(await screen.findByRole('link', { name: '2026/001' })).toBeInTheDocument()
    expect(ultima(peticiones)).toEqual({ page: '0', size: '20' })
  })
})

describe('carga y errores', () => {
  test('anuncia «Cargando facturas…» en una región en vivo y deja los filtros visibles', async () => {
    let liberar!: () => void
    const espera = new Promise<void>((resolver) => (liberar = resolver))
    servidor.use(
      http.get('/api/v1/facturas', async () => {
        await espera
        return HttpResponse.json({ content: [resumen(1)], page: 0, size: 20, totalElements: 1, totalPages: 1 })
      }),
    )
    renderizarRuta('/facturas')

    const estado = await screen.findByText('Cargando facturas…')
    expect(estado.tagName).toBe('OUTPUT')
    expect(estado).toHaveRole('status')
    expect(screen.getByLabelText('Serie')).toBeVisible()

    liberar()
    expect(await screen.findByRole('link', { name: '2026/001' })).toBeInTheDocument()
    expect(screen.queryByText('Cargando facturas…')).not.toBeInTheDocument()
  })

  test('500: mensaje con errorId, y los filtros escritos se conservan', async () => {
    servidor.use(http.get('/api/v1/facturas', () => HttpResponse.json({ status: 500, errorId: 'abc-123' }, { status: 500 })))
    renderizarRuta('/facturas')
    await userEvent.type(screen.getByLabelText('Serie'), 'A')

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Error del servidor')
    expect(alerta).toHaveTextContent('abc-123')
    expect(screen.getByLabelText('Serie')).toHaveValue('A')
  })

  test('sin conexión: lo indica y «Reintentar» vuelve a pedir la página', async () => {
    let llamadas = 0
    servidor.use(
      http.get('/api/v1/facturas', () => {
        llamadas += 1
        return llamadas === 1 ? HttpResponse.error() : HttpResponse.json({ content: [resumen(1)], page: 0, size: 20, totalElements: 1, totalPages: 1 })
      }),
    )
    renderizarRuta('/facturas')

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Sin conexión con el servicio')
    await userEvent.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('link', { name: '2026/001' })).toBeInTheDocument()
    expect(llamadas).toBe(2)
  })
})
