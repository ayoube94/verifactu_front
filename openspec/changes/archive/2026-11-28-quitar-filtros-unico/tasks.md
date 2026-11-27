# Tasks

## 1. Un solo «Quitar filtros»

- [x] 1.1 Añadir a `FiltrosListado` la propiedad opcional `ocultarQuitar` y pasarla desde `ListadoFacturas.tsx` con `vacio === 'sin-resultados'`, de modo que el formulario no muestre «Quitar filtros» en ese estado y lo siga mostrando en el resto. Se verifica con tests de la pantalla de los escenarios «Ninguna cumple los filtros» (un único «Quitar filtros», dentro del estado vacío, y al pulsarlo vuelve la lista sin filtros) y «Con resultados «Quitar filtros» sigue en el formulario» (un único botón, en el formulario), con `npm test` en verde

## 2. Cierre

- [x] 2.1 Pasar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` y `npx impeccable detect` sobre `src/`. Se verifica con los seis comandos sin errores
- [x] 2.2 Actualizar la sección Review de `.impeccable/surfaces/src-paginas-listado-ListadoFacturas-tsx.md`: marcar como resuelto el punto P3 «Quitar filtros aparece dos veces». Se verifica con el fichero actualizado y sin ese punto en los abiertos
