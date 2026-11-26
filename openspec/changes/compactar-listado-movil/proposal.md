# Proposal

## Why

La revisión de diseño del listado (tarea 7.4 de `listar-facturas`) detectó que a 360 px cada factura se apila en un bloque de unos 300 a 400 px de alto: seis filas de datos, y la de «Tipo» ocupa dos o tres líneas por la descripción («Factura emitida en sustitución de simplificadas»). Ocho facturas ocupan más de 3.000 px y, en móvil, cuesta escanear el listado y encontrar una factura. El uso en móvil es ocasional pero previsto («consultar», según `PRODUCT.md`), y la pantalla de entrada del trabajo diario es precisamente este listado. Ver la issue #90.

## What Changes

- **Pantallas estrechas (hasta 480 px):** cada factura del listado se muestra en un bloque más bajo:
  - fecha y tipo comparten una misma fila, cada uno con su etiqueta visible;
  - el tipo se muestra solo con su código (`F1`); la descripción («Factura ordinaria») deja de verse, pero sigue disponible para lectores de pantalla;
  - el resto de datos (factura, cliente con su NIF, importe y estado ante la AEAT) mantienen su etiqueta y orden.
- **Escritorio y tablet (más de 480 px):** sin cambios. La tabla sigue mostrando el tipo con su descripción.
- **Lo que no cambia:** los datos, el orden de la API, los enlaces, el estado en texto con su tono y la ausencia de desplazamiento horizontal.

### Fuera de alcance

- Cambiar los datos que muestra el listado o añadir columnas.
- Rediseñar el listado como tarjetas o con otro patrón distinto de la tabla apilada.
- Compactar otras pantallas (la vista de factura, la emisión).
- El comportamiento de la paginación y de los filtros (las issues #91 y #92 son aparte).
- Un punto de corte nuevo: se reutiliza el de 480 px que ya usan la tabla de líneas de la factura y este listado.

### Dependencia del backend

**Ninguna.** Es solo presentación: los campos son los que ya devuelve `GET /api/v1/facturas`.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `listado-facturas`: se añade un requisito sobre cómo se presentan las filas en pantallas estrechas (fecha y tipo en una fila, tipo sin descripción visible pero accesible). No cambia ningún requisito existente: «Filas del listado» sigue exigiendo mostrar el tipo, y esto lo concreta para móvil.

## Impact

- **Código:** `src/paginas/listado/TablaFacturas.tsx` y `TablaFacturas.module.css`; tests de `TablaFacturas` y el escenario de 360 px de `e2e/listado.spec.ts`.
- **Dependencias nuevas:** ninguna.
- **Documentación:** la nota de revisión de `.impeccable/surfaces/src-paginas-listado-ListadoFacturas-tsx.md` pasa de «P2 abierto» a resuelto.
- **Coste AWS:** 0 USD adicionales.
