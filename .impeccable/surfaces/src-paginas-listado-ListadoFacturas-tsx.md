---
version: 1
slug: "src-paginas-listado-ListadoFacturas-tsx"
primary_target: "src/paginas/listado/ListadoFacturas.tsx"
related_targets: ["src/paginas/listado/FiltrosListado.tsx", "src/paginas/listado/TablaFacturas.tsx", "src/paginas/listado/Paginacion.tsx", "src/paginas/listado/EstadoVacio.tsx"]
---

## Scope

Listado de facturas (`/facturas`). Modo: Operate. Usuario: operador interno que busca una factura por serie, número, cliente, fecha o estado ante la AEAT, o repasa las que la AEAT ha rechazado. Composición fijada en `openspec/changes/listar-facturas/design.md`, dentro del mundo «Libro registro» de `DESIGN.md`. No repite la elección de mundo.

## Direction contract

THESIS: El listado es el índice del libro registro: una fila pautada por asiento, ordenada como la API la devuelve, con el estado ante la AEAT siempre en palabras.

OWN-WORLD: Mismos tokens que el armazón (`src/estilos/tokens.css`). Tinta índigo solo para «Filtrar» y los enlaces; filetes de pauta entre filas; el tono del estado (verde, ámbar, rojo) refuerza el texto, nunca lo sustituye.

STORY: El operador filtra, localiza la factura, la abre y vuelve con «atrás» al mismo listado y los mismos filtros, porque el estado vive en la URL.

FIRST VIEWPORT: Titular «Facturas», los seis filtros en dos filas y, debajo, la tabla. A 360 px serie y número comparten fila para que la primera factura quede lo más a mano posible.

FORM: Tabla con cabeceras de columna (factura, fecha, tipo, cliente, importe a la derecha con cifras tabulares, estado). A 360 px cada fila se apila como bloque con la etiqueta de cada dato; sin desplazamiento horizontal.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Review (tarea 7.4, 2026-11-23)

Revisión hecha en un solo contexto (sin sub-agentes), con capturas a 1280 y 360 px de los estados con datos, vacío, sin resultados y error, y `impeccable detect` sin hallazgos sobre la página en marcha.

- **P1 corregido:** un rango de fechas invertido mostraba el error pero no movía el foco, de modo que un lector de pantalla no lo anunciaba. Ahora se enfoca «Fecha desde» y su error se lee por `aria-describedby`.
- **P2 corregido:** a 360 px los seis filtros ocupaban una columna cada uno; serie y número comparten fila.
- **P2 abierto:** a 360 px cada factura ocupa unos 400 px de alto. Candidato: ocultar la descripción del tipo en móvil y fundir fecha y tipo.
- **P2 abierto:** al cambiar de página el scroll no vuelve al inicio del listado.
- **P3 abierto:** en «Ninguna factura cumple los filtros» «Quitar filtros» aparece dos veces (formulario y estado vacío); la spec lo pide en el estado vacío.

## Unresolved

Ninguna. La entrevista de `/impeccable shape` no se ha ejecutado en esta fase: la composición se toma del diseño.
