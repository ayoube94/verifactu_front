import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router'
import { ErrorApi } from '../../api/problemas.ts'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { MensajeError } from '../../componentes/MensajeError.tsx'
import estilos from '../Pagina.module.css'
import { aPeticion, type ValoresValidados } from './esquema.ts'
import { emitirFactura, type FacturaEmitida } from './emision.ts'
import { FormularioEmision } from './FormularioEmision.tsx'
import formulario from './EmitirFactura.module.css'

/** Pantalla de emisión de factura (`/facturas/nueva`). */
export function EmitirFactura() {
  useTituloPagina('Emitir factura')
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaEmitida | null>(null)

  // Una sola petición: la mutación no se reintenta (ver consultas.ts) y el formulario ignora envíos mientras espera
  const emision = useMutation({
    mutationFn: (valores: ValoresValidados) => emitirFactura(aPeticion(valores)),
    onSuccess: (factura) => setFacturaEmitida(factura),
  })
  const enviando = emision.isPending
  const error = emision.error instanceof ErrorApi ? emision.error : null

  // Salir de la página mientras la AEAT responde puede dejar la factura sin resultado visible: se pide confirmación
  const bloqueo = useBlocker(({ currentLocation, nextLocation }) => enviando && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (bloqueo.state !== 'blocked') return
    if (window.confirm('La factura se está enviando a la AEAT. ¿Salir igualmente? Antes de salir, comprueba si se emitió.')) bloqueo.proceed()
    else bloqueo.reset()
  }, [bloqueo])

  const verFormulario = () => {
    setFacturaEmitida(null)
    emision.reset()
  }

  // El 409 y los 400 de campo se muestran junto a sus campos; el resto va en el mensaje general de la página
  const mostrarGeneral = error !== null && error.detalle.tipo !== 'conflicto' && !(error.detalle.tipo === 'validacion' && Object.keys(error.detalle.campos).length > 0)

  return (
    <section className={estilos.pagina} aria-labelledby="titulo-emitir">
      <h1 id="titulo-emitir" className={estilos.titulo}>
        Emitir factura
      </h1>

      {mostrarGeneral && error?.detalle.tipo === 'red' && (
        <div role="alert" className={formulario.avisoEmision}>
          No se sabe si la factura se emitió: compruébalo antes de volver a emitirla.
        </div>
      )}
      {mostrarGeneral && error?.detalle.tipo !== 'red' && <MensajeError error={error} ocultarCampos sinAccion />}

      <output className={formulario.estadoEspera} aria-live="polite">
        {enviando ? 'Esperando la respuesta de la AEAT…' : ''}
      </output>

      {facturaEmitida ? (
        <div className={formulario.resultado}>
          <p>Factura registrada.</p>
          <button type="button" onClick={verFormulario}>
            Emitir otra factura
          </button>
        </div>
      ) : (
        <FormularioEmision onEnviar={(valores) => emision.mutate(valores)} enviando={enviando} errorServidor={error} />
      )}
    </section>
  )
}
