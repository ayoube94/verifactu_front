import createClient from 'openapi-fetch'
import { errorDeRed, errorDesdeRespuesta } from './problemas.ts'
import type { paths } from './schema.d.ts'

/**
 * Cliente tipado de la API del backend.
 * - baseUrl vacío: siempre rutas relativas (/api/v1/...) al mismo origen que la página.
 * - Sin cabeceras de credenciales: el navegador reenvía las de HTTP Basic y el borde añade X-API-Key.
 */
export const api = createClient<paths>({
  baseUrl: '',
  // Se resuelve en cada llamada (no al importar), para que los tests puedan interceptar fetch
  fetch: (peticion) => globalThis.fetch(peticion),
})

interface RespuestaApi<D> {
  data?: D
  error?: unknown
  response: Response
}

/**
 * Ejecuta una llamada del cliente y devuelve el dato, o lanza un ErrorApi normalizado.
 * Uso: `const factura = await resultado(() => api.GET('/api/v1/facturas/{id}', { params: { path: { id } } }))`
 */
export async function resultado<D>(llamada: () => Promise<RespuestaApi<D>>): Promise<D> {
  let respuesta: RespuestaApi<D>
  try {
    respuesta = await llamada()
  } catch (causa) {
    // fetch rechazado (red caída, servidor inaccesible) o cuerpo 2xx que no es JSON válido
    throw errorDeRed(causa)
  }
  if (!respuesta.response.ok) {
    throw errorDesdeRespuesta(respuesta.response.status, respuesta.error)
  }
  return respuesta.data as D
}
