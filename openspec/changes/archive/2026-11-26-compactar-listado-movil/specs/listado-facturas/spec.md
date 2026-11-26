# Spec Delta

## ADDED Requirements

### Requirement: Filas compactas en pantalla estrecha
En pantallas de hasta 480 px de ancho, cada fila del listado SHALL mostrarse como un bloque compacto con la factura y el importe en una línea y la fecha y el tipo en otra, cada dato con su etiqueta, sin descripción visible del tipo y sin desplazamiento horizontal.

#### Scenario: Factura e importe en una misma línea
- **WHEN** el listado se muestra a 360 px con la factura `2026/100` de importe `1.754,50 €`
- **THEN** la etiqueta y el valor de «Factura» y los de «Importe total» aparecen en la misma línea del bloque de esa factura

#### Scenario: Fecha y tipo en una misma línea
- **WHEN** el listado se muestra a 360 px con una factura de fecha `05/03/2026` y tipo `F1`
- **THEN** la etiqueta y el valor de «Fecha» y los de «Tipo» aparecen en la misma línea del bloque de esa factura

#### Scenario: Tipo solo con su código
- **WHEN** el listado se muestra a 360 px con una factura de tipo `F3`
- **THEN** el bloque muestra «F3» y no muestra la descripción «Factura emitida en sustitución de simplificadas», pero esa descripción forma parte del texto accesible de la celda del tipo

#### Scenario: Cliente y estado con etiqueta
- **WHEN** el listado se muestra a 360 px
- **THEN** el cliente con su NIF y el estado ante la AEAT siguen mostrándose cada uno con su etiqueta, en una línea propia

#### Scenario: Etiqueta y valor que no caben
- **WHEN** en una celda de media anchura la etiqueta y el valor no caben en una línea (por ejemplo, «Importe total» con `98.765,40 €`)
- **THEN** el valor pasa a una segunda línea dentro de su celda, sin salirse del bloque

#### Scenario: Bloque más bajo
- **WHEN** se compara una factura típica (nombre de cliente de una línea y estado de una línea) a 360 px antes y después del cambio
- **THEN** su bloque es al menos un 20 % más bajo que antes

#### Scenario: Sin desplazamiento horizontal
- **WHEN** el listado se muestra a 360 px con nombres de cliente muy largos
- **THEN** la página no tiene desplazamiento horizontal

#### Scenario: Sin desplazamiento horizontal con letra ampliada
- **WHEN** el listado se muestra a 360 px con el tamaño de letra del navegador al 200 %
- **THEN** la página no tiene desplazamiento horizontal y todos los datos de cada factura siguen visibles con su etiqueta

#### Scenario: Pantallas anchas sin cambios
- **WHEN** el listado se muestra a más de 480 px
- **THEN** la tabla sigue mostrando una columna de tipo con el código y su descripción visible
