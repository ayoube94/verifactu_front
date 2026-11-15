import type { RouteObject } from 'react-router'
import { ConsultarFactura } from '../paginas/consulta/ConsultarFactura.tsx'
import { FacturaDetalle } from '../paginas/consulta/FacturaDetalle.tsx'
import { EmitirFactura } from '../paginas/emitir/EmitirFactura.tsx'
import { Inicio } from '../paginas/Inicio.tsx'
import { NoEncontrado } from '../paginas/NoEncontrado.tsx'
import { VerificarHuella } from '../paginas/verificacion/VerificarHuella.tsx'
import { Armazon } from './Armazon.tsx'

/** Rutas de la aplicación. */
export const rutas: RouteObject[] = [
  {
    element: <Armazon />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'facturas/nueva', element: <EmitirFactura /> },
      { path: 'consultar', element: <ConsultarFactura /> },
      { path: 'facturas/:id', element: <FacturaDetalle /> },
      { path: 'verificar-huella', element: <VerificarHuella /> },
      { path: '*', element: <NoEncontrado /> },
    ],
  },
]
