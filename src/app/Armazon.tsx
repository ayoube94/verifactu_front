import { NavLink, Outlet } from 'react-router'
import { EstadoServicio } from '../componentes/EstadoServicio.tsx'
import estilos from './Armazon.module.css'
import { secciones } from './secciones.ts'
import { NOMBRE_PRODUCTO } from './useTituloPagina.ts'

/** Armazón común de todas las pantallas: saltar al contenido, cabecera con navegación y contenido principal. */
export function Armazon() {
  return (
    <>
      <a className={estilos.saltar} href="#contenido">
        Saltar al contenido
      </a>
      <header className={estilos.cabecera}>
        <div className={estilos.barra}>
          <NavLink to="/" className={estilos.marca}>
            {NOMBRE_PRODUCTO}
          </NavLink>
          <nav aria-label="Principal" className={estilos.navegacion}>
            <ul>
              {secciones.map((seccion) => (
                <li key={seccion.ruta}>
                  <NavLink to={seccion.ruta} end className={estilos.enlace}>
                    {seccion.etiqueta}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={estilos.salud}>
            <EstadoServicio />
          </div>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className={estilos.contenido}>
        <Outlet />
      </main>
    </>
  )
}
