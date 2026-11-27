# Proposal

## Why

En el listado de facturas, «Anterior», «Siguiente» y el selector de tamaño están debajo de la tabla. Al pulsarlos, la página nueva se carga pero la vista se queda abajo, y para leer desde la primera fila hay que subir a mano. Con 50 o 100 facturas por página es una subida larga, repetida en cada cambio de página. Lo detectó la revisión de diseño del listado (tarea 7.4 de `listar-facturas`, P2) y está recogido en la issue #91.

Hoy no hay ningún desplazamiento programático en la aplicación: el listado se limita a cambiar la query de la URL y a repintar la tabla.

## What Changes

- **Al cambiar de página o de tamaño de página** con los controles de paginación, si el inicio de la tabla queda por encima de la parte visible de la pantalla, la vista se desplaza hasta el inicio de la tabla. El desplazamiento es inmediato, sin animación.
- **Si el inicio de la tabla ya se ve** (una lista corta en escritorio, con los controles a la vista sin haber desplazado), no se desplaza nada.
- **No se desplaza** al aplicar o quitar filtros (el formulario está arriba), al cargar el listado, ni al volver atrás o adelante en el navegador.
- **El foco no se mueve:** se queda en el control pulsado, de modo que con teclado se puede seguir pasando de página con «Siguiente» sin volver a buscarlo.

### Fuera de alcance

- Mover el foco a la tabla o anunciar la página nueva con una región en vivo (el listado ya anuncia «Cargando facturas…» mientras carga).
- Recordar la posición de desplazamiento al volver desde una factura (es comportamiento del navegador con «atrás»).
- Desplazamiento en otras pantallas.
- Animación del desplazamiento: se descarta, no es una mejora y evita el caso de `prefers-reduced-motion`.
- «Quitar filtros» duplicado (issue #92, aparte).

### Dependencia del backend

**Ninguna.** Es solo comportamiento del navegador.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `listado-facturas`: se añade un requisito sobre dónde queda la vista al cambiar de página o de tamaño de página. No cambia ningún requisito existente: «Paginación» sigue definiendo los controles y las peticiones.

## Impact

- **Código:** `src/paginas/listado/ListadoFacturas.tsx` (una referencia al inicio de la tabla y la llamada al cambiar de página o de tamaño) y una función pequeña en `src/paginas/listado/`; tests del listado y un escenario en `e2e/listado.spec.ts`.
- **Dependencias nuevas:** ninguna.
- **Documentación:** la nota de revisión de `.impeccable/surfaces/src-paginas-listado-ListadoFacturas-tsx.md` pasa de «P2 abierto» a resuelto.
- **Coste AWS:** 0 USD adicionales.
