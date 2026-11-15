import { expect, test, type Page } from '@playwright/test'
import { facturaEmitida, simularApi } from './apiSimulada.ts'

const HUELLA = 'b826df163a9c0e4571d288f0a6b39c21fe0d4a5b7c6d8e9f0a1b2c3d4e5f6a7b'

/** Rellena una factura válida de una línea: 1 × 1000 € al 21 %. */
async function rellenarFactura(pagina: Page) {
  await pagina.getByLabel('Serie').fill('2026')
  await pagina.getByLabel('Número').fill('001')
  await pagina.getByLabel('Descripción de la operación').fill('Consultoría')
  await pagina.getByLabel('NIF').fill('A98765432')
  await pagina.getByLabel('Nombre o razón social').fill('EMPRESA CLIENTE S.A.')
  await pagina.getByLabel('Descripción, línea 1').fill('Auditoría')
  await pagina.getByLabel('Precio unitario (€)').fill('1000')
}

/** Sirve la factura 42 en GET /api/v1/facturas/42 y el veredicto de la huella en la ruta de verificación. */
async function simularConsultas(pagina: Page, integridadValida = true) {
  await pagina.route('**/api/v1/facturas/42', (ruta) => ruta.fulfill({ json: facturaEmitida('ACEPTADO') }))
  await pagina.route('**/api/v1/facturas/42/xml', (ruta) =>
    ruta.fulfill({ status: 200, contentType: 'application/xml', body: '<factura/>' }),
  )
  await pagina.route('**/api/v1/facturas/auditoria/verificar-huella/**', (ruta) =>
    ruta.fulfill({
      json: {
        huella: HUELLA,
        huellaAnterior: '',
        fechaGeneracion: '2026-10-14T20:00:00+02:00',
        cadenaCanonica: 'IDEmisorFactura=A98765432&NumSerieFactura=2026-001&FechaExpedicion=14-10-2026',
        integridadValida,
        mensaje: integridadValida ? 'La huella coincide con la guardada' : 'La huella no coincide',
      },
    }),
  )
}

test.describe('consulta de factura', () => {
  test('emitir, consultar por id, ver el bloque VeriFactu y descargar el XML', async ({ page }) => {
    await simularApi(page, (_peticion, ruta) => ruta.fulfill({ status: 201, json: facturaEmitida('ACEPTADO') }))
    await simularConsultas(page)

    await page.goto('/facturas/nueva')
    await rellenarFactura(page)
    await page.getByRole('button', { name: 'Emitir' }).click()
    await expect(page.getByText('Aceptada por la AEAT')).toBeVisible()

    // Desde la navegación, consultar la factura por su id
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Consultar factura' }).click()
    await page.getByLabel('Id de la factura').fill('42')
    await page.getByRole('button', { name: 'Consultar' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Factura 2026/001' })).toBeVisible()
    await expect(page.getByText('A1B2C3D4E5F6G7H8')).toBeVisible()
    await expect(page.getByText('Suma y sigue · huella anterior')).toBeVisible()
    await expect(page.getByRole('img', { name: /Código QR de cotejo de la factura 2026-001/ })).toBeVisible()

    const enlace = page.getByRole('link', { name: 'Descargar XML' })
    await expect(enlace).toHaveAttribute('href', '/api/v1/facturas/42/xml')
    const [descarga] = await Promise.all([page.waitForEvent('download'), enlace.click()])
    expect(descarga.url()).toContain('/api/v1/facturas/42/xml')
  })

  test('un id que no existe muestra el aviso y enlaza para consultar otra', async ({ page }) => {
    await simularApi(page, () => undefined)
    await page.route('**/api/v1/facturas/999', (ruta) => ruta.fulfill({ status: 404, json: { status: 404 } }))
    await page.goto('/consultar')
    await page.getByLabel('Id de la factura').fill('999')
    await page.getByRole('button', { name: 'Consultar' }).click()
    await expect(page.getByText('No existe ninguna factura con el id 999.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Consultar otra factura' })).toBeVisible()
  })
})

test.describe('verificación de huella', () => {
  test('una huella íntegra se confirma y una alterada se marca como no válida', async ({ page }) => {
    await simularApi(page, () => undefined)
    await simularConsultas(page, true)
    await page.goto('/verificar-huella')
    await page.getByLabel('Huella del registro').fill(HUELLA)
    await page.getByRole('button', { name: 'Verificar' }).click()
    await expect(page.getByText('Integridad válida: el registro no ha sido alterado.')).toBeVisible()
  })

  test('integridad no válida: alerta visible', async ({ page }) => {
    await simularApi(page, () => undefined)
    await simularConsultas(page, false)
    await page.goto(`/verificar-huella?huella=${HUELLA}`)
    await expect(page.getByText('Integridad no válida: la huella recalculada no coincide con la guardada.')).toBeVisible()
  })

  test('a 360 px la cadena canónica se ajusta sin desbordar la página', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await simularApi(page, () => undefined)
    await simularConsultas(page, true)
    await page.goto(`/verificar-huella?huella=${HUELLA}`)
    await page.getByText('Detalle técnico').click()
    await expect(page.getByText('Cadena canónica')).toBeVisible()
    const desbordamiento = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(desbordamiento).toBeLessThanOrEqual(0)
  })
})
