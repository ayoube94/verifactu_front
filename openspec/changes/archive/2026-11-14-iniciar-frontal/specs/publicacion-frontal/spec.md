# Spec Delta

## Purpose

Definir cómo se sirve el frontal empaquetado dentro de la plataforma, de forma que cumpla el contrato del backend y se pueda desplegar y volver atrás sin tocarlo.

## ADDED Requirements

### Requirement: Servidor interno en el puerto 8080 sin privilegios
La imagen del frontal SHALL servir la aplicación compilada por HTTP en el puerto 8080 del contenedor, MUST ejecutarse con un usuario distinto de root y MUST NOT publicar puertos en el host.

#### Scenario: Arranque de la imagen
- **WHEN** se arranca la imagen y se pide `GET /` al puerto 8080 del contenedor
- **THEN** la respuesta es HTTP 200 con el `index.html` de la aplicación

#### Scenario: Usuario del proceso
- **WHEN** se inspecciona el proceso del servidor dentro del contenedor en ejecución
- **THEN** su usuario no es root

### Requirement: Fallback de rutas de cliente
El servidor SHALL devolver `index.html` con HTTP 200 para cualquier ruta que no corresponda a un fichero existente, de modo que una ruta de la aplicación abierta o recargada directamente cargue la aplicación.

#### Scenario: Recarga de una ruta de cliente
- **WHEN** se pide `GET /facturas/42` directamente al servidor
- **THEN** la respuesta es HTTP 200 con el mismo contenido que `GET /`

#### Scenario: Fichero existente
- **WHEN** se pide un recurso existente del `dist/`, como un fichero de `/assets/`
- **THEN** se sirve ese fichero con su tipo de contenido y no `index.html`

### Requirement: Caché compatible con despliegues
El servidor SHALL marcar los recursos con huella en el nombre (`/assets/*`) como cacheables a largo plazo e inmutables, y `index.html` como no cacheable, para que un despliegue nuevo se vea al recargar sin servir versiones mezcladas.

#### Scenario: Página principal tras un despliegue
- **WHEN** se pide `GET /`
- **THEN** la respuesta lleva `Cache-Control: no-cache` (o más restrictivo)

#### Scenario: Recurso con huella
- **WHEN** se pide un fichero de `/assets/`
- **THEN** la respuesta lleva `Cache-Control` con `max-age` de al menos un año e `immutable`

### Requirement: Solo recursos del propio origen
El frontal MUST NOT cargar en tiempo de ejecución scripts, estilos, fuentes ni imágenes de otros orígenes, y el servidor SHALL enviar una Content-Security-Policy que solo permita el propio origen (más imágenes `data:` para el QR que devuelve la API).

#### Scenario: Cabecera CSP
- **WHEN** se pide `GET /`
- **THEN** la respuesta incluye `Content-Security-Policy` con `default-src 'self'` y sin orígenes externos

#### Scenario: Carga de la aplicación
- **WHEN** se abre la aplicación con la red del navegador inspeccionada
- **THEN** todas las peticiones van al propio origen

### Requirement: Artefacto sin secretos
La aplicación compilada y la imagen MUST NOT contener claves de API, credenciales HTTP Basic, URLs de backend por entorno ni otros secretos.

#### Scenario: Revisión del artefacto
- **WHEN** se buscan en el `dist/` la cabecera `X-API-Key`, valores de credenciales o URLs absolutas de la API
- **THEN** no aparece ninguna coincidencia
