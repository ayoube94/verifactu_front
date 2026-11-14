import type { Page, Route } from '@playwright/test'
import type { components } from '../src/api/schema.d.ts'

export type FacturaEmitida = components['schemas']['FacturaResponseDto']
export type PeticionFactura = components['schemas']['FacturaCreateDto']

/** Factura de respuesta con el estado indicado; los importes son los del ejemplo del spec (1.450 € + IVA). */
export function facturaEmitida(estadoEnvio: string, extra: Partial<NonNullable<FacturaEmitida['verifactu']>> = {}): FacturaEmitida {
  return {
    id: 42,
    serie: '2026',
    numero: '001',
    numSerieFactura: '2026-001',
    fechaExpedicion: '2026-10-14',
    tipoFactura: 'F1',
    regimenIva: 'REGIMEN_GENERAL',
    descripcionOperacion: 'Consultoría',
    baseImponibleTotal: 1450,
    cuotaTotal: 304.5,
    importeTotal: 1754.5,
    cliente: { nif: 'A98765432', nombreRazonSocial: 'EMPRESA CLIENTE S.A.', pais: 'ES' },
    lineas: [],
    verifactu: {
      id: 7,
      huella: 'B826DF163A9C0E4571D288F0A6B39C21FE0D4A5B7C6D8E9F0A1B2C3D4E5F6A7B',
      huellaAnterior: '4F1C9A0E77B2D3C108AA5E6F1290BC4478DE0F12AB34CD56EF78901234567890',
      estadoEnvio,
      csvAeat: estadoEnvio === 'ACEPTADO' ? 'A1B2C3D4E5F6G7H8' : null,
      codigoRespuestaAeat: null,
      mensajeAeat: null,
      qrBase64: 'iVBORw0KGgo=',
      ...extra,
    },
  } as FacturaEmitida
}

/**
 * Simula la API y el health del backend en el navegador de la prueba.
 * `emision` decide la respuesta de POST /api/v1/facturas y recibe la petición ya parseada.
 * Devuelve las peticiones de emisión recibidas, para comprobar cuántas llegaron y con qué cuerpo.
 */
export async function simularApi(
  pagina: Page,
  emision: (peticion: PeticionFactura, ruta: Route) => Promise<void> | void,
): Promise<PeticionFactura[]> {
  const recibidas: PeticionFactura[] = []
  await pagina.route('**/actuator/health', (ruta) => ruta.fulfill({ json: { status: 'UP' } }))
  await pagina.route('**/api/v1/facturas', async (ruta) => {
    if (ruta.request().method() !== 'POST') return ruta.fallback()
    const peticion = ruta.request().postDataJSON() as PeticionFactura
    recibidas.push(peticion)
    await emision(peticion, ruta)
  })
  return recibidas
}
