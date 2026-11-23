import { api, resultado } from '../../api/cliente.ts'
import type { components } from '../../api/schema.d.ts'
import type { EstadoEnvio } from '../../dominio/estadoEnvio.ts'
import { ESTADOS_ENVIO } from '../../dominio/estadoEnvio.ts'

/** Tamaños de página que ofrece la pantalla (el contrato admite de 1 a 100). */
export const TAMANOS_PAGINA = [10, 20, 50, 100] as const
export const TAMANO_POR_DEFECTO = 20

/**
 * Estado del listado: filtros, página (desde 0, como la API) y tamaño. Es lo que viaja en la URL
 * y lo que se envía a `GET /api/v1/facturas`; los filtros ausentes no se envían.
 */
export interface ParametrosListado {
  serie?: string
  numero?: string
  nifCliente?: string
  fechaDesde?: string
  fechaHasta?: string
  estadoEnvio?: EstadoEnvio
  page: number
  size: number
}

type FiltroTexto = 'serie' | 'numero' | 'nifCliente'
const FILTROS_TEXTO: readonly FiltroTexto[] = ['serie', 'numero', 'nifCliente']

/** `AAAA-MM-DD` que además existe en el calendario (rechaza 2026-02-30). */
function esFechaIso(valor: string): boolean {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!partes) return false
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])]
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}

/**
 * Lee la query de la URL descartando todo valor que la API rechazaría o que el usuario no puede elegir:
 * es la única barrera antes de la petición. Los textos se recortan y los vacíos no cuentan.
 */
export function leerParametros(query: URLSearchParams): ParametrosListado {
  const parametros: ParametrosListado = { page: 0, size: TAMANO_POR_DEFECTO }

  for (const clave of FILTROS_TEXTO) {
    const valor = query.get(clave)?.trim()
    if (valor) parametros[clave] = valor
  }
  for (const clave of ['fechaDesde', 'fechaHasta'] as const) {
    const valor = query.get(clave)?.trim()
    if (valor && esFechaIso(valor)) parametros[clave] = valor
  }
  const estado = query.get('estadoEnvio')
  if (estado && (ESTADOS_ENVIO as readonly string[]).includes(estado)) parametros.estadoEnvio = estado as EstadoEnvio

  const pagina = query.get('page')
  if (pagina && /^\d+$/.test(pagina) && Number.isSafeInteger(Number(pagina))) parametros.page = Number(pagina)
  const tamano = Number(query.get('size'))
  if ((TAMANOS_PAGINA as readonly number[]).includes(tamano)) parametros.size = tamano

  return parametros
}

/** Escribe la query de la URL: solo lo que difiere del valor por defecto, siempre en el mismo orden. */
export function aQuery(parametros: ParametrosListado): URLSearchParams {
  const query = new URLSearchParams()
  for (const clave of [...FILTROS_TEXTO, 'fechaDesde', 'fechaHasta', 'estadoEnvio'] as const) {
    const valor = parametros[clave]
    if (valor) query.set(clave, valor)
  }
  if (parametros.page > 0) query.set('page', String(parametros.page))
  if (parametros.size !== TAMANO_POR_DEFECTO) query.set('size', String(parametros.size))
  return query
}

export type PaginaFacturas = components['schemas']['PaginaFacturasDto']
export type ResumenFactura = components['schemas']['FacturaResumenDto']

/** Pide una página del listado (`GET /api/v1/facturas`). Los parámetros ausentes no se envían. */
export function listarFacturas(parametros: ParametrosListado): Promise<PaginaFacturas> {
  return resultado(() => api.GET('/api/v1/facturas', { params: { query: parametros } })) as Promise<PaginaFacturas>
}
