import { Link } from 'react-router'
import { Boton } from '../../componentes/Boton.tsx'
import estilos from './EstadoVacio.module.css'

export type TipoVacio = 'sin-facturas' | 'sin-resultados' | 'fuera-de-rango'

interface Propiedades {
  tipo: TipoVacio
  onQuitarFiltros: () => void
  onPrimeraPagina: () => void
}

/** Distingue tres vacíos que piden acciones distintas: no hay facturas, ningún resultado o página inexistente. */
export function EstadoVacio({ tipo, onQuitarFiltros, onPrimeraPagina }: Propiedades) {
  switch (tipo) {
    case 'sin-facturas':
      return (
        <div className={estilos.vacio}>
          <p className={estilos.titulo}>Todavía no hay facturas</p>
          <p className={estilos.texto}>Las facturas aparecerán aquí en cuanto emitas la primera.</p>
          <Link to="/facturas/nueva">Emitir factura</Link>
        </div>
      )
    case 'sin-resultados':
      return (
        <div className={estilos.vacio}>
          <p className={estilos.titulo}>Ninguna factura cumple los filtros</p>
          <p className={estilos.texto}>Prueba con otros valores o quita los filtros para ver todas las facturas.</p>
          <div>
            <Boton onClick={onQuitarFiltros}>Quitar filtros</Boton>
          </div>
        </div>
      )
    case 'fuera-de-rango':
      return (
        <div className={estilos.vacio}>
          <p className={estilos.titulo}>Esta página no existe</p>
          <p className={estilos.texto}>Hay menos páginas de las que pide esta dirección.</p>
          <div>
            <Boton onClick={onPrimeraPagina}>Volver a la primera página</Boton>
          </div>
        </div>
      )
  }
}
