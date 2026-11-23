import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useBlocker } from 'react-router'
import { ErrorApi } from '../../api/problemas.ts'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { Boton } from '../../componentes/Boton.tsx'
import { MensajeError } from '../../componentes/MensajeError.tsx'
import estilos from '../Pagina.module.css'
import { aPeticion, type ValoresValidados } from './esquema.ts'
import { buscarPorNumero, emitirFactura, obtenerFactura, type FacturaEmitida } from './emision.ts'
import { FormularioEmision } from './FormularioEmision.tsx'
import { RegistroEmitido } from './RegistroEmitido.tsx'
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
  const sinRespuesta = error?.detalle.tipo === 'red' && emision.variables !== undefined

  // Tras un fallo sin respuesta, la emisión pudo llegar a crearse: se busca antes de permitir reintentar (D7)
  const comprobacion = useQuery({
    queryKey: ['por-numero', emision.variables?.serie, emision.variables?.numero],
    queryFn: () => buscarPorNumero(emision.variables!.serie, emision.variables!.numero),
    enabled: sinRespuesta,
    retry: false,
  })
  // Solo cuenta mientras el fallo sin respuesta está activo; al reiniciar, una consulta cacheada no vuelve a aparecer
  // 409 con facturaId: el usuario puede abrir la factura que ya existe con esa serie y número (8.3)
  const facturaDuplicada = error?.detalle.tipo === 'conflicto' ? error.detalle.facturaId : undefined
  const [verExistente, setVerExistente] = useState(false)
  const existente = useQuery({
    queryKey: ['factura', facturaDuplicada],
    queryFn: () => obtenerFactura(facturaDuplicada!),
    enabled: verExistente && facturaDuplicada !== undefined,
    retry: false,
  })

  const emitidaAntes = sinRespuesta && comprobacion.isSuccess ? comprobacion.data : null
  const errorComprobacion = sinRespuesta && comprobacion.error instanceof ErrorApi ? comprobacion.error : null

  // Salir de la página mientras la AEAT responde puede dejar la factura sin resultado visible: se pide confirmación
  const bloqueo = useBlocker(({ currentLocation, nextLocation }) => enviando && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (bloqueo.state !== 'blocked') return
    if (window.confirm('La factura se está enviando a la AEAT. ¿Salir igualmente? Antes de salir, comprueba si se emitió.')) bloqueo.proceed()
    else bloqueo.reset()
  }, [bloqueo])

  const verFormulario = () => {
    setFacturaEmitida(null)
    setVerExistente(false)
    emision.reset()
  }

  // El 409 y los 400 de campo se muestran junto a sus campos; el resto va en el mensaje general de la página
  const mostrarGeneral = error !== null && !sinRespuesta && error.detalle.tipo !== 'conflicto' && !(error.detalle.tipo === 'validacion' && Object.keys(error.detalle.campos).length > 0)

  const existenteCargada = verExistente && existente.isSuccess ? existente.data : null
  const resultado = facturaEmitida ?? emitidaAntes ?? existenteCargada

  return (
    <section className={`${estilos.pagina} ${formulario.paginaAncha}`} aria-labelledby="titulo-emitir">
      <h1 id="titulo-emitir" className={estilos.titulo}>
        Emitir factura
      </h1>

      {mostrarGeneral && error && <MensajeError error={error} ocultarCampos sinAccion />}

      {facturaDuplicada !== undefined && !resultado && (
        <div className={formulario.avisoEmision}>
          <p>Ya existe una factura con esta serie y número.</p>
          {existente.isError && <p>No se ha podido cargar la factura existente.</p>}
          <Boton onClick={() => setVerExistente(true)} disabled={existente.isFetching}>
            Ver la factura existente
          </Boton>
        </div>
      )}

      {sinRespuesta && !resultado && (
        <div role="alert" className={formulario.avisoEmision}>
          <p>No se sabe si la factura se emitió. Comprobándolo…</p>
          {comprobacion.isPending && <p>Buscando la factura por serie y número.</p>}
          {errorComprobacion?.detalle.tipo === 'no-encontrado' && (
            <>
              <p>La factura no llegó a emitirse.</p>
              <Boton variante="principal" onClick={() => emision.mutate(emision.variables!)}>
                Reintentar la emisión
              </Boton>
            </>
          )}
          {comprobacion.isError && errorComprobacion?.detalle.tipo !== 'no-encontrado' && (
            <>
              <p>No se ha podido comprobar. No se reintenta hasta saber si la factura existe.</p>
              <Boton onClick={() => void comprobacion.refetch()}>Comprobar de nuevo</Boton>
            </>
          )}
        </div>
      )}

      <output className={formulario.estadoEspera} aria-live="polite">
        {enviando ? 'Esperando la respuesta de la AEAT…' : ''}
      </output>

      {resultado ? (
        <div className={formulario.resultado}>
          {emitidaAntes && <p className={formulario.avisoEmision}>Esta factura ya se había emitido.</p>}
          <RegistroEmitido factura={resultado} />
          <div className={formulario.accionesResultado}>
            <button type="button" onClick={verFormulario}>
              Emitir otra factura
            </button>
            <Link to="/facturas">Ver todas las facturas</Link>
          </div>
        </div>
      ) : (
        <FormularioEmision onEnviar={(valores) => emision.mutate(valores)} enviando={enviando} errorServidor={error} />
      )}
    </section>
  )
}
