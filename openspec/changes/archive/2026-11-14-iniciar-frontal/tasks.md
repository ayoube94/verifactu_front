# Tasks

## 1. Proyecto base

- [x] 1.1 Crear el proyecto Vite `react-ts` en la raíz con TypeScript `strict`, `.nvmrc` y `engines` a Node 24, y `package-lock.json`. Se verifica con `npm ci && npm run build`, que genera `dist/index.html`
- [x] 1.2 Configurar el lint con oxlint (el de la plantilla actual de Vite; plugins `react` con `rules-of-hooks` y `exhaustive-deps`, y `jsx-a11y`) y los scripts `lint` y `typecheck` (`tsc -b`). Se verifica con `npm run lint && npm run typecheck`, que terminan sin errores
- [x] 1.3 Configurar Vitest (jsdom), Testing Library y MSW con un `setupTests` común y un test de humo que renderiza la app. Se verifica con `npm test`, que pasa
- [x] 1.4 Añadir `.gitignore` (Node, `dist/` y las entradas de impeccable del README de impeccable) y un `README.md` con requisitos, comandos (`dev`, `test`, `build`, `api:sync`, `api:types`) y enlace a `notes/plan-por-fases.md`. Se verifica con `git status`, que no muestra `node_modules/` ni `dist/`

## 2. Diseño con impeccable

- [x] 2.1 Ejecutar `npx impeccable install --providers=claude --scope=project` aceptando el hook de diseño. Se verifica que existe `.claude/skills/impeccable/` y que el hook aparece en la configuración de `.claude/`
- [x] 2.2 Ejecutar `/impeccable init` y redactar `PRODUCT.md`:
  - usuario operador en preproducción;
  - objetivo: emitir y comprobar facturas sin errores;
  - tono sobrio y administrativo;
  - restricciones: es-ES, WCAG 2.2 AA, sin recursos externos;
  - decisión sobre el tema oscuro.

  Se verifica que `PRODUCT.md` existe y que `/impeccable` lo carga sin preguntar de nuevo
- [x] 2.3 Crear `src/estilos/tokens.css` (colores por función, tipografía con pila del sistema, escala de espaciado, radios y anillo de foco) y `src/estilos/base.css` (reset mínimo, `:focus-visible`). Se verifica con `npx impeccable detect src/`, que termina sin hallazgos

## 3. Contrato y cliente de API

- [x] 3.1 Crear `scripts/sync-openapi.mjs` (`npm run api:sync`): descarga con `gh run download` el artefacto `openapi` del último build correcto de `main` de `ayoube94/verifactu_web` a `contrato/openapi.json`. Versionar la copia actual. Se verifica con `npm run api:sync`, que deja `contrato/openapi.json` sin diff respecto a la copia versionada
- [x] 3.2 Añadir `npm run api:types` (`openapi-typescript contrato/openapi.json -o src/api/schema.d.ts`), versionar `schema.d.ts` y añadir `npm run api:check`, que regenera los tipos y falla si hay diferencias. Se verifica que `npm run api:check` pasa y falla si se edita a mano `schema.d.ts` (el generador vive aislado en `tools/openapi/` con TypeScript 5.9, porque `openapi-typescript` exige TypeScript 5 y el proyecto usa el 7; `npm run api:tools` lo instala)
- [x] 3.3 Crear `src/api/problemas.ts`:
  - tipos manuales de ProblemDetail, con `errores` y `errorId`;
  - tipo de la respuesta de verificación de huella;
  - tipo `ErrorApi` discriminado: `validacion`, `conflicto`, `no-encontrado`, `no-autorizado`, `servidor`, `red`;
  - función `normalizarError`.

  Se verifica con tests unitarios que usan cuerpos copiados de `GlobalExceptionHandler` y `ApiKeyFilter` del backend: 400 con y sin `errores`, 401, 404 sin cuerpo, 404 con `{"error"}`, 409, 500 con `errorId` y fallo de red
- [x] 3.4 Crear `src/api/cliente.ts` con `openapi-fetch` (`baseUrl: ""`) y una función auxiliar que devuelve el dato o lanza `ErrorApi`, sin cabeceras de credenciales. Se verifica con un test MSW que la petición va a una ruta relativa `/api/v1/...` y no lleva `X-API-Key`
- [x] 3.5 Configurar en `vite.config.ts` el proxy de `/api` y `/actuator` hacia `BACKEND_URL` (por defecto `http://localhost:8080`), leído solo en Node. Se verifica con el backend en perfil `dev` arrancado: `npm run dev` y `curl localhost:5173/actuator/health` devuelve `{"status":"UP"}`

## 4. Armazón de la interfaz

- [x] 4.1 Crear `src/utilidades/formato.ts` con `formatearImporte` (es-ES, EUR, 2 decimales), `formatearFecha` (`dd/mm/aaaa` a partir de `aaaa-mm-dd`, sin desplazamiento de zona horaria) y `formatearFechaHora`. Se verifica con tests: `1210` da `1.210,00 €` y `2026-10-14` da `14/10/2026`
- [x] 4.2 Configurar React Router (`createBrowserRouter`), el `QueryClientProvider` (`retry: 1` en consultas y `retry: false` en mutaciones), el layout `<Armazon>` (saltar al contenido, cabecera, `<nav>` desde una lista única de secciones, `<main id="contenido">`) y el hook `useTituloPagina`. Se verifica con tests: el primer Tab enfoca "Saltar al contenido", `lang="es"` está en `index.html` y el enlace activo está marcado con `aria-current`
- [x] 4.3 Crear la página de no encontrado (ruta `*`) con enlace a inicio. Se verifica con un test que `/una/ruta/inexistente` muestra la página dentro del armazón
- [x] 4.4 Crear el componente `<MensajeError>`, que presenta cada tipo de `ErrorApi` según el spec `cliente-api`: campos, conflicto, no encontrado, no autorizado con "Recargar", servidor con `errorId` y red con "Reintentar". Se verifica con un test por tipo
- [x] 4.5 Crear el indicador `<EstadoServicio>` (consulta `/actuator/health` al cargar y muestra "Operativo" o "No disponible", con texto y no solo color). Se verifica con tests MSW: `UP` 200, `DOWN` 503 y fallo de red, y en todos el resto de la página sigue interactiva
- [x] 4.6 Crear la página de inicio: nombre del producto, para qué sirve, estado del servicio y aviso de que las secciones de emisión y consulta llegan en las siguientes fases, sin enlaces rotos. Se verifica con un test que la navegación solo contiene secciones existentes
- [x] 4.7 Pasar `/impeccable critique` y `/impeccable audit` sobre el armazón y la página de inicio, corregir los hallazgos P0 y P1 y generar `DESIGN.md` con `/impeccable document`. Se verifica con `npx impeccable detect http://localhost:5173`, que termina sin hallazgos, y con que la página se ve sin desplazamiento horizontal a 360 px (critique y audit hechos en el hilo siguiendo `reference/audit.md`, sin subagente revisor: 0 P0/P1, se corrigió un P2 de `prefers-reduced-motion`; dirección elegida en la página de decisión: «Libro registro»)

## 5. Imagen Docker

- [x] 5.1 Crear `scripts/comprobar-dist.mjs` y añadirlo como `postbuild`: falla si `dist/` contiene `X-API-Key`, `Authorization`, `localhost` o URLs absolutas a `/api/` o `/actuator`. Se verifica que `npm run build` pasa y que falla al introducir a propósito la cadena `X-API-Key` en el código
- [x] 5.2 Crear el `Caddyfile`:
  - `:8080`, `admin off` y `persist_config off`;
  - `try_files` y `file_server`;
  - caché inmutable en `/assets/*` y `no-cache` en el resto;
  - la CSP de `design.md` D8.

  Crear también el `Dockerfile` multi-stage (`node:24-alpine` → `caddy:2-alpine`, usuario sin privilegios, XDG en `/tmp`, `EXPOSE 8080`) y `.dockerignore`. Se verifica con `docker build --platform linux/amd64 -t verifactu-web:local .`, que termina correctamente
- [x] 5.3 Crear `scripts/comprobar-imagen.sh`. Arranca la imagen y comprueba:
  - `GET /` responde 200 con `index.html` y `no-cache`;
  - `GET /facturas/42` devuelve el mismo `index.html`;
  - un fichero de `/assets/` lleva `immutable`;
  - la cabecera CSP contiene `default-src 'self'`;
  - el usuario del proceso no es root.

  Se verifica con el script contra `verifactu-web:local`, que termina con código 0. Marcar en el PR los puntos del checklist §7 del contrato. Como la imagen base de caddy declara `EXPOSE 80/443/2019` en sus metadatos, se comprueba que el proceso solo escucha en el 8080 (publicar en el host lo decide el compose)

## 6. Integración continua

- [x] 6.1 Crear `.github/workflows/ci.yml` (en `pull_request` y `push` a `main`):
  - `npm ci`, `lint`, `typecheck`, `test`, `build`;
  - `api:check`;
  - `openspec validate --all --strict` (CLI 1.16.0);
  - `npx impeccable detect --github src/`;
  - `docker build` y `scripts/comprobar-imagen.sh`.

  Se verifica que la ejecución en el PR de este change pasa en verde
- [x] 6.2 Añadir `.github/pull_request_template.md` con el recordatorio de `npm run api:sync` si cambió el backend y el checklist §7 del contrato. Se verifica que aparece al abrir un PR

## 7. Verificación integral

- [x] 7.1 Con el backend en perfil `dev` y `npm run dev`:
  - abrir la app, ver "Operativo";
  - parar el backend y ver "No disponible" tras recargar;
  - recorrer la página de inicio y la de no encontrado solo con teclado.

  Anotar el resultado en el PR. Resultado (7/11/2026): con el backend en `dev`, «Servicio operativo» en cabecera e inicio; con el backend parado, el proxy devuelve 502 y la app muestra «Servicio no disponible» con «Comprobar de nuevo»; teclado cubierto por los tests del armazón y de no encontrado

## Workflow follow-up

- Revisar el PR, hacer merge y archivar el change con `/opsx:archive iniciar-frontal`.
- Proponer la fase 2 (`emitir-factura`) y la fase 3 (`consultar-factura`), que son independientes entre sí.
- Pedir en el repositorio del backend las mejoras del contrato OpenAPI descritas en `notes/plan-por-fases.md`.
