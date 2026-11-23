import { expect, test, type Page } from '@playwright/test'

const resumen = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  numSerieFactura: `2026/${String(id).padStart(3, '0')}`,
  fechaExpedicion: '2026-03-05',
  tipoFactura: 'F1',
  clienteNif: 'B12345678',
  clienteNombre: 'Cliente SL',
  importeTotal: 1210,
  estadoEnvio: 'ACEPTADO',
  huella: 'ABC',
  ...extra,
})

/** Sirve `GET /api/v1/facturas` (con su query) con las facturas indicadas y anota la query de cada petición. */
async function simularListado(pagina: Page, content: object[]) {
  const peticiones: Record<string, string>[] = []
  await pagina.route('**/actuator/health', (ruta) => ruta.fulfill({ json: { status: 'UP' } }))
  await pagina.route(/\/api\/v1\/facturas\?/, (ruta) => {
    peticiones.push(Object.fromEntries(new URL(ruta.request().url()).searchParams))
    return ruta.fulfill({ json: { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 } })
  })
  return peticiones
}

test.describe('listado de facturas a 360 px', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('con nombres de cliente muy largos no hay desplazamiento horizontal', async ({ page }) => {
    await simularListado(page, [
      resumen(1, { clienteNombre: 'ASOCIACIÓN INTERPROFESIONAL DE EMPRESAS DE SERVICIOS DE CONSULTORÍA Y AUDITORÍA DEL MEDITERRÁNEO SOCIEDAD LIMITADA' }),
      resumen(2, { clienteNombre: 'SupercalifragilisticoespialidosoSupercalifragilisticoespialidoso', tipoFactura: 'F3', estadoEnvio: 'ERROR_CONEXION', importeTotal: 1234567.89 }),
    ])
    await page.goto('/facturas')

    await expect(page.getByRole('link', { name: '2026/002' })).toBeVisible()
    const { ancho, visible } = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, visible: document.documentElement.clientWidth }))
    expect(ancho).toBeLessThanOrEqual(visible)
    await page.screenshot({ path: test.info().outputPath('listado-360.png'), fullPage: true })
  })
})
