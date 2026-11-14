import type { RouteObject } from 'react-router'
import { EmitirFactura } from '../paginas/emitir/EmitirFactura.tsx'
import { Inicio } from '../paginas/Inicio.tsx'
import { NoEncontrado } from '../paginas/NoEncontrado.tsx'
import { Armazon } from './Armazon.tsx'

/** Rutas de la aplicación. La fase 3 añade /facturas/:id y /auditoria. */
export const rutas: RouteObject[] = [
  {
    element: <Armazon />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'facturas/nueva', element: <EmitirFactura /> },
      { path: '*', element: <NoEncontrado /> },
    ],
  },
]
