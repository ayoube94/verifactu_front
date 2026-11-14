import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

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
    await userEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Emitir factura' }))
    expect(router.state.location.pathname).toBe('/facturas/nueva')
    expect(await screen.findByRole('heading', { level: 1, name: 'Emitir factura' })).toBeInTheDocument()
  })
})

/** Rellena una factura válida de una línea: 1 × 1000 € al 21 %. */
async function rellenarFactura(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Serie'), '2026')
  await usuario.type(screen.getByLabelText('Número'), '001')
  await usuario.type(screen.getByLabelText('Descripción de la operación'), 'Consultoría')
  await usuario.type(screen.getByLabelText('NIF'), 'A98765432')
  await usuario.type(screen.getByLabelText('Nombre o razón social'), 'EMPRESA CLIENTE S.A.')
  await usuario.type(screen.getByLabelText('Descripción, línea 1'), 'Auditoría')
  await usuario.type(screen.getByLabelText('Precio unitario (€)'), '1000')
}

/** Añade una segunda línea válida (2 × 75 €) para probar errores en la línea 2. */
async function anadirSegundaLinea(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole('button', { name: 'Añadir línea' }))
  await usuario.type(screen.getByLabelText('Descripción, línea 2'), 'Soporte')
  await usuario.type(screen.getByLabelText('Precio unitario (€)', { selector: 'input[id$="l1-precio"]' }), '75')
}

describe('envío (4.1)', () => {
  test('doble pulsación: una sola petición, con tipoIva numérico en cada línea', async () => {
    const usuario = userEvent.setup()
    const cuerpos: unknown[] = []
    servidor.use(
      http.post('/api/v1/facturas', async ({ request }) => {
        cuerpos.push(await request.json())
        await delay(150)
        return HttpResponse.json({ id: 1 }, { status: 201 })
      }),
    )
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)

    const boton = screen.getByRole('button', { name: 'Emitir' })
    await usuario.click(boton)
    await usuario.click(boton)

    expect(await screen.findByRole('button', { name: 'Emitiendo…' })).toBeDisabled()
    await waitFor(() => expect(cuerpos).toHaveLength(1))
    expect(cuerpos[0]).toMatchObject({ lineas: [{ tipoIva: 21, cantidad: 1, precioUnitario: 1000 }] })
  })

  test('mientras espera, lo anuncia y avisa si se intenta salir', async () => {
    const usuario = userEvent.setup()
    servidor.use(
      http.post('/api/v1/facturas', async () => {
        await delay(200)
        return HttpResponse.json({ id: 1 }, { status: 201 })
      }),
    )
    const escuchar = vi.spyOn(window, 'addEventListener')
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(await screen.findByText('Esperando la respuesta de la AEAT…')).toBeInTheDocument()
    expect(escuchar).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    escuchar.mockRestore()
  })
})

describe('errores del servidor (4.2 y 4.3)', () => {
  test('400 con error de una línea: aparece junto a la cantidad de la segunda línea y los datos se conservan', async () => {
    const usuario = userEvent.setup()
    servidor.use(
      http.post('/api/v1/facturas', () =>
        HttpResponse.json(
          { status: 400, detail: 'Error de validación en los datos de la factura', errores: { 'lineas[1].cantidad': 'La cantidad debe ser mayor que 0', serie: 'La serie es obligatoria' } },
          { status: 400 },
        ),
      ),
    )
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)
    await anadirSegundaLinea(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    const cantidad2 = await screen.findByLabelText('Cantidad', { selector: 'input[id$="l1-cantidad"]' })
    expect(cantidad2).toHaveAttribute('aria-invalid', 'true')
    expect(cantidad2).toHaveAccessibleDescription('La cantidad debe ser mayor que 0')
    expect(screen.getByLabelText('Serie')).toHaveValue('2026')
    expect(screen.getByLabelText('Descripción, línea 1')).toHaveValue('Auditoría')
  })

  test('409: el conflicto aparece en serie y número, con los datos del formulario intactos', async () => {
    const usuario = userEvent.setup()
    servidor.use(
      http.post('/api/v1/facturas', () =>
        HttpResponse.json({ status: 409, detail: 'Ya existe una factura registrada con la serie 2026 y número 001' }, { status: 409 }),
      ),
    )
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(await screen.findByLabelText('Serie')).toHaveAccessibleDescription('Ya existe una factura registrada con la serie 2026 y número 001')
    expect(screen.getByLabelText('Número')).toHaveAccessibleDescription('Ya existe una factura registrada con la serie 2026 y número 001')
    expect(screen.getByLabelText('Número')).toHaveValue('001')
  })

  test('500: muestra el errorId sin botón de reintento y conserva los datos', async () => {
    const usuario = userEvent.setup()
    const llamadas = vi.fn<() => void>()
    servidor.use(
      http.post('/api/v1/facturas', () => {
        llamadas()
        return HttpResponse.json(
          { status: 500, detail: 'Se ha producido un error inesperado en el servidor', errorId: '3f6c2a1e-9b7d' },
          { status: 500 },
        )
      }),
    )
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(await screen.findByText('3f6c2a1e-9b7d')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reintentar|Recargar/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Serie')).toHaveValue('2026')
    expect(llamadas).toHaveBeenCalledOnce()
  })
})

describe('fallo de red en la emisión (4.4)', () => {
  test('sin respuesta: dice que no se sabe si se emitió y no ofrece reintentar', async () => {
    const usuario = userEvent.setup()
    servidor.use(http.post('/api/v1/facturas', () => HttpResponse.error()))
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se sabe si la factura se emitió: compruébalo antes de volver a emitirla.',
    )
    expect(screen.queryByRole('button', { name: /Reintentar|Recargar/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Serie')).toHaveValue('2026')
  })
})

describe('400 por campo de destinatario (4.2)', () => {
  test('cliente.nif del backend se coloca en el NIF del formulario', async () => {
    const usuario = userEvent.setup()
    servidor.use(
      http.post('/api/v1/facturas', () =>
        HttpResponse.json({ status: 400, detail: 'Error de validación', errores: { 'cliente.nif': 'El NIF/CIF del cliente es obligatorio' } }, { status: 400 }),
      ),
    )
    renderizarRuta('/facturas/nueva')
    await rellenarFactura(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(await screen.findByLabelText('NIF')).toHaveAccessibleDescription('El NIF/CIF del cliente es obligatorio')
  })
})
