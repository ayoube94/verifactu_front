# cliente-api Specification

## Purpose
Definir cómo se comunica el frontal con la API REST del backend: siempre en el mismo origen, sin credenciales propias, y con un tratamiento uniforme de los errores que el usuario pueda entender y comunicar.

## Requirements

### Requirement: Mismo origen y sin credenciales propias
El frontal SHALL llamar a la API únicamente con rutas relativas bajo `/api/v1/` y MUST NOT añadir la cabecera `X-API-Key` ni ninguna otra credencial a sus peticiones; la autenticación la resuelven el navegador y el borde.

#### Scenario: Petición a la API
- **WHEN** el frontal consulta una factura
- **THEN** la petición va a `/api/v1/facturas/{id}` del mismo origen que la página y no lleva cabecera `X-API-Key`

### Requirement: Errores de validación por campo
Ante una respuesta HTTP 400 con cuerpo ProblemDetail que incluya `errores`, el frontal SHALL exponer a la pantalla cada mensaje asociado a su campo, además del mensaje general (`detail`).

#### Scenario: Campo rechazado por el backend
- **WHEN** la API responde 400 con `errores` = `{"serie": "La serie es obligatoria"}`
- **THEN** la pantalla puede mostrar "La serie es obligatoria" junto al campo `serie`

#### Scenario: Cuerpo no válido sin detalle por campo
- **WHEN** la API responde 400 con ProblemDetail sin `errores`
- **THEN** se muestra el `detail` como mensaje general

### Requirement: Conflicto y recurso inexistente
El frontal SHALL distinguir una respuesta HTTP 409 (conflicto de negocio, mostrando el `detail` del backend) de una HTTP 404 (recurso no encontrado), y presentar cada una con un mensaje propio en español.

#### Scenario: Conflicto de negocio
- **WHEN** la API responde 409 con `detail` "Ya existe una factura registrada con la serie 2026 y número 001"
- **THEN** el usuario ve ese mensaje como un conflicto, no como un fallo técnico

#### Scenario: Recurso inexistente
- **WHEN** la API responde 404
- **THEN** el usuario ve que el recurso no existe, sin mensaje técnico

### Requirement: Error interno con identificador
Ante una respuesta HTTP 5xx, el frontal SHALL mostrar un mensaje genérico sin detalles técnicos e incluir el `errorId` del ProblemDetail cuando exista, para que el usuario pueda comunicarlo.

#### Scenario: Error inesperado del servidor
- **WHEN** la API responde 500 con `errorId` = "3f6c…"
- **THEN** el usuario ve un mensaje de error del servidor que incluye "3f6c…"

### Requirement: Acceso no autorizado
Ante una respuesta HTTP 401 de la API, el frontal SHALL indicar que el acceso no está autorizado e invitar a recargar la página para volver a identificarse, sin pedir ni almacenar credenciales.

#### Scenario: Credenciales caducadas o borde mal configurado
- **WHEN** la API responde 401
- **THEN** el usuario ve un mensaje de acceso no autorizado con la acción de recargar, y no aparece ningún formulario de credenciales del frontal

### Requirement: Fallo de conexión
Si una petición no obtiene respuesta (red caída, servidor inaccesible o respuesta no interpretable), el frontal SHALL indicar que no se pudo contactar con el servicio y permitir reintentar.

#### Scenario: Servidor inaccesible
- **WHEN** la petición a la API falla sin respuesta HTTP
- **THEN** el usuario ve que no hay conexión con el servicio y una acción para reintentar
