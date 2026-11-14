import { useTituloPagina } from '../../app/useTituloPagina.ts'
import estilos from '../Pagina.module.css'
import { FormularioEmision } from './FormularioEmision.tsx'

/** Pantalla de emisión de factura (`/facturas/nueva`). El envío a la API se conecta en el grupo 4. */
export function EmitirFactura() {
  useTituloPagina('Emitir factura')
  return (
    <section className={estilos.pagina} aria-labelledby="titulo-emitir">
      <h1 id="titulo-emitir" className={estilos.titulo}>
        Emitir factura
      </h1>
      <FormularioEmision onEnviar={() => undefined} />
    </section>
  )
}
