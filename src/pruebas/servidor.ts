import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/**
 * Servidor MSW compartido por los tests. Por defecto el servicio está operativo (el armazón consulta
 * la salud en cada pantalla); cada test añade o sustituye handlers con `servidor.use(...)`.
 */
export const servidor = setupServer(http.get('/actuator/health', () => HttpResponse.json({ status: 'UP' })))
