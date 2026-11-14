# Proposal

## Why

El backend VeriFactu ya tiene preparado el alojamiento del frontal: contenedor `web`, contrato en `docs/operacion/frontal.md` y `openapi.json` publicado en CI. Mientras tanto, sirve una página provisional "en construcción". Antes de construir pantallas de negocio necesitamos una base que cumpla ese contrato desde el primer día. Sin ella, cada pantalla posterior arrastraría decisiones sin tomar sobre la API, los errores, el diseño y el empaquetado.

## What Changes

- Crear el proyecto React + TypeScript (Vite) con lint, comprobación de tipos y tests.
- Incorporar el **contrato de la API** del backend:
  - copia versionada del `openapi.json`;
  - script para actualizarla desde el CI del backend;
  - tipos TypeScript generados a partir de ella.
- Crear un **cliente de API** que llama siempre a rutas relativas `/api/v1` y traduce las respuestas de error del backend (ProblemDetail) a errores comprensibles para el usuario. Cubre validación por campo, conflicto, no encontrado, no autorizado, error interno con su identificador y fallo de red.
- Montar la **estructura de la interfaz**:
  - cabecera con navegación;
  - rutas que se pueden compartir;
  - página de "no encontrado";
  - indicador del estado del servicio a partir de `/actuator/health`;
  - formato español de importes y fechas;
  - página de inicio.
- Incorporar **impeccable** al proyecto: skill, hook de diseño, `PRODUCT.md` y detector en CI. Definir los tokens de diseño base.
- Crear la **imagen Docker** según el contrato:
  - Caddy en el puerto 8080, sin root;
  - *fallback* de SPA;
  - caché correcta de los recursos;
  - CSP restringida al propio origen;
  - ningún secreto en el `dist/`.
- Crear el **CI** en GitHub Actions: lint, tipos, tests, build, coherencia de los tipos con el contrato, `openspec validate --strict`, detector de impeccable y build de la imagen con prueba de humo.

### Fuera de alcance

- Pantallas de negocio: emitir factura (fase 2) y consultar factura o verificar huella (fase 3).
- Publicar la imagen en GHCR y desplegarla en el servidor: va en la fase 4, `desplegar-frontal`. Aquí la imagen solo se construye y se prueba en CI.
- Listado de facturas: fase 5, depende de un endpoint nuevo en el backend.
- Login, sesión o gestión de credenciales. El acceso sigue siendo HTTP Basic en el borde.
- Tema oscuro, internacionalización a otros idiomas y modo sin conexión.

### Dependencia del backend

Ninguna bloqueante. Se usa el `openapi.json` publicado en el último build de `main` del backend. Sus huecos (el POST declara 200 en lugar de 201, no documenta los errores y la verificación de huella no está tipada) se cubren con tipos escritos a mano en el frontal. Se pedirá al backend que los documente, sin bloquear este change.

## Capabilities

### New Capabilities
- `publicacion-frontal`: cómo se sirve el frontal empaquetado: puerto, *fallback* de rutas de cliente, caché, cabeceras de seguridad y ausencia de secretos.
- `cliente-api`: cómo se comunica el frontal con la API del backend: mismo origen sin credenciales propias y traducción uniforme de las respuestas de error para el usuario.
- `estructura-interfaz`: el armazón común de la aplicación: navegación, rutas de cliente, página de no encontrado, estado del servicio, formato regional y requisitos de accesibilidad comunes a todas las pantallas.

### Modified Capabilities
<!-- Ninguna: es el primer change del repositorio. -->

## Impact

- **Repositorio:** todo el código inicial del frontal, `Dockerfile`, `Caddyfile`, `.github/workflows/ci.yml`, `contrato/openapi.json`, `PRODUCT.md` y la configuración de impeccable en `.claude/` y `.impeccable/`.
- **Dependencias nuevas:**
  - de ejecución: React, React Router, TanStack Query y openapi-fetch;
  - de desarrollo: Vite, TypeScript, oxlint, Vitest, Testing Library, MSW, openapi-typescript e impeccable.
- **Backend:** sin cambios. Cuando se despliegue en la fase 4, la imagen sustituirá a `deploy/web-placeholder`.
- **Coste AWS:** 0 USD adicionales. No se crea infraestructura.
