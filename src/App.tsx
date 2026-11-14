import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { crearClienteConsultas } from './app/consultas.ts'
import { rutas } from './app/rutas.tsx'

const router = createBrowserRouter(rutas)

export function App() {
  const [clienteConsultas] = useState(crearClienteConsultas)
  return (
    <QueryClientProvider client={clienteConsultas}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
