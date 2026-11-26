# Tasks

## 1. Medición y marcado

- [ ] 1.1 Medir la altura actual de cada bloque de factura a 360 px con un script de Playwright y las 8 facturas de la revisión 7.4 (nombres cortos y largos, tipos F1, F2, F3 y R1). Se verifica con la tabla de alturas (por factura y media) anotada en el PR, como base del 20 %
- [ ] 1.2 Separar en `TablaFacturas.tsx` la descripción del tipo del NIF con su propia clase, y poner un espacio entre el código y la descripción. Se verifica con un test que comprueba que el texto de la celda de tipo es «F3 Factura emitida en sustitución de simplificadas», que el NIF sigue en su celda y que todas las celdas conservan su `data-etiqueta`

## 2. Estilos a 360 px

- [ ] 2.1 En `TablaFacturas.module.css`, hasta 480 px: rejilla de dos columnas por fila con fecha y tipo en una columna cada una y el resto de celdas a fila completa, y descripción del tipo recortada como solo para lectores de pantalla. Sin cambios por encima de 480 px. Se verifica con un E2E a 360 px (fecha y tipo con la misma posición vertical, descripción con caja de 1 px) y otro a 1280 px (descripción visible)
- [ ] 2.2 Comprobar la reducción y el comportamiento con texto ampliado: repetir la medición de 1.1, comprobar que el bloque típico baja al menos un 20 % y que con el tamaño de letra del navegador al 200 % fecha y tipo bajan a dos líneas sin desbordar. Se verifica con las cifras antes y después en el PR, la captura revisada a 360 px y el escenario de nombres largos de `e2e/listado.spec.ts` en verde. Si no se llega al 20 %, se pausa y se consulta (ver `design.md`, Open Questions)

## 3. Cierre

- [ ] 3.1 Pasar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` y `npx impeccable detect` sobre la pantalla en marcha. Se verifica con los seis comandos sin errores
- [ ] 3.2 Actualizar la sección Review de `.impeccable/surfaces/src-paginas-listado-ListadoFacturas-tsx.md`: marcar como resuelto el punto «las filas son altas en móvil» con las cifras medidas. Se verifica con el fichero actualizado y sin ese punto en los abiertos
