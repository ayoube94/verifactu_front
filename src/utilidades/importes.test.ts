import { describe, expect, test } from 'vitest'
import { aEscalado, aTexto, calcularLinea, calcularTotales, dividirHalfUp } from './importes.ts'

const linea = (cantidad: string, precio: string, descuento = '0', tipo = '21') => ({ cantidad, precio, descuento, tipo })

describe('aEscalado', () => {
  test('acepta coma o punto y rellena la escala', () => {
    expect(aEscalado('75,5', 2)).toBe(7550n)
    expect(aEscalado('75.50', 2)).toBe(7550n)
    expect(aEscalado('0,1234', 4)).toBe(1234n)
  })

  test('rechaza más decimales que los de la escala y texto no numérico', () => {
    expect(aEscalado('0,12345', 4)).toBeNull()
    expect(aEscalado('5,555', 2)).toBeNull()
    expect(aEscalado('abc', 2)).toBeNull()
    expect(aEscalado('1.000,00', 2)).toBeNull()
  })
})

describe('dividirHalfUp', () => {
  test('0,5 sube y el negativo es simétrico', () => {
    expect(dividirHalfUp(5n, 10n)).toBe(1n)
    expect(dividirHalfUp(4n, 10n)).toBe(0n)
    expect(dividirHalfUp(-5n, 10n)).toBe(-1n)
  })
})

describe('aTexto', () => {
  test('muestra siempre los decimales de la escala', () => {
    expect(aTexto(145000n, 2)).toBe('1450.00')
    expect(aTexto(5n, 2)).toBe('0.05')
    expect(aTexto(-105n, 2)).toBe('-1.05')
  })
})

describe('calcularLinea', () => {
  test('la línea de ejemplo del spec: 1 × 1000 al 21 %', () => {
    expect(calcularLinea(linea('1', '1000'))).toEqual({ base: 100000n, cuota: 21000n, importe: 121000n })
  })

  test('3 × 0,35 al 21 %: base 1,05 y cuota 0,22', () => {
    const r = calcularLinea(linea('3', '0,35'))
    expect(aTexto(r!.base, 2)).toBe('1.05')
    expect(aTexto(r!.cuota, 2)).toBe('0.22')
  })

  test('el producto no se redondea antes de restar el descuento', () => {
    // 3 × 0,3333 = 0,9999; con descuento 0,00 la base es 1,00 (no 0,99 ni 1,01)
    expect(aTexto(calcularLinea(linea('3', '0,3333'))!.base, 2)).toBe('1.00')
  })

  test('precio de 4 decimales con cantidad fraccionaria', () => {
    // 2,5 × 0,1234 = 0,3085 → base 0,31
    expect(aTexto(calcularLinea(linea('2,5', '0,1234', '0', '0'))!.base, 2)).toBe('0.31')
  })

  test('la cuota se redondea HALF_UP a 2 decimales', () => {
    // base 0,05 × 21 % = 0,0105 → cuota 0,01
    expect(aTexto(calcularLinea(linea('1', '0,05'))!.cuota, 2)).toBe('0.01')
    // base 0,10 × 21 % = 0,021 → cuota 0,02 ; base 0,25 × 10 % = 0,025 → cuota 0,03
    expect(aTexto(calcularLinea(linea('1', '0,25', '0', '10'))!.cuota, 2)).toBe('0.03')
  })

  test('descuento en euros, no en porcentaje', () => {
    expect(aTexto(calcularLinea(linea('2', '100', '50'))!.base, 2)).toBe('150.00')
  })

  test('devuelve null si un campo no es válido', () => {
    expect(calcularLinea(linea('1', '10,55555'))).toBeNull()
    expect(aTexto(calcularLinea(linea('1', '10,555'))!.base, 2)).toBe('10.56')
    expect(calcularLinea(linea('', '10'))).toBeNull()
  })
})

describe('calcularTotales', () => {
  test('el ejemplo del spec: base 1.450,00 €, cuota 304,50 €, total 1.754,50 €', () => {
    const t = calcularTotales([linea('1', '1000'), linea('6', '75')])
    expect(aTexto(t.base, 2)).toBe('1450.00')
    expect(aTexto(t.cuota, 2)).toBe('304.50')
    expect(aTexto(t.total, 2)).toBe('1754.50')
  })

  test('los totales suman las líneas ya redondeadas, no el total sin redondear', () => {
    // Dos líneas de 0,05 × 21 %: cada cuota es 0,01 → total de cuotas 0,02 (no 0,0210 redondeado a 0,02 por otra vía)
    const t = calcularTotales([linea('1', '0,05'), linea('1', '0,05')])
    expect(aTexto(t.cuota, 2)).toBe('0.02')
  })

  test('las líneas no válidas no suman', () => {
    const t = calcularTotales([linea('1', '100'), linea('x', '1')])
    expect(aTexto(t.total, 2)).toBe('121.00')
  })
})
