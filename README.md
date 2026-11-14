# VeriFactu: frontal web

Frontal React de la plataforma de facturación VeriFactu. El backend (Spring Boot) vive en [ayoube94/verifactu_web](https://github.com/ayoube94/verifactu_web). Allí está el contrato que este repositorio cumple: `docs/operacion/frontal.md`.

- **Plan por fases:** [notes/plan-por-fases.md](notes/plan-por-fases.md)
- **Cambios en curso y specs:** [openspec/](openspec/). Se trabaja con `/opsx:propose`, `/opsx:apply` y `/opsx:archive`.

## Requisitos

- **Node 24** (ver `.nvmrc`) y npm.
- **Docker:** solo para construir y probar la imagen.
- **GitHub CLI (`gh`)** con acceso al repositorio del backend, que es privado. Solo hace falta para `npm run api:sync`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173`. Hace de proxy de `/api` y `/actuator` hacia `BACKEND_URL` (por defecto `http://localhost:8080`) |
| `npm test` | Tests (Vitest + Testing Library + MSW) |
| `npm run lint` / `npm run typecheck` | Lint (oxlint, con reglas de React Hooks y accesibilidad) y comprobación de tipos |
| `npm run build` | Compila en `dist/` y comprueba que no contiene secretos |
| `npm run api:sync` | Descarga el `openapi.json` del último build correcto de `main` del backend a `contrato/openapi.json` |
| `npm run api:types` | Genera `src/api/schema.d.ts` a partir de `contrato/openapi.json` |
| `npm run api:check` | Falla si `schema.d.ts` no corresponde al contrato versionado (lo usa el CI) |

### Desarrollo con el backend local

En el repositorio del backend, arranca la aplicación en perfil `dev`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

En este repositorio:

```bash
npm run dev
```

El frontal llama siempre a rutas relativas (`/api/v1/...`), en local y en producción. En producción, el Caddy del borde enruta `/api/*` al backend y añade la clave de API: **nunca hay claves en este repositorio ni en el `dist/`**.

### Cuando cambia la API del backend

```bash
npm run api:sync && npm run api:types
```

Revisa el diff de `contrato/openapi.json` y `src/api/schema.d.ts` en el PR.

## Imagen Docker

```bash
docker build --platform linux/amd64 -t verifactu-web:local .
./scripts/comprobar-imagen.sh verifactu-web:local
```

La imagen cumple el contrato del backend:
- Caddy en el puerto 8080, sin root;
- *fallback* de SPA a `index.html`;
- caché inmutable en `/assets/*`;
- CSP restringida al propio origen.
