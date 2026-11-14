# Plan del frontal por fases

Actualizado a **7 de noviembre de 2026**. Cada fase es un change de OpenSpec (`/opsx:propose` → revisar → `/opsx:apply` → `/opsx:archive`), igual que en el backend.

## Punto de partida

**Qué ofrece hoy el backend** ([verifactu_web](https://github.com/ayoube94/verifactu_web)):

| Método | Ruta | Uso en el frontal |
|---|---|---|
| `POST` | `/api/v1/facturas` | Emitir factura. Responde 201 con la factura, la huella, el estado AEAT y el QR |
| `GET` | `/api/v1/facturas/{id}` | Ver una factura |
| `GET` | `/api/v1/facturas/{id}/xml` | Descargar el XML enviado a la AEAT |
| `GET` | `/api/v1/facturas/auditoria/verificar-huella/{huella}` | Comprobar que un registro no se ha alterado |
| `GET` | `/actuator/health` | Estado del servicio (público) |

**Cómo se despliega el frontal:** lo fija el contrato `docs/operacion/frontal.md` del backend.
- Imagen `ghcr.io/<owner>/verifactu-web:<sha>` con Caddy en el puerto 8080 y *fallback* a `index.html`.
- Se sirve en el mismo dominio que la API, en el Lightsail de `eu-south-2`.
- Llamadas con rutas relativas `/api/v1`.
- Sin claves en el navegador: el Caddy del borde pide usuario y contraseña (HTTP Basic) y añade la `X-API-Key`.
- S3 + CloudFront y Amplify ya se descartaron en el diseño del backend por coste y complejidad.

**Huecos encontrados que afectan al frontal:**
1. **No hay listado de facturas.** Sin él, solo se puede abrir una factura por su id o por su huella. Va en la fase 5 y requiere un change en el backend.
2. **El `openapi.json` es incompleto:**
   - el `POST` declara 200, pero devuelve 201;
   - no documenta los errores (400, 404, 409 en formato ProblemDetail);
   - la verificación de huella devuelve un objeto sin tipar.

   Mientras no se arregle, el frontal define a mano esos tipos (ver "Peticiones al backend").
3. **La emisión es síncrona con la AEAT** y puede tardar hasta unos 10 s. Una respuesta 201 puede traer el estado `RECHAZADO` o `ERROR_CONEXION`. La pantalla tiene que dejarlo claro y evitar el doble envío.
4. **El `descuento` de cada línea es un importe en euros**, no un porcentaje.
5. **El QR que devuelve el backend aún no usa la URL oficial de la AEAT** (nota 02 del backend). El frontal lo muestra tal cual. La factura imprimible con QR y la leyenda "VERI*FACTU" espera a que el backend lo corrija.

## Fases

| Fase | Change | Qué se consigue | Depende de |
|---|---|---|---|
| 1 | `iniciar-frontal` | Proyecto base, cliente de API tipado, estructura de la interfaz, imagen Docker que cumple el contrato y CI. Sustituye a la página provisional `web-placeholder` | — |
| 2 | `emitir-factura` | Formulario de emisión con líneas, totales orientativos, errores de validación por campo, número duplicado (409) y resultado con estado AEAT, huella y QR | Fase 1 |
| 3 | `consultar-factura` | Ver una factura por id (datos, líneas, totales, estado AEAT, QR, huella), descargar su XML y verificar la integridad de una huella | Fase 1 |
| 4 | `desplegar-frontal` | Workflow que publica la imagen en GHCR y la despliega por SSH, con comprobación y vuelta atrás automática | Backend: instancia Lightsail creada y compose en `/opt/verifactu` (tareas 8.x y 10.1 del backend) |
| 5 | `listar-facturas` | Listado paginado con búsqueda por número, NIF, fecha y estado AEAT. Es la pantalla de entrada | Backend: endpoint `GET /api/v1/facturas` paginado (change nuevo en el backend) |

Las fases 2 y 3 son independientes entre sí. La 4 se puede adelantar en cuanto exista el servidor.

### Después, en paralelo al backend

- **Login multi-cliente:** sustituye al HTTP Basic, junto al change multi-cliente del backend. Supone pantalla de acceso, sesión y emisor activo.
- **Anulaciones y rectificativas (R1–R5):** cuando el backend las soporte.
- **Factura imprimible o PDF** con el QR oficial y la leyenda "VERI*FACTU": cuando el backend corrija la URL del QR.

## Peticiones al backend

No bloquean las fases 1 a 3, pero conviene hacerlas pronto. Son un change pequeño en el backend:
- Anotar con springdoc las respuestas reales:
  - `201` en la emisión;
  - `400`, `404` y `409` con `ProblemDetail`;
  - `404` en el XML y en la verificación.
- Sustituir el `Map` de la verificación de huella por un DTO (`VerificacionHuellaDto`).
- Dar a `info.version` del OpenAPI la versión de la aplicación, para saber de qué build salen los tipos.
- **Fase 5:** endpoint de listado paginado con filtros.

## Decisiones de tecnología (fase 1)

| Tema | Decisión | Por qué |
|---|---|---|
| Base | React + TypeScript + Vite | Es lo pedido. Vite es además el servidor de desarrollo que ya prevé el backend (`localhost:5173`) |
| Rutas | React Router | Hay pocas pantallas y URLs que se pueden compartir (`/facturas/42`) |
| API | `openapi-typescript` + `openapi-fetch` | Tipos generados del contrato del backend y un cliente de ~6 kB, sin capa propia que mantener |
| Formularios | React Hook Form + Zod | El formulario de emisión tiene líneas dinámicas y validación que replica la del backend |
| Diseño | impeccable + CSS propio con tokens | impeccable es un skill del agente, no una librería de componentes. Guía y revisa el diseño (`critique`, `audit`, `polish`) y su detector corre en CI. Sin Tailwind ni librería de componentes, para mantenerlo simple |
| Tests | Vitest + Testing Library + MSW | MSW simula la API con los tipos del contrato, sin levantar el backend |
| Servidor | Caddy en la imagen | Es lo que recomienda el contrato y lo mismo que usa el borde |
| Coste AWS | 0 USD adicionales | Corre como un contenedor más (~10 MB de RAM) en la instancia existente |
