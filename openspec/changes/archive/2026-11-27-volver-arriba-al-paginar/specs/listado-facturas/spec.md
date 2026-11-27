# Spec Delta

## ADDED Requirements

### Requirement: Vista al cambiar de página
Al cambiar de página o de tamaño de página con los controles de paginación, si el inicio de la tabla queda por encima de la parte visible de la pantalla, la vista SHALL desplazarse de inmediato hasta ese inicio, sin animación. En cualquier otro caso la vista MUST NOT desplazarse, y el foco MUST permanecer en el control pulsado.

#### Scenario: Siguiente desde el final de una página larga
- **WHEN** el usuario ha desplazado la pantalla hasta los controles de una página de 50 facturas, de modo que el inicio de la tabla queda por encima, y pulsa «Siguiente»
- **THEN** la vista se desplaza hasta que el inicio de la tabla queda en la parte superior de la pantalla

#### Scenario: Cambiar el tamaño de página
- **WHEN** el usuario, con el inicio de la tabla por encima de lo visible, elige 100 facturas por página
- **THEN** la vista se desplaza hasta el inicio de la tabla

#### Scenario: El inicio de la tabla ya se ve
- **WHEN** el usuario pulsa «Siguiente» en una lista corta en la que el inicio de la tabla ya está a la vista
- **THEN** la vista no se desplaza

#### Scenario: Sin animación
- **WHEN** la vista se desplaza al cambiar de página, con o sin la preferencia de movimiento reducido del sistema
- **THEN** el desplazamiento es inmediato, sin animación

#### Scenario: Filtrar no desplaza
- **WHEN** el usuario aplica o quita filtros
- **THEN** la vista no se desplaza

#### Scenario: Cargar o navegar con el historial no desplaza
- **WHEN** el listado se abre con una página en la URL, o el usuario vuelve atrás o adelante en el navegador
- **THEN** la aplicación no desplaza la vista por su cuenta

#### Scenario: El foco se queda en el control
- **WHEN** el usuario pulsa «Siguiente» con el teclado
- **THEN** el foco sigue en «Siguiente» y puede volver a pulsarlo para pasar a la página siguiente
