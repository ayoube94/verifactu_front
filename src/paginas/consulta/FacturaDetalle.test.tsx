import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { renderizarRuta } from '../../pruebas/renderizar.tsx'
import { servidor } from '../../pruebas/servidor.ts'

const HUELLA = 'B826DF163A9C0E4571D288F0A6B39C21FE0D4A5B7C6D8E9F0A1B2C3D4E5F6A7B'
const HUELLA_ANTERIOR = '4F1C9A0E77B2D3C108AA5E6F1290BC4478DE0F12AB34CD56EF78901234567890'

/** Factura del ejemplo: 1 × 1.000 € de auditoría al 21 %, destinatario y registro VeriFactu. */
function factura(estadoEnvio: string, extra: Record<string, unknown> = {}) {
  return {
    id: 42,
    serie: '2026',
    numero: '001',
    numSerieFactura: '2026-001',
    fechaExpedicion: '2026-10-14',
    fechaOperacion: '2026-10-14',
    tipoFactura: 'F1',
    regimenIva: 'REGIMEN_GENERAL',
    descripcionOperacion: 'Consultoría',
    baseImponibleTotal: 1000,
    cuotaTotal: 210,
    importeTotal: 1210,
    cliente: { nif: 'A98765432', nombreRazonSocial: 'EMPRESA CLIENTE S.A.', pais: 'ES' },
    lineas: [{ posicion: 1, descripcion: 'Auditoría', cantidad: 1, precioUnitario: 1000, descuento: 0, tipoIva: 21 }],
    verifactu: {
      id: 7,
      huella: HUELLA,
      huellaAnterior: HUELLA_ANTERIOR,
      estadoEnvio,
      csvAeat: estadoEnvio === 'ACEPTADO' ? 'A1B2C3D4E5F6G7H8' : null,
      codigoRespuestaAeat: null,
      mensajeAeat: null,
      qrBase64: 'iVBORw0KGgo=',
    },
    ...extra,
  }
}

const servirFactura = (cuerpo: object) => servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json(cuerpo)))

describe('vista de factura /facturas/:id', () => {
  test('muestra cabecera, líneas, bloque VeriFactu y el enlace al XML', async () => {
    servirFactura(factura('ACEPTADO'))
    renderizarRuta('/facturas/42')

    expect(await screen.findByRole('heading', { level: 1, name: 'Factura 2026/001' })).toBeInTheDocument()
    expect(document.title).toBe('Factura 2026/001 · Zefact')
    expect(screen.getByText('Factura ordinaria')).toBeInTheDocument()
    expect(screen.getByText('01 · Régimen general')).toBeInTheDocument()
    // Fecha de operación en la cabecera y fecha de expedición en el bloque VeriFactu (mismo día en el ejemplo)
    expect(screen.getByText('Fecha de operación').nextElementSibling).toHaveTextContent('14/10/2026')

    const lineas = screen.getByRole('table', { name: 'Líneas de la factura' })
    expect(within(lineas).getByText('Auditoría')).toBeInTheDocument()
    expect(within(lineas).getByText('1.000,00 €')).toBeInTheDocument()
    expect(within(lineas).getByText('21 %')).toBeInTheDocument()

    expect(screen.getByText('Aceptada por la AEAT')).toBeInTheDocument()
    expect(screen.getByText('A1B2C3D4E5F6G7H8')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Código QR de cotejo de la factura 2026-001/ })).toBeInTheDocument()

    const xml = screen.getByRole('link', { name: 'Descargar XML' })
    expect(xml).toHaveAttribute('href', '/api/v1/facturas/42/xml')
    expect(xml).toHaveAttribute('download')
  })

  test('la huella y la huella anterior aparecen completas en el texto de la página', async () => {
    servirFactura(factura('ACEPTADO'))
    renderizarRuta('/facturas/42')
    await screen.findByRole('heading', { level: 1, name: 'Factura 2026/001' })
    const texto = document.body.textContent ?? ''
    expect(texto).toContain(HUELLA)
    expect(texto).toContain(HUELLA_ANTERIOR)
  })

  test('una factura rechazada muestra el código y el mensaje de la AEAT, sin CSV', async () => {
    servirFactura(
      factura('RECHAZADO', {
        verifactu: {
          id: 7,
          huella: HUELLA,
          huellaAnterior: HUELLA_ANTERIOR,
          estadoEnvio: 'RECHAZADO',
          csvAeat: null,
          codigoRespuestaAeat: '4102',
          mensajeAeat: 'Ya existe un registro con ese número',
        },
      }),
    )
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('Rechazada por la AEAT')).toBeInTheDocument()
    expect(screen.getByText('4102')).toBeInTheDocument()
    expect(screen.getByText('Ya existe un registro con ese número')).toBeInTheDocument()
    expect(screen.queryByText('Aceptada por la AEAT')).not.toBeInTheDocument()
    expect(screen.queryByText('CSV')).not.toBeInTheDocument()
  })

  test('el primer registro de la cadena se indica como «Primer registro de la cadena»', async () => {
    servirFactura(
      factura('ACEPTADO', {
        verifactu: { id: 1, huella: HUELLA, huellaAnterior: null, estadoEnvio: 'ACEPTADO', csvAeat: 'X1' },
      }),
    )
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('Primer registro de la cadena')).toBeInTheDocument()
  })

  test('404: «No existe ninguna factura con el id 42.» con enlace para consultar otra', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json({ detail: 'No encontrada' }, { status: 404 })))
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('No existe ninguna factura con el id 42.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Consultar otra factura' })).toHaveAttribute('href', '/consultar')
  })

  test('un id que no es entero positivo no pide nada y lo explica', async () => {
    const peticion = vi.fn<() => Response>(() => HttpResponse.json({}))
    servidor.use(http.get('/api/v1/facturas/:id', peticion))
    renderizarRuta('/facturas/abc')
    expect(await screen.findByText('No existe ninguna factura con el id abc.')).toBeInTheDocument()
    expect(peticion).not.toHaveBeenCalled()
  })

  test('500: mensaje genérico con el errorId, y «Reintentar» vuelve a pedir la factura', async () => {
    let llamadas = 0
    servidor.use(
      http.get('/api/v1/facturas/:id', () => {
        llamadas += 1
        return llamadas === 1
          ? HttpResponse.json({ status: 500, errorId: 'err-9f2' }, { status: 500 })
          : HttpResponse.json(factura('ACEPTADO'))
      }),
    )
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('Error del servidor')).toBeInTheDocument()
    expect(screen.getByText('err-9f2')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Factura 2026/001' })).toBeInTheDocument()
  })

  test('sin conexión: lo indica y ofrece reintentar', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.error()))
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('Sin conexión con el servicio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  test('401: indica que el acceso no está autorizado y ofrece recargar, sin formulario de credenciales', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => HttpResponse.json({ status: 401 }, { status: 401 })))
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('Acceso no autorizado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/contraseña|clave|usuario/i)).not.toBeInTheDocument()
  })

  test('mientras carga muestra el encabezado y el aviso de carga', async () => {
    servidor.use(http.get('/api/v1/facturas/:id', () => new Promise(() => undefined)))
    renderizarRuta('/facturas/42')
    expect(await screen.findByText('Cargando la factura…')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Factura' })).toBeInTheDocument())
  })
})
