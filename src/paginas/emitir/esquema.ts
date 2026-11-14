import { z } from 'zod'
import type { components } from '../../api/schema.d.ts'
import { aEscalado, ESCALA } from '../../utilidades/importes.ts'

type FacturaCreate = components['schemas']['FacturaCreateDto']

export const TIPOS_FACTURA = ['F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'R4', 'R5'] as const
export const REGIMENES_IVA = [
  'REGIMEN_GENERAL',
  'EXPORTACION',
  'BIENES_USADOS',
  'ORO_INVERSION',
  'AGENCIAS_VIAJES',
  'GRUPO_ENTIDADES',
  'CRITERIO_CAJA',
  'SIMPLIFICADO',
] as const
/** Tipos de IVA que ofrece el selector. El backend acepta cualquier porcentaje; el formulario se limita a estos. */
export const TIPOS_IVA = ['21', '10', '4', '0'] as const
/** Facturas simplificadas: el destinatario es opcional. */
const SIMPLIFICADAS = new Set<string>(['F2', 'R5'])

/** Valores del formulario tal como se editan: todo texto, también los números. */
export interface ValoresFormulario {
  serie: string
  numero: string
  fechaExpedicion: string
  tipoFactura: (typeof TIPOS_FACTURA)[number]
  regimenIva: (typeof REGIMENES_IVA)[number]
  descripcionOperacion: string
  cliente: { nif: string; nombreRazonSocial: string; direccion: string; codigoPostal: string; ciudad: string; pais: string }
  lineas: { descripcion: string; cantidad: string; precioUnitario: string; descuento: string; tipoIva: string }[]
}

/** Fecha de hoy como AAAA-MM-DD en hora de Madrid (la zona en que el backend genera los registros). */
export function fechaHoyMadrid(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
}

export function valoresIniciales(fecha: string = fechaHoyMadrid()): ValoresFormulario {
  return {
    serie: '',
    numero: '',
    fechaExpedicion: fecha,
    tipoFactura: 'F1',
    regimenIva: 'REGIMEN_GENERAL',
    descripcionOperacion: '',
    cliente: { nif: '', nombreRazonSocial: '', direccion: '', codigoPostal: '', ciudad: '', pais: 'ES' },
    lineas: [{ descripcion: '', cantidad: '1', precioUnitario: '', descuento: '0', tipoIva: '21' }],
  }
}

/** Número con separador decimal (coma o punto) y escala máxima. */
const decimal = (escala: number, mensajeEscala: string) =>
  z.string().refine((t) => aEscalado(t, escala) !== null || t.trim() === '', { message: mensajeEscala })

const textoRequerido = (mensaje: string, max?: number, mensajeMax?: string) => {
  const base = z.string().trim().min(1, { message: mensaje })
  return max ? base.max(max, { message: mensajeMax }) : base
}

const decimalRequerido = (escala: number, mensajeEscala: string, mensajeObligatorio: string) =>
  z
    .string()
    .trim()
    .min(1, { message: mensajeObligatorio })
    .refine((t) => aEscalado(t, escala) !== null, { message: mensajeEscala })

const linea = z.object({
  descripcion: textoRequerido('La descripción de la línea es obligatoria'),
  cantidad: decimalRequerido(ESCALA.cantidad, 'La cantidad admite como máximo 4 decimales', 'La cantidad es obligatoria').refine(
    (t) => (aEscalado(t, ESCALA.cantidad) ?? 0n) > 0n,
    { message: 'La cantidad debe ser mayor que 0' },
  ),
  precioUnitario: decimalRequerido(ESCALA.precio, 'El precio unitario admite como máximo 4 decimales', 'El precio unitario es obligatorio').refine(
    (t) => (aEscalado(t, ESCALA.precio) ?? 0n) >= 0n,
    { message: 'El precio unitario no puede ser negativo' },
  ),
  descuento: decimal(ESCALA.descuento, 'El descuento admite como máximo 2 decimales'),
  tipoIva: z
    .string()
    .min(1, { message: 'El tipo de IVA es obligatorio (ej: 21.00, 10.00, 4.00, 0.00)' })
    .refine((t) => t === '' || (TIPOS_IVA as readonly string[]).includes(t), { message: 'Elige un tipo de IVA de la lista' }),
})

export const esquemaFormulario = z
  .object({
    serie: textoRequerido('La serie es obligatoria', 30, 'La serie no puede superar los 30 caracteres'),
    numero: textoRequerido('El número de factura es obligatorio', 30, 'El número no puede superar los 30 caracteres'),
    fechaExpedicion: z.string().min(1, { message: 'La fecha de expedición es obligatoria' }),
    tipoFactura: z.enum(TIPOS_FACTURA, { message: 'Elige un tipo de factura' }),
    regimenIva: z.enum(REGIMENES_IVA, { message: 'Elige un régimen de IVA' }),
    descripcionOperacion: textoRequerido('La descripción de la operación es obligatoria', 500, 'La descripción no puede superar los 500 caracteres'),
    cliente: z.object({
      nif: z.string().trim().max(20, { message: 'El NIF no puede exceder 20 caracteres' }),
      nombreRazonSocial: z.string().trim().max(120, { message: 'El Nombre/Razón Social no puede exceder 120 caracteres' }),
      direccion: z.string(),
      codigoPostal: z.string(),
      ciudad: z.string(),
      pais: z.string(),
    }),
    lineas: z.array(linea).min(1, { message: 'La factura debe incluir al menos una línea de detalle' }),
  })
  .superRefine((valores, ctx) => {
    // El destinatario es obligatorio salvo en las simplificadas. En ellas, si se rellena una parte, la otra también es obligatoria.
    const { nif, nombreRazonSocial } = valores.cliente
    const hayDestinatario = nif !== '' || nombreRazonSocial !== ''
    if (SIMPLIFICADAS.has(valores.tipoFactura) && !hayDestinatario) return
    if (nif === '') ctx.addIssue({ code: 'custom', path: ['cliente', 'nif'], message: 'El NIF/CIF del cliente es obligatorio' })
    if (nombreRazonSocial === '')
      ctx.addIssue({ code: 'custom', path: ['cliente', 'nombreRazonSocial'], message: 'El Nombre o Razón Social del cliente es obligatorio' })
  })

export type ValoresValidados = z.infer<typeof esquemaFormulario>

/**
 * Construye el cuerpo de POST /api/v1/facturas. Cada línea lleva `tipoIva` numérico siempre.
 * Sin destinatario (solo en simplificadas) no se envía `cliente`.
 */
export function aPeticion(valores: ValoresValidados): FacturaCreate {
  const { cliente } = valores
  const hayDestinatario = cliente.nif !== '' || cliente.nombreRazonSocial !== ''
  return {
    serie: valores.serie,
    numero: valores.numero,
    fechaExpedicion: valores.fechaExpedicion,
    tipoFactura: valores.tipoFactura,
    regimenIva: valores.regimenIva,
    descripcionOperacion: valores.descripcionOperacion,
    ...(hayDestinatario ? { cliente: { ...cliente, pais: cliente.pais || 'ES' } } : {}),
    lineas: valores.lineas.map((l, i) => ({
      posicion: i + 1,
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad.replace(',', '.')),
      precioUnitario: Number(l.precioUnitario.replace(',', '.')),
      descuento: Number((l.descuento || '0').replace(',', '.')),
      tipoIva: Number(l.tipoIva),
    })),
  }
}
