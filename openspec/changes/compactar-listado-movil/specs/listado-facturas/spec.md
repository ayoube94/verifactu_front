# Spec Delta

## ADDED Requirements

### Requirement: Filas compactas en pantalla estrecha
En pantallas de hasta 480 px de ancho, cada fila del listado SHALL mostrarse como un bloque en el que la fecha y el tipo comparten una misma línea, cada uno con su etiqueta visible, y en el que el tipo se ve solo con su código. La descripción del tipo MUST seguir disponible para las tecnologías de apoyo. El resto de datos de la fila SHALL conservar su etiqueta, y el listado MUST NOT desplazarse horizontalmente.

#### Scenario: Fecha y tipo en una misma línea
- **WHEN** el listado se muestra a 360 px con una factura de fecha `05/03/2026` y tipo `F1`
- **THEN** la etiqueta y el valor de «Fecha» y los de «Tipo» aparecen en la misma línea del bloque de esa factura

#### Scenario: Tipo solo con su código
- **WHEN** el listado se muestra a 360 px con una factura de tipo `F3`
- **THEN** el bloque muestra «F3» y no muestra la descripción «Factura emitida en sustitución de simplificadas», pero esa descripción forma parte del texto accesible de la celda del tipo

#### Scenario: Resto de datos con etiqueta
- **WHEN** el listado se muestra a 360 px
- **THEN** la factura, el cliente con su NIF, el importe y el estado ante la AEAT siguen mostrándose cada uno con su etiqueta, en ese orden

#### Scenario: Bloque más bajo
- **WHEN** se compara una factura típica (nombre de cliente de una línea y estado de una línea) a 360 px antes y después del cambio
- **THEN** su bloque es al menos un 20 % más bajo que antes

#### Scenario: Sin desplazamiento horizontal
- **WHEN** el listado se muestra a 360 px con nombres de cliente muy largos
- **THEN** la página no tiene desplazamiento horizontal

#### Scenario: Pantallas anchas sin cambios
- **WHEN** el listado se muestra a más de 480 px
- **THEN** la tabla sigue mostrando una columna de tipo con el código y su descripción visible
