# Tasks

## 1. Desplazamiento al paginar

- [ ] 1.1 Crear en `src/paginas/listado/` la función `volverAlInicioDeLaTabla(elemento)`: desplaza con `scrollIntoView({ block: 'start', behavior: 'instant' })` solo si `getBoundingClientRect().top` es negativo, y no falla si el navegador no tiene `scrollIntoView` ni si el elemento es nulo. Se verifica con tests unitarios de los cuatro casos: top negativo (se desplaza), top cero o positivo (no se desplaza), `scrollIntoView` ausente (no lanza) y elemento nulo (no lanza)
- [ ] 1.2 Conectarla en `ListadoFacturas.tsx`: referencia en el `<output>` «Cargando facturas…» y llamada al pulsar «Anterior» y «Siguiente» y al cambiar el tamaño de página, y no al filtrar, al quitar filtros ni desde «Volver a la primera página». Se verifica con tests de la pantalla (con `scrollIntoView` y `getBoundingClientRect` sustituidos) de los escenarios «Siguiente», «Cambiar el tamaño», «El inicio de la tabla ya se ve», «Filtrar no desplaza», «Cargar o navegar con el historial no desplaza» (abrir con `?page=1`) y «El foco se queda en el control»

## 2. Comprobación en navegador

- [ ] 2.1 Escribir los escenarios E2E en `e2e/listado.spec.ts`: a 360 y 1280 px, con 50 facturas simuladas y varias páginas, desplazar hasta «Siguiente», pulsarlo y comprobar que el inicio de la tabla queda a la vista y que el foco sigue en «Siguiente»; y a 1280 px con 3 facturas, comprobar que la posición de desplazamiento no cambia. Se verifica con `npm run test:e2e` en verde

## 3. Cierre

- [ ] 3.1 Pasar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` y `npx impeccable detect` sobre la pantalla en marcha. Se verifica con los seis comandos sin errores
- [ ] 3.2 Actualizar la sección Review de `.impeccable/surfaces/src-paginas-listado-ListadoFacturas-tsx.md`: marcar como resuelto el punto «al cambiar de página el scroll no vuelve al inicio del listado». Se verifica con el fichero actualizado y sin ese punto en los abiertos
