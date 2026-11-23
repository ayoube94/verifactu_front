import { Link } from 'react-router'
import { presentarEstado, type EstadoEnvio } from '../../dominio/estadoEnvio.ts'
import { formatearFecha, formatearImporte } from '../../utilidades/formato.ts'
import { DESCRIPCION_TIPO } from '../emitir/etiquetas.ts'
import type { ResumenFactura } from './listado.ts'
import estilos from './TablaFacturas.module.css'

const descripcionTipo = (tipo: string | undefined) => (tipo && tipo in DESCRIPCION_TIPO ? DESCRIPCION_TIPO[tipo as keyof typeof DESCRIPCION_TIPO] : '')

/**
 * Filas del listado, en el orden en que las devuelve la API. Solo muestra: importes y estados llegan
 * calculados por el backend. A 360 px cada fila se apila como bloque con la etiqueta de cada dato.
 */
export function TablaFacturas({ facturas }: { facturas: readonly ResumenFactura[] }) {
  return (
    <div className={estilos.tablaScroll}>
      <table className={estilos.tabla}>
        <caption className={estilos.oculta}>Facturas emitidas</caption>
        <thead>
          <tr>
            <th scope="col">Factura</th>
            <th scope="col">Fecha</th>
            <th scope="col">Tipo</th>
            <th scope="col">Cliente</th>
            <th scope="col" className={estilos.numero}>
              Importe total
            </th>
            <th scope="col">Estado ante la AEAT</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((factura) => {
            const estado = presentarEstado(factura.estadoEnvio as EstadoEnvio)
            return (
              <tr key={factura.id}>
                <td data-etiqueta="Factura">
                  <Link to={`/facturas/${factura.id}`}>{factura.numSerieFactura}</Link>
                </td>
                <td data-etiqueta="Fecha">{formatearFecha(factura.fechaExpedicion)}</td>
                <td data-etiqueta="Tipo">
                  <span className={estilos.valor}>
                    <span className={estilos.codigoTipo}>{factura.tipoFactura}</span>
                    {descripcionTipo(factura.tipoFactura) && <span className={estilos.secundario}>{descripcionTipo(factura.tipoFactura)}</span>}
                  </span>
                </td>
                <td data-etiqueta="Cliente">
                  <span className={estilos.valor}>
                    {factura.clienteNombre}
                    <span className={estilos.secundario}>{factura.clienteNif}</span>
                  </span>
                </td>
                <td className={estilos.numero} data-etiqueta="Importe total">
                  {formatearImporte(factura.importeTotal)}
                </td>
                <td data-etiqueta="Estado ante la AEAT">
                  <span className={estilos.estado} data-tono={estado.tono}>
                    {estado.texto}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
