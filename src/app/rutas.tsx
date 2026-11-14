import type { RouteObject } from 'react-router'
import { Inicio } from '../paginas/Inicio.tsx'
import { NoEncontrado } from '../paginas/NoEncontrado.tsx'
import { Armazon } from './Armazon.tsx'

/** Rutas de la aplicación. Las fases 2 y 3 añaden /facturas/nueva, /facturas/:id y /auditoria. */
export const rutas: RouteObject[] = [
  {
    element: <Armazon />,
    children: [
      { index: true, element: <Inicio /> },
      { path: '*', element: <NoEncontrado /> },
    ],
  },
]
