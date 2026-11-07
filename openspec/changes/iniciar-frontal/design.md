# Design

## Context

- **El repositorio está vacío.** Solo tiene el `README.md` y OpenSpec inicializado.
- **El backend fija el contrato de despliegue** en `docs/operacion/frontal.md`:
  - imagen Caddy en el puerto 8080;
  - *fallback* de SPA;
  - rutas relativas `/api/v1`;
  - sin claves en el navegador;
  - mismo dominio que la API, detrás del Caddy del borde con HTTP Basic.
- **El borde ya añade cabeceras de seguridad:** HSTS, `nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy`. **No añade CSP.**
- **El backend publica `openapi.json`** como artefacto de CI en cada build de `main`.
  - El repositorio del backend es **privado**: descargar el artefacto exige un token con acceso a ese repo.
  - El contrato tiene huecos: el POST declara 200, no hay respuestas de error y la verificación de huella devuelve `object` sin tipar.
- **Errores del backend**, todos en formato ProblemDetail (`type`, `title`, `status`, `detail`, `timestamp`):
  - **400** de validación: añade `errores: {campo: mensaje}`;
  - **409** de negocio: el `detail` lleva el mensaje;
  - **500**: añade `errorId`;
  - **401** de `ApiKeyFilter`: lo devuelve también como ProblemDetail;
  - **404** de `GET /facturas/{id}`: sin cuerpo;
  - **404** de verificar huella: devuelve `{"error": ...}`.
- **Salud:** `GET /actuator/health` es público y responde `{"status":"UP"}` sin detalles. Si el servicio está caído, Spring responde 503 con `{"status":"DOWN"}`.

## Goals / Non-Goals

**Goals:**
- Que cualquier pantalla posterior (fases 2, 3 y 5) se añada como una ruta más, sin decisiones de infraestructura pendientes.
- Que un cambio en la API del backend se detecte en el frontal al actualizar el contrato, no en producción.
- Que la imagen construida en CI ya cumpla el checklist del contrato (§7), aunque se publique en la fase 4.

**Non-Goals:**
- Publicar en GHCR ni desplegar (fase 4).
- Sistema de diseño completo: solo tokens base y los pocos componentes que usa el armazón.
- Gestión de estado global aparte de la caché de peticiones.

## Decisions

### D1. Vite + React + TypeScript estricto, Node LTS fijado

- **Herramientas:** Vite con plantilla `react-ts` y `strict: true`.
- **Node:** se fija la versión LTS en `.nvmrc` y en `engines` (Node 24, el que hay instalado). npm con `package-lock.json`.
- **Por qué Vite:** el backend ya prevé su servidor de desarrollo (`localhost:5173`).
- **Alternativas descartadas:**
  - **Next.js o React Router en modo framework:** traen render en servidor y un runtime Node que la imagen estática no necesita.
  - **pnpm:** no aporta nada aquí y añade una herramienta más.

### D2. Contrato versionado en el repo y tipos generados

- `contrato/openapi.json` es una **copia versionada** del artefacto del backend.
- `npm run api:sync` la actualiza con `gh run download` desde el último build correcto de `main` del backend. Usa las credenciales `gh` del desarrollador.
- `npm run api:types` genera `src/api/schema.d.ts` con `openapi-typescript`. El fichero generado también se versiona.
- **El CI regenera los tipos y falla si hay diferencias** con lo versionado (deriva).
- **Por qué:** el CI no necesita un token del repo privado del backend, cada build es reproducible y cada actualización del contrato aparece como un diff revisable en un PR.
- **Alternativas descartadas:**
  - **Descargar el artefacto en cada build de CI:** necesita un PAT entre repos, no es reproducible y los artefactos caducan a los 90 días.
  - **Paquete npm del contrato publicado por el backend:** es más infraestructura para un único consumidor.

### D3. Cliente `openapi-fetch` y errores normalizados

- **Cliente:** `createClient<paths>({ baseUrl: "" })`, siempre con rutas relativas. No se añaden cabeceras de credenciales. Las credenciales Basic las reenvía el navegador al mismo origen.
- **Normalización de errores:** una única función convierte cualquier fallo en un `ErrorApi` discriminado:
  - `validacion` (400): `mensaje` y `campos: Record<string, string>`;
  - `conflicto` (409): `mensaje`;
  - `no-encontrado` (404);
  - `no-autorizado` (401);
  - `servidor` (5xx): `errorId?`;
  - `red`: fallo de `fetch` o cuerpo no interpretable.
- **Tipos escritos a mano:** el ProblemDetail y la respuesta de verificación de huella se tipan en `src/api/problemas.ts`, porque el contrato no los documenta. Cuando el backend los documente, se sustituyen por los generados.
- **Componente común:** `<MensajeError error={...} onReintentar?>` presenta cada tipo según `cliente-api`. Las pantallas no muestran errores con código propio.
- **Alternativas descartadas:**
  - **Cliente generado completo (orval, openapi-generator):** genera mucho código para cuatro endpoints.
  - **`fetch` a mano:** se pierde la comprobación de tipos de rutas y parámetros.

### D4. TanStack Query para las peticiones

- `useQuery` para las lecturas (salud, factura, verificación) y `useMutation` para la emisión (fase 2).
- **Lo que resuelve:** estados de carga y error, reintento manual y evitar dobles envíos con `isPending`, sin código propio.
- **Configuración:**
  - `retry: false` en las mutaciones. **Una emisión nunca se reintenta sola**, porque encadena una huella.
  - `retry: 1` en las lecturas.
  - Caché en memoria, sin persistencia (nada de facturas en `localStorage`).
- **Alternativa descartada:** loaders y actions de React Router. Encaja peor con React Hook Form y con mostrar la espera de la AEAT en la misma pantalla.

### D5. Rutas y armazón

- **Router:** React Router en modo declarativo (`createBrowserRouter`) con un layout común (`<Armazon>`), que contiene:
  - enlace "Saltar al contenido";
  - cabecera con el nombre y `<nav>` con `NavLink`;
  - indicador de salud;
  - `<main id="contenido">`.
- **Título del documento:** cada ruta declara el suyo con un pequeño hook `useTituloPagina`.
- **Rutas en esta fase:** `/` (inicio) y `*` (no encontrado). Las fases 2 y 3 añaden `/facturas/nueva`, `/facturas/:id` y `/auditoria`.
- **Navegación:** se define en una lista única. Solo incluye las secciones existentes (spec `estructura-interfaz`).

### D6. Diseño con impeccable y CSS propio

- **Instalación:** `npx impeccable install --providers=claude --scope=project`, con el hook de diseño activado.
- **Contexto de producto:** `/impeccable init` escribe `PRODUCT.md`:
  - usuario: operador de la plataforma en preproducción, que más adelante será el personal de las empresas cliente;
  - objetivo: emitir y comprobar facturas sin errores;
  - tono: sobrio, administrativo y de confianza.
- **`DESIGN.md`:** se genera con `/impeccable document` cuando existan el armazón y la página de inicio.
- **Estilos:**
  - tokens en `src/estilos/tokens.css` (color, tipografía, espaciado, radios, foco);
  - CSS Modules por componente;
  - pila de fuentes del sistema, para no cargar fuentes externas (CSP);
  - sin Tailwind ni librería de componentes: pocas pantallas, y así cada estilo es explícito y revisable con impeccable.
- **CI:** `npx impeccable detect --github src/` corre como comprobación bloqueante. Las excepciones justificadas se registran con `impeccable ignores`.
- **Revisión:** antes de cerrar el change se pasa `/impeccable critique` y `/impeccable audit` sobre el armazón y la página de inicio, y se corrigen los hallazgos P0 y P1.
- **Alternativa descartada:** una librería de componentes (MUI, Mantine, shadcn). Ninguna sustituye a impeccable, que no aporta componentes, y todas añaden peso y una estética por defecto.

### D7. Proxy de desarrollo

- `vite.config.ts` hace de proxy de `/api` y `/actuator` hacia `BACKEND_URL` (por defecto `http://localhost:8080`, el backend de `compose.dev.yaml` o `bootRun` en perfil `dev`).
- `BACKEND_URL` solo se lee en Node, al configurar Vite. **No se expone al cliente** (sin prefijo `VITE_`).
- Así el código usa las mismas rutas relativas en desarrollo y en producción, y no depende de CORS.

### D8. Imagen: build con Node, servicio con Caddy sin root

- **Dockerfile multi-stage:**
  - `node:24-alpine` ejecuta `npm ci` y `npm run build`;
  - `caddy:2-alpine` copia `dist/` a `/srv` y el `Caddyfile`.
- **Plataforma:** `linux/amd64`.
- **Usuario sin privilegios:** se crea uno sin privilegios (`USER`). Caddy funciona en el puerto 8080 sin capacidades. Las variables `XDG_CONFIG_HOME` y `XDG_DATA_HOME` apuntan a `/tmp`, y en el `Caddyfile` van `admin off` y `persist_config off` para no escribir en disco.
- **Caddyfile:**
  - `:8080`;
  - `try_files {path} /index.html` y `file_server`;
  - `Cache-Control: public, max-age=31536000, immutable` en `/assets/*` y `no-cache` en el resto;
  - `Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
- **Comprobación del build:** después del build, `scripts/comprobar-dist.mjs` busca en `dist/`:
  - `X-API-Key`;
  - `Authorization`;
  - `localhost`;
  - URLs absolutas que terminen en `/api/` o `/actuator`.

  El build falla si hay coincidencias. Las URLs de terceros que las librerías incluyen como texto (por ejemplo, los enlaces de error de React) no se consideran secretos.
- **Alternativa descartada:** `nginx:alpine`. Es equivalente, pero Caddy es lo que recomienda el contrato y lo que ya usa el borde.

### D9. CI en GitHub Actions

Un único `ci.yml` en `pull_request` y `push` a `main`, con estos pasos:
1. `npm ci`;
2. `lint`;
3. `typecheck`;
4. `test`;
5. `build`, con la comprobación de secretos;
6. deriva de tipos (D2);
7. `openspec validate --all --strict`, con la misma versión de CLI que el backend (1.16.0);
8. `impeccable detect`;
9. `docker build` y prueba de humo con `scripts/comprobar-imagen.sh`: arranca el contenedor y comprueba `/`, `/facturas/42`, cabeceras de caché y CSP, y que el usuario no es root.

La publicación en GHCR se deja a la fase 4.

### D10. Tests

- **Vitest + Testing Library:** componentes y hooks.
- **MSW:** simula la API con respuestas tipadas desde `schema.d.ts`.
- **Lo que se prueba:** cada requisito de `cliente-api` y `estructura-interfaz` tiene al menos un test.
- **Lo que no se prueba en Vitest:** los de `publicacion-frontal` se comprueban con el script de humo de la imagen.
- **E2E en navegador (Playwright):** se deja para cuando haya flujos de negocio (fase 2).

### Coste AWS

0 USD adicionales. No se crea infraestructura: la imagen sustituirá a `web-placeholder` en la instancia existente, con unos 10 MB de RAM.

## Risks / Trade-offs

- **[El contrato versionado se queda viejo]** → El README y el PR template recuerdan ejecutar `npm run api:sync` cuando cambie el backend. A partir de la fase 4, el workflow de despliegue también podrá comprobarlo.
- **[Los tipos escritos a mano de ProblemDetail se desvían del backend]** → Hay tests con cuerpos copiados de `GlobalExceptionHandler` y `ApiKeyFilter`, y se pide al backend que los documente en OpenAPI (ver `notes/plan-por-fases.md`).
- **[Caddy sin root falla al intentar escribir configuración o certificados]** → `admin off`, `persist_config off`, XDG en `/tmp` y prueba de humo en CI que arranca la imagen real.
- **[El detector de impeccable genera ruido o falsos positivos en CI]** → Excepciones explícitas con motivo (`impeccable ignores`). Si bloquea sin aportar, se puede pasar a no bloqueante, decidiéndolo en el PR.
- **[El hook de impeccable modifica el flujo del agente en este repo]** → Es lo buscado. Su configuración queda versionada en `.claude/` para que funcione igual en cualquier equipo.
- **[La CSP estricta rompe algo en el futuro]** → El QR llega como `data:` y ya está permitido. Cualquier excepción nueva requiere modificar el spec `publicacion-frontal`.

## Migration Plan

Este change no despliega nada. La imagen se construye y se prueba en CI. La sustitución de `web-placeholder` en el servidor, y su vuelta atrás, se definen en la fase 4 (`desplegar-frontal`).

## Open Questions

- **Tema oscuro.** Fuera de alcance. Se decidirá en `PRODUCT.md` con `/impeccable init`. Los tokens se nombran por función, no por color, para poder añadirlo sin tocar componentes.
