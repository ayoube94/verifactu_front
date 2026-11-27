# Design

## Context

`ListadoFacturas` (`src/paginas/listado/ListadoFacturas.tsx`) cambia de página escribiendo la query de la URL (`cambiarPagina` y `cambiarTamano`), y la consulta (`useListadoFacturas`) conserva la página anterior mientras llega la siguiente (`keepPreviousData`). Los controles de paginación están debajo de la tabla. El desplazamiento de la página no se toca en ningún sitio de la aplicación: no hay llamadas a `scrollTo` ni a `scrollIntoView`, ni `scroll-behavior` en el CSS, y la cabecera no es fija (no hace falta compensarla).

Los tests de `src/paginas/listado/` usan jsdom, donde `Element.prototype.scrollIntoView` no existe y `window.scrollTo` solo escribe un aviso de «no implementado»; `getBoundingClientRect` devuelve todo ceros.

Ver `proposal.md` para el motivo y `specs/listado-facturas/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Que al pasar de página desde los controles de abajo se vea el principio de la tabla, sin acciones extra del usuario.
- No desplazar nunca cuando no hace falta ni cuando el cambio de la URL no viene de los controles.

**Non-Goals:**
- Gestión de foco o anuncios nuevos para lectores de pantalla (ver `proposal.md`).
- Un sistema general de restauración del desplazamiento.

## Decisions

### Desplazar desde los manejadores de los controles, no desde un efecto sobre la URL
La llamada se hace en las funciones que reciben «Anterior», «Siguiente» y el cambio de tamaño, justo después de escribir la URL. Un efecto que reaccionara a `page` en la URL también se dispararía al cargar el listado, al volver atrás o adelante y al aplicar filtros, que es justo lo que la spec prohíbe. Los controles de «volver a la primera página» del estado vacío y los filtros no la usan.

Alternativa descartada: *efecto sobre `parametros.page`*. Exigiría distinguir de dónde viene cada cambio con banderas y es más frágil que llamar desde el sitio que lo origina.

### El destino es la región de carga, justo encima de la tabla
Se pone una referencia en el `<output>` «Cargando facturas…», que ya existe, está siempre presente y es el elemento inmediatamente anterior a la tabla. No se añade ningún envoltorio. Si la lista está vacía o hay un error no hay controles de paginación, así que el caso no se da.

Alternativa descartada: *`window.scrollTo(0, 0)`*. Subiría hasta el título y los filtros, y no es lo que pide la issue («al inicio de la tabla»). Además jsdom lo imprime como error.

### Solo si el inicio de la tabla queda por encima de lo visible
Antes de desplazar se lee `getBoundingClientRect().top` del destino y solo se desplaza si es negativo. Sin esa condición, en escritorio con una lista corta (todo a la vista, sin haber desplazado) el listado «saltaría» de forma innecesaria al pulsar «Siguiente», ocultando los filtros. Con una página de 50 o 100 filas, estando abajo, el inicio de la tabla siempre está por encima y se desplaza.

### Inmediato, sin animación
Se llama a `scrollIntoView({ block: 'start', behavior: 'instant' })`. `instant` ignora un `scroll-behavior: smooth` que se añadiera globalmente más adelante. Al no haber animación no hay nada que atenuar con `prefers-reduced-motion`; el principio de `DESIGN.md` es que el movimiento comunica un estado y aquí no aporta nada.

### El foco no se mueve
El foco se queda en el botón pulsado. Moverlo a la tabla impediría pasar varias páginas seguidas con «Siguiente» desde el teclado, y la tabla no es un control. Si el botón queda fuera de la pantalla tras el desplazamiento, el navegador lo vuelve a mostrar en cuanto el usuario interactúa con él, que es el comportamiento estándar.

### Cómo se verifica
- **Unit (jsdom):** la función auxiliar se prueba con un elemento simulado. La integración en la pantalla se prueba sustituyendo `scrollIntoView` y `getBoundingClientRect` (en jsdom no existen o devuelven ceros) y comprobando que se llama con `{ block: 'start', behavior: 'instant' }` al paginar y al cambiar de tamaño, y que no se llama al filtrar ni al abrir con `?page=1`.
- **E2E (Playwright, 360 y 1280 px):** con una lista larga se desplaza hasta los controles, se pulsa «Siguiente» y se comprueba que el inicio de la tabla queda a la vista; con una lista corta a 1280 px no cambia la posición de desplazamiento.

## Risks / Trade-offs

- **`behavior: 'instant'` no reconocido en un navegador antiguo** → Los navegadores que no lo entienden lo tratan como `auto`, también inmediato salvo que el CSS diga lo contrario, y hoy no lo dice.
- **jsdom sin `scrollIntoView`** → La llamada es opcional (`elemento.scrollIntoView?.()`), de modo que ningún test existente falla; los nuevos lo sustituyen.
- **El botón pulsado queda fuera de pantalla tras desplazar** → Aceptado por lo dicho en la decisión del foco.

## Migration Plan

No hay migración. Vuelta atrás: revertir el commit.
