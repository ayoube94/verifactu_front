import { useRef } from 'react'
import { useSearchParams } from 'react-router'
import { normalizarError } from '../../api/problemas.ts'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { MensajeError } from '../../componentes/MensajeError.tsx'
import estilos from '../Pagina.module.css'
import { FiltrosListado } from './FiltrosListado.tsx'
import { CAMPOS_FILTRO, FILTROS_VACIOS, type CampoFiltro, type ValoresFiltros } from './valoresFiltros.ts'
import { aQuery, leerParametros, type ParametrosListado } from './listado.ts'
import formato from './ListadoFacturas.module.css'
import { EstadoVacio, type TipoVacio } from './EstadoVacio.tsx'
import { Paginacion } from './Paginacion.tsx'
import { TablaFacturas } from './TablaFacturas.tsx'
import { useListadoFacturas } from './useListadoFacturas.ts'
import { volverAlInicioDeLaTabla } from './volverAlInicio.ts'

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
  const inicioTabla = useRef<HTMLOutputElement>(null)

  // Un filtro nuevo vuelve a la primera página y conserva el tamaño elegido. `leerParametros` recorta y descarta lo no válido.
  const aplicar = (valores: ValoresFiltros) => {
    const siguientes = leerParametros(new URLSearchParams({ ...valores, size: String(parametros.size) }))
    setQuery(aQuery(siguientes))
  }
  const quitar = () => setQuery(aQuery({ page: 0, size: parametros.size }))

  const cambiarPagina = (pagina: number) => setQuery(aQuery({ ...parametros, page: pagina }))
  // Cambiar el tamaño vuelve a la primera página: la actual dejaría de corresponder a lo que se ve
  const cambiarTamano = (tamano: number) => setQuery(aQuery({ ...parametros, page: 0, size: tamano }))
  // Los controles están bajo la tabla: al usarlos la vista vuelve al inicio de la tabla. Filtrar o «volver a la primera página» no lo hacen.
  const paginarDesdeControles = (pagina: number) => {
    cambiarPagina(pagina)
    volverAlInicioDeLaTabla(inicioTabla.current)
  }
  const cambiarTamanoDesdeControles = (tamano: number) => {
    cambiarTamano(tamano)
    volverAlInicioDeLaTabla(inicioTabla.current)
  }

  const validacion = consulta.error ? repartirValidacion(consulta.error) : undefined
  const pagina = consulta.data
  const facturas = pagina?.content ?? []
  const hayFiltros = Object.values(filtros).some(Boolean)
  const vacio: TipoVacio | undefined =
    !pagina || facturas.length > 0 ? undefined : (pagina.totalElements ?? 0) > 0 ? 'fuera-de-rango' : hayFiltros ? 'sin-resultados' : 'sin-facturas'

  return (
    <section className={`${estilos.pagina} ${formato.pagina}`}>
      <h1 className={estilos.titulo}>Facturas</h1>
      <FiltrosListado key={JSON.stringify(filtros)} inicial={filtros} errores={validacion?.campos} onAplicar={aplicar} onQuitar={quitar} ocultarQuitar={vacio === 'sin-resultados'} />
      {validacion?.generales.length ? (
        <div role="alert" className={formato.errorGeneral}>
          {validacion.generales.map((mensaje) => (
            <p key={mensaje}>{mensaje}</p>
          ))}
        </div>
      ) : null}
      {/* Región en vivo siempre presente: anuncia la carga y se vacía al terminar (también al cambiar de página) */}
      <output ref={inicioTabla} className={formato.estado}>{consulta.isFetching ? 'Cargando facturas…' : ''}</output>
      {facturas.length > 0 && <TablaFacturas facturas={facturas} />}
      {vacio && <EstadoVacio tipo={vacio} onQuitarFiltros={quitar} onPrimeraPagina={() => cambiarPagina(0)} />}
      {pagina && facturas.length > 0 && (
        <Paginacion
          pagina={pagina.page ?? parametros.page}
          totalPaginas={pagina.totalPages ?? 1}
          totalFacturas={pagina.totalElements ?? facturas.length}
          tamano={parametros.size}
          onPagina={paginarDesdeControles}
          onTamano={cambiarTamanoDesdeControles}
        />
      )}
      {consulta.error && !validacion && <MensajeError error={consulta.error} onReintentar={() => void consulta.refetch()} />}
    </section>
  )
}
