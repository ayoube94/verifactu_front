# Proposal

## Why

Tras las fases 2 y 3 el operador puede emitir una factura y abrirla, pero solo si ya conoce su id. No hay forma de ver qué facturas existen, cuáles fueron rechazadas por la AEAT ni de encontrar una por número, cliente o fecha. La fase 5 cierra ese hueco con un listado paginado y filtrable, ahora que el backend ya expone `GET /api/v1/facturas`.

## What Changes

- **Pantalla de listado `/facturas`** («Facturas · Zefact»), con una fila por factura:
  - serie y número, fecha de expedición, tipo, cliente (nombre y NIF), importe total y estado ante la AEAT;
  - cada fila enlaza a `/facturas/:id` (la pantalla de la fase 3);
  - orden fijo del backend (fecha de expedición descendente y después id descendente), sin ordenación en el navegador.
- **Filtros** que se combinan con AND: serie, número, NIF del cliente, fecha desde, fecha hasta y estado de envío a la AEAT. Se envían al backend; el frontal no filtra nada por su cuenta.
- **Paginación** con página anterior y siguiente, total de facturas y tamaño de página elegible (10, 20, 50 o 100).
- **Estado en la URL:** filtros, página y tamaño viajan en la query (`/facturas?estadoEnvio=RECHAZADO&page=1`), de modo que un listado filtrado se puede compartir y el botón «atrás» del navegador lo restaura.
- **Estados de la pantalla:** carga, listado vacío (aún no hay facturas), sin resultados para los filtros (con «Quitar filtros»), error del servidor con `errorId`, sin conexión con reintento y 400 del backend mostrado junto al filtro afectado.
- **Navegación:** «Facturas» entra en `src/app/secciones.ts` justo después de «Inicio», y la página de inicio gana la operación «Listar facturas». Tras emitir una factura, el resultado ofrece volver al listado.
- **Lo que el frontal no calcula:** importes, estados y orden se muestran tal cual los devuelve el backend. El resumen no incluye líneas ni QR; para eso está la pantalla de la factura.

### Fuera de alcance

- Ordenación configurable por columna: el contrato fija un único orden.
- Exportar el listado (CSV o PDF), selección múltiple y acciones en lote.
- Búsqueda de texto libre o por rango de importes: el contrato solo ofrece los seis filtros indicados.
- Descargar el XML desde el listado: sigue en la pantalla de la factura.
- Convertir el listado en la página de inicio de la aplicación: `/` sigue siendo la pantalla actual (ver Open Questions en `design.md`).
- Anulaciones y rectificativas, y la factura imprimible con QR.

### Dependencia del backend

**Ninguna pendiente.** El endpoint `GET /api/v1/facturas` (`listarFacturas`) y los esquemas `FacturaResumenDto` y `PaginaFacturasDto` ya están en `contrato/openapi.json`. Antes de implementar se ejecuta `npm run api:sync && npm run api:types` para confirmar que el contrato local coincide con el último del backend; si difiere, se coordina con el repo del backend antes de seguir.

## Capabilities

### New Capabilities
- `listado-facturas`: ver las facturas emitidas en un listado paginado, filtrarlas por serie, número, NIF, fechas y estado de envío, y abrir cualquiera de ellas.

### Modified Capabilities
- Ninguna. `estructura-interfaz` ya exige mostrar solo las secciones que existen; añadir «Facturas» cumple ese requisito sin cambiarlo, y el acceso desde la navegación y el inicio lo fija la spec nueva, igual que en `consulta-facturas`.

## Impact

- **Código:**
  - ruta nueva `/facturas` en `src/app/rutas.tsx` (conviviendo con `/facturas/nueva` y `/facturas/:id`);
  - página, filtros, tabla y paginación en `src/paginas/listado/`;
  - `src/app/secciones.ts`, `src/paginas/Inicio.tsx` y el enlace de vuelta en `RegistroEmitido`;
  - formateo con `src/utilidades/formato.ts` y estados con `src/dominio/estadoEnvio.ts` (sin cambios de comportamiento).
- **Dependencias nuevas:** ninguna.
- **Tests:** MSW con el endpoint de listado y un escenario E2E de listado, filtro y paso a la factura.
- **Coste AWS:** 0 USD adicionales.
