---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/estilos/tokens.css"]
---

## Scope

Armazón de la aplicación Zefact (cabecera, navegación, estado del servicio, inicio, no encontrado) y el mundo que heredan las pantallas de emisión, consulta y verificación. Modo: Operate. Usuario: operador interno en preproducción.

## Direction contract

THESIS: Cada factura es un asiento numerado del libro registro y su huella arrastra la anterior, como el «suma y sigue». Rechaza el SaaS por defecto: barra lateral gris, tarjetas blancas y etiquetas de color.

OWN-WORLD: Cabecera verde botella (#1E3B32), fondo papel (#F5F6F0), tinta índigo (#24346E) reservada para la acción principal y lo activo, filetes de pauta verde (#8FAE9A / #C9D6CC), rojo (#B42318) solo para error. Pila de sistema, cifras tabulares, una talla que hace casi todo; huellas en monoespaciada solo porque son datos.

STORY: El operador ve al instante el estado frente a la AEAT, entiende que el registro está encadenado y puede verificarlo o descargar el XML.

FIRST VIEWPORT: Cabecera de 64px con Zefact, navegación y estado del servicio a la derecha; contenido sobre papel con titular serie-número en índigo, datos y tabla con filetes; columna derecha separada por filete con estado, «suma y sigue» y acciones.

FORM: Libro registro de facturas expedidas, quinto de mi lista ordenada; seed:6d60a352a4d34de7. Raises: serie-número como único titular (Saville); columnas fijas que se restilan por estado (panel de salidas); un solo color reservado (orientación); lo inactivo en gris (catálogo); acciones irreversibles aisladas (consola); una talla hace el trabajo (manual).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Tema oscuro fuera de alcance.
