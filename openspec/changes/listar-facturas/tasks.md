# Tasks

## 1. Contrato, ruta y navegación

- [x] 1.1 Ejecutar `npm run api:sync && npm run api:types` y comprobar que `GET /api/v1/facturas`, `FacturaResumenDto` y `PaginaFacturasDto` siguen como en el spec. Se verifica con `npm run api:check` en verde y sin diferencias en `contrato/openapi.json` (o, si las hay, con el spec corregido antes de seguir)
- [x] 1.2 Añadir la ruta `/facturas` con una página vacía `ListadoFacturas` (título «Facturas · Zefact») y la sección «Facturas» en `src/app/secciones.ts`, tras «Inicio». Se verifica con un test de que la navegación muestra «Facturas» marcada como activa en `/facturas`, y de que `/facturas/nueva` y `/facturas/42` siguen mostrando la emisión y la factura
- [x] 1.3 Añadir «Listar facturas» a las operaciones de la página de inicio como enlace a `/facturas`. Se verifica con un test de que el enlace existe y navega

## 2. Parámetros del listado

- [x] 2.1 Crear `leerParametros(query)` y `aQuery(parametros)` en `src/paginas/listado/listado.ts`: valores por defecto (`page` 0, `size` 20), descarte de `page` no válido, `size` fuera de 10/20/50/100, `estadoEnvio` desconocido y fechas mal formadas, `trim` de los textos y omisión de los vacíos, y URL solo con lo que difiere del defecto. Se verifica con tests unitarios de los escenarios «Campos vacíos» y «Valores de la URL no válidos» y de que `aQuery(leerParametros(q))` es estable

## 3. Consulta de la página

- [x] 3.1 Crear `listarFacturas(parametros)` con los tipos generados y el hook `useListadoFacturas` (clave `['facturas', parametros]`, `keepPreviousData`, `retry: false`, `staleTime` 0, sin persistencia), mapeando 400, 500 y fallo de red con `src/api/problemas.ts`. Se verifica con tests MSW de 200 (la petición lleva exactamente los parámetros del spec), 400 con `errores`, 500 con `errorId` y `HttpResponse.error()`

## 4. Filtros

- [x] 4.1 Crear el formulario de filtros (serie, número, NIF, fecha desde, fecha hasta y estado, con los textos de `estadoEnvio.ts`) con etiquetas visibles, «Filtrar» y «Quitar filtros», que escribe en la URL y vuelve a la página 0. Se verifica con tests de los escenarios «Aplicar un filtro», «Filtros combinados», «Quitar los filtros» y «Cambiar un filtro vuelve a la primera página»
- [x] 4.2 Validar que la fecha desde no sea posterior a la fecha hasta, con el mensaje junto al campo y sin petición, y repartir un 400 con `errores` a los filtros visibles (resto, a un mensaje general). Se verifica con tests del rango invertido y de un 400 sobre `fechaDesde` y sobre `size`
- [x] 4.3 Restaurar los filtros de la URL en el formulario al abrir `/facturas?...` y al volver atrás. Se verifica con un test que abre `/facturas?estadoEnvio=RECHAZADO&page=1` y comprueba el selector y la petición, y con otro de filtrar, abrir una factura y volver atrás

## 5. Tabla de facturas

- [x] 5.1 Crear la tabla con serie y número como enlace a `/facturas/:id`, fecha `dd/mm/aaaa`, tipo, cliente (nombre y NIF), importe con coma decimal y €, y estado con texto y tono, en el orden de la API. Se verifica con tests de la fila del spec (`2026/001`, `05/03/2026`, `1.210,00 €`), del enlace a `/facturas/42`, del estado `RECHAZADO` frente a `ACEPTADO` y de que el orden no se altera
- [x] 5.2 Maquetar el bloque apilado a 360 px con la etiqueta de cada dato y cifras tabulares en el importe, sin desplazamiento horizontal. Se verifica con `npm run build` y la revisión a 360 px de la tabla con nombres de cliente largos

## 6. Paginación y estados

- [x] 6.1 Crear los controles de paginación («Anterior», «Siguiente», «Página N de M», total de facturas y selector de 10/20/50/100) que escriben `page` y `size` en la URL. Se verifica con tests de los escenarios «Navegar entre páginas», «Primera y última página», «Cambiar el tamaño» y «Una sola página»
- [x] 6.2 Crear los estados vacíos: «Todavía no hay facturas» con enlace a «Emitir factura», «Ninguna factura cumple los filtros» con «Quitar filtros» y página fuera de rango con vuelta a la primera. Se verifica con tests MSW de los tres escenarios
- [x] 6.3 Mostrar la carga en una región `aria-live` («Cargando facturas…») sin perder los filtros, el 500 con `errorId` y el fallo de red con «Reintentar». Se verifica con tests MSW de carga, 500 y `HttpResponse.error()`, comprobando que los filtros escritos se conservan
- [x] 6.4 Añadir «Ver todas las facturas» en `RegistroEmitido`, junto a «Emitir otra factura». Se verifica con un test del flujo de emisión que comprueba que el enlace lleva a `/facturas`

## 7. Verificación integral

- [ ] 7.1 Con el backend en perfil `dev` y `npm run dev`, emitir dos facturas y comprobar el listado: orden, cada filtro por separado y combinados, paginación con `size` 10, y si el filtro de NIF distingue mayúsculas (si es así, normalizarlo en un único punto y cubrirlo con test). Se verifica con una nota del resultado en el PR y, si cambia algo, su test
- [x] 7.2 Escribir el escenario E2E en `playwright`: emitir una factura, abrir `/facturas`, filtrar por su serie y número, entrar en la factura y volver atrás con el filtro intacto. Se verifica con `npm run test:e2e` en verde
- [x] 7.3 Pasar `npm run lint`, `npm run typecheck`, `npm test` y `npx impeccable detect` sobre la pantalla nueva, y corregir los hallazgos. Se verifica con los cuatro comandos sin errores
- [x] 7.4 Revisar la pantalla con `/impeccable critique` y `/impeccable audit` a 360 px y con teclado, y corregir los P0 y P1. Se verifica con el informe sin P0 ni P1 abiertos y anotando la composición en `.impeccable/surfaces/`
