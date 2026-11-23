import { describe, expect, test } from 'vitest'
import { aQuery, leerParametros, TAMANOS_PAGINA } from './listado.ts'

const leer = (query: string) => leerParametros(new URLSearchParams(query))

describe('leerParametros', () => {
  test('sin query: primera página, 20 por página y sin filtros', () => {
    expect(leer('')).toEqual({ page: 0, size: 20 })
  })

  test('lee todos los filtros y recorta los espacios', () => {
    expect(leer('serie=%20A%20&numero=001&nifCliente=B12345678&fechaDesde=2026-03-01&fechaHasta=2026-03-31&estadoEnvio=RECHAZADO&page=2&size=50')).toEqual({
      serie: 'A',
      numero: '001',
      nifCliente: 'B12345678',
      fechaDesde: '2026-03-01',
      fechaHasta: '2026-03-31',
      estadoEnvio: 'RECHAZADO',
      page: 2,
      size: 50,
    })
  })

  test('un campo vacío o solo con espacios no genera parámetro', () => {
    expect(leer('serie=&numero=%20%20&nifCliente=')).toEqual({ page: 0, size: 20 })
  })

  test.each([
    ['page=-1', { page: 0, size: 20 }],
    ['page=abc', { page: 0, size: 20 }],
    ['page=1.5', { page: 0, size: 20 }],
    ['size=1000', { page: 0, size: 20 }],
    ['size=0', { page: 0, size: 20 }],
    ['size=25', { page: 0, size: 20 }],
    ['estadoEnvio=XX', { page: 0, size: 20 }],
    ['estadoEnvio=aceptado', { page: 0, size: 20 }],
    ['fechaDesde=01/03/2026', { page: 0, size: 20 }],
    ['fechaHasta=2026-02-30', { page: 0, size: 20 }],
    ['fechaDesde=2026-13-01', { page: 0, size: 20 }],
  ])('ignora el valor no válido de %s', (query, esperado) => {
    expect(leer(query)).toEqual(esperado)
  })

  test('los tamaños permitidos son 10, 20, 50 y 100', () => {
    expect(TAMANOS_PAGINA).toEqual([10, 20, 50, 100])
  })
})

describe('aQuery', () => {
  test('/facturas limpia: no escribe lo que vale el valor por defecto', () => {
    expect(aQuery({ page: 0, size: 20 }).toString()).toBe('')
  })

  test('escribe solo lo que difiere del defecto, en un orden estable', () => {
    expect(aQuery({ page: 1, size: 50, estadoEnvio: 'RECHAZADO', serie: 'A' }).toString()).toBe('serie=A&estadoEnvio=RECHAZADO&page=1&size=50')
  })

  test('es estable: leer y volver a escribir no cambia la query', () => {
    const query = 'serie=A&numero=001&nifCliente=B1&fechaDesde=2026-03-01&fechaHasta=2026-03-31&estadoEnvio=ACEPTADO&page=3&size=10'
    expect(aQuery(leer(query)).toString()).toBe(query)
  })
})
