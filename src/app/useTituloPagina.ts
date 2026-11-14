import { useEffect } from 'react'

export const NOMBRE_PRODUCTO = 'Zefact'

/** Pone «<pantalla> · Zefact» como título del documento mientras la pantalla está montada. */
export function useTituloPagina(pantalla: string) {
  useEffect(() => {
    document.title = `${pantalla} · ${NOMBRE_PRODUCTO}`
  }, [pantalla])
}
