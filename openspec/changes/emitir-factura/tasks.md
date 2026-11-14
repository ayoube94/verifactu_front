# Tasks

## 1. Ruta y navegación

- [x] 1.1 Añadir la ruta `/facturas/nueva` con una página vacía `EmitirFactura` (título «Emitir factura · Zefact») y la sección «Emitir factura» en `src/app/secciones.ts`. Se verifica con un test de que la navegación muestra «Inicio» y «Emitir factura» y marca la activa
- [x] 1.2 En la página de inicio, convertir «Emitir factura» en enlace a `/facturas/nueva` (las otras dos siguen como «Próxima fase»). Se verifica con un test de que el enlace existe y navega

## 2. Dominio: importes y modelo del formulario

- [x] 2.1 Crear `src/utilidades/importes.ts` con aritmética decimal en `BigInt`: parseo con coma o punto, `calcularLinea` (base y cuota HALF_UP 2, factor a escala 4) y `calcularTotales`. Se verifica con tests: los ejemplos del spec (`1.450,00 €`, `304,50 €`, `1.754,50 €`; `3 × 0,35` da base `1,05` y cuota `0,22`) y casos frontera HALF_UP, y un precio de 4 decimales (`3 × 0,3333` da base `1,00`)
- [x] 2.2 Instalar `react-hook-form`, `zod` y `@hookform/resolvers`. Crear `src/paginas/emitir/esquema.ts` con el esquema Zod:
  - reglas y mensajes copiados del backend;
  - decimales máximos por campo como el backend (cantidad y precio 4; descuento e IVA 2);
  - destinatario obligatorio salvo F2 y R5;
  - valores iniciales con la fecha de hoy en Madrid.

  Crear también `aPeticion()`, que construye el `FacturaCreateDto` con `tipoIva` numérico siempre y sin `cliente` si está vacío en una simplificada. Se verifica con tests por cada regla del spec y de `aPeticion()`
- [x] 2.3 Crear `src/dominio/estadoEnvio.ts`, el mapa de `EstadoEnvio` a texto y tono (D6). Se verifica con un test que cubre los seis estados y que solo `ACEPTADO` es éxito

## 3. Formulario

- [x] 3.1 Si no se ha hecho ya, `/impeccable shape` de la pantalla de emisión dentro de `DESIGN.md`, y anotar la composición en el surface brief. Se verifica con el brief en `.impeccable/surfaces/`
- [x] 3.2 Crear los componentes de campo (`CampoTexto`, `CampoSelect`, con etiqueta visible, error asociado con `aria-describedby` y `aria-invalid`, y estados normal, foco, error y deshabilitado) siguiendo los tokens. Se verifica con tests de asociación etiqueta-campo y error, y con el detector de impeccable sin hallazgos
- [x] 3.3 Crear los bloques de cabecera (serie, número, fecha, tipo con códigos y descripciones, régimen y descripción de la operación) y de destinatario. Se verifica con un test de los valores iniciales del spec
- [x] 3.4 Crear la tabla de líneas con `useFieldArray`: añadir y quitar (la última no se quita), el descuento rotulado en euros, el selector de IVA (21, 10, 4 y 0 %), la base de cada línea y el bloque apilado a 360 px. Se verifica con tests de añadir y quitar conservando valores
- [x] 3.5 Crear el pie de totales orientativos, recalculado al editar y rotulado como «orientativo». Se verifica con un test del ejemplo del spec escribiendo en los campos
- [x] 3.6 Conectar la validación al enviar, con mensajes junto a cada campo y el foco en el primer error. Se verifica con el escenario «Envío con campos vacíos» (ninguna petición enviada)

## 4. Envío y errores del servidor

- [x] 4.1 Crear la mutación de emisión (D4): botón «Emitiendo…» ocupado, mensaje `aria-live` de espera, guarda contra el doble envío y aviso al abandonar con `beforeunload` y `useBlocker`. Se verifica con tests MSW: doble pulsación con una sola petición, y que se envía `tipoIva` en cada línea
- [x] 4.2 Crear `rutaDeCampo()` y aplicar los 400 del backend con `setError` (D5), con las claves desconocidas al mensaje general. Se verifica con tests de `serie`, `cliente.nif` y `lineas[1].cantidad`
- [x] 4.3 Mostrar el 409 junto a serie y número y los 5xx con `errorId`, conservando los datos. Se verifica con tests MSW de 409 y 500 (una sola petición, datos intactos)
- [x] 4.4 Ante un fallo sin respuesta en la emisión, mostrar «No se sabe si la factura se emitió: compruébalo antes de reintentar», sin botón de reintento (D7, antes del backend). Se verifica con un test MSW con `HttpResponse.error()`

## 5. Resultado

- [x] 5.1 Crear `<SumaYSigue>` (huella anterior o «Primer registro de la cadena», y huella propia, agrupada visualmente y completa al copiar). Se verifica con tests de los dos casos y de que `textContent` contiene la huella completa
- [x] 5.2 Crear `<RegistroEmitido>`:
  - estado en palabras con su tono;
  - código y mensaje de la AEAT;
  - número, fecha, destinatario y totales del backend;
  - CSV;
  - `<SumaYSigue>`;
  - QR con `alt`.

  Se verifica con tests de `ACEPTADO`, `RECHAZADO` (incidencia, con aviso de que no se puede reemitir) y `ERROR_CONEXION`
- [x] 5.3 Integrar el resultado en `/facturas/nueva` tras el 201, con «Emitir otra factura» que reinicia el formulario. Se verifica con un test del flujo completo con MSW
- [x] 5.4 Pasar `/impeccable critique` y `/impeccable audit` sobre la pantalla (formulario, espera, errores y resultado) y corregir los P0 y P1. Se verifica con `impeccable detect` sin hallazgos sobre la página en marcha, la revisión a 360 px y solo con teclado, y `DESIGN.md` actualizado si se añaden componentes (campos, tabla de líneas)

## 6. E2E con Playwright

- [x] 6.1 Instalar `@playwright/test` (solo Chromium), configurar `playwright.config.ts` contra `vite preview`, añadir el script `test:e2e` y crear el helper de rutas simuladas tipado con `schema.d.ts`. Se verifica con `npm run test:e2e` y un test de humo que abre `/facturas/nueva`
- [x] 6.2 Escribir los escenarios E2E: emisión aceptada, 400 en una línea, 201 rechazado y doble clic con una sola petición. Se verifica con `npm run test:e2e` en verde
- [ ] 6.3 Añadir al job `build` del CI la instalación de Chromium (cacheada) y `npm run test:e2e`, y ajustar `.gitignore` para los informes. Se verifica con el CI del PR en verde

## 7. Verificación integral

- [x] 7.1 Con el backend en perfil `dev` y `npm run dev`:
  - emitir una factura real y ver su resultado y estado;
  - repetir la misma serie y número y ver el 409;
  - enviar una línea con cantidad 0 forzando el bypass del cliente (petición manual) para confirmar que los mensajes del 400 coinciden con los del cliente.

  Anotar el resultado en el PR. Resultado (14/11/2026, backend `main` en dev, AEAT no disponible en dev): emisión real → 201 y «Rechazada por la AEAT» mostrado como incidencia (HTTP 302 de la pasarela); repetir serie y número → 409 junto a serie y número con el mensaje del backend; línea con cantidad 0 enviada a mano → `lineas[0].cantidad` = «La cantidad debe ser mayor que 0», igual que la validación del cliente

## 8. Contrato completo del backend (depende de `contrato-api-openapi` implementado en el backend)

- [ ] 8.1 `npm run api:sync && npm run api:types`. Sustituir los tipos manuales de `src/api/problemas.ts` (ProblemDetail y verificación de huella) por los generados, conservando `ErrorApi` y la normalización. Leer `facturaId` del 409. Se verifica con `npm run typecheck`, `npm test` y `npm run api:check`
- [ ] 8.2 Implementar la recuperación (D7): tras un fallo sin respuesta, consultar `por-numero` (200 «ya se había emitido», 404 «Reintentar la emisión», sin respuesta «Comprobar de nuevo»). Se verifica con tests MSW de los tres casos y un escenario E2E
- [ ] 8.3 Ante un 409 con `facturaId`, ofrecer «Ver la factura existente», que carga `GET /{id}` y muestra `<RegistroEmitido>`. Se verifica con un test MSW y un escenario E2E

## Workflow follow-up

- Abrir el PR con los grupos 1–7 si el backend aún no ha implementado `contrato-api-openapi`. El grupo 8 puede ir en un PR posterior de la misma fase.
- Archivar con `/opsx:archive emitir-factura` solo cuando el grupo 8 esté hecho y el CI en verde.
