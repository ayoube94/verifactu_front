import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './servidor.ts'

// En el navegador, `new Request('/api/...')` se resuelve contra el origen de la página; en Node (undici)
// lanza "Invalid URL". Reproducimos el comportamiento del navegador para probar las rutas relativas reales.
const RequestNativo = globalThis.Request
globalThis.Request = class extends RequestNativo {
  constructor(entrada: RequestInfo | URL, opciones?: RequestInit) {
    super(typeof entrada === 'string' && entrada.startsWith('/') ? new URL(entrada, window.location.origin) : entrada, opciones)
  }
}

// Cualquier petición sin handler definido es un error del test: así no se cuela una llamada real.
beforeAll(() => servidor.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  servidor.resetHandlers()
  cleanup()
})
afterAll(() => servidor.close())
