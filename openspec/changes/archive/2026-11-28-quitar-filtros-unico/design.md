# Design

## Context

`FiltrosListado` muestra «Quitar filtros» en su fila de acciones cuando hay algún valor escrito o aplicado (`hayValores(valores) || hayValores(inicial)`). `EstadoVacio`, tipo `sin-resultados`, muestra otro «Quitar filtros» con la misma acción (`quitar` de `ListadoFacturas`, que vacía los filtros y vuelve a la página 0). `ListadoFacturas` ya calcula el tipo de vacío (`vacio`), y el formulario es hermano del estado vacío, no su padre.

Ver `proposal.md` para el motivo y `specs/listado-facturas/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Un solo «Quitar filtros» visible cuando ninguna factura cumple los filtros.
- No cambiar nada con resultados, cargando o con error.

**Non-Goals:**
- Gestión de foco tras la acción (ver `proposal.md`).

## Decisions

### Se queda el botón del estado vacío
Está junto al mensaje que explica por qué no hay nada, donde está la atención del usuario, y la spec ya lo pedía: no hay que reescribir ese requisito, solo precisarlo. Quitar el del estado vacío y dejar el del formulario obligaría a cambiar su texto de ayuda («quita los filtros para ver todas las facturas»), que apuntaría a una acción que estaría arriba, lejos.

Alternativa descartada: *quitar siempre el del formulario*. Con resultados y filtros activos el usuario necesita una salida rápida desde el propio formulario.

### El formulario lo oculta solo en el estado «sin resultados»
`ListadoFacturas` pasa a `FiltrosListado` una propiedad booleana (`ocultarQuitar`, verdadera cuando `vacio === 'sin-resultados'`). La decisión se toma donde ya se conoce el estado y el formulario no necesita saber nada de la consulta. Mientras carga, con error o con resultados, `vacio` no es `sin-resultados` y el botón sigue como hoy.

Alternativa descartada: *que `EstadoVacio` no muestre su botón cuando el formulario ya tiene el suyo*. Invierte la decisión tomada arriba y deja el estado vacío sin acción propia.

### Sin parpadeo al cambiar de estado
`vacio` solo vale `sin-resultados` cuando hay una página cargada sin facturas, así que el botón del formulario desaparece en el mismo render en que aparece el del estado vacío, y reaparece cuando llegan resultados. Con `keepPreviousData` no hay un instante con los dos ni con ninguno.

### Cómo se verifica
- **Unit (jsdom):** test de pantalla con filtros y sin resultados que busca todos los botones «Quitar filtros» y espera uno, dentro del estado vacío; y con filtros y con resultados, uno, dentro del formulario. El test existente de pulsar el del estado vacío sigue valiendo.

## Risks / Trade-offs

- **Quien edita los campos en el estado vacío no ve «Quitar filtros» en el formulario** → Tiene el del estado vacío a la vista, justo debajo, y «Filtrar» sigue disponible para probar otros valores.
- **El foco se pierde al pulsar el botón del estado vacío (desaparece con él)** → Igual que hoy; queda fuera de alcance.

## Migration Plan

No hay migración. Vuelta atrás: revertir el commit.
