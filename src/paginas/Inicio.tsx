import { useSalud } from '../api/salud.ts'
import { Boton } from '../componentes/Boton.tsx'
import { useTituloPagina } from '../app/useTituloPagina.ts'
import estilos from './Inicio.module.css'

/** Operaciones del frontal y la fase en que llegan (notes/plan-por-fases.md). Sin enlaces hasta que existan. */
const operaciones = [
  {
    nombre: 'Emitir factura',
    descripcion: 'Registrar una factura, encadenarla con su huella y remitirla a la AEAT.',
    disponible: 'Próxima fase',
  },
  {
    nombre: 'Consultar factura',
    descripcion: 'Ver sus líneas, el estado ante la AEAT, el QR y descargar el XML enviado.',
    disponible: 'Próxima fase',
  },
  {
    nombre: 'Verificar huella',
    descripcion: 'Comprobar que un registro no se ha alterado recalculando su huella.',
    disponible: 'Próxima fase',
  },
] as const

export function Inicio() {
  useTituloPagina('Inicio')

  return (
    <div className={estilos.inicio}>
      <section className={estilos.principal} aria-labelledby="titulo-inicio">
        <h1 id="titulo-inicio" className={estilos.titulo}>
          Facturación VeriFactu
        </h1>
        <p className={estilos.entrada}>
          Zefact registra cada factura, la encadena con la huella de la anterior y la remite a la AEAT. Desde aquí
          emitirás, consultarás y verificarás esos registros.
        </p>

        <h2 className={estilos.subtitulo}>Operaciones</h2>
        <ul className={estilos.operaciones}>
          {operaciones.map((operacion) => (
            <li key={operacion.nombre} className={estilos.operacion}>
              <span className={estilos.nombre}>{operacion.nombre}</span>
              <span className={estilos.descripcion}>{operacion.descripcion}</span>
              <span className={estilos.disponible}>{operacion.disponible}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className={estilos.lateral} aria-labelledby="titulo-servicio">
        <h2 id="titulo-servicio" className={estilos.subtitulo}>
          Servicio
        </h2>
        <DetalleServicio />
      </aside>
    </div>
  )
}

function DetalleServicio() {
  const { data: operativo, isPending, isFetching, refetch } = useSalud()

  if (isPending) {
    return <p className={estilos.pendiente}>Comprobando el servicio…</p>
  }
  if (operativo) {
    return (
      <div className={estilos.detalle}>
        <p className={estilos.estado} data-estado="operativo">
          Operativo
        </p>
        <p className={estilos.nota}>El backend responde y acepta peticiones.</p>
      </div>
    )
  }
  return (
    <div className={estilos.detalle}>
      <p className={estilos.estado} data-estado="no-disponible">
        No disponible
      </p>
      <p className={estilos.nota}>
        El backend no responde. No se pueden emitir ni consultar facturas hasta que vuelva a estar operativo.
      </p>
      <div>
        <Boton onClick={() => void refetch()} ocupado={isFetching}>
          {isFetching ? 'Comprobando…' : 'Comprobar de nuevo'}
        </Boton>
      </div>
    </div>
  )
}
