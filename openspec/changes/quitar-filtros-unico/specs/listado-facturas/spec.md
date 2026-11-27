# Spec Delta

## MODIFIED Requirements

### Requirement: Estados vacíos
La pantalla SHALL distinguir entre que no exista ninguna factura y que ninguna cumpla los filtros, y MUST NOT mostrar la acción «Quitar filtros» más de una vez a la vez.

#### Scenario: Todavía no hay facturas
- **WHEN** la API responde 200 con `totalElements` 0 y no hay filtros activos
- **THEN** la pantalla muestra «Todavía no hay facturas» con un enlace a «Emitir factura»

#### Scenario: Ninguna cumple los filtros
- **WHEN** la API responde 200 con `totalElements` 0 y hay filtros activos
- **THEN** la pantalla muestra «Ninguna factura cumple los filtros» con la acción «Quitar filtros», y esa es la única «Quitar filtros» de la pantalla: el formulario de filtros no la muestra

#### Scenario: Con resultados «Quitar filtros» sigue en el formulario
- **WHEN** hay filtros activos y la API devuelve facturas
- **THEN** el formulario de filtros muestra «Quitar filtros» y la pantalla no muestra ningún estado vacío

#### Scenario: Página fuera de rango
- **WHEN** la URL pide una página mayor que la última y la API responde 200 sin facturas pero con `totalElements` mayor que 0
- **THEN** la pantalla ofrece volver a la primera página en lugar de mostrar «Todavía no hay facturas»
