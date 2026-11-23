/** Filtros del listado tal como se escriben en el formulario (todo texto; vacío = sin filtro). */
export interface ValoresFiltros {
  serie: string
  numero: string
  nifCliente: string
  fechaDesde: string
  fechaHasta: string
  estadoEnvio: string
}

export const FILTROS_VACIOS: ValoresFiltros = { serie: '', numero: '', nifCliente: '', fechaDesde: '', fechaHasta: '', estadoEnvio: '' }

export type CampoFiltro = keyof ValoresFiltros
export const CAMPOS_FILTRO = Object.keys(FILTROS_VACIOS) as CampoFiltro[]
