## Qué cambia

<!-- Change de OpenSpec que implementa (openspec/changes/<nombre>) y resumen -->

## Contrato con el backend

- [ ] Si la API del backend ha cambiado: `npm run api:sync && npm run api:types` y revisado el diff de `contrato/openapi.json` y `src/api/schema.d.ts`
- [ ] Las llamadas a la API usan rutas relativas `/api/v1/...` y no envían `X-API-Key` ni credenciales

## Checklist de la imagen (docs/operacion/frontal.md §7 del backend)

El job `imagen` del CI lo comprueba con `scripts/comprobar-imagen.sh`:

- [ ] La imagen escucha en el puerto 8080 y no necesita privilegios de root
- [ ] `GET /` devuelve `index.html` y `GET /una/ruta/cualquiera` también
- [ ] Ningún fichero del `dist/` contiene secretos ni claves de API (`postbuild`)
- [ ] Las llamadas a la API usan rutas relativas `/api/v1/...`

## Diseño

- [ ] Las pantallas nuevas siguen `DESIGN.md` y el detector de impeccable no da hallazgos
- [ ] Revisado a 360 px y solo con teclado
