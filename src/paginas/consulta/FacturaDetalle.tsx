import { Link, useParams } from 'react-router'
import { ErrorApi } from '../../api/problemas.ts'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { MensajeError } from '../../componentes/MensajeError.tsx'
import { CODIGO_REGIMEN, DESCRIPCION_TIPO } from '../emitir/etiquetas.ts'
import { RegistroEmitido } from '../emitir/RegistroEmitido.tsx'
import { formatearFecha, formatearImporte } from '../../utilidades/formato.ts'
import estilos from '../Pagina.module.css'
import { useFactura } from './useFactura.ts'
import vista from './FacturaDetalle.module.css'

/** Vista de una factura emitida (`/facturas/:id`): datos, líneas, bloque VeriFactu y XML. */
export function FacturaDetalle() {
  const { id: idTexto = '' } = useParams()
  const id = Number(idTexto)
  const idValido = /^\d+$/.test(idTexto) && Number.isSafeInteger(id) && id > 0

  if (!idValido) {
    return <NoEncontrada id={idTexto} />
  }
  return <FacturaCargada id={id} />
}

function FacturaCargada({ id }: { id: number }) {
  const consulta = useFactura(id)
  const titulo = consulta.data ? `Factura ${consulta.data.serie}/${consulta.data.numero}` : 'Factura'
  useTituloPagina(titulo)

  if (consulta.isPending) {
    return (
      <section className={estilos.pagina} aria-busy="true">
        <h1 className={estilos.titulo}>Factura</h1>
        <p className={estilos.entrada}>Cargando la factura…</p>
      </section>
    )
  }

  if (consulta.isError) {
    const error = consulta.error
    if (error instanceof ErrorApi && error.detalle.tipo === 'no-encontrado') {
      return <NoEncontrada id={String(id)} />
    }
    return (
      <section className={estilos.pagina}>
        <MensajeError error={error} onReintentar={() => void consulta.refetch()} />
      </section>
    )
  }

  const factura = consulta.data
  return (
    <section className={[estilos.pagina, vista.factura].join(' ')}>
      <h1 className={estilos.titulo}>{titulo}</h1>

      <dl className={vista.datos}>
        <div>
          <dt>Tipo</dt>
          <dd>{DESCRIPCION_TIPO[factura.tipoFactura as keyof typeof DESCRIPCION_TIPO] ?? factura.tipoFactura}</dd>
        </div>
        <div>
          <dt>Régimen de IVA</dt>
          <dd>{CODIGO_REGIMEN[factura.regimenIva as keyof typeof CODIGO_REGIMEN] ?? factura.regimenIva}</dd>
        </div>
        <div>
          <dt>Fecha de operación</dt>
          <dd>{formatearFecha(factura.fechaOperacion)}</dd>
        </div>
        <div>
          <dt>Descripción de la operación</dt>
          <dd>{factura.descripcionOperacion}</dd>
        </div>
      </dl>

      <div className={vista.tablaScroll}>
        <table className={vista.lineas}>
          <caption className={vista.oculta}>Líneas de la factura</caption>
          <thead>
            <tr>
              <th scope="col" className={vista.numero}>
                Nº
              </th>
              <th scope="col">Descripción</th>
              <th scope="col" className={vista.numero}>
                Cantidad
              </th>
              <th scope="col" className={vista.numero}>
                Precio unitario
              </th>
              <th scope="col" className={vista.numero}>
                Descuento (€)
              </th>
              <th scope="col" className={vista.numero}>
                IVA
              </th>
            </tr>
          </thead>
          <tbody>
            {(factura.lineas ?? []).map((linea) => (
              <tr key={linea.posicion}>
                <td className={vista.numero} data-etiqueta="Nº">
                  {linea.posicion}
                </td>
                <td data-etiqueta="Descripción">{linea.descripcion}</td>
                <td className={vista.numero} data-etiqueta="Cantidad">
                  {linea.cantidad.toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                </td>
                <td className={vista.numero} data-etiqueta="Precio unitario">
                  {formatearImporte(linea.precioUnitario)}
                </td>
                <td className={vista.numero} data-etiqueta="Descuento (€)">
                  {formatearImporte(linea.descuento)}
                </td>
                <td className={vista.numero} data-etiqueta="IVA">
                  {linea.tipoIva.toLocaleString('es-ES', { maximumFractionDigits: 2 })} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RegistroEmitido factura={factura} sinNumero />

      <div className={vista.acciones}>
        <a href={`/api/v1/facturas/${factura.id}/xml`} download>
          Descargar XML
        </a>
        <Link to="/consultar">Consultar otra factura</Link>
      </div>
    </section>
  )
}

function NoEncontrada({ id }: { id: string }) {
  useTituloPagina('Factura no encontrada')
  return (
    <section className={[estilos.pagina, vista.noEncontrada].join(' ')}>
      <h1 className={estilos.titulo}>Factura no encontrada</h1>
      <p>No existe ninguna factura con el id {id}.</p>
      <Link to="/consultar">Consultar otra factura</Link>
    </section>
  )
}
