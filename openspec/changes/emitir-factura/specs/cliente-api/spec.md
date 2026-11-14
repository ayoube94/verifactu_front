# Spec Delta

## MODIFIED Requirements

### Requirement: Fallo de conexión
Si una petición no obtiene respuesta (red caída, servidor inaccesible o respuesta no interpretable), el frontal SHALL indicar que no se pudo contactar con el servicio y permitir reintentar. Una petición que crea un registro inalterable (la emisión de una factura) MUST NOT ofrecer un reintento directo: antes SHALL comprobar si el registro llegó a crearse.

#### Scenario: Servidor inaccesible
- **WHEN** la petición a la API falla sin respuesta HTTP
- **THEN** el usuario ve que no hay conexión con el servicio y una acción para reintentar

#### Scenario: Emisión sin respuesta
- **WHEN** `POST /api/v1/facturas` falla sin respuesta HTTP
- **THEN** no se ofrece «Reintentar» hasta haber comprobado si la factura se creó
