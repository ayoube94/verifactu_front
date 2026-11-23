import { useSearchParams } from 'react-router'
import { normalizarError } from '../../api/problemas.ts'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { MensajeError } from '../../componentes/MensajeError.tsx'
import estilos from '../Pagina.module.css'
import { CAMPOS_FILTRO, FILTROS_VACIOS, FiltrosListado, type CampoFiltro, type ValoresFiltros } from './FiltrosListado.tsx'
import { aQuery, leerParametros, type ParametrosListado } from './listado.ts'
import formato from './ListadoFacturas.module.css'
import { useListadoFacturas } from './useListadoFacturas.ts'

const filtrosDe = (parametros: ParametrosListado): ValoresFiltros => ({
  ...FILTROS_VACIOS,
  serie: parametros.serie ?? '',
  numero: parametros.numero ?? '',
  nifCliente: parametros.nifCliente ?? '',
  fechaDesde: parametros.fechaDesde ?? '',
  fechaHasta: parametros.fechaHasta ?? '',
  estadoEnvio: parametros.estadoEnvio ?? '',
})

/**
 * Reparte un 400 del backend: los parámetros con filtro visible van junto a su campo y el resto
 * (size, page…) a un mensaje general. La URL ya se sanea, así que solo ocurre si cambia el contrato.
 */
function repartirValidacion(error: unknown) {
  const { detalle } = normalizarError(error)
  if (detalle.tipo !== 'validacion') return undefined
  const campos: Partial<Record<CampoFiltro, string>> = {}
  const generales: string[] = []
  for (const [clave, mensaje] of Object.entries(detalle.campos)) {
    if ((CAMPOS_FILTRO as string[]).includes(clave)) campos[clave as CampoFiltro] = mensaje
    else generales.push(mensaje)
  }
  if (Object.keys(campos).length === 0 && generales.length === 0) generales.push(detalle.mensaje)
  return { campos, generales }
}

/** Listado paginado de facturas (`/facturas`). Filtros, página y tamaño viven en la URL. */
export function ListadoFacturas() {
  useTituloPagina('Facturas')
  const [query, setQuery] = useSearchParams()
  const parametros = leerParametros(query)
  const consulta = useListadoFacturas(parametros)
  const filtros = filtrosDe(parametros)

  // Un filtro nuevo vuelve a la primera página y conserva el tamaño elegido. `leerParametros` recorta y descarta lo no válido.
  const aplicar = (valores: ValoresFiltros) => {
    const siguientes = leerParametros(new URLSearchParams({ ...valores, size: String(parametros.size) }))
    setQuery(aQuery(siguientes))
  }
  const quitar = () => setQuery(aQuery({ page: 0, size: parametros.size }))

  const validacion = consulta.error ? repartirValidacion(consulta.error) : undefined

  return (
    <section className={`${estilos.pagina} ${formato.pagina}`}>
      <h1 className={estilos.titulo}>Facturas</h1>
      <FiltrosListado key={JSON.stringify(filtros)} inicial={filtros} errores={validacion?.campos} onAplicar={aplicar} onQuitar={quitar} />
      {validacion?.generales.length ? (
        <div role="alert" className={formato.errorGeneral}>
          {validacion.generales.map((mensaje) => (
            <p key={mensaje}>{mensaje}</p>
          ))}
        </div>
      ) : null}
      {consulta.error && !validacion && <MensajeError error={consulta.error} onReintentar={() => void consulta.refetch()} />}
    </section>
  )
}
