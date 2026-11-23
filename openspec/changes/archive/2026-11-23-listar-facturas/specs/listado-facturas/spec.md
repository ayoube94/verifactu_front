# Spec Delta

## Purpose

Permitir al operador ver qué facturas existen, encontrar una por serie, número, cliente, fecha o estado ante la AEAT y abrirla, sin conocer su id de antemano y sin que el navegador decida nada sobre los datos.

## ADDED Requirements

### Requirement: Acceso al listado
La aplicación SHALL ofrecer una pantalla `/facturas`, enlazada desde la navegación principal como «Facturas» y desde la página de inicio como «Listar facturas», que al abrirse carga la primera página sin filtros.

#### Scenario: Desde la navegación
- **WHEN** el usuario pulsa «Facturas» en la navegación
- **THEN** se abre `/facturas` con el enlace marcado como activo, los filtros vacíos y la primera página de facturas

#### Scenario: Desde la página de inicio
- **WHEN** el usuario pulsa «Listar facturas» en la página de inicio
- **THEN** se abre `/facturas`

#### Scenario: Convivencia con las otras rutas de facturas
- **WHEN** el usuario abre `/facturas/nueva` o `/facturas/42`
- **THEN** se muestran la emisión o la factura 42, y no el listado

### Requirement: Filas del listado
El listado SHALL mostrar, por cada factura, la serie y el número, la fecha de expedición, el tipo, el nombre y el NIF del cliente, el importe total y el estado ante la AEAT, en el orden que devuelve la API, y SHALL enlazar cada fila a `/facturas/:id`.

#### Scenario: Página con facturas
- **WHEN** la API responde 200 con una factura `2026/001` de fecha `2026-03-05`, importe 1210 y estado `ACEPTADO`
- **THEN** la fila muestra «2026/001», «05/03/2026» y «1.210,00 €», con el estado en texto y el nombre del cliente con su NIF

#### Scenario: Abrir una factura
- **WHEN** el usuario pulsa el número de la factura de id 42
- **THEN** la aplicación navega a `/facturas/42`

#### Scenario: Estado que no es aceptación
- **WHEN** una factura tiene estado `RECHAZADO` o `ERROR_CONEXION`
- **THEN** el estado se muestra con texto de incidencia y no con el aspecto de una factura aceptada, y solo `ACEPTADO` y `ACEPTADO_CON_ERRORES` se muestran como aceptación

#### Scenario: Orden de la API
- **WHEN** la API devuelve las facturas en un orden
- **THEN** la pantalla las muestra en ese mismo orden, sin reordenarlas

### Requirement: Filtros
La pantalla SHALL ofrecer filtros por serie, número, NIF del cliente, fecha de expedición desde, fecha de expedición hasta y estado de envío, los SHALL enviar a la API combinados y MUST NOT filtrar ni buscar en el navegador.

#### Scenario: Aplicar un filtro
- **WHEN** el usuario elige el estado «Rechazada por la AEAT» y pulsa «Filtrar»
- **THEN** se pide a la API la página 0 con `estadoEnvio=RECHAZADO` y se muestran solo las facturas que devuelve

#### Scenario: Filtros combinados
- **WHEN** el usuario rellena serie `A`, fecha desde `01/03/2026` y fecha hasta `31/03/2026`
- **THEN** la petición lleva los tres parámetros a la vez, con las fechas como `2026-03-01` y `2026-03-31`

#### Scenario: Campos vacíos
- **WHEN** un campo de filtro está vacío o solo tiene espacios
- **THEN** no se envía ese parámetro

#### Scenario: Rango de fechas invertido
- **WHEN** la fecha desde es posterior a la fecha hasta
- **THEN** no se envía ninguna petición y se muestra «La fecha desde no puede ser posterior a la fecha hasta» junto al campo

#### Scenario: Quitar los filtros
- **WHEN** el usuario pulsa «Quitar filtros»
- **THEN** los campos se vacían y se muestra la primera página sin filtros

#### Scenario: Cambiar un filtro vuelve a la primera página
- **WHEN** el usuario está en la página 3 y aplica un filtro nuevo
- **THEN** se pide la página 0

### Requirement: Paginación
La pantalla SHALL paginar el listado con los datos de la API, mostrar el total de facturas y la página actual, y permitir elegir 10, 20, 50 o 100 facturas por página, con 20 por defecto.

#### Scenario: Navegar entre páginas
- **WHEN** la API responde con `page` 0, `totalPages` 3 y `totalElements` 57, y el usuario pulsa «Siguiente»
- **THEN** se pide la página 1 y la pantalla muestra «Página 2 de 3» y «57 facturas»

#### Scenario: Primera y última página
- **WHEN** el usuario está en la primera página
- **THEN** «Anterior» está deshabilitado, y en la última página lo está «Siguiente»

#### Scenario: Cambiar el tamaño
- **WHEN** el usuario elige 50 facturas por página
- **THEN** se pide la página 0 con `size=50`

#### Scenario: Una sola página
- **WHEN** `totalPages` es 1 o menor
- **THEN** no se muestran los controles de página, pero sí el total de facturas

### Requirement: Estado en la URL
La pantalla SHALL reflejar en la query de la URL los filtros, la página y el tamaño que están activos, y SHALL restaurarlos al abrir esa URL o al volver atrás en el navegador, sin guardar nada en el almacenamiento del navegador.

#### Scenario: URL compartida
- **WHEN** el usuario abre `/facturas?estadoEnvio=RECHAZADO&page=1`
- **THEN** el filtro de estado muestra «Rechazada por la AEAT» y se pide la página 1 con ese filtro

#### Scenario: Volver desde una factura
- **WHEN** el usuario filtra, abre una factura y pulsa «atrás» en el navegador
- **THEN** vuelve al listado con los mismos filtros y página

#### Scenario: Valores de la URL no válidos
- **WHEN** la URL trae `page=-1`, `size=1000` o `estadoEnvio=XX`
- **THEN** la pantalla ignora el valor no válido y usa el valor por defecto de ese parámetro, sin enviar a la API un valor que sabe que rechazará

### Requirement: Estados vacíos
La pantalla SHALL distinguir entre que no exista ninguna factura y que ninguna cumpla los filtros.

#### Scenario: Todavía no hay facturas
- **WHEN** la API responde 200 con `totalElements` 0 y no hay filtros activos
- **THEN** la pantalla muestra «Todavía no hay facturas» con un enlace a «Emitir factura»

#### Scenario: Ninguna cumple los filtros
- **WHEN** la API responde 200 con `totalElements` 0 y hay filtros activos
- **THEN** la pantalla muestra «Ninguna factura cumple los filtros» con la acción «Quitar filtros»

#### Scenario: Página fuera de rango
- **WHEN** la URL pide una página mayor que la última y la API responde 200 sin facturas pero con `totalElements` mayor que 0
- **THEN** la pantalla ofrece volver a la primera página en lugar de mostrar «Todavía no hay facturas»

### Requirement: Carga y errores
La pantalla SHALL indicar la carga a las tecnologías de apoyo y distinguir los fallos del servicio, sin perder los filtros escritos.

#### Scenario: Cargando
- **WHEN** la petición de una página está en curso
- **THEN** la pantalla anuncia «Cargando facturas…» en una región `aria-live` y los filtros siguen visibles

#### Scenario: Parámetro rechazado
- **WHEN** la API responde 400 con `errores` que nombra `size` o `fechaDesde`
- **THEN** el motivo se muestra junto al filtro afectado o, si el parámetro no tiene filtro visible, como mensaje general

#### Scenario: Error del servidor
- **WHEN** la API responde 500
- **THEN** la pantalla muestra el mensaje genérico de error del servidor con el `errorId` cuando exista, según el requisito de cliente-api, y los filtros se conservan

#### Scenario: Sin conexión
- **WHEN** la petición no obtiene respuesta
- **THEN** la pantalla indica que no hay conexión con el servicio y ofrece «Reintentar», porque un listado no modifica datos

### Requirement: Datos de facturación fuera del navegador
El listado MUST NOT guardar facturas ni resultados de listado en `localStorage`, `sessionStorage` ni en una caché persistente.

#### Scenario: Cierre de la pestaña
- **WHEN** el usuario ha consultado un listado y cierra la pestaña
- **THEN** no queda en el almacenamiento del navegador ningún dato de las facturas listadas
