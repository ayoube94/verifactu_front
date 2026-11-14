import { presentarEstado, type EstadoEnvio } from '../../dominio/estadoEnvio.ts'
import { formatearFecha, formatearImporte } from '../../utilidades/formato.ts'
import { SumaYSigue } from './SumaYSigue.tsx'
import type { FacturaEmitida } from './emision.ts'
import estilos from './RegistroEmitido.module.css'

interface Propiedades {
  factura: FacturaEmitida
}

/** Imagen del QR: el backend lo devuelve en base64, con o sin el prefijo data:. */
const srcQr = (qr: string) => (qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`)

/**
 * Resultado de una emisión: estado ante la AEAT en palabras, datos del registro y encadenamiento.
 * Se reutiliza en la fase 3 (/facturas/:id).
 */
export function RegistroEmitido({ factura }: Propiedades) {
  const v = factura.verifactu
  const estado = presentarEstado(v?.estadoEnvio as EstadoEnvio)
  const incidencia = estado.tono === 'incidencia' || estado.tono === 'aviso'
  const rechazada = v?.estadoEnvio === 'RECHAZADO'

  return (
    <article className={estilos.registro} aria-labelledby="titulo-registro">
      <header className={estilos.cabecera}>
        <h2 id="titulo-registro" className={estilos.numero}>
          Factura {factura.numSerieFactura}
        </h2>
        <p className={estilos.estado} data-tono={estado.tono} role={incidencia ? 'alert' : undefined}>
          {estado.texto}
        </p>
      </header>

      {v?.codigoRespuestaAeat || v?.mensajeAeat ? (
        <p className={estilos.respuestaAeat}>
          {v.codigoRespuestaAeat && <span className={estilos.codigo}>{v.codigoRespuestaAeat}</span>}
          {v.mensajeAeat && <span>{v.mensajeAeat}</span>}
        </p>
      ) : null}

      {rechazada && (
        <p className={estilos.aviso}>
          El registro ya está encadenado: no se puede volver a emitir con la misma serie y número.
        </p>
      )}

      <dl className={estilos.datos}>
        <div>
          <dt>Fecha de expedición</dt>
          <dd>{formatearFecha(factura.fechaExpedicion)}</dd>
        </div>
        <div>
          <dt>Destinatario</dt>
          <dd>{factura.cliente ? `${factura.cliente.nombreRazonSocial} · ${factura.cliente.nif}` : 'Simplificada, sin destinatario'}</dd>
        </div>
        <div>
          <dt>Base imponible</dt>
          <dd>{formatearImporte(factura.baseImponibleTotal)}</dd>
        </div>
        <div>
          <dt>Cuota de IVA</dt>
          <dd>{formatearImporte(factura.cuotaTotal)}</dd>
        </div>
        <div className={estilos.total}>
          <dt>Importe total</dt>
          <dd>{formatearImporte(factura.importeTotal)}</dd>
        </div>
        {v?.csvAeat && (
          <div>
            <dt>CSV</dt>
            <dd className={estilos.csv}>{v.csvAeat}</dd>
          </div>
        )}
      </dl>

      {v && <SumaYSigue huellaAnterior={v.huellaAnterior} huella={v.huella ?? ''} />}

      {v?.qrBase64 && (
        <figure className={estilos.qr}>
          <img src={srcQr(v.qrBase64)} alt={`Código QR de cotejo de la factura ${factura.numSerieFactura} en la AEAT`} width={160} height={160} />
        </figure>
      )}
    </article>
  )
}
