import type { ReactNode } from 'react'
import { normalizarError } from '../api/problemas.ts'
import { Boton } from './Boton.tsx'
import estilos from './MensajeError.module.css'

interface PropiedadesMensajeError {
  /** Cualquier error lanzado por una llamada a la API (se normaliza aquí). */
  error: unknown
  /** Acción de reintento; sin ella, los errores de red y de servidor ofrecen recargar la página. */
  onReintentar?: () => void
  /** Texto para el 404 cuando el backend no da uno (p. ej. «No existe ninguna factura con el id 42.»). */
  mensajeNoEncontrado?: string
  /** El formulario ya muestra los errores junto a cada campo: no repetirlos aquí. */
  ocultarCampos?: boolean
  /** Sin botón de reintento ni de recarga (p. ej. una emisión que no debe repetirse sola). */
  sinAccion?: boolean
}

const recargar = () => window.location.reload()

/** Presenta de forma uniforme cualquier error de la API (spec cliente-api). */
export function MensajeError({ error, onReintentar, mensajeNoEncontrado, ocultarCampos = false, sinAccion = false }: PropiedadesMensajeError) {
  const { detalle } = normalizarError(error)
  const reintentar = onReintentar ?? recargar
  const textoReintentar = onReintentar ? 'Reintentar' : 'Recargar la página'

  switch (detalle.tipo) {
    case 'validacion': {
      const campos = Object.entries(detalle.campos)
      return (
        <Aviso titulo="Revisa los datos">
          <p>{detalle.mensaje}</p>
          {!ocultarCampos && campos.length > 0 && (
            <ul className={estilos.campos}>
              {campos.map(([campo, mensaje]) => (
                <li key={campo}>{mensaje}</li>
              ))}
            </ul>
          )}
        </Aviso>
      )
    }
    case 'conflicto':
      return (
        <Aviso titulo="No se puede completar la operación">
          <p>{detalle.mensaje}</p>
        </Aviso>
      )
    case 'no-encontrado':
      return (
        <Aviso titulo="No encontrado">
          <p>{detalle.mensaje ?? mensajeNoEncontrado ?? 'Lo que buscas no existe.'}</p>
        </Aviso>
      )
    case 'no-autorizado':
      return (
        <Aviso titulo="Acceso no autorizado" accion={<Boton onClick={recargar}>Recargar la página</Boton>}>
          <p>Tu acceso ha caducado o no está autorizado. Recarga la página para volver a identificarte.</p>
        </Aviso>
      )
    case 'servidor':
      return (
        <Aviso titulo="Error del servidor" accion={sinAccion ? undefined : <Boton onClick={reintentar}>{textoReintentar}</Boton>}>
          <p>Se ha producido un error inesperado en el servidor y la operación no se ha completado.</p>
          {detalle.errorId && (
            <p>
              Si se repite, comunica este identificador: <code className={estilos.codigo}>{detalle.errorId}</code>
            </p>
          )}
        </Aviso>
      )
    case 'red':
      return (
        <Aviso titulo="Sin conexión con el servicio" accion={sinAccion ? undefined : <Boton onClick={reintentar}>{textoReintentar}</Boton>}>
          <p>No se ha podido contactar con Zefact. Comprueba tu conexión e inténtalo de nuevo.</p>
        </Aviso>
      )
  }
}

function Aviso({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <div role="alert" className={estilos.aviso}>
      <p className={estilos.titulo}>{titulo}</p>
      <div className={estilos.cuerpo}>{children}</div>
      {accion && <div className={estilos.accion}>{accion}</div>}
    </div>
  )
}
