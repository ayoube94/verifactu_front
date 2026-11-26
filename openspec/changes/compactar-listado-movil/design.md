# Design

## Context

El listado (`src/paginas/listado/TablaFacturas.tsx` y su CSS) es una `<table>` real con seis columnas: factura, fecha, tipo, cliente, importe y estado. Hasta 480 px el CSS convierte la tabla en bloques (`display: block`): se oculta la cabecera, cada `<td>` pasa a `display: flex` con `justify-content: space-between` y su etiqueta sale de `td::before { content: attr(data-etiqueta) }`. Es el mismo patrón que la tabla de líneas de la vista de factura.

Observado en la captura a 360 px con 8 facturas (revisión 7.4): cada factura son seis filas de una línea, salvo «Tipo» (código más descripción, hasta tres líneas) y «Cliente» (nombre largo más NIF). Ver `proposal.md` para el motivo y `specs/listado-facturas/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Un bloque de factura al menos un 20 % más bajo a 360 px, sin perder ningún dato ni su etiqueta.
- Cambio solo de presentación, localizado en la tabla del listado.

**Non-Goals:**
- Cambiar el patrón de tabla apilada, el punto de corte de 480 px o el listado a ancho de escritorio.
- Compactar otros datos (cliente, importe, estado): la propuesta se limita a fecha y tipo.

## Decisions

### Fecha y tipo en la misma línea con una rejilla de dos columnas
En el `@media (max-width: 480px)` cada `<tr>` pasa de bloque a `display: grid` con dos columnas iguales. La factura, el cliente, el importe y el estado ocupan la fila entera (`grid-column: 1 / -1`) y fecha y tipo, que ya son consecutivos en el DOM, una columna cada uno. No hace falta tocar el orden del HTML ni añadir elementos, así que el orden de lectura y de tabulación no cambia.

Cada celda de media anchura (unos 150 px a 360 px) mantiene su etiqueta delante del valor («Fecha 05/03/2026», «Tipo F3»). Si no cupieran en una línea, la etiqueta y el valor pasan a dos líneas dentro de su celda (`flex-wrap`) en lugar de desbordar, con `min-width: 0` en la rejilla.

Alternativas descartadas:
- *Una sola celda «Fecha y tipo» con el texto unido:* cambia el HTML y la tabla de escritorio, y pierde la etiqueta de cada dato.
- *Reducir el relleno de todas las filas:* ahorra poco y empeora la zona táctil.
- *Pasar a tarjetas:* es un rediseño distinto, fuera de alcance.

### La descripción del tipo se oculta visualmente, no se elimina
A 360 px la descripción del tipo se recorta con la técnica de «solo lectores de pantalla» (caja de 1 px recortada, como ya hace la leyenda de la tabla), no con `display: none`. Así el valor accesible de la celda sigue siendo «F1 Factura ordinaria» y un lector de pantalla no se queda con un código sin explicar. Para que se lea con espacio, el HTML lleva un espacio entre el código y la descripción, que hoy no hace falta porque van en bloques.

La descripción se separa del NIF con su propia clase: hoy ambos usan `.secundario`, y el NIF debe seguir visible en móvil.

Alternativas descartadas:
- *`display: none`:* quita la descripción del árbol de accesibilidad.
- *`title` o `<abbr>`:* no es accesible en pantallas táctiles.
- *Ocultarla en JavaScript con `matchMedia`:* complica y duplica el punto de corte que ya está en CSS.

### Cómo se verifica
Un test de jsdom no puede medir el diseño, así que se reparte:
- **Unit (Testing Library):** la celda del tipo contiene el código y la descripción en su texto, y las celdas siguen teniendo su `data-etiqueta`.
- **E2E (Playwright, a 360 px):** fecha y tipo comparten posición vertical, la descripción tiene una caja de 1 px, y no hay desplazamiento horizontal con nombres largos (el escenario que ya existe). A 1280 px la descripción es visible.
- **Medición del 20 %:** se mide la altura de cada bloque antes y después con el mismo conjunto de 8 facturas y la misma captura, y se anotan las cifras en el PR. No se fija en un test porque depende de la tipografía del sistema.

## Risks / Trade-offs

- **Fecha y tipo no caben en media columna** (por ejemplo, tipografía grande del usuario) → `flex-wrap` y `min-width: 0` hacen que bajen a dos líneas en su celda sin desbordar; se prueba a 360 px con el texto ampliado.
- **El ahorro es menor del 20 %** → La medición previa (tarea 1.1) fija la base; si no se llega, se ajusta el relleno antes de dar la tarea por hecha, o se reabre el alcance con el usuario, no se baja el umbral.
- **Lectores de pantalla leen «F1Factura ordinaria» sin espacio** → Se añade el espacio en el HTML y el test comprueba el texto de la celda.
- **Divergencia con la tabla de líneas de la factura** (que seguirá en una columna) → Aceptado: son pantallas con densidades distintas, y no se toca.

## Migration Plan

No hay migración: es CSS y una clase nueva. Vuelta atrás: revertir el commit.

## Open Questions

- **¿Se compacta también el importe junto a la factura?** Ahorraría otra línea, pero la propuesta se limita a lo pedido en la issue #90. Si tras medir no se alcanza el 20 %, es el siguiente candidato y se decidiría entonces.
