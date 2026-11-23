import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

const pagina = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }

/** Sirve el listado y anota la query de cada petición. */
function servirListado(cuerpo: object = pagina) {
  const peticiones: Record<string, string>[] = []
  servidor.use(
    http.get('/api/v1/facturas', ({ request }) => {
      peticiones.push(Object.fromEntries(new URL(request.url).searchParams))
      return HttpResponse.json(cuerpo)
    }),
  )
  return peticiones
}

const ultima = (peticiones: Record<string, string>[]) => peticiones[peticiones.length - 1]

describe('filtros del listado', () => {
  test('aplicar un filtro pide la página 0 con ese parámetro', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas')
    await waitFor(() => expect(peticiones).toHaveLength(1))
    expect(peticiones[0]).toEqual({ page: '0', size: '20' })

    await userEvent.selectOptions(screen.getByLabelText('Estado ante la AEAT'), 'Rechazada por la AEAT')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => expect(ultima(peticiones)).toEqual({ estadoEnvio: 'RECHAZADO', page: '0', size: '20' }))
  })

  test('filtros combinados: la petición lleva los tres parámetros a la vez, con las fechas en ISO', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas')
    await userEvent.type(screen.getByLabelText('Serie'), 'A')
    await userEvent.type(screen.getByLabelText('Fecha desde'), '2026-03-01')
    await userEvent.type(screen.getByLabelText('Fecha hasta'), '2026-03-31')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => expect(ultima(peticiones)).toEqual({ serie: 'A', fechaDesde: '2026-03-01', fechaHasta: '2026-03-31', page: '0', size: '20' }))
  })

  test('Intro en un campo aplica los filtros y los espacios no cuentan', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas')
    await userEvent.type(screen.getByLabelText('NIF del cliente'), '  B12345678  {Enter}')
    await userEvent.type(screen.getByLabelText('Número'), '   ')
    await waitFor(() => expect(ultima(peticiones)).toEqual({ nifCliente: 'B12345678', page: '0', size: '20' }))
  })

  test('«Quitar filtros» vacía los campos y vuelve a la primera página sin filtros', async () => {
    const peticiones = servirListado()
    const { router } = renderizarRuta('/facturas?serie=A&estadoEnvio=RECHAZADO&page=2&size=50')
    await waitFor(() => expect(ultima(peticiones)).toEqual({ serie: 'A', estadoEnvio: 'RECHAZADO', page: '2', size: '50' }))

    await userEvent.click(within(screen.getByRole('form', { name: 'Filtros de facturas' })).getByRole('button', { name: 'Quitar filtros' }))

    expect(screen.getByLabelText('Serie')).toHaveValue('')
    expect(screen.getByLabelText('Estado ante la AEAT')).toHaveValue('')
    await waitFor(() => expect(ultima(peticiones)).toEqual({ page: '0', size: '50' }))
    expect(router.state.location.search).toBe('?size=50')
  })

  test('cambiar un filtro estando en la página 3 vuelve a la página 0', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas?page=3')
    await waitFor(() => expect(ultima(peticiones)).toEqual({ page: '3', size: '20' }))

    await userEvent.type(screen.getByLabelText('Serie'), 'B')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => expect(ultima(peticiones)).toEqual({ serie: 'B', page: '0', size: '20' }))
  })

  test('rango de fechas invertido: no hay petición y el error está junto al campo', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas')
    await waitFor(() => expect(peticiones).toHaveLength(1))

    await userEvent.type(screen.getByLabelText('Fecha desde'), '2026-04-01')
    await userEvent.type(screen.getByLabelText('Fecha hasta'), '2026-03-01')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    const desde = screen.getByLabelText('Fecha desde')
    expect(desde).toHaveAccessibleDescription('La fecha desde no puede ser posterior a la fecha hasta')
    expect(desde).toBeInvalid()
    expect(peticiones).toHaveLength(1)
  })

  test('un 400 sobre fechaDesde se muestra junto a ese filtro', async () => {
    servidor.use(
      http.get('/api/v1/facturas', () => HttpResponse.json({ status: 400, detail: 'Parámetro no válido', errores: { fechaDesde: 'Fecha no válida' } }, { status: 400 })),
    )
    renderizarRuta('/facturas')
    await waitFor(() => expect(screen.getByLabelText('Fecha desde')).toHaveAccessibleDescription('Fecha no válida'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('un 400 sobre size, que no tiene filtro, va a un mensaje general', async () => {
    servidor.use(
      http.get('/api/v1/facturas', () => HttpResponse.json({ status: 400, detail: 'Parámetro no válido', errores: { size: 'El tamaño máximo es 100' } }, { status: 400 })),
    )
    renderizarRuta('/facturas')
    expect(await screen.findByRole('alert')).toHaveTextContent('El tamaño máximo es 100')
  })

  test('restaura los filtros de la URL en el formulario y en la petición', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas?estadoEnvio=RECHAZADO&serie=A&fechaDesde=2026-03-01&page=1')

    expect(screen.getByLabelText('Estado ante la AEAT')).toHaveValue('RECHAZADO')
    expect(screen.getByLabelText('Serie')).toHaveValue('A')
    expect(screen.getByLabelText('Fecha desde')).toHaveValue('2026-03-01')
    await waitFor(() => expect(ultima(peticiones)).toEqual({ serie: 'A', fechaDesde: '2026-03-01', estadoEnvio: 'RECHAZADO', page: '1', size: '20' }))
  })

  test('los valores no válidos de la URL se ignoran y no llegan a la API', async () => {
    const peticiones = servirListado()
    renderizarRuta('/facturas?page=-1&size=1000&estadoEnvio=XX')
    await waitFor(() => expect(peticiones).toHaveLength(1))
    expect(peticiones[0]).toEqual({ page: '0', size: '20' })
    expect(screen.getByLabelText('Estado ante la AEAT')).toHaveValue('')
  })

  test('filtrar, salir y volver atrás restaura el listado con los mismos filtros', async () => {
    const peticiones = servirListado()
    const { router } = renderizarRuta('/facturas')
    await userEvent.type(screen.getByLabelText('Serie'), 'A')
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => expect(router.state.location.search).toBe('?serie=A'))

    await router.navigate('/consultar')
    await waitFor(() => expect(router.state.location.pathname).toBe('/consultar'))
    await router.navigate(-1)

    await waitFor(() => expect(screen.getByLabelText('Serie')).toHaveValue('A'))
    await waitFor(() => expect(ultima(peticiones)).toEqual({ serie: 'A', page: '0', size: '20' }))
  })
})
