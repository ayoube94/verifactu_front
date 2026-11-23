# Design

## Context

Las fases 2 y 3 dejaron un cliente de API tipado (`openapi-fetch` con los tipos generados de `contrato/openapi.json`), el tratamiento uniforme de errores en `src/api/problemas.ts` (`ErrorApi`, `errorId`, 400 con `errores`), TanStack Query sin persistencia (`src/app/consultas.ts`), la presentación del estado AEAT en `src/dominio/estadoEnvio.ts` y los componentes de campo (`Campos`, `Boton`, `MensajeError`). Esta fase añade una única lectura, `GET /api/v1/facturas` (`listarFacturas`), que ya está en el contrato.

El contrato fija lo que la pantalla puede pedir: `page` (desde 0), `size` (1 a 100, 20 por defecto), `serie`, `numero`, `nifCliente`, `fechaDesde`, `fechaHasta` y `estadoEnvio`, con orden fijo por fecha de expedición y después id, ambos descendentes. La respuesta es un resumen (`FacturaResumenDto`: id, `numSerieFactura`, fecha, tipo, `clienteNif`, `clienteNombre`, `importeTotal`, `estadoEnvio`, huella) dentro de `PaginaFacturasDto` (`content`, `page`, `size`, `totalElements`, `totalPages`). Un 400 llega como `ProblemaValidacion` con `errores`.

Rutas actuales de facturas: `/facturas/nueva` y `/facturas/:id`. Ver `proposal.md` para el motivo y `specs/listado-facturas/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Un listado que se pueda compartir y restaurar con «atrás», porque su estado vive en la URL.
- Reutilizar los componentes, el formateo regional, el manejo de errores y el mapa de estados AEAT existentes.
- Que el navegador no decida nada sobre los datos: filtra, ordena y pagina el backend.

**Non-Goals:**
- Ordenación por columna, exportación, búsqueda libre o acciones en lote.
- Cambiar el contrato del backend o pedir campos que el resumen no trae (líneas, QR).
- Sustituir la página de inicio por el listado (ver Open Questions).

## Decisions

### La URL es la fuente de verdad del listado
Filtros, `page` y `size` viven en la query de la URL con `useSearchParams`, y la petición se deriva de ella. Los campos del formulario tienen estado local y solo escriben en la URL al pulsar «Filtrar», que además reinicia `page` a 0. Así el estado es compartible, «atrás» lo restaura y no hay segunda copia que sincronizar.

La lectura de la URL pasa por una función pura `leerParametros(query)` que descarta valores no válidos (`page` negativo o no entero, `size` fuera de 10/20/50/100, `estadoEnvio` desconocido, fechas mal formadas) y devuelve los valores por defecto. Es la única barrera antes de la API y es lo que cubre el escenario de URL no válida. Las URL se escriben solo con los parámetros que difieren del valor por defecto, para que `/facturas` sea la URL limpia.

Alternativas descartadas:
- *Estado en React sin URL:* se pierde al recargar o al volver desde una factura, y no se puede compartir.
- *Almacenar los filtros en `localStorage`:* contradice la restricción de no guardar datos del operador más allá de la sesión y no resuelve compartir.

### Filtrar al pulsar «Filtrar», no al escribir
Una petición por carácter sobre serie, número o NIF genera ruido y parpadeos, y el contrato ofrece coincidencia exacta, no por prefijo, así que buscar mientras se escribe daría resultados vacíos intermedios. «Filtrar» se activa con Intro desde cualquier campo. El selector de estado y el de tamaño de página sí actúan al cambiar, porque son una elección cerrada.

### Consulta con TanStack Query y página anterior visible
Clave `['facturas', parametros]`, `placeholderData: keepPreviousData` para que la tabla no se vacíe entre páginas (la región `aria-live` sigue anunciando la carga), `retry: false` en 4xx igual que `useFactura` y `refetchOnWindowFocus` desactivado. Un listado puede quedar viejo, pero el estado de envío de una factura recién emitida debe verse al volver: `staleTime` 0 y recarga al montar. La caché vive solo en memoria de la pestaña (`consultas.ts`), sin persistencia.

La función `listarFacturas(parametros)` vive en `src/paginas/listado/listado.ts` junto a la lectura de parámetros, con los tipos de `schema.d.ts`; no se definen tipos a mano.

### NIF y demás textos: recortar espacios y enviar tal cual
Se aplica `trim` y se omite el parámetro si queda vacío. No se pasa a mayúsculas ni se valida el formato del NIF: la API decide qué coincide, y el frontal no duplica reglas del backend. Si en la verificación contra el backend resulta que distingue mayúsculas, se normaliza en una sola función (tarea 7.1).

### Fechas con `<input type="date">`
El valor ya es `AAAA-MM-DD`, que es exactamente lo que espera la API, sin parsear ni pasar por `Date` (el mismo motivo que en `formato.ts`). El navegador muestra la fecha en formato local. La única validación propia es que desde no sea posterior a hasta, comparando las cadenas ISO, que ordenan igual que las fechas.

### Tabla accesible y bloque apilado a 360 px
Una `<table>` real con cabeceras de columna y el número de factura como enlace (el nombre accesible del enlace incluye serie y número). A 360 px las filas pasan a bloques apilados con la etiqueta de cada dato, como la tabla de líneas de la emisión. El importe va alineado a la derecha con cifras tabulares, y el estado siempre con texto: el tono (`estadoEnvio.ts`) solo refuerza.

### Paginación
Controles «Anterior»/«Siguiente» y «Página N de M» sin numeración de páginas: el volumen esperado es bajo y el contrato no fija un máximo de páginas. Con una sola página los controles se ocultan y se mantiene el total. Si la API devuelve 200 vacío con `totalElements` mayor que 0 (página fuera de rango tras borrar o cambiar el tamaño), se ofrece volver a la primera en vez de «Todavía no hay facturas».

### Errores
Se reutiliza `ErrorApi`: el 400 se reparte con las claves de `errores` (`size`, `fechaDesde`, `fechaHasta`, `estadoEnvio`…) a los filtros visibles y lo no reconocido va al mensaje general, igual que `rutaDeCampo()` en la emisión. Como la URL ya se sanea, un 400 solo debería ocurrir si el contrato cambia; por eso no se oculta, se muestra. El 500 lleva `errorId` y el fallo de red ofrece «Reintentar» (es una lectura, a diferencia de la emisión).

### Navegación, inicio y vuelta desde la emisión
«Facturas» se añade a `secciones.ts` tras «Inicio». La página de inicio gana la tarjeta «Listar facturas» (hoy son tres operaciones). `RegistroEmitido` ofrece «Ver todas las facturas» junto a «Emitir otra factura», porque tras emitir es el siguiente paso natural.

## Risks / Trade-offs

- **Contrato local desfasado respecto al backend** → La tarea 1.1 ejecuta `npm run api:sync && npm run api:types` y compara; si el backend cambió el listado, se corrige el spec antes de implementar.
- **El filtro de NIF puede distinguir mayúsculas en el backend** → Se comprueba contra el backend en el perfil `dev` (tarea 7.1) y, si hace falta, se normaliza en un único punto.
- **Estado de envío viejo en el listado** (una factura `PENDIENTE` pasa a `ACEPTADO` en el backend) → `staleTime` 0 y recarga al montar; no hay refresco automático periódico en esta fase.
- **Tabla ancha en móvil** → Bloques apilados a 360 px, revisados con `/impeccable critique` y a mano.
- **Volumen grande de facturas** → Solo se transfiere una página (máximo 100) y el resumen no trae líneas ni QR; no hace falta virtualización.
- **Facturas de otros emisores cuando llegue el multi-cliente** → La API filtrará por el emisor de la sesión; el frontal no cambia.

## Migration Plan

No hay migración: se añaden una ruta y componentes. Desplegar el frontal no requiere cambios en el backend ni en el borde (`GET /api/v1/facturas` ya existe y el Caddy del borde ya reenvía `/api`). Vuelta atrás: la del despliegue habitual (`/opt/verifactu/.last-good-tag-web`).

## Open Questions

- **¿Debe `/facturas` ser la pantalla de entrada?** `notes/plan-por-fases.md` la llama «pantalla de entrada». Este change deja `/` como está y enlaza el listado desde la navegación y el inicio. Convertirlo en la portada es un cambio de enrutado y de contenido de `/` que no altera ninguna otra tarea, así que se puede decidir tras ver el listado funcionando.
- **¿Hace falta mostrar el tipo de factura con su descripción (F1, F2…) o basta el código?** Se muestra con el mismo texto que usa la emisión (`etiquetas.ts`); si resulta largo a 360 px, se deja solo el código con la descripción accesible.
