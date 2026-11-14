import { Link, useLocation } from 'react-router'
import { useTituloPagina } from '../app/useTituloPagina.ts'
import estilos from './Pagina.module.css'

export function NoEncontrado() {
  useTituloPagina('Página no encontrada')
  const { pathname } = useLocation()
  return (
    <section className={estilos.pagina} aria-labelledby="titulo-no-encontrado">
      <h1 id="titulo-no-encontrado" className={estilos.titulo}>
        Página no encontrada
      </h1>
      <p className={estilos.entrada}>
        No hay ninguna pantalla en <code>{pathname}</code>. Puede que el enlace esté mal escrito o que la sección todavía
        no exista.
      </p>
      <p>
        <Link to="/">Volver a inicio</Link>
      </p>
    </section>
  )
}
