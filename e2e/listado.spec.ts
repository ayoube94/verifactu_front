import { expect, test, type Page } from '@playwright/test'
import { facturaEmitida, simularApi } from './apiSimulada.ts'

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

test.describe('listado de facturas', () => {
  test('emitir, ver el listado, filtrar por serie y número, abrir la factura y volver atrás con el filtro intacto', async ({ page }) => {
    await simularApi(page, (_peticion, ruta) => ruta.fulfill({ status: 201, json: facturaEmitida('ACEPTADO') }))
    await page.route('**/api/v1/facturas/42', (ruta) => ruta.fulfill({ json: facturaEmitida('ACEPTADO') }))
    const emitida = resumen(42, { numSerieFactura: '2026-001', importeTotal: 1754.5 })
    // El «backend» simulado aplica el filtro de serie y número como el real (coincidencia exacta)
    const peticiones: Record<string, string>[] = []
    await page.route(/\/api\/v1\/facturas\?/, (ruta) => {
      const query = Object.fromEntries(new URL(ruta.request().url()).searchParams)
      peticiones.push(query)
      const coincide = (!query.serie || query.serie === '2026') && (!query.numero || query.numero === '001')
      const content = coincide ? [emitida] : []
      return ruta.fulfill({ json: { content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0 } })
    })

    // Emisión
    await page.goto('/facturas/nueva')
    await page.getByLabel('Serie').fill('2026')
    await page.getByLabel('Número').fill('001')
    await page.getByLabel('Descripción de la operación').fill('Consultoría')
    await page.getByLabel('NIF').fill('A98765432')
    await page.getByLabel('Nombre o razón social').fill('EMPRESA CLIENTE S.A.')
    await page.getByLabel('Descripción, línea 1').fill('Auditoría')
    await page.getByLabel('Precio unitario (€)').fill('1000')
    await page.getByRole('button', { name: 'Emitir', exact: true }).click()
    await expect(page.getByText('Aceptada por la AEAT')).toBeVisible()

    // Del resultado al listado
    await page.getByRole('link', { name: 'Ver todas las facturas' }).click()
    await expect(page).toHaveURL(/\/facturas$/)
    await expect(page.getByRole('link', { name: '2026-001' })).toBeVisible()
    await expect(page.getByText('1.754,50 €')).toBeVisible()

    // Un filtro sin coincidencias y después el correcto
    await page.getByLabel('Serie').fill('X')
    await page.getByRole('button', { name: 'Filtrar', exact: true }).click()
    await expect(page.getByText('Ninguna factura cumple los filtros')).toBeVisible()
    await page.getByLabel('Serie').fill('2026')
    await page.getByLabel('Número').fill('001')
    await page.getByRole('button', { name: 'Filtrar', exact: true }).click()
    await expect(page).toHaveURL(/\/facturas\?serie=2026&numero=001$/)

    // A la factura y de vuelta con «atrás»
    await page.getByRole('link', { name: '2026-001' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Factura 2026/001' })).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/facturas\?serie=2026&numero=001$/)
    await expect(page.getByLabel('Serie')).toHaveValue('2026')
    await expect(page.getByLabel('Número')).toHaveValue('001')
    await expect(page.getByRole('link', { name: '2026-001' })).toBeVisible()
    expect(peticiones.at(-1)).toMatchObject({ serie: '2026', numero: '001', page: '0', size: '20' })
  })
})
