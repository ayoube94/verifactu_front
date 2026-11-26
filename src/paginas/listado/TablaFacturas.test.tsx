import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

const resumen = (id: number, numSerieFactura: string, estadoEnvio: string, extra: Record<string, unknown> = {}) => ({
  id,
  numSerieFactura,
  fechaExpedicion: '2026-03-05',
  tipoFactura: 'F1',
  clienteNif: 'B12345678',
  clienteNombre: 'Cliente SL',
  importeTotal: 1210,
  estadoEnvio,
  huella: 'ABC',
  ...extra,
})

const servirPagina = (content: object[]) =>
  servidor.use(http.get('/api/v1/facturas', () => HttpResponse.json({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 })))

describe('tabla de facturas', () => {
  test('la fila muestra número, fecha, importe, cliente y estado con el formato español', async () => {
    servirPagina([resumen(42, '2026/001', 'ACEPTADO')])
    renderizarRuta('/facturas')

    const fila = within(await screen.findByRole('table', { name: 'Facturas emitidas' })).getAllByRole('row')[1]!
    expect(within(fila).getByRole('link', { name: '2026/001' })).toBeInTheDocument()
    expect(fila).toHaveTextContent('05/03/2026')
    expect(fila).toHaveTextContent('1.210,00 €')
    expect(fila).toHaveTextContent('Cliente SL')
    expect(fila).toHaveTextContent('B12345678')
    expect(fila).toHaveTextContent('F1')
    expect(fila).toHaveTextContent('Factura ordinaria')
    expect(fila).toHaveTextContent('Aceptada por la AEAT')
  })

  test('el número enlaza a /facturas/:id', async () => {
    servirPagina([resumen(42, '2026/001', 'ACEPTADO')])
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json({ detail: 'No existe' }, { status: 404 })))
    const { router } = renderizarRuta('/facturas')

    const enlace = await screen.findByRole('link', { name: '2026/001' })
    expect(enlace).toHaveAttribute('href', '/facturas/42')
    await userEvent.click(enlace)
    expect(router.state.location.pathname).toBe('/facturas/42')
  })

  test('RECHAZADO y ERROR_CONEXION son incidencia; solo ACEPTADO y ACEPTADO_CON_ERRORES son aceptación', async () => {
    servirPagina([
      resumen(1, 'A/1', 'RECHAZADO'),
      resumen(2, 'A/2', 'ERROR_CONEXION'),
      resumen(3, 'A/3', 'ACEPTADO'),
      resumen(4, 'A/4', 'ACEPTADO_CON_ERRORES'),
      resumen(5, 'A/5', 'PENDIENTE'),
    ])
    renderizarRuta('/facturas')

    const tabla = await screen.findByRole('table', { name: 'Facturas emitidas' })
    const tono = (texto: string) => within(tabla).getByText(texto).getAttribute('data-tono')
    expect(tono('Rechazada por la AEAT')).toBe('incidencia')
    expect(tono('Error de conexión con la AEAT')).toBe('incidencia')
    expect(tono('Aceptada por la AEAT')).toBe('exito')
    expect(tono('Aceptada con errores')).toBe('aviso')
    expect(tono('Pendiente de envío')).toBe('pendiente')
  })

  test('mantiene el orden de la API, sin reordenar', async () => {
    servirPagina([resumen(3, 'Z/9', 'ACEPTADO', { fechaExpedicion: '2026-01-01' }), resumen(2, 'A/1', 'ACEPTADO', { fechaExpedicion: '2026-12-31' }), resumen(1, 'M/5', 'ACEPTADO')])
    renderizarRuta('/facturas')

    await waitFor(() => expect(screen.getAllByRole('link', { name: /\// })).toHaveLength(3))
    const orden = screen.getAllByRole('link', { name: /\// }).map((enlace) => enlace.textContent)
    expect(orden).toEqual(['Z/9', 'A/1', 'M/5'])
  })

  test('la celda del tipo lleva el código y la descripción con un espacio, y el NIF sigue en la del cliente', async () => {
    servirPagina([resumen(7, '2026/007', 'ACEPTADO', { tipoFactura: 'F3', clienteNif: 'G11223344' })])
    renderizarRuta('/facturas')

    const tabla = await screen.findByRole('table', { name: 'Facturas emitidas' })
    const celda = (etiqueta: string) => tabla.querySelector(`td[data-etiqueta="${etiqueta}"]`)!
    // A 360 px la descripción se oculta solo visualmente: el texto de la celda (lo que lee un lector de pantalla) la conserva
    expect(celda('Tipo').textContent).toBe('F3 Factura emitida en sustitución de simplificadas')
    expect(celda('Cliente')).toHaveTextContent('G11223344')
    for (const etiqueta of ['Factura', 'Fecha', 'Tipo', 'Cliente', 'Importe total', 'Estado ante la AEAT']) {
      expect(celda(etiqueta)).toBeInTheDocument()
    }
  })
})
