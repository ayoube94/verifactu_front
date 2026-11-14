# Proposal

## Why

El frontal ya tiene armazón, cliente de API e imagen, pero todavía no permite hacer nada con las facturas. Emitir es la operación central de Zefact. Hasta ahora el operador tenía que llamar a `POST /api/v1/facturas` a mano, sin ver de forma clara si la AEAT aceptó el registro.

## What Changes

- **Pantalla nueva `/facturas/nueva` («Emitir factura»)**, enlazada desde la navegación y desde la página de inicio.
- **Formulario de emisión:**
  - datos de la factura: serie, número, fecha de expedición, tipo F1–F3/R1–R5, régimen de IVA y descripción de la operación;
  - destinatario: NIF, razón social y dirección;
  - líneas dinámicas: descripción, cantidad, precio unitario, descuento **en euros** y tipo de IVA, que **siempre se envía explícito**.
- **Validación en el cliente** con las mismas reglas que el backend, más la obligación de destinatario en las facturas no simplificadas. Los errores 400 del backend se muestran junto a cada campo y el 409 de número duplicado se explica.
- **Totales orientativos** (base, cuota y total) calculados como el backend: redondeo HALF_UP a 2 decimales por línea. Se rotulan como orientativos: los definitivos son los que devuelve el backend.
- **Envío síncrono con la AEAT** (hasta unos 10 s):
  - estado de espera visible;
  - sin doble envío;
  - la emisión nunca se reintenta sola.
- **Resultado de la emisión:**
  - estado ante la AEAT inequívoco, porque un 201 puede traer `RECHAZADO` o `ERROR_CONEXION`;
  - código y mensaje de la AEAT cuando los hay;
  - CSV;
  - huella con su «suma y sigue» (huella anterior);
  - QR.
- **Recuperación tras un corte de red:** antes de permitir reintentar, se comprueba con `GET /api/v1/facturas/por-numero` si la factura llegó a emitirse. Un 409 con `facturaId` abre la factura existente.
- **Tipos generados del contrato** en lugar de los escritos a mano en `src/api/problemas.ts`, cuando el backend publique el contrato completo.
- **Primer test E2E en navegador** (Playwright) del flujo de emisión, con la API simulada, ejecutado en CI.

### Fuera de alcance

- Consultar una factura por id, descargar el XML y verificar una huella: fase 3, `consultar-factura`.
- Listado de facturas: fase 5.
- Facturas rectificativas completas:
  - el formulario ofrece los tipos R1–R5 porque el backend los acepta;
  - pero no recoge la factura rectificada ni importes negativos, porque el backend no los soporta todavía.
- Borradores guardados, plantillas, catálogo de clientes o autocompletado por NIF. Sin datos de facturación persistidos en el navegador.
- Factura imprimible o PDF con QR: espera a que el backend use la URL oficial del QR.

### Dependencia del backend

**Parcial.** El grueso del change funciona con el backend actual. El último grupo de tareas depende del change `contrato-api-openapi` del backend, ya especificado en su `main` pero aún no implementado:
- `GET /api/v1/facturas/por-numero`;
- `facturaId` en el 409;
- respuestas y tipos documentados en el `openapi.json`.

Además, cuando el backend implemente `listado-facturas-y-tipo-iva`, una línea sin `tipoIva` pasará a dar 400. No afecta al frontal, que siempre lo envía.

## Capabilities

### New Capabilities
- `emision-facturas`: emisión de una factura desde el frontal: formulario, validación, totales orientativos, envío, presentación del resultado ante la AEAT y recuperación tras un fallo sin respuesta.

### Modified Capabilities
- `cliente-api`: el requisito «Fallo de conexión» se matiza. Una operación que crea un registro inalterable (la emisión) no ofrece un reintento directo: antes comprueba si el registro se creó.

## Impact

- **Código:**
  - rutas y navegación (`src/app`);
  - nueva página y componentes del formulario y del resultado;
  - utilidades de importes;
  - cliente de API;
  - `src/api/problemas.ts`, que se retira en el último grupo.
- **Dependencias nuevas:**
  - React Hook Form y Zod (ya previstas en el diseño de la fase 1);
  - Playwright (desarrollo).
- **CI:** nuevo paso E2E con Chromium de Playwright.
- **Backend:** ninguno desde este repo. Consume los changes `contrato-api-openapi` y, de forma indirecta, `listado-facturas-y-tipo-iva`.
- **Coste AWS:** 0 USD adicionales.
