# Proposal

## Why

Tras la fase 2 el operador puede emitir facturas, pero no puede volver a verlas. Para comprobar qué se envió a la AEAT, descargar el XML o confirmar que un registro no se ha alterado hace falta llamar a la API a mano. La fase 3 cierra ese hueco con consultas de solo lectura, sin tocar el backend.

## What Changes

- **Pantalla de factura `/facturas/:id`** («Factura 2026/001 · Zefact»):
  - datos de cabecera (serie, número, fechas, tipo, régimen y descripción de la operación);
  - destinatario;
  - líneas con cantidad, precio, descuento en euros, tipo de IVA y base;
  - totales (base imponible, cuota e importe total) tal como los devuelve el backend;
  - bloque VeriFactu: estado ante la AEAT, código y mensaje de la AEAT, CSV, huella, huella anterior, fecha-hora de generación y QR.
- **Descarga del XML** enviado a la AEAT desde la propia pantalla (`GET /api/v1/facturas/{id}/xml`).
- **Consulta por id:** «Consultar factura» en la navegación y en la página de inicio abre `/consultar`, con un campo para el id y un botón que navega a `/facturas/:id`. Un id inexistente muestra «No existe ninguna factura con ese id».
- **Verificación de integridad de una huella:** página `/verificar-huella` con un campo para la huella (64 caracteres hexadecimales). Muestra si la huella recomputada coincide con la guardada (`integridadValida`), con el mensaje del backend, la huella anterior y la cadena canónica en un bloque desplegable.
- **Navegación:** las entradas «Consultar factura» y «Verificar huella» se añaden a `src/app/secciones.ts` y dejan de ser «Próxima fase» en la página de inicio.
- **Lo que el frontal no calcula:** la huella, el QR y los importes se muestran tal cual los devuelve el backend. La verificación la hace el backend, no el navegador.

### Fuera de alcance

- Listado o búsqueda de facturas: fase 5 (requiere endpoint paginado en el backend).
- Búsqueda por serie y número (`GET /api/v1/facturas/por-numero`): queda para la fase 5, con el listado. En esta fase la consulta es solo por id.
- Factura imprimible o PDF con QR y leyenda «VERI*FACTU»: espera a que el backend use la URL oficial del QR.
- Anulaciones y rectificativas.
- Cache de facturas en el navegador: nada de datos de facturación en `localStorage`.

### Dependencia del backend

**Ninguna.** Usa solo los endpoints ya presentes en `contrato/openapi.json`: `GET /api/v1/facturas/{id}`, `GET /api/v1/facturas/{id}/xml` y `GET /api/v1/facturas/auditoria/verificar-huella/{huella}`. Los 404 y 401 ya están documentados como respuestas; los 404 del XML y de la verificación se tratan igual que el de la factura.

## Capabilities

### New Capabilities
- `consulta-facturas`: ver una factura por id con sus datos, líneas, totales y bloque VeriFactu, descargar su XML y buscarla por id desde la navegación.
- `verificacion-huella`: comprobar la integridad de un registro a partir de su huella y presentar el resultado sin ambigüedad.

### Modified Capabilities
- Ninguna. `cliente-api` y `emision-facturas` no cambian sus requisitos: solo se reutilizan.

## Impact

- **Código:**
  - rutas nuevas en `src/app/rutas.tsx` (`/consultar`, `/facturas/:id`, `/verificar-huella`);
  - página y componentes de factura y de verificación;
  - `src/app/secciones.ts` y `src/paginas/Inicio.tsx`;
  - formateo de fechas e importes en `src/utilidades`.
- **Dependencias nuevas:** ninguna.
- **Tests:** MSW con los endpoints de consulta y un escenario E2E de consulta de factura y verificación.
- **Coste AWS:** 0 USD adicionales.
