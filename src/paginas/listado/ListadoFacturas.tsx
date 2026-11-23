import { useTituloPagina } from '../../app/useTituloPagina.ts'
import estilos from '../Pagina.module.css'

/** Listado paginado de facturas (`/facturas`). */
export function ListadoFacturas() {
  useTituloPagina('Facturas')

  return (
    <section className={estilos.pagina}>
      <h1 className={estilos.titulo}>Facturas</h1>
    </section>
  )
}
