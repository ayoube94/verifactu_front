# Design

## Context

El listado (`src/paginas/listado/TablaFacturas.tsx` y su CSS) es una `<table>` real con seis columnas: factura, fecha, tipo, cliente, importe y estado. Hasta 480 px el CSS convierte la tabla en bloques (`display: block`): se oculta la cabecera, cada `<td>` pasa a `display: flex` con `justify-content: space-between` y su etiqueta sale de `td::before { content: attr(data-etiqueta) }`. Es el mismo patrón que la tabla de líneas de la vista de factura.

Medición de partida a 360 px, letra normal, con las 8 facturas de la revisión 7.4 (tipos F1, F2, F3 y R1, nombres cortos y largos): **281 px de media por bloque** (272 el típico, 320 el más alto; 2.244 px en total). Cada factura son seis filas de una línea, salvo «Tipo» (código más descripción, hasta tres líneas), «Cliente» (nombre largo más NIF) y «Estado» (su valor se parte en dos líneas porque la etiqueta es larga).

Con la letra del navegador al 200 % el listado ya desbordaba horizontalmente antes de este cambio: la etiqueta de cada celda tiene `flex: none` y empuja el valor fuera del bloque (el culpable observado es «Aceptada por la AEAT»).

Ver `proposal.md` para el motivo y `specs/listado-facturas/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Un bloque de factura al menos un 20 % más bajo a 360 px, sin perder ningún dato ni su etiqueta.
- Que el listado no desborde horizontalmente a 360 px, tampoco con la letra al 200 %.
- Cambio solo de presentación, localizado en la tabla del listado.

**Non-Goals:**
- Cambiar el patrón de tabla apilada, el punto de corte de 480 px o el listado a ancho de escritorio.
- Compactar otras pantallas con el mismo patrón (la vista de factura tiene el mismo problema con letra ampliada, pero queda fuera).

## Decisions

### Rejilla de dos columnas con dos pares: factura e importe, fecha y tipo
En el `@media (max-width: 480px)` cada `<tr>` pasa de bloque a `display: grid` con dos columnas iguales. La factura y el importe forman la primera fila, y la fecha y el tipo la segunda; el cliente y el estado ocupan la fila entera (`grid-column: 1 / -1`). No hace falta añadir elementos ni tocar la tabla de escritorio.

Fecha y tipo ya eran consecutivos en el DOM. El importe no (el orden del DOM es factura, fecha, tipo, cliente, importe, estado), así que se sube con la propiedad `order`: el orden visual pasa a ser factura, importe, fecha, tipo, cliente, estado. Es una divergencia entre orden visual y orden de lectura que se acepta porque en cada fila solo hay un elemento enfocable (el enlace de la factura), de modo que el orden de tabulación no cambia, y un lector de pantalla recorre los datos de cada celda con su etiqueta, que se anuncia igual.

Alternativas descartadas:
- *Una sola celda «Factura e importe» con el texto unido:* cambia el HTML y la tabla de escritorio, y pierde la etiqueta de cada dato.
- *Reordenar las columnas del DOM:* cambiaría también la tabla de escritorio.
- *Pasar a tarjetas:* es un rediseño distinto, fuera de alcance.

### Que quepa en media columna: etiqueta pequeña y menos relleno lateral
Solo con la rejilla, «Importe total» y una cifra como `1.754,50 €` no caben en media columna (unos 156 px de ancho útil) y se parten en dos líneas, de modo que el ahorro es pequeño. Por eso a ≤ 480 px:
- la etiqueta de todas las celdas pasa al tamaño pequeño de la escala (`--texto-pequeno`, 13 px), con lo que además queda subordinada al valor;
- las cuatro celdas de media anchura reducen su relleno lateral de 12 a 8 px y el hueco entre etiqueta y valor a 8 px.

Si aun así no caben (cifras largas), la celda parte el valor a una segunda línea; es el comportamiento especificado.

### Todas las celdas pueden envolver
Se cambia `flex: none` de la etiqueta por celdas con `flex-wrap: wrap` y `min-width: 0`. Así, cuando la etiqueta y el valor no caben, el valor baja a la línea siguiente en vez de empujar el bloque fuera de la pantalla. Es lo que corrige el desbordamiento con letra al 200 %.

### La descripción del tipo se oculta visualmente, no se elimina
A 360 px la descripción del tipo se recorta con la técnica de «solo lectores de pantalla» (caja de 1 px recortada, como ya hace la leyenda de la tabla), no con `display: none`. Así el valor accesible de la celda sigue siendo «F1 Factura ordinaria». Para que se lea con espacio, el HTML lleva un espacio entre el código y la descripción, que hoy no hace falta porque van en bloques. La descripción se separa del NIF con su propia clase, porque el NIF debe seguir visible.

Alternativas descartadas:
- *`display: none`:* quita la descripción del árbol de accesibilidad.
- *`title` o `<abbr>`:* no es accesible en pantallas táctiles.
- *Ocultarla en JavaScript con `matchMedia`:* duplica el punto de corte que ya está en CSS.

### Cómo se verifica
Un test de jsdom no puede medir el diseño, así que se reparte:
- **Unit (Testing Library):** la celda del tipo contiene el código y la descripción en su texto, y las celdas siguen teniendo su `data-etiqueta`.
- **E2E (Playwright, a 360 px):** factura e importe comparten posición vertical, y también fecha y tipo; la descripción tiene una caja de 1 px; no hay desplazamiento horizontal con nombres largos ni con la letra al 200 %. A 1280 px la descripción es visible.
- **Medición del 20 %:** se mide la altura de cada bloque antes y después con el mismo conjunto de 8 facturas, y se anotan las cifras en el PR. No se fija en un test porque depende de la tipografía del sistema.

Medición de la fase de diseño, con CSS inyectado a 360 px y letra normal (media por bloque; la base es 281 px):

| Variante | Media | Cambio |
|---|---|---|
| Fecha y tipo en una línea (ya implementado) | 227 px | −19,2 % |
| + factura e importe, relleno normal | 219 px | −22,1 % |
| + etiqueta pequeña y menos relleno lateral | 184 px | −34,5 % |
| + todas las celdas envuelven | 191 px | −32,0 %, sin desbordar a 200 % |

## Risks / Trade-offs

- **Un importe largo hace que su celda tenga dos líneas y su fila sea más alta que otras** → Aceptado: el valor baja dentro de su celda y el bloque sigue siendo más bajo que el actual (por ejemplo, 184 a 232 px frente a 272 a 320).
- **El ahorro es menor del 20 % con otras tipografías del sistema** → La medición se repite al final (tarea 2.3); si no se llega, se pausa y se consulta, no se baja el umbral.
- **El orden visual (importe junto a la factura) no coincide con el del DOM** → Aceptado por lo dicho arriba; si la tabla ganara más elementos enfocables por fila, habría que revisarlo.
- **Etiqueta de 13 px legible a 360 px** → El texto secundario ya usa esa talla en el producto (NIF, descripciones); se revisa la captura y el contraste con `impeccable detect`.
- **Divergencia con la tabla de líneas de la factura** (que seguirá igual) → Aceptado: son pantallas con densidades distintas.

## Migration Plan

No hay migración: es CSS y una clase nueva. Vuelta atrás: revertir el commit.
