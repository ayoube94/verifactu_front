import { useTituloPagina } from '../../app/useTituloPagina.ts'
import estilos from '../Pagina.module.css'

/** Pantalla de emisión de factura (`/facturas/nueva`). El formulario se añade en la fase 2, grupos 2 a 5. */
export function EmitirFactura() {
  useTituloPagina('Emitir factura')
  return (
    <section className={estilos.pagina} aria-labelledby="titulo-emitir">
      <h1 id="titulo-emitir" className={estilos.titulo}>
        Emitir factura
      </h1>
    </section>
  )
}
