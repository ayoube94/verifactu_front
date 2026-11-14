import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { servidor } from '../../pruebas/servidor.ts'
import { fechaHoyMadrid } from './esquema.ts'
import { FormularioEmision } from './FormularioEmision.tsx'

const sinEnvio = () => vi.fn<(valores: unknown) => void>()

/** Rellena una factura válida mínima: serie, número, descripción, destinatario y una línea de 1 × 1000 €. */
async function rellenarValida(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Serie'), '2026')
  await usuario.type(screen.getByLabelText('Número'), '001')
  await usuario.type(screen.getByLabelText('Descripción de la operación'), 'Consultoría')
  await usuario.type(screen.getByLabelText('NIF'), 'A98765432')
  await usuario.type(screen.getByLabelText('Nombre o razón social'), 'EMPRESA CLIENTE S.A.')
  await usuario.type(screen.getByLabelText('Descripción, línea 1'), 'Auditoría')
  await usuario.type(screen.getByLabelText('Precio unitario (€)'), '1000')
}

describe('campos accesibles (3.2)', () => {
  test('cada control tiene su etiqueta', () => {
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    expect(screen.getByLabelText('Serie')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo de factura')).toBeInTheDocument()
    expect(screen.getByLabelText('IVA')).toBeInTheDocument()
  })

  test('el error queda asociado al campo con aria-invalid y descripción accesible', async () => {
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Emitir' }))

    const serie = screen.getByLabelText('Serie')
    expect(serie).toHaveAttribute('aria-invalid', 'true')
    expect(serie).toHaveAccessibleDescription('La serie es obligatoria')
  })
})

describe('valores iniciales (3.3)', () => {
  test('fecha de hoy en Madrid, tipo F1, régimen general, país ES y una línea al 21 %', () => {
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    expect(screen.getByLabelText('Fecha de expedición')).toHaveValue(fechaHoyMadrid())
    expect(screen.getByLabelText('Tipo de factura')).toHaveValue('F1')
    expect(screen.getByLabelText('Régimen de IVA')).toHaveValue('REGIMEN_GENERAL')
    expect(screen.getByLabelText('País')).toHaveValue('ES')
    expect(screen.getByLabelText('Cantidad')).toHaveValue('1')
    expect(screen.getByLabelText('IVA')).toHaveValue('21')
  })
})

describe('líneas (3.4)', () => {
  test('añadir y quitar líneas conservando valores; la última no se quita', async () => {
    const usuario = userEvent.setup()
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    await usuario.type(screen.getByLabelText('Descripción, línea 1'), 'Primera')
    await usuario.click(screen.getByRole('button', { name: 'Añadir línea' }))
    expect(screen.getByLabelText('Descripción, línea 2')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Quitar línea 2' }))
    expect(screen.queryByLabelText('Descripción, línea 2')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Descripción, línea 1')).toHaveValue('Primera')
    expect(screen.getByRole('button', { name: 'Quitar línea 1' })).toBeDisabled()
  })

  test('el descuento se rotula en euros', () => {
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    expect(screen.getByLabelText('Descuento (€)')).toHaveAccessibleDescription('Importe en euros, no porcentaje')
  })

  test('el selector de IVA ofrece 21, 10, 4 y 0 %', () => {
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    const opciones = within(screen.getByLabelText('IVA')).getAllByRole('option').map((o) => o.textContent)
    expect(opciones).toEqual(['21 %', '10 %', '4 %', '0 %'])
  })
})

describe('totales orientativos (3.5)', () => {
  test('recalculan al editar y se rotulan como orientativos (ejemplo del spec)', async () => {
    const usuario = userEvent.setup()
    render(<FormularioEmision onEnviar={sinEnvio()} />)
    const totales = screen.getByRole('region', { name: /Totales/ })
    expect(totales).toHaveTextContent('(orientativos)')

    await usuario.type(screen.getByLabelText('Precio unitario (€)'), '1000')
    expect(within(totales).getByText('1.000,00 €')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Añadir línea' }))
    const cantidad2 = screen.getByLabelText('Cantidad', { selector: 'input[id$="l1-cantidad"]' })
    await usuario.clear(cantidad2)
    await usuario.type(cantidad2, '6')
    await usuario.type(screen.getByLabelText('Precio unitario (€)', { selector: 'input[id$="l1-precio"]' }), '75')

    expect(within(totales).getByText('1.450,00 €')).toBeInTheDocument()
    expect(within(totales).getByText('304,50 €')).toBeInTheDocument()
    expect(within(totales).getByText('1.754,50 €')).toBeInTheDocument()
  })
})

describe('validación al enviar (3.6)', () => {
  test('con campos vacíos no se envía, no hay petición y el foco va a la serie', async () => {
    const onEnviar = sinEnvio()
    const llamadas = vi.fn<() => void>()
    servidor.use(http.post('/api/v1/facturas', () => (llamadas(), HttpResponse.json({}, { status: 201 }))))
    render(<FormularioEmision onEnviar={onEnviar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(onEnviar).not.toHaveBeenCalled()
    expect(llamadas).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Serie')).toHaveFocus()
    expect(screen.getByText('La serie es obligatoria')).toBeInTheDocument()
  })

  test('con valores válidos llama a onEnviar con los valores validados', async () => {
    const onEnviar = sinEnvio()
    const usuario = userEvent.setup()
    render(<FormularioEmision onEnviar={onEnviar} />)
    await rellenarValida(usuario)

    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))

    expect(onEnviar).toHaveBeenCalledOnce()
    const valores = onEnviar.mock.calls[0][0] as { serie: string; lineas: { precioUnitario: string }[] }
    expect(valores.serie).toBe('2026')
    expect(valores.lineas[0].precioUnitario).toBe('1000')
  })

  test('factura F2 sin destinatario es válida', async () => {
    const onEnviar = sinEnvio()
    const usuario = userEvent.setup()
    render(<FormularioEmision onEnviar={onEnviar} />)
    await usuario.type(screen.getByLabelText('Serie'), '2026')
    await usuario.type(screen.getByLabelText('Número'), '002')
    await usuario.type(screen.getByLabelText('Descripción de la operación'), 'Venta')
    await usuario.selectOptions(screen.getByLabelText('Tipo de factura'), 'F2')
    await usuario.type(screen.getByLabelText('Descripción, línea 1'), 'Venta')
    await usuario.type(screen.getByLabelText('Precio unitario (€)'), '10')

    await usuario.click(screen.getByRole('button', { name: 'Emitir' }))
    expect(onEnviar).toHaveBeenCalledOnce()
  })
})
