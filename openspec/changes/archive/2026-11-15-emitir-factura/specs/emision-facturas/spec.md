# Spec Delta

## Purpose

Permitir al operador emitir una factura desde el frontal y saber sin ambigüedad qué ha pasado con ella ante la AEAT, sin emitirla nunca dos veces por error.

## ADDED Requirements

### Requirement: Acceso a la emisión
La aplicación SHALL ofrecer la pantalla de emisión en `/facturas/nueva`, con la entrada «Emitir factura» en la navegación principal y un enlace desde la página de inicio.

#### Scenario: Desde la navegación
- **WHEN** el usuario pulsa «Emitir factura» en la navegación
- **THEN** se abre `/facturas/nueva` con el formulario vacío, el enlace marcado como activo y el título «Emitir factura · Zefact»

#### Scenario: Desde inicio
- **WHEN** el usuario está en la página de inicio
- **THEN** «Emitir factura» aparece como enlace a `/facturas/nueva` y ya no como «Próxima fase»

### Requirement: Datos del formulario
El formulario SHALL recoger serie, número, fecha de expedición, tipo de factura, régimen de IVA, descripción de la operación, destinatario (NIF, nombre o razón social, dirección, código postal, ciudad y país) y una o más líneas (descripción, cantidad, precio unitario, descuento en euros y tipo de IVA), cada campo con su etiqueta visible.

#### Scenario: Valores iniciales
- **WHEN** se abre el formulario
- **THEN** la fecha de expedición es la de hoy en hora de Madrid, el tipo es F1, el régimen es 01 General, el país es ES y hay una línea con cantidad 1, descuento 0 y tipo de IVA 21 %

#### Scenario: Descuento en euros
- **WHEN** el usuario rellena el descuento de una línea
- **THEN** el campo indica que es un importe en euros, no un porcentaje

#### Scenario: Añadir y quitar líneas
- **WHEN** el usuario añade una línea y después quita otra
- **THEN** las líneas restantes conservan sus valores y la última línea no se puede quitar

### Requirement: Tipo de IVA siempre explícito
Cada línea enviada MUST incluir su `tipoIva`. El frontal MUST NOT depender de ningún valor por defecto del backend para él.

#### Scenario: Petición de emisión
- **WHEN** se emite una factura
- **THEN** cada línea del cuerpo de `POST /api/v1/facturas` lleva `tipoIva` numérico

### Requirement: Validación en el cliente
El formulario SHALL aplicar antes de enviar las mismas reglas que el backend e impedir el envío si alguna falla, mostrando cada mensaje junto a su campo, enlazado a él para tecnologías de apoyo, y llevando el foco al primer campo con error.

#### Scenario: Envío con campos vacíos
- **WHEN** el usuario pulsa «Emitir» sin serie y con una línea de cantidad 0
- **THEN** no se envía ninguna petición, se muestran «La serie es obligatoria» y «La cantidad debe ser mayor que 0» junto a sus campos y el foco va al campo de serie

#### Scenario: Reglas de cabecera
- **WHEN** la serie o el número superan 30 caracteres, o la descripción de la operación está vacía o supera 500
- **THEN** el campo afectado se señala y no se envía

#### Scenario: Reglas de línea
- **WHEN** una línea no tiene descripción, tiene precio negativo o no tiene tipo de IVA
- **THEN** el campo afectado de esa línea se señala y no se envía

#### Scenario: Límites del destinatario
- **WHEN** el NIF supera 20 caracteres o la razón social supera 120
- **THEN** el campo afectado se señala y no se envía

### Requirement: Destinatario según el tipo de factura
El destinatario (NIF y razón social) SHALL ser obligatorio en todas las facturas salvo las simplificadas (F2 y R5). En una simplificada con el destinatario vacío, la petición MUST NOT incluir `cliente`.

#### Scenario: Factura simplificada sin destinatario
- **WHEN** el tipo es F2 y el destinatario está vacío
- **THEN** el formulario es válido y la petición no incluye `cliente`

#### Scenario: Factura ordinaria sin destinatario
- **WHEN** el tipo es F1 y falta el NIF del destinatario
- **THEN** se señala el NIF como obligatorio y no se envía

### Requirement: Números en formato español
Los campos de cantidad, precio, descuento y tipo de IVA SHALL aceptar coma o punto como separador decimal, sin separador de miles. Cada campo MUST admitir los decimales que guarda el backend: cantidad y precio unitario hasta 4, descuento y tipo de IVA hasta 2.

#### Scenario: Coma decimal
- **WHEN** el usuario escribe `75,50` como precio
- **THEN** se envía `75.5` y los totales lo tienen en cuenta

#### Scenario: Precio con 4 decimales
- **WHEN** el usuario escribe `0,1234` como precio unitario
- **THEN** el valor es válido y se envía `0.1234`

#### Scenario: Demasiados decimales
- **WHEN** el usuario escribe `0,12345` como precio o `5,555` como descuento
- **THEN** el campo indica cuántos decimales admite (4 o 2) y no se envía

### Requirement: Totales orientativos
El formulario SHALL calcular y mostrar, mientras se edita, la base imponible, la cuota de IVA y el importe de cada línea y del total, con el cálculo del backend:
- base de línea = cantidad × precio − descuento (el producto sin redondear), redondeada HALF_UP a 2 decimales;
- cuota = base × (tipo / 100 con 4 decimales), redondeada HALF_UP a 2 decimales;
- importe de línea = base + cuota;
- totales = suma de las líneas.

Los totales se rotulan como orientativos.

#### Scenario: Línea de ejemplo
- **WHEN** hay una línea de cantidad 1, precio 1000, descuento 0 e IVA 21 %, y otra de cantidad 6, precio 75 e IVA 21 %
- **THEN** se muestran base `1.450,00 €`, cuota `304,50 €` y total `1.754,50 €`

#### Scenario: Redondeo por línea
- **WHEN** una línea tiene cantidad 3, precio 0,35 e IVA 21 %
- **THEN** su base es `1,05 €` y su cuota `0,22 €`

### Requirement: Envío sin duplicados
Al emitir, el formulario SHALL:
- mostrar que está esperando la respuesta de la AEAT;
- deshabilitar el envío hasta obtener respuesta;
- avisar si el usuario intenta abandonar la página mientras espera.

La emisión MUST NOT reintentarse automáticamente.

#### Scenario: Doble pulsación
- **WHEN** el usuario pulsa «Emitir» dos veces seguidas
- **THEN** se envía una sola petición y el botón indica «Emitiendo…» hasta la respuesta

#### Scenario: Error del servidor
- **WHEN** la emisión responde 500
- **THEN** se muestra el error con su `errorId`, no se repite la petición por sí sola y los datos del formulario se conservan

### Requirement: Errores del backend en el formulario
Ante un 400 con `errores`, el formulario SHALL mostrar cada mensaje junto a su campo, traduciendo las claves del backend (`serie`, `cliente.nif`, `lineas[1].cantidad`) al campo correspondiente, y los mensajes sin campo reconocible como error general. Ante un 409 SHALL explicar que la serie y el número ya existen.

#### Scenario: Error de una línea
- **WHEN** la API responde 400 con `errores` = `{"lineas[1].cantidad": "La cantidad debe ser mayor que 0"}`
- **THEN** el mensaje aparece junto a la cantidad de la segunda línea

#### Scenario: Número duplicado
- **WHEN** la API responde 409
- **THEN** se muestra el conflicto junto a serie y número y los datos del formulario se conservan

### Requirement: Estado ante la AEAT inequívoco
Tras una emisión con respuesta 201, la aplicación SHALL mostrar el estado de envío en palabras («Aceptada por la AEAT», «Aceptada con errores», «Rechazada por la AEAT», «Error de conexión con la AEAT», «Pendiente de envío» o «Enviada, sin respuesta») con el código y el mensaje de la AEAT cuando existan. Un estado distinto de aceptado MUST presentarse como incidencia, nunca como éxito.

#### Scenario: Factura aceptada
- **WHEN** la emisión devuelve `estadoEnvio` `ACEPTADO` con CSV
- **THEN** se muestra «Aceptada por la AEAT» como éxito

#### Scenario: Factura registrada pero rechazada
- **WHEN** la emisión devuelve 201 con `estadoEnvio` `RECHAZADO` y un mensaje de la AEAT
- **THEN** se muestra «Rechazada por la AEAT» como incidencia junto al código y el mensaje, y se indica que el registro ya está encadenado y no se puede volver a emitir con la misma serie y número

#### Scenario: Error de conexión con la AEAT
- **WHEN** la emisión devuelve 201 con `estadoEnvio` `ERROR_CONEXION`
- **THEN** se muestra «Error de conexión con la AEAT» como incidencia, no como éxito

### Requirement: Datos del registro emitido
El resultado SHALL mostrar, con los valores devueltos por el backend, el número `serie-número`, la fecha, el destinatario, los totales, el CSV cuando exista, la huella anterior como «suma y sigue» seguida de la huella del registro, y el QR con texto alternativo.

#### Scenario: Registro completo
- **WHEN** la emisión devuelve 201 con `numSerieFactura` `2026-001`, CSV, `huellaAnterior`, `huella` y `qrBase64`
- **THEN** se muestran `2026-001`, el CSV, «Suma y sigue» con la huella anterior, la huella del registro y la imagen del QR con texto alternativo

#### Scenario: Primer registro de la cadena
- **WHEN** `huellaAnterior` está vacía
- **THEN** el bloque «suma y sigue» indica que es el primer registro de la cadena

#### Scenario: Emitir otra
- **WHEN** el usuario pulsa «Emitir otra factura» en el resultado
- **THEN** vuelve un formulario nuevo con los valores iniciales

### Requirement: Recuperación tras un fallo sin respuesta
Si la emisión falla sin respuesta HTTP, la aplicación SHALL comprobar con `GET /api/v1/facturas/por-numero` si la factura llegó a crearse antes de permitir reintentar:
- si existe, muestra su resultado indicando que ya se había emitido;
- si no existe (404), permite reintentar con los mismos datos;
- si la comprobación tampoco obtiene respuesta, no ofrece reintento hasta comprobarlo de nuevo.

Ante un 409 con `facturaId`, SHALL ofrecer abrir la factura existente.

#### Scenario: La factura sí se emitió
- **WHEN** el `POST` falla sin respuesta y `por-numero` devuelve la factura
- **THEN** se muestra su resultado ante la AEAT con el aviso «Esta factura ya se había emitido» y no se ofrece reintentar

#### Scenario: La factura no se emitió
- **WHEN** el `POST` falla sin respuesta y `por-numero` devuelve 404
- **THEN** se indica que la factura no llegó a emitirse y se ofrece «Reintentar la emisión»

#### Scenario: Duplicado con identificador
- **WHEN** la emisión responde 409 con `facturaId` 42
- **THEN** el conflicto ofrece ver la factura existente, cargada con `GET /api/v1/facturas/42`
