import { describe, expect, test } from 'vitest'
import { esCampoDelFormulario, rutaDeCampo } from './esquema.ts'

describe('rutaDeCampo', () => {
  test('convierte los índices de línea a ruta de React Hook Form', () => {
    expect(rutaDeCampo('lineas[1].cantidad')).toBe('lineas.1.cantidad')
    expect(rutaDeCampo('cliente.nif')).toBe('cliente.nif')
    expect(rutaDeCampo('serie')).toBe('serie')
  })
})

describe('esCampoDelFormulario', () => {
  test('reconoce los campos del formulario y deja fuera los desconocidos', () => {
    expect(esCampoDelFormulario('serie')).toBe(true)
    expect(esCampoDelFormulario('cliente.nif')).toBe(true)
    expect(esCampoDelFormulario('lineas[0].tipoIva')).toBe(true)
    expect(esCampoDelFormulario('campoNuevoDelBackend')).toBe(false)
    expect(esCampoDelFormulario('lineas[0].campoRaro')).toBe(false)
  })
})
