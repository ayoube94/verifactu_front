import { describe, expect, test } from 'vitest'
import { aPeticion, esquemaFormulario, fechaHoyMadrid, valoresIniciales, type ValoresFormulario } from './esquema.ts'

/** Formulario válido de partida; cada test cambia solo lo que prueba. */
const base = (): ValoresFormulario => ({
  ...valoresIniciales('2026-10-14'),
  serie: '2026',
  numero: '001',
  descripcionOperacion: 'Prestación de servicios',
  cliente: { nif: 'A98765432', nombreRazonSocial: 'EMPRESA CLIENTE S.A.', direccion: '', codigoPostal: '', ciudad: '', pais: 'ES' },
  lineas: [{ descripcion: 'Auditoría', cantidad: '1', precioUnitario: '1000', descuento: '0', tipoIva: '21' }],
})

/** Mensajes por campo tras validar, con la clave de ruta como en el backend (`lineas[1].cantidad`). */
function errores(valores: ValoresFormulario): Record<string, string> {
  const r = esquemaFormulario.safeParse(valores)
  if (r.success) return {}
  return Object.fromEntries(
    r.error.issues.map((i) => [
      i.path.reduce<string>((acc, p) => (typeof p === 'number' ? `${acc}[${p}]` : acc ? `${acc}.${String(p)}` : String(p)), ''),
      i.message,
    ]),
  )
}

describe('valores iniciales', () => {
  test('fecha de hoy en Madrid, F1, régimen general, país ES, una línea al 21 %', () => {
    const v = valoresIniciales('2026-10-14')
    expect(v).toMatchObject({
      fechaExpedicion: '2026-10-14',
      tipoFactura: 'F1',
      regimenIva: 'REGIMEN_GENERAL',
      cliente: { pais: 'ES' },
      lineas: [{ cantidad: '1', descuento: '0', tipoIva: '21' }],
    })
  })

  test('la fecha se calcula en hora de Madrid, no en UTC', () => {
    // 23:30 UTC del 14 de octubre ya es 15 de octubre en Madrid (UTC+2 en verano)
    expect(fechaHoyMadrid(new Date('2026-10-14T23:30:00Z'))).toBe('2026-10-15')
  })
})

describe('validación con las reglas del backend', () => {
  test('envío con campos vacíos: serie obligatoria y cantidad 0 (mensajes del backend)', () => {
    const v = base()
    v.serie = ''
    v.lineas[0].cantidad = '0'
    const e = errores(v)
    expect(e.serie).toBe('La serie es obligatoria')
    expect(e['lineas[0].cantidad']).toBe('La cantidad debe ser mayor que 0')
  })

  test('límites de cabecera: serie y número de 30, descripción de 500', () => {
    const v = base()
    v.serie = 'x'.repeat(31)
    v.numero = 'x'.repeat(31)
    v.descripcionOperacion = 'x'.repeat(501)
    const e = errores(v)
    expect(e.serie).toBe('La serie no puede superar los 30 caracteres')
    expect(e.numero).toBe('El número no puede superar los 30 caracteres')
    expect(e.descripcionOperacion).toBe('La descripción no puede superar los 500 caracteres')
    expect(errores({ ...base(), serie: 'x'.repeat(30) })).toEqual({})
  })

  test('reglas de línea: descripción, precio negativo y tipo de IVA', () => {
    const v = base()
    v.lineas[0] = { descripcion: '', cantidad: '1', precioUnitario: '-5', descuento: '0', tipoIva: '' }
    const e = errores(v)
    expect(e['lineas[0].descripcion']).toBe('La descripción de la línea es obligatoria')
    expect(e['lineas[0].precioUnitario']).toBe('El precio unitario no puede ser negativo')
    expect(e['lineas[0].tipoIva']).toBe('El tipo de IVA es obligatorio (ej: 21.00, 10.00, 4.00, 0.00)')
  })

  test('el error de una segunda línea se ubica en su índice', () => {
    const v = base()
    v.lineas.push({ descripcion: 'Soporte', cantidad: '0', precioUnitario: '10', descuento: '0', tipoIva: '21' })
    expect(errores(v)['lineas[1].cantidad']).toBe('La cantidad debe ser mayor que 0')
  })

  test('límites del destinatario: NIF de 20 y razón social de 120', () => {
    const v = base()
    v.cliente.nif = 'X'.repeat(21)
    v.cliente.nombreRazonSocial = 'X'.repeat(121)
    const e = errores(v)
    expect(e['cliente.nif']).toBe('El NIF no puede exceder 20 caracteres')
    expect(e['cliente.nombreRazonSocial']).toBe('El Nombre/Razón Social no puede exceder 120 caracteres')
  })

  test('sin líneas no se puede enviar', () => {
    const v = base()
    v.lineas = []
    expect(errores(v).lineas).toBe('La factura debe incluir al menos una línea de detalle')
  })
})

describe('decimales por campo, como el backend', () => {
  test('coma decimal válida; precio con 4 decimales', () => {
    const v = base()
    v.lineas[0].precioUnitario = '0,1234'
    expect(errores(v)).toEqual({})
  })

  test('demasiados decimales: precio con 5 y descuento con 3', () => {
    const v = base()
    v.lineas[0].precioUnitario = '0,12345'
    v.lineas[0].descuento = '5,555'
    const e = errores(v)
    expect(e['lineas[0].precioUnitario']).toBe('El precio unitario admite como máximo 4 decimales')
    expect(e['lineas[0].descuento']).toBe('El descuento admite como máximo 2 decimales')
  })
})

describe('destinatario según el tipo de factura', () => {
  test('factura simplificada F2 sin destinatario es válida y no envía cliente', () => {
    const v = base()
    v.tipoFactura = 'F2'
    v.cliente = { ...v.cliente, nif: '', nombreRazonSocial: '' }
    expect(errores(v)).toEqual({})
    expect(aPeticion(esquemaFormulario.parse(v))).not.toHaveProperty('cliente')
  })

  test('factura ordinaria F1 sin NIF pide el NIF', () => {
    const v = base()
    v.cliente.nif = ''
    expect(errores(v)['cliente.nif']).toBe('El NIF/CIF del cliente es obligatorio')
  })

  test('en una simplificada, rellenar solo una parte exige la otra', () => {
    const v = base()
    v.tipoFactura = 'R5'
    v.cliente = { ...v.cliente, nombreRazonSocial: '' }
    expect(errores(v)['cliente.nombreRazonSocial']).toBe('El Nombre o Razón Social del cliente es obligatorio')
  })
})

describe('aPeticion', () => {
  test('cada línea lleva tipoIva numérico y posición, y los números van con punto', () => {
    const v = base()
    v.lineas[0].precioUnitario = '75,5'
    const p = aPeticion(esquemaFormulario.parse(v))
    expect(p.lineas).toEqual([{ posicion: 1, descripcion: 'Auditoría', cantidad: 1, precioUnitario: 75.5, descuento: 0, tipoIva: 21 }])
    expect(typeof p.lineas[0].tipoIva).toBe('number')
  })

  test('con destinatario lo incluye con país ES por defecto', () => {
    const v = base()
    v.cliente.pais = ''
    expect(aPeticion(esquemaFormulario.parse(v)).cliente).toMatchObject({ nif: 'A98765432', pais: 'ES' })
  })
})
