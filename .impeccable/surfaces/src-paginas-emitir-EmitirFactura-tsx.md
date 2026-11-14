---
version: 1
slug: "src-paginas-emitir-EmitirFactura-tsx"
primary_target: "src/paginas/emitir/EmitirFactura.tsx"
related_targets: ["src/paginas/emitir/FormularioEmision.tsx"]
---

## Scope

Pantalla de emisión de factura (`/facturas/nueva`). Modo: Operate. Usuario: operador interno en preproducción que emite facturas de prueba y revisa el resultado ante la AEAT. Composición fijada en `openspec/changes/emitir-factura/design.md` (D9), dentro del mundo «Libro registro» de `DESIGN.md`. No repite la elección de mundo.

## Direction contract

THESIS: La factura se lee como un asiento: cabecera en una fila, destinatario en un bloque con filete, líneas en tabla pautada con columnas fijas y totales al pie, como el pie de un folio.

OWN-WORLD: Mismos tokens que el armazón (`src/estilos/tokens.css`). Tinta índigo solo para el botón principal y el total; filetes de pauta para separar asientos; error en rojo con texto.

STORY: El operador rellena un asiento, ve el total orientativo mientras escribe y, al emitir, sabe qué ha pasado con la factura ante la AEAT.

FIRST VIEWPORT: Titular «Emitir factura» y, debajo, la cabecera del asiento (serie, número, fecha, tipo, régimen). Después el destinatario y la tabla de líneas. El botón «Emitir» queda al pie de los totales.

FORM: Tabla pautada de líneas con columnas fijas; a 360 px cada línea se apila en bloque con etiquetas visibles.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Ninguna. La entrevista de `/impeccable shape` no se ha ejecutado en esta fase: la composición se toma del diseño.
