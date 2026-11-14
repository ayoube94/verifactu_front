import { expect, test, type Page } from '@playwright/test'
import { facturaEmitida, simularApi } from './apiSimulada.ts'

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

test.describe('emisión de factura', () => {
  test('humo: la pantalla de emisión carga con su formulario', async ({ page }) => {
    await simularApi(page, () => undefined)
    await page.goto('/facturas/nueva')
    await expect(page.getByRole('heading', { level: 1, name: 'Emitir factura' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Emitir' })).toBeVisible()
  })

  test('emisión aceptada: muestra «Aceptada por la AEAT», el CSV y las dos huellas', async ({ page }) => {
    const recibidas = await simularApi(page, (_peticion, ruta) => ruta.fulfill({ status: 201, json: facturaEmitida('ACEPTADO') }))
    await page.goto('/facturas/nueva')
    await rellenarFactura(page)
    await page.getByRole('button', { name: 'Emitir' }).click()

    await expect(page.getByText('Aceptada por la AEAT')).toBeVisible()
    await expect(page.getByText('A1B2C3D4E5F6G7H8')).toBeVisible()
    await expect(page.getByText('Suma y sigue · huella anterior')).toBeVisible()
    await expect(page.getByRole('img', { name: /Código QR de cotejo de la factura 2026-001/ })).toBeVisible()
    // El cuerpo lleva tipoIva numérico en cada línea
    expect(recibidas[0].lineas[0]).toMatchObject({ tipoIva: 21, precioUnitario: 1000 })
  })

  test('400 con error en la línea 2: el mensaje aparece junto a su cantidad y los datos se conservan', async ({ page }) => {
    await simularApi(page, (_peticion, ruta) =>
      ruta.fulfill({
        status: 400,
        json: {
          status: 400,
          detail: 'Error de validación en los datos de la factura',
          errores: { 'lineas[1].cantidad': 'La cantidad debe ser mayor que 0' },
        },
      }),
    )
    await page.goto('/facturas/nueva')
    await rellenarFactura(page)
    await page.getByRole('button', { name: 'Añadir línea' }).click()
    await page.getByLabel('Descripción, línea 2').fill('Soporte')
    await page.locator('input[id$="l1-precio"]').fill('75')
    await page.getByRole('button', { name: 'Emitir' }).click()

    const cantidad2 = page.locator('input[id$="l1-cantidad"]')
    await expect(cantidad2).toHaveAttribute('aria-invalid', 'true')
    await expect(cantidad2).toHaveAccessibleDescription('La cantidad debe ser mayor que 0')
    await expect(page.getByLabel('Serie')).toHaveValue('2026')
  })

  test('201 rechazado: incidencia, código de la AEAT y aviso de que no se puede reemitir', async ({ page }) => {
    await simularApi(page, (_peticion, ruta) =>
      ruta.fulfill({
        status: 201,
        json: facturaEmitida('RECHAZADO', { codigoRespuestaAeat: 'ERR-4102', mensajeAeat: 'Identificador de emisor no válido' }),
      }),
    )
    await page.goto('/facturas/nueva')
    await rellenarFactura(page)
    await page.getByRole('button', { name: 'Emitir' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Rechazada por la AEAT' })).toBeVisible()
    await expect(page.getByText('ERR-4102')).toBeVisible()
    await expect(page.getByText('no se puede volver a emitir con la misma serie y número')).toBeVisible()
    await expect(page.getByText('Aceptada por la AEAT')).toHaveCount(0)
  })

  test('doble clic: una sola petición llega a la API', async ({ page }) => {
    const recibidas = await simularApi(page, async (_peticion, ruta) => {
      await new Promise((r) => setTimeout(r, 400))
      await ruta.fulfill({ status: 201, json: facturaEmitida('ACEPTADO') })
    })
    await page.goto('/facturas/nueva')
    await rellenarFactura(page)
    const emitir = page.getByRole('button', { name: 'Emitir' })
    await emitir.dblclick()

    await expect(page.getByText('Aceptada por la AEAT')).toBeVisible()
    expect(recibidas).toHaveLength(1)
  })
})
