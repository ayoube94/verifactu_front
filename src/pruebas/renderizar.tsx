import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { crearClienteConsultas } from '../app/consultas.ts'
import { rutas } from '../app/rutas.tsx'

/** Renderiza la aplicación completa (armazón incluido) en la ruta indicada, con una caché nueva por test. */
export function renderizarRuta(ruta = '/') {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  const clienteConsultas = crearClienteConsultas()
  // Sin reintentos en tests: un fallo simulado debe verse al primer intento
  clienteConsultas.setDefaultOptions({ queries: { retry: false }, mutations: { retry: false } })
  return {
    router,
    ...render(
      <QueryClientProvider client={clienteConsultas}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}
