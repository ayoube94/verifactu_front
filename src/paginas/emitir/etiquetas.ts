import type { REGIMENES_IVA, TIPOS_FACTURA } from './esquema.ts'

/** Etiquetas en español de los códigos de factura y de régimen, compartidas por el formulario y la vista de factura. */
export const DESCRIPCION_TIPO: Record<(typeof TIPOS_FACTURA)[number], string> = {
  F1: 'Factura ordinaria',
  F2: 'Factura simplificada',
  F3: 'Factura emitida en sustitución de simplificadas',
  R1: 'Rectificativa por error fundado en derecho',
  R2: 'Rectificativa por modificación de base imponible',
  R3: 'Rectificativa por bonificaciones posteriores',
  R4: 'Rectificativa, resto de supuestos',
  R5: 'Rectificativa en facturas simplificadas',
}

export const CODIGO_REGIMEN: Record<(typeof REGIMENES_IVA)[number], string> = {
  REGIMEN_GENERAL: '01 · Régimen general',
  EXPORTACION: '02 · Exportación',
  BIENES_USADOS: '03 · Bienes usados, objetos de arte y antigüedades',
  ORO_INVERSION: '04 · Oro de inversión',
  AGENCIAS_VIAJES: '05 · Agencias de viajes',
  GRUPO_ENTIDADES: '06 · Grupo de entidades',
  CRITERIO_CAJA: '07 · Criterio de caja',
  SIMPLIFICADO: '08 · Recargo de equivalencia',
}
