import { useSalud } from '../api/salud.ts'
import estilos from './EstadoServicio.module.css'

/** Indicador del estado del backend. Informa con texto (no solo con color) y nunca bloquea la interfaz. */
export function EstadoServicio() {
  const { data: operativo, isPending } = useSalud()
  const estado = isPending ? 'comprobando' : operativo ? 'operativo' : 'no-disponible'

  return (
    <output className={estilos.estado} data-estado={estado}>
      <span className={estilos.punto} aria-hidden="true" />
      {estado === 'comprobando' ? (
        <span>Comprobando el servicio…</span>
      ) : (
        <span>
          Servicio <strong className={estilos.valor}>{estado === 'operativo' ? 'operativo' : 'no disponible'}</strong>
        </span>
      )}
    </output>
  )
}
