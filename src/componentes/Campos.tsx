import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes } from 'react'
import estilos from './Campos.module.css'

interface PropiedadesBase {
  id: string
  etiqueta: string
  /** Texto de ayuda visible bajo la etiqueta (p. ej. «Importe en euros, no porcentaje»). */
  ayuda?: string
  /** Mensaje de error del campo; se anuncia y se asocia al control. */
  error?: string
  /** Oculta la etiqueta visualmente pero la mantiene para tecnologías de apoyo (tabla de líneas en escritorio). */
  etiquetaOculta?: boolean
  className?: string
}

interface PropiedadesTexto extends PropiedadesBase, Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  ref?: Ref<HTMLInputElement>
}

/** Campo de texto o numérico con etiqueta, ayuda y error asociados. Compatible con `register` de React Hook Form. */
export function CampoTexto({ id, etiqueta, ayuda, error, etiquetaOculta, className, ref, ...resto }: PropiedadesTexto) {
  const ayudaId = ayuda ? `${id}-ayuda` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [ayudaId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={etiquetaOculta ? estilos.oculta : estilos.etiqueta}>
        {etiqueta}
      </label>
      {ayuda && (
        <span id={ayudaId} className={estilos.ayuda} data-ayuda="">
          {ayuda}
        </span>
      )}
      <input
        {...resto}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[estilos.control, error ? estilos.conError : ''].join(' ')}
      />
      {error && <ErrorCampo id={errorId!}>{error}</ErrorCampo>}
    </div>
  )
}

interface PropiedadesSelect extends PropiedadesBase, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  ref?: Ref<HTMLSelectElement>
  children: ReactNode
}

/** Selector con etiqueta, ayuda y error asociados. Compatible con `register`. */
export function CampoSelect({ id, etiqueta, ayuda, error, etiquetaOculta, className, ref, children, ...resto }: PropiedadesSelect) {
  const ayudaId = ayuda ? `${id}-ayuda` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [ayudaId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={etiquetaOculta ? estilos.oculta : estilos.etiqueta}>
        {etiqueta}
      </label>
      {ayuda && (
        <span id={ayudaId} className={estilos.ayuda} data-ayuda="">
          {ayuda}
        </span>
      )}
      <select
        {...resto}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[estilos.control, error ? estilos.conError : ''].join(' ')}
      >
        {children}
      </select>
      {error && <ErrorCampo id={errorId!}>{error}</ErrorCampo>}
    </div>
  )
}

function ErrorCampo({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={estilos.error}>
      {children}
    </span>
  )
}
