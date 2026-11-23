# Spec Delta

## Purpose

Permitir comprobar que un registro VeriFactu no se ha alterado, introduciendo su huella y leyendo el resultado que calcula el backend, de forma que el operador entienda sin ambigüedad si la integridad se mantiene.

## ADDED Requirements

### Requirement: Acceso a la verificación
La aplicación SHALL ofrecer una pantalla `/verificar-huella` con un campo para la huella, enlazada desde la navegación principal, y la página de inicio SHALL mostrar «Verificar huella» como enlace a ella.

#### Scenario: Desde la navegación
- **WHEN** el usuario pulsa «Verificar huella» en la navegación
- **THEN** se abre `/verificar-huella` con el campo vacío

### Requirement: Validación de la huella
El campo SHALL aceptar exactamente 64 caracteres hexadecimales, sin distinguir mayúsculas de minúsculas, y no SHALL enviar ninguna petición si no los cumple.

#### Scenario: Huella con formato incorrecto
- **WHEN** el usuario envía `abc123`
- **THEN** no se envía ninguna petición y se muestra «La huella tiene 64 caracteres hexadecimales» junto al campo

#### Scenario: Huella válida en mayúsculas
- **WHEN** el usuario envía 64 caracteres hexadecimales en mayúsculas
- **THEN** la petición se envía con la huella en minúsculas

### Requirement: Resultado de la verificación
La pantalla SHALL presentar el resultado de `GET /api/v1/facturas/auditoria/verificar-huella/{huella}` indicando si la integridad es válida, mostrando el mensaje devuelto por la API. El frontal MUST NOT recalcular la huella ni decidir la validez por su cuenta.

#### Scenario: Integridad válida
- **WHEN** la API responde 200 con `integridadValida` true
- **THEN** la pantalla indica que el registro no ha sido alterado y muestra el mensaje de la API

#### Scenario: Integridad no válida
- **WHEN** la API responde 200 con `integridadValida` false
- **THEN** la pantalla indica que la huella recomputada no coincide con la guardada, con alerta de error y el mensaje de la API

#### Scenario: Detalle técnico
- **WHEN** se muestra un resultado
- **THEN** la huella anterior, la fecha de generación y la cadena canónica aparecen en un bloque desplegable, con la huella anterior vacía indicada como «Primer registro de la cadena»

### Requirement: Huella inexistente
La pantalla SHALL indicar que no existe ningún registro con esa huella cuando la API responda 404.

#### Scenario: Huella sin registro
- **WHEN** la API responde 404
- **THEN** la pantalla muestra «No existe ningún registro con esa huella», sin mensaje técnico

#### Scenario: Sin conexión
- **WHEN** la petición no obtiene respuesta
- **THEN** la pantalla indica que no hay conexión con el servicio y permite reintentar
