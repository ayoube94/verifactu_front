import { describe, expect, test } from 'vitest'
import { formatearFecha, formatearFechaHora, formatearImporte } from './formato.ts'

// Intl usa espacio no separable (U+00A0) antes del símbolo €
const nbsp = ' '

describe('formatearImporte', () => {
  test.each([
    [1210, `1.210,00${nbsp}€`],
    ['1210.00', `1.210,00${nbsp}€`],
    [0, `0,00${nbsp}€`],
    [304.5, `304,50${nbsp}€`],
    [1234567.891, `1.234.567,89${nbsp}€`],
  ])('%s → %s', (valor, esperado) => {
    expect(formatearImporte(valor)).toBe(esperado)
  })

  test('valores vacíos o no numéricos no se muestran', () => {
    expect(formatearImporte(null)).toBe('')
    expect(formatearImporte(undefined)).toBe('')
    expect(formatearImporte('abc')).toBe('')
  })
})

describe('formatearFecha', () => {
  test('aaaa-mm-dd → dd/mm/aaaa sin desplazamiento de zona horaria', () => {
    expect(formatearFecha('2026-10-14')).toBe('14/10/2026')
    expect(formatearFecha('2027-01-01')).toBe('01/01/2027')
  })

  test('un valor inesperado se muestra tal cual', () => {
    expect(formatearFecha('14-10-2026')).toBe('14-10-2026')
    expect(formatearFecha(undefined)).toBe('')
  })
})

describe('formatearFechaHora', () => {
  test('se muestra en hora de Madrid', () => {
    expect(formatearFechaHora('2026-10-14T20:00:00+02:00')).toBe('14/10/2026 20:00:00')
    expect(formatearFechaHora('2026-10-14T18:00:00Z')).toBe('14/10/2026 20:00:00')
  })
})
