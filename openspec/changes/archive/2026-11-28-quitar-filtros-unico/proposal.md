# Proposal

## Why

Cuando hay filtros activos y ninguna factura los cumple, «Quitar filtros» aparece dos veces en la pantalla: en el formulario y en el estado vacío «Ninguna factura cumple los filtros». Es redundante: dos botones iguales a pocos centímetros, con la misma acción. Lo detectó la revisión de diseño del listado (tarea 7.4 de `listar-facturas`, P3) y está recogido en la issue #92.

Hay que decidir cuál se queda. La spec actual pide el botón en el estado vacío (escenario «Ninguna cumple los filtros»), así que quitar ese botón exigiría cambiar la spec; quitar el del formulario no.

## What Changes

- **En «Ninguna factura cumple los filtros»** el único «Quitar filtros» es el del estado vacío, junto al mensaje, que es donde está la atención del usuario cuando no ve resultados.
- **El formulario deja de mostrar «Quitar filtros» solo en ese estado.** Con resultados, o mientras se carga o ha fallado la petición, sigue como hoy: aparece si hay algún filtro escrito o aplicado.
- **La spec lo dice expresamente:** el escenario «Ninguna cumple los filtros» pasa a exigir que haya un único «Quitar filtros», y se añade un escenario que fija que con resultados el botón sigue en el formulario.

### Fuera de alcance

- Mover el foco tras pulsar «Quitar filtros» en el estado vacío (el botón desaparece con el estado vacío, comportamiento actual en las dos variantes).
- Cambiar el aspecto o el texto de los botones.
- «Volver a la primera página» y los otros estados vacíos.

### Dependencia del backend

**Ninguna.** Es solo presentación.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `listado-facturas`: se modifica el requisito «Estados vacíos» (escenario «Ninguna cumple los filtros» y un escenario nuevo). No cambia «Filtros»: el escenario «Quitar los filtros» sigue valiendo para el botón del formulario y para el del estado vacío.

## Impact

- **Código:** `src/paginas/listado/FiltrosListado.tsx` (propiedad para ocultar el botón), `src/paginas/listado/ListadoFacturas.tsx` (la pasa cuando el estado es «sin resultados») y tests del listado.
- **Dependencias nuevas:** ninguna.
- **Documentación:** la nota de revisión de `.impeccable/surfaces/src-paginas-listado-ListadoFacturas-tsx.md` pasa de «P3 abierto» a resuelto.
- **Coste AWS:** 0 USD adicionales.
