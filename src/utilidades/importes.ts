/**
 * Aritmética de importes exacta, con la misma escala y redondeo que el backend (LineaFactura, Factura):
 * - cantidad y precio unitario: 4 decimales; descuento y tipo de IVA: 2 decimales.
 * - base = (cantidad × precio − descuento), redondeada HALF_UP a 2 decimales (el producto sin redondear).
 * - cuota = base × (tipo / 100), con el factor a 4 decimales, redondeada HALF_UP a 2.
 * - importe de línea = base + cuota. Totales = suma de los valores ya redondeados de cada línea.
 *
 * Trabaja con enteros escalados (BigInt) para no perder precisión con `0.1 + 0.2`.
 * Solo el resultado final se convierte a texto para mostrarlo.
 */

export const ESCALA = { cantidad: 4, precio: 4, descuento: 2, tipo: 2 } as const

/** Entero escalado con `escala` decimales, o null si el texto no es un número válido o tiene más decimales. */
export function aEscalado(texto: string, escala: number): bigint | null {
  const limpio = texto.trim().replace(',', '.')
  const m = /^(-?)(\d+)(?:\.(\d*))?$/.exec(limpio)
  if (!m) return null
  const [, signo, enteros, decimales = ''] = m
  if (decimales.length > escala) return null
  const valor = BigInt(enteros + decimales.padEnd(escala, '0'))
  return signo === '-' ? -valor : valor
}

/** Divide redondeando HALF_UP (0,5 sube; en negativos, simétrico). */
export function dividirHalfUp(numerador: bigint, denominador: bigint): bigint {
  const negativo = numerador < 0n !== denominador < 0n
  const n = numerador < 0n ? -numerador : numerador
  const d = denominador < 0n ? -denominador : denominador
  const cociente = (2n * n + d) / (2n * d)
  return negativo ? -cociente : cociente
}

/** Entero escalado con `escala` decimales → texto con punto y exactamente esos decimales, p. ej. 145000n → "1450.00". */
export function aTexto(valor: bigint, escala: number): string {
  const negativo = valor < 0n
  const digitos = (negativo ? -valor : valor).toString().padStart(escala + 1, '0')
  const entero = digitos.slice(0, digitos.length - escala)
  const decimales = digitos.slice(digitos.length - escala)
  return `${negativo ? '-' : ''}${entero}${escala > 0 ? `.${decimales}` : ''}`
}

export interface LineaNumerica {
  cantidad: string
  precio: string
  descuento: string
  tipo: string
}

export interface ImportesLinea {
  /** Base imponible a escala 2. */
  base: bigint
  /** Cuota de IVA a escala 2. */
  cuota: bigint
  /** Importe de la línea (base + cuota) a escala 2. */
  importe: bigint
}

/** Calcula una línea. Devuelve null si algún campo no es un número válido en su escala. */
export function calcularLinea(linea: LineaNumerica): ImportesLinea | null {
  const cantidad = aEscalado(linea.cantidad, ESCALA.cantidad)
  const precio = aEscalado(linea.precio, ESCALA.precio)
  const descuento = aEscalado(linea.descuento === '' ? '0' : linea.descuento, ESCALA.descuento)
  const tipo = aEscalado(linea.tipo, ESCALA.tipo)
  if (cantidad === null || precio === null || descuento === null || tipo === null) return null

  // cantidad (escala 4) × precio (escala 4) = escala 8; el descuento pasa de escala 2 a 8
  const brutoSinRedondear = cantidad * precio
  const base = dividirHalfUp(brutoSinRedondear - descuento * 10n ** 6n, 10n ** 6n) // escala 2

  // tipo / 100 con 4 decimales: tipo ya está en escala 2, así que su valor escalado a 4 decimales es el mismo entero
  const factor4 = tipo
  const cuota = dividirHalfUp(base * factor4, 10n ** 4n) // escala 2 × escala 4 → escala 6 → escala 2

  return { base, cuota, importe: base + cuota }
}

export interface Totales {
  base: bigint
  cuota: bigint
  total: bigint
}

/** Suma los valores ya redondeados de cada línea. Las líneas no válidas se ignoran. */
export function calcularTotales(lineas: readonly LineaNumerica[]): Totales {
  return lineas.reduce<Totales>(
    (acc, linea) => {
      const r = calcularLinea(linea)
      return r ? { base: acc.base + r.base, cuota: acc.cuota + r.cuota, total: acc.total + r.importe } : acc
    },
    { base: 0n, cuota: 0n, total: 0n },
  )
}
