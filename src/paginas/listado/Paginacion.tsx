import { Boton } from '../../componentes/Boton.tsx'
import { CampoSelect } from '../../componentes/Campos.tsx'
import { TAMANOS_PAGINA } from './listado.ts'
import estilos from './Paginacion.module.css'

interface Propiedades {
  /** Página actual, desde 0 (como la API). */
  pagina: number
  totalPaginas: number
  totalFacturas: number
  tamano: number
  onPagina: (pagina: number) => void
  onTamano: (tamano: number) => void
}

/** Total, página actual y tamaño de página. Anterior y Siguiente solo existen si hay más de una página. */
export function Paginacion({ pagina, totalPaginas, totalFacturas, tamano, onPagina, onTamano }: Propiedades) {
  return (
    <nav className={estilos.paginacion} aria-label="Paginación del listado">
      <p className={estilos.total}>{totalFacturas === 1 ? '1 factura' : `${totalFacturas} facturas`}</p>

      {totalPaginas > 1 && (
        <div className={estilos.paginas}>
          <Boton onClick={() => onPagina(pagina - 1)} disabled={pagina <= 0}>
            Anterior
          </Boton>
          <p className={estilos.actual}>
            Página {pagina + 1} de {totalPaginas}
          </p>
          <Boton onClick={() => onPagina(pagina + 1)} disabled={pagina >= totalPaginas - 1}>
            Siguiente
          </Boton>
        </div>
      )}

      <CampoSelect id="tamano-pagina" etiqueta="Facturas por página" className={estilos.tamano} value={tamano} onChange={(evento) => onTamano(Number(evento.target.value))}>
        {TAMANOS_PAGINA.map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </CampoSelect>
    </nav>
  )
}
