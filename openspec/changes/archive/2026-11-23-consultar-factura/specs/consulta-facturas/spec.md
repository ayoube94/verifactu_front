# Spec Delta

## Purpose

Permitir al operador ver una factura emitida por su id, con todo lo que la AEAT recibió y el estado de su envío, y descargar el XML exacto enviado, sin volver a llamar a la API a mano.

## ADDED Requirements

### Requirement: Acceso a la consulta por id
La aplicación SHALL ofrecer una pantalla `/consultar` con un campo para el id de la factura, enlazada desde la navegación principal y desde la página de inicio, que al enviarse navega a `/facturas/:id`.

#### Scenario: Desde la navegación
- **WHEN** el usuario pulsa «Consultar factura» en la navegación
- **THEN** se abre `/consultar` con el campo de id vacío y el enlace marcado como activo

#### Scenario: Id válido
- **WHEN** el usuario introduce `42` y envía el formulario
- **THEN** la aplicación navega a `/facturas/42`

#### Scenario: Id no numérico
- **WHEN** el usuario introduce `abc` y envía el formulario
- **THEN** no se navega, se muestra «El id debe ser un número entero positivo» junto al campo y no se envía ninguna petición

### Requirement: Datos de la factura
La pantalla `/facturas/:id` SHALL mostrar la cabecera de la factura (serie, número, fecha de expedición, fecha de operación, tipo, régimen de IVA y descripción de la operación), el destinatario, las líneas y los totales tal como los devuelve la API, sin recalcularlos.

#### Scenario: Factura encontrada
- **WHEN** la API responde 200 para la factura 42
- **THEN** la pantalla muestra el título «Factura 2026/001», cada línea con su base, y los totales de base imponible, cuota e importe total con coma decimal y símbolo €

#### Scenario: Fechas en formato español
- **WHEN** la factura tiene fecha de expedición `2026-03-05`
- **THEN** la pantalla la muestra como `05/03/2026`

#### Scenario: Descuento en euros
- **WHEN** una línea tiene descuento 10
- **THEN** la pantalla lo muestra como «10,00 €» y no como porcentaje

### Requirement: Bloque VeriFactu
La pantalla SHALL mostrar el bloque VeriFactu de la factura con el estado ante la AEAT, el código y mensaje de la AEAT cuando existan, el CSV, la huella, la huella anterior (o «Primer registro de la cadena» si no hay), la fecha-hora de generación y el QR.

#### Scenario: Factura aceptada
- **WHEN** `estadoEnvio` es `ACEPTADO`
- **THEN** el bloque indica que la AEAT aceptó la factura y muestra el CSV

#### Scenario: Factura rechazada
- **WHEN** `estadoEnvio` es `RECHAZADO` con `codigoRespuestaAeat` y `mensajeAeat`
- **THEN** el bloque indica que la AEAT rechazó la factura y muestra el código y el mensaje, sin mostrar el CSV como aceptación

#### Scenario: Huella completa
- **WHEN** se muestra la huella
- **THEN** el texto de la huella aparece completo en el DOM, aunque visualmente se agrupe

#### Scenario: QR
- **WHEN** el registro trae `qrBase64`
- **THEN** el bloque muestra el QR como imagen con texto alternativo, y el enlace `qrUrl` tal como lo devuelve el backend

### Requirement: Descarga del XML
La pantalla SHALL ofrecer la descarga del XML enviado a la AEAT desde `GET /api/v1/facturas/{id}/xml`, sin generarlo en el navegador.

#### Scenario: Descarga disponible
- **WHEN** la factura se ha cargado correctamente
- **THEN** aparece el enlace «Descargar XML» apuntando a `/api/v1/facturas/42/xml`, con el nombre de fichero que indica la cabecera de la respuesta
### Requirement: Factura inexistente o error
La pantalla SHALL distinguir una factura inexistente de un fallo del servicio.

#### Scenario: Id inexistente
- **WHEN** la API responde 404 para `/facturas/999`
- **THEN** la pantalla muestra «No existe ninguna factura con ese id» con un enlace para consultar otra

#### Scenario: Error del servidor
- **WHEN** la API responde 500
- **THEN** la pantalla muestra el mensaje genérico de error del servidor con el `errorId` cuando exista, según el requisito de cliente-api

#### Scenario: Sin conexión
- **WHEN** la petición no obtiene respuesta
- **THEN** la pantalla indica que no hay conexión con el servicio y ofrece reintentar, porque una consulta no modifica datos
