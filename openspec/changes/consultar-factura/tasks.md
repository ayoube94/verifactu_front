# Tasks

## 1. Rutas y navegación

- [x] 1.1 Añadir las rutas `/consultar`, `/facturas/:id` y `/verificar-huella` con páginas vacías (títulos «Consultar factura · Zefact», «Factura · Zefact» y «Verificar huella · Zefact») y las secciones «Consultar factura» y «Verificar huella» en `src/app/secciones.ts`. Se verifica con un test de que la navegación muestra las secciones nuevas y marca la activa
- [x] 1.2 En la página de inicio, convertir «Consultar factura» y «Verificar huella» en enlaces a sus rutas (la tercera tarjeta, si la hay, sigue como «Próxima fase»). Se verifica con un test de que los enlaces existen y navegan

## 2. Consulta por id

- [x] 2.1 Crear el formulario de `/consultar` con un único campo de id, validación de entero positivo y navegación a `/facturas/:id`. Se verifica con tests del spec: id válido navega a `/facturas/42`, e id `abc` muestra el error sin petición
- [x] 2.2 Crear el cliente de consulta `obtenerFactura(id)` con TanStack Query (clave `['factura', id]`, sin persistencia) y mapear 404, 401, 500 y fallo de red con `src/api/problemas.ts`. Se verifica con tests MSW de 200, 404, 500 y `HttpResponse.error()`

## 3. Vista de factura

- [x] 3.1 Crear la cabecera, el destinatario, la tabla de líneas (solo lectura, con base por línea) y el bloque de totales, con fechas `dd/mm/aaaa` y coma decimal. Se verifica con un test que carga la factura de ejemplo del spec y comprueba título, fechas, descuento en euros y totales
- [x] 3.2 Crear `<BloqueVerifactu>` con estado AEAT (texto y tono de `estadoEnvio.ts`), código y mensaje de la AEAT, CSV solo con aceptación, huella completa en el DOM, huella anterior o «Primer registro de la cadena», fecha-hora de generación y QR. Se verifica con tests de `ACEPTADO`, `RECHAZADO` y de que `textContent` contiene la huella completa
- [x] 3.3 Crear la descarga del XML como enlace `download` a `/api/v1/facturas/{id}/xml`. Se verifica con un test que comprueba el `href` y el atributo `download`. Si el XML falla, el navegador muestra su propio error (ver `design.md`)
- [x] 3.4 Mostrar en la pantalla los estados de error del spec: id inexistente con enlace a `/consultar`, 500 con `errorId` y sin conexión con reintento. Se verifica con tests MSW de 404, 500 y `HttpResponse.error()`

## 4. Verificación de huella

- [x] 4.1 Crear el formulario de `/verificar-huella` con validación de 64 caracteres hexadecimales, normalización a minúsculas y la huella en `?huella=`. Se verifica con tests: `abc123` no envía petición y la huella en mayúsculas se envía en minúsculas
- [x] 4.2 Crear la presentación del resultado de `verificarIntegridadHuella`: integridad válida o no válida según `integridadValida`, mensaje de la API y bloque `<details>` con huella anterior, fecha y cadena canónica. Se verifica con tests de los dos valores de `integridadValida` y de la huella anterior vacía. Revisar a 360 px que la cadena canónica no desborda
- [x] 4.3 Mostrar «No existe ningún registro con esa huella» en el 404 y el estado de sin conexión con reintento. Se verifica con tests MSW de 404 y de `HttpResponse.error()`

## 5. Verificación integral

- [x] 5.1 Añadir un escenario E2E en `playwright` que consulte una factura emitida desde el formulario de emisión, compruebe el bloque VeriFactu y el enlace del XML, y verifique la huella devuelta. Se verifica con `npm run test:e2e` en verde
- [x] 5.2 Pasar `npm run lint`, `npm run typecheck`, `npm test` y `npx impeccable detect` sobre las pantallas nuevas, y corregir los hallazgos. Se verifica con los cuatro comandos sin errores
- [x] 5.3 Revisar las pantallas nuevas con `/impeccable critique` y `/impeccable audit` a 360 px y con teclado, y corregir los P0 y P1. Se verifica con el informe sin P0 ni P1 abiertos
