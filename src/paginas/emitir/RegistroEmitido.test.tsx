import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { RegistroEmitido } from './RegistroEmitido.tsx'
import { SumaYSigue } from './SumaYSigue.tsx'
import type { FacturaEmitida } from './emision.ts'

const HUELLA = 'B826DF163A9C0E4571D288F0A6B39C21FE0D4A5B7C6D8E9F0A1B2C3D4E5F6A7B'
const ANTERIOR = '4F1C9A0E77B2D3C108AA5E6F1290BC4478DE0F12AB34CD56EF78901234567890'

/** Factura devuelta por el backend (1 línea de 1000 € + 6 × 75 € al 21 %). */
function factura(estado: string, extra: Record<string, unknown> = {}): FacturaEmitida {
  return {
    id: 42,
    numSerieFactura: '2026-001',
    fechaExpedicion: '2026-10-14',
    cliente: { nif: 'A98765432', nombreRazonSocial: 'EMPRESA CLIENTE S.A.', pais: 'ES' },
    baseImponibleTotal: 1450,
    cuotaTotal: 304.5,
    importeTotal: 1754.5,
    verifactu: {
      huella: HUELLA,
      huellaAnterior: ANTERIOR,
      estadoEnvio: estado,
      csvAeat: null,
      codigoRespuestaAeat: null,
      mensajeAeat: null,
      qrBase64: 'iVBORw0KGgo=',
      ...extra,
    },
  } as unknown as FacturaEmitida
}

describe('SumaYSigue (5.1)', () => {
  test('muestra la huella anterior y la propia; el texto copiado es la huella completa', () => {
    const { container } = render(<SumaYSigue huellaAnterior={ANTERIOR} huella={HUELLA} />)
    expect(screen.getByText('Suma y sigue · huella anterior')).toBeInTheDocument()
    const codigos = container.querySelectorAll('code')
    expect(codigos[0].textContent).toBe(ANTERIOR)
    expect(codigos[1].textContent).toBe(HUELLA)
  })

  test('sin huella anterior indica que es el primer registro de la cadena', () => {
    render(<SumaYSigue huellaAnterior="" huella={HUELLA} />)
    expect(screen.getByText('Primer registro de la cadena')).toBeInTheDocument()
  })
})

describe('RegistroEmitido (5.2)', () => {
  test('ACEPTADO: éxito con el texto de la AEAT, CSV, totales, dos huellas y QR con texto alternativo', () => {
    render(<RegistroEmitido factura={factura('ACEPTADO', { csvAeat: 'A1B2C3D4E5F6G7H8' })} />)

    expect(screen.getByText('Aceptada por la AEAT')).toHaveAttribute('data-tono', 'exito')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('A1B2C3D4E5F6G7H8')).toBeInTheDocument()
    expect(screen.getByText('1.450,00 €')).toBeInTheDocument()
    expect(screen.getByText('1.754,50 €')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Código QR de cotejo de la factura 2026-001 en la AEAT' })).toHaveAttribute(
      'src',
      'data:image/png;base64,iVBORw0KGgo=',
    )
    expect(screen.getByText('Suma y sigue · huella anterior')).toBeInTheDocument()
  })

  test('RECHAZADO: incidencia con código y mensaje de la AEAT y aviso de que no se puede reemitir', () => {
    render(<RegistroEmitido factura={factura('RECHAZADO', { codigoRespuestaAeat: 'ERR-4102', mensajeAeat: 'Identificador de emisor no válido' })} />)

    expect(screen.getByText('Rechazada por la AEAT')).toHaveAttribute('data-tono', 'incidencia')
    expect(screen.getByRole('alert')).toHaveTextContent('Rechazada por la AEAT')
    expect(screen.getByText('ERR-4102')).toBeInTheDocument()
    expect(screen.getByText('Identificador de emisor no válido')).toBeInTheDocument()
    expect(screen.getByText('El registro ya está encadenado: no se puede volver a emitir con la misma serie y número.')).toBeInTheDocument()
  })

  test('ERROR_CONEXION: incidencia, nunca éxito', () => {
    render(<RegistroEmitido factura={factura('ERROR_CONEXION')} />)
    expect(screen.getByText('Error de conexión con la AEAT')).toHaveAttribute('data-tono', 'incidencia')
    expect(screen.queryByText('Aceptada por la AEAT')).not.toBeInTheDocument()
  })

  test('ACEPTADO_CON_ERRORES se muestra como aviso, no como éxito', () => {
    render(<RegistroEmitido factura={factura('ACEPTADO_CON_ERRORES')} />)
    expect(screen.getByText('Aceptada con errores')).toHaveAttribute('data-tono', 'aviso')
  })
})
