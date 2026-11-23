## Context

La fase 2 dejó un cliente de API tipado (`openapi-fetch` con los tipos generados del contrato) y un manejo uniforme de errores (`src/api/problemas.ts`). Esta fase añade solo lecturas: tres endpoints ya presentes en `contrato/openapi.json`. El frontal no calcula nada con valor legal; muestra lo que devuelve el backend.

Rutas actuales: `/`, `/facturas/nueva` y `*`. `src/app/rutas.tsx` ya anuncia que la fase 3 añade `/facturas/:id` y `/auditoria`. Esta propuesta usa `/verificar-huella` en lugar de `/auditoria` porque nombra la acción que el operador busca.

## Goals / Non-Goals

**Goals:**
- Ver una factura completa por id, con su bloque VeriFactu, y descargar su XML.
- Comprobar la integridad de una huella y mostrar el resultado de la API sin reinterpretarlo.
- Reutilizar los componentes de campo, el mensaje de error y el formateo regional de la fase 2.

**Non-Goals:**
- Listado, búsqueda por número o filtros (fase 5).
- Recalcular huellas, importes o el QR en el navegador.
- Guardar facturas en caché persistente.

## Decisions

### Rutas y navegación
- `/consultar` (formulario de id) → navega a `/facturas/:id`. Así el id nunca viaja como texto libre a la API sin validar, y la URL de la factura es compartible.
- `/verificar-huella` con la huella en el formulario; la petición se hace al enviar, no al escribir, para no lanzar una llamada por carácter. La huella se lleva a la URL con `?huella=` en lugar de en el path, para que una huella mal escrita no produzca una URL de ruta distinta.

  Alternativa descartada: `/verificar-huella/:huella`. Obliga a codificar el path y da 404 de router ante huellas incompletas, que deben mostrar el mensaje de formato.
- `secciones.ts` gana «Consultar factura» y «Verificar huella». Solo se añaden cuando la pantalla existe (regla de `estructura-interfaz`).

### Consulta y caché
- Cada consulta usa TanStack Query (ya en `package.json`) con clave `['factura', id]`. Sin persistencia: al cerrar la pestaña se pierde, como exige la restricción de no guardar datos de facturación en el navegador.
- `staleTime` 0 y `refetchOnWindowFocus` desactivado: una factura emitida no cambia, pero la pantalla no debe quedarse con un estado de envío viejo si el operador vuelve a abrirla.

### Descarga del XML
- Es un enlace directo `<a href="/api/v1/facturas/{id}/xml" download>`. El navegador conserva las credenciales del borde (HTTP Basic) y el Caddy añade `X-API-Key`; no hace falta una petición con `fetch` ni un `Blob`. El origen es el mismo, así que el atributo `download` funciona.
- La API genera el XML al emitir, así que una factura cargada con 200 debería tener XML. No se hace una petición previa para comprobarlo: si el XML falla, el navegador muestra su propia página de error. Es un comportamiento aceptado en esta fase y queda así documentado; el spec no exige un mensaje propio para ese caso.

### Mensajes de estado AEAT
- Un único componente `<BloqueVerifactu>` que recibe `RegistroVerifactuDto` y usa `src/dominio/estadoEnvio.ts` (fase 2) para texto y tono. El CSV solo se muestra con `ACEPTADO` o `ACEPTADO_CON_ERRORES`, para no dar apariencia de aceptación a un `RECHAZADO` que trae CSV residual.

### Verificación de huella
- La validez la decide solo `integridadValida`. El frontal no compara strings de huellas.
- El detalle (huella anterior, fecha, cadena canónica) va en un `<details>` para no saturar la pantalla; `cadenaCanonica` se muestra en un bloque con `overflow-wrap: anywhere` para móvil.

### Fechas e importes
- Formateo con `src/utilidades/formato.ts` (fase 1): `dd/mm/aaaa`, coma decimal, símbolo €. Las fechas `date` llegan como `YYYY-MM-DD` y se formatean sin pasar por `Date` para evitar desplazamientos de zona horaria. La fecha-hora de generación (`date-time` con offset) se muestra en hora de Madrid.

## Risks / Trade-offs

- **Factura sin XML o con 404 al descargar** → el navegador muestra su página de error en lugar de un mensaje propio. Aceptado en esta fase; el E2E (tarea 5.1) cubre el caso 200.
- **Huella con mayúsculas** → el backend espera minúsculas hexadecimales. Mitigación: normalizar antes de enviar y cubrirlo con test.
- **Cadena canónica muy larga en móvil** → desborda el ancho. Mitigación: `overflow-wrap: anywhere` y prueba a 360 px en la tarea 4.2.
- **QR con URL no oficial** (nota 02 del backend) → la pantalla lo muestra igual que la emisión. Queda documentado como limitación conocida hasta que el backend lo corrija.

## Migration Plan

No hay migración: solo se añaden rutas y componentes. Desplegar el frontal con esta fase no requiere cambios en el backend ni en el borde.
