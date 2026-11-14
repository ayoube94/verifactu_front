import estilos from './SumaYSigue.module.css'

interface Propiedades {
  /** Huella del registro anterior de la cadena; vacía si este es el primero. */
  huellaAnterior: string | null | undefined
  /** Huella de este registro. */
  huella: string
}

/** Agrupa la huella en bloques de 4 solo visualmente: el texto copiable es la huella completa. */
function Huella({ valor }: { valor: string }) {
  const grupos = valor.match(/.{1,4}/g) ?? []
  return (
    <code className={estilos.huella}>
      {grupos.map((g, i) => (
        <span key={`${i}-${g}`} className={estilos.grupo}>
          {g}
        </span>
      ))}
    </code>
  )
}

/** «Suma y sigue»: la huella anterior arrastrada antes de la huella del registro. Gesto propio del mundo Libro registro. */
export function SumaYSigue({ huellaAnterior, huella }: Propiedades) {
  const primera = !huellaAnterior
  return (
    <div className={estilos.cadena} aria-label="Encadenamiento del registro">
      <div className={estilos.anterior}>
        <span className={estilos.etiqueta}>{primera ? 'Suma y sigue' : 'Suma y sigue · huella anterior'}</span>
        {primera ? <p className={estilos.primera}>Primer registro de la cadena</p> : <Huella valor={huellaAnterior} />}
      </div>
      <div className={estilos.propia}>
        <span className={estilos.etiquetaPropia}>Huella de este registro</span>
        <Huella valor={huella} />
      </div>
    </div>
  )
}
