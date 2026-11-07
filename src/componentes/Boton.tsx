import type { ButtonHTMLAttributes } from 'react'
import estilos from './Boton.module.css'

interface PropiedadesBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `principal` lleva la tinta (una por pantalla); `secundario` es contorno. */
  variante?: 'principal' | 'secundario'
  /** Deshabilita el botón y lo anuncia como ocupado mientras dura una operación. */
  ocupado?: boolean
}

export function Boton({
  variante = 'secundario',
  ocupado = false,
  disabled,
  className,
  type = 'button',
  children,
  ...resto
}: PropiedadesBoton) {
  return (
    <button
      {...resto}
      type={type}
      disabled={disabled || ocupado}
      aria-busy={ocupado || undefined}
      className={[estilos.boton, estilos[variante], className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}
