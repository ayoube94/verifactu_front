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

FORM: Tabla con cabeceras de columna (factura, fecha, tipo, cliente, importe a la derecha con cifras tabulares, estado). A 360 px cada fila se apila como bloque compacto de dos columnas: factura e importe en una línea, fecha y tipo en otra (el tipo solo con su código; la descripción queda para lectores de pantalla), y cliente y estado en una línea propia cada uno; etiquetas pequeñas y celdas que envuelven, sin desplazamiento horizontal ni con la letra al 200 %.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Review (tarea 7.4, 2026-11-23)

Revisión hecha en un solo contexto (sin sub-agentes), con capturas a 1280 y 360 px de los estados con datos, vacío, sin resultados y error, y `impeccable detect` sin hallazgos sobre la página en marcha.

- **P1 corregido:** un rango de fechas invertido mostraba el error pero no movía el foco, de modo que un lector de pantalla no lo anunciaba. Ahora se enfoca «Fecha desde» y su error se lee por `aria-describedby`.
- **P2 corregido:** a 360 px los seis filtros ocupaban una columna cada uno; serie y número comparten fila.
- **P2 resuelto** (change `compactar-listado-movil`, #90): a 360 px el bloque medio de una factura baja de 281 a 185 px (−34,2 %; el típico de 272 a 184 px) y las 8 facturas de la revisión de 2.244 a 1.478 px. Se logró juntando fecha y tipo (−19,2 % por sí solo), factura e importe, y con etiquetas de 13 px y relleno lateral de 8 px. Efecto añadido: ya no hay desbordamiento horizontal con la letra del navegador al 200 %, que existía antes.
- **P2 resuelto** (change `volver-arriba-al-paginar`, #91): «Anterior», «Siguiente» y el cambio de tamaño llevan la vista al inicio de la tabla, de inmediato y sin animación, solo si ese inicio queda por encima de lo visible; filtrar, cargar y el historial no desplazan, y el foco se queda en el control.
- **P3 resuelto** (change `quitar-filtros-unico`, #92): en «Ninguna factura cumple los filtros» queda un único «Quitar filtros», el del estado vacío; el formulario lo oculta solo en ese estado y lo sigue mostrando con resultados.

## Unresolved

Ninguna. La entrevista de `/impeccable shape` no se ha ejecutado en esta fase: la composición se toma del diseño.
