# Design

## Context

- **Lo que ya existe (fase 1):**
  - `api` (`openapi-fetch`) con `resultado()`, que lanza `ErrorApi` normalizado;
  - `MensajeError`, `Boton`, `useTituloPagina` y `formatearImporte` / `formatearFecha`;
  - TanStack Query con `mutations.retry: false`;
  - navegación desde una lista única (`src/app/secciones.ts`);
  - tokens y `DESIGN.md` del mundo «Libro registro», con el «suma y sigue» ya descrito como elemento propio.
- **Backend hoy (`main`):**
  - `POST /api/v1/facturas` valida con Jakarta y responde 201 con `FacturaResponseDto`;
  - 400 con `errores` (claves tipo `serie`, `cliente.nif`, `lineas[0].cantidad`), 409 por serie y número duplicados y 500 con `errorId`;
  - la llamada a la AEAT es síncrona dentro de la transacción (hasta unos 10 s);
  - `tipoIva` aún se rellena al 21 % si falta.
- **Backend especificado pero no implementado:**
  - `contrato-api-openapi`: contrato completo, `GET /por-numero` y `facturaId` en el 409;
  - `listado-facturas-y-tipo-iva`: `tipoIva` obligatorio.
- **Cálculo del backend** (`LineaFactura`):
  - base = (cantidad × precio − descuento) HALF_UP 2;
  - factor = tipo / 100 a escala 4 HALF_UP;
  - cuota = base × factor HALF_UP 2;
  - totales = suma de las líneas redondeadas.

## Goals / Non-Goals

**Goals:**
- Que el operador nunca dude de si una factura se emitió ni de su estado ante la AEAT.
- Que sea imposible emitir dos veces por un doble clic, un reintento automático o un corte de red.
- Que el formulario se pueda completar solo con teclado y a 360 px.

**Non-Goals:**
- Un sistema de formularios genérico: solo los componentes que necesita esta pantalla.
- Editar o anular facturas emitidas (los registros son inalterables).

## Decisions

### D1. Una ruta y dos estados en la misma pantalla
`/facturas/nueva` muestra el formulario. Al recibir el 201, la misma pantalla pasa a «resultado».

- **Por qué no navegar a `/facturas/:id`:** esa pantalla es de la fase 3. Hasta que exista, el resultado se muestra aquí.
- **Cuando llegue la fase 3:** el componente del resultado (`<RegistroEmitido>`) se reutiliza en `/facturas/:id`.
- **«Emitir otra factura»:** reinicia el formulario.
- **Alternativa descartada:** una ruta `/facturas/nueva/resultado` con estado en `location.state`. Al recargar se perdería y no aporta nada.

### D2. React Hook Form + Zod, con números como texto

- **Formulario:** `useForm` con `zodResolver` y `useFieldArray` para las líneas. Validación al enviar y, después, al cambiar.
- **Números como texto:** cantidad, precio, descuento y tipo se editan como texto, con `inputMode="decimal"` y no `type="number"`, que en es-ES rechaza la coma según el navegador.
- **Conversión:** el esquema Zod normaliza la coma a punto y valida los decimales con la escala de cada columna del backend (`LineaFactura`): cantidad y precio unitario 4, descuento y tipo de IVA 2. Solo convierte a número al construir el cuerpo de la petición.
- **Mensajes:** los de Zod copian literalmente los del backend (`LineaFacturaDto`, `FacturaCreateDto`, `ClienteDto`), para que un error del cliente y uno del servidor se lean igual.
- **Destinatario:** se exige salvo en F2 y R5, con un `superRefine` que depende de `tipoFactura`. Es más estricto que el backend, porque una factura completa exige destinatario. Queda anotado en las specs.
- **Alternativa descartada:** validar solo en el servidor. Cada error costaría una ida y vuelta, y con la AEAT síncrona no hay riesgo de emitir por error, pero sí de esperar.

### D3. Aritmética decimal exacta sin dependencias
`src/utilidades/importes.ts` reproduce el cálculo del backend con `BigInt` en punto fijo:
- textos decimales → enteros escalados (cantidad y precio a escala 4, descuento y tipo a 2, así el producto bruto se calcula exacto y sin redondear, como en el backend);
- multiplicación;
- redondeo HALF_UP a la escala del backend.

No se usan `number` para operar, porque `0.1 + 0.2` falla.

- **Tests:** los ejemplos de los specs y los casos frontera de HALF_UP (`x,xx5`).
- **Alternativa descartada:** `decimal.js` o `big.js`. Son unos 10–30 kB para tres operaciones. Si más adelante se necesita más aritmética, se reconsidera.

### D4. Envío: mutación única y protección de salida
- **Mutación:** `useMutation` sobre `resultado(() => api.POST('/api/v1/facturas', { body }))`. `retry: false` ya es el valor global.
- **Botón:** `ocupado={isPending}`, que lo deshabilita y pone `aria-busy`, con el texto «Emitiendo…».
- **Mensaje de espera:** «Esperando la respuesta de la AEAT…» en una región `aria-live="polite"`.
- **Protección del doble envío:** además del botón deshabilitado, el `onSubmit` ignora el envío si hay una mutación en curso, porque un Enter repetido podría colarse antes de que React vuelva a pintar.
- **Salida de la página:** mientras `isPending`, `beforeunload` y `useBlocker` de React Router avisan si el usuario sale.

### D5. Errores del servidor dentro del formulario
- **`rutaDeCampo()`:** traduce las claves del backend a rutas de React Hook Form (`lineas[1].cantidad` → `lineas.1.cantidad`, `cliente.nif` → `cliente.nif`) y aplica `setError`.
- **Claves desconocidas:** se muestran en `MensajeError` con `ocultarCampos` sobre las ya colocadas.
- **409:** se muestra junto a serie y número con el `detail` del backend.
- **Errores sin respuesta y 5xx:** pasan por `MensajeError`. Los datos del formulario se conservan siempre.

### D6. Resultado: estados con palabras y «suma y sigue»
- **Estados:** `estadoEnvio` se traduce con un único mapa (`src/dominio/estadoEnvio.ts`) a texto y a tono (`exito`, `incidencia` o `pendiente`). El tono decide el color; el texto siempre aparece.
  - `ACEPTADO` es el único éxito.
  - `ACEPTADO_CON_ERRORES` es una incidencia leve (aviso).
  - `RECHAZADO` y `ERROR_CONEXION` son incidencias (error).
  - `PENDIENTE` y `ENVIADO` quedan pendientes.
- **`<SumaYSigue>`:** sigue `DESIGN.md`. Un bloque de papel hundido con la huella anterior, o «Primer registro de la cadena», y debajo la huella propia con filete índigo de 2px. Las huellas se agrupan en bloques de 4 caracteres solo visualmente; el texto copiado es la huella completa.
- **QR:** `<img src={qrBase64} alt="Código QR de cotejo de la factura 2026-001 en la AEAT">`. `data:` ya está permitido en la CSP.
- **Componente:** el resultado vive en `<RegistroEmitido factura={...}>`, reutilizable en la fase 3.

### D7. Recuperación tras un fallo sin respuesta (depende del backend)
Cuando la mutación falla con `ErrorApi` de tipo `red`, se lanza `GET /api/v1/facturas/por-numero` con la serie y el número enviados:

| Respuesta de `por-numero` | Qué se muestra |
|---|---|
| 200 | `<RegistroEmitido>` con el aviso «Esta factura ya se había emitido» |
| 404 | «La factura no llegó a emitirse», con el botón «Reintentar la emisión» |
| Sin respuesta | «No se ha podido comprobar», con «Comprobar de nuevo» y sin reintento |

Ante un 409 con `facturaId`, `MensajeError` ofrece «Ver la factura existente», que carga `GET /{id}` y muestra `<RegistroEmitido>`.

Hasta que el backend publique el endpoint, este grupo no se implementa. Un fallo `red` en la emisión muestra solo «No se sabe si la factura se emitió: compruébalo antes de reintentar», sin botón de reintento. Así se cumple ya la spec modificada de `cliente-api`.

### D8. E2E con Playwright contra la build y la API simulada
- **Ejecución:** Playwright (solo Chromium) contra `vite preview`.
- **API simulada:** `page.route('/api/**')` y `/actuator/health`, con respuestas tipadas desde `schema.d.ts`. No necesita backend en CI.
- **Escenarios:**
  - emisión aceptada;
  - 400 con error en una línea;
  - 201 rechazado;
  - doble clic, con una sola petición.
- **CI:** nuevo paso en el job `build` con `npx playwright install --with-deps chromium`. Se cachea por versión.
- **Alternativa descartada:** E2E contra el backend real en CI. Necesitaría levantar Spring y PostgreSQL y simular la AEAT, y eso pertenece a una prueba de integración entre repos, no a este change.

### D9. Diseño de la pantalla (mundo «Libro registro»)
- **Formulario:** se lee como un asiento.
  - Cabecera en una fila: serie, número, fecha y tipo.
  - Destinatario en un bloque con filete.
  - Las líneas como tabla pautada con columnas fijas y cifras tabulares: descripción, cantidad, precio, descuento, IVA, base y quitar.
  - Totales alineados a la derecha, bajo un filete índigo de 2px, como el pie de un folio.
- **A 360 px:** cada línea pasa a ser un bloque apilado, sin desplazamiento horizontal.
- **Antes de implementar:** se pasa `/impeccable shape` sobre la pantalla para cerrar la composición dentro del mundo ya fijado. Al terminar, `critique` y `audit`.

## Risks / Trade-offs

- **[Las reglas de validación del cliente se desvían de las del backend]** → Los mensajes se copian literalmente y hay un test por regla. El backend sigue validando, y un 400 inesperado se pinta igualmente junto al campo (D5).
- **[El cálculo de totales difiere del backend en algún caso de redondeo]** → Se replica la escala intermedia del backend (factor a 4 decimales) y se testean casos frontera. Los totales se rotulan como orientativos y el resultado muestra siempre los del backend.
- **[Se ofrecen tipos R1–R5 sin los datos de la factura rectificada]** → La AEAT podría rechazar el registro. El resultado lo mostraría como rechazado, sin ambigüedad. Las rectificativas completas son un change futuro, que depende del backend.
- **[El backend tarda en implementar `contrato-api-openapi`]** → El change se puede revisar y mergear sin el grupo 8, con el aviso de D7 sin reintento. El change no se archiva hasta cerrar ese grupo.
- **[Playwright alarga el CI]** → Un solo navegador y binarios cacheados. Se estima en 1 minuto o menos.

## Migration Plan

Sin migración: es una pantalla nueva. Se despliega con el flujo de la fase 4 cuando exista. Mientras tanto, solo en local y en la imagen construida por CI.
