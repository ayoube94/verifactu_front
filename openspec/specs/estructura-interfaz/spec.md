# estructura-interfaz Specification

## Purpose
Definir el armazón común de la aplicación que comparten todas las pantallas: navegación, rutas de cliente, página de no encontrado, estado del servicio, formato regional español y accesibilidad básica.

## Requirements

### Requirement: Navegación común
La aplicación SHALL mostrar en todas las pantallas una cabecera con el nombre del producto y la navegación a las secciones disponibles, y MUST NOT mostrar enlaces a secciones que aún no existen.

#### Scenario: Secciones disponibles
- **WHEN** el usuario abre cualquier pantalla
- **THEN** ve la cabecera con enlaces solo a secciones implementadas, y el enlace de la sección actual está marcado como activo

### Requirement: Rutas de cliente compartibles
Cada pantalla SHALL tener su propia URL, que al abrirse directamente o al recargar muestra esa misma pantalla, y SHALL actualizar el título del documento con el nombre de la pantalla.

#### Scenario: Recarga de una pantalla
- **WHEN** el usuario recarga la página estando en una pantalla de la aplicación
- **THEN** vuelve a ver la misma pantalla y el título de la pestaña la identifica

### Requirement: Página de no encontrado
Ante una URL que no corresponda a ninguna pantalla, la aplicación SHALL mostrar una página de "no encontrado" dentro del armazón común con un enlace a la página de inicio.

#### Scenario: URL desconocida
- **WHEN** el usuario abre `/una/ruta/inexistente`
- **THEN** ve la página de no encontrado con la cabecera común y un enlace a inicio

### Requirement: Estado del servicio
La aplicación SHALL consultar el endpoint público de salud del backend al cargar y mostrar de forma visible si el servicio está operativo o no disponible, sin bloquear el resto de la interfaz.

#### Scenario: Servicio operativo
- **WHEN** el endpoint de salud responde con estado `UP`
- **THEN** la interfaz indica que el servicio está operativo

#### Scenario: Servicio caído
- **WHEN** el endpoint de salud responde con un estado distinto de `UP`, con HTTP 503 o no responde
- **THEN** la interfaz indica que el servicio no está disponible y el resto de la pantalla sigue usable

### Requirement: Formato regional español
La aplicación SHALL mostrar los importes en formato es-ES con dos decimales, coma decimal y símbolo € (por ejemplo `1.210,00 €`), y las fechas como `dd/mm/aaaa`, sin alterar los valores recibidos de la API.

#### Scenario: Importe
- **WHEN** la API devuelve un importe `1210` o `1210.00`
- **THEN** se muestra `1.210,00 €`

#### Scenario: Fecha
- **WHEN** la API devuelve la fecha `2026-10-14`
- **THEN** se muestra `14/10/2026`

### Requirement: Accesibilidad común
Todas las pantallas SHALL declarar el idioma `es`, ofrecer un enlace para saltar al contenido principal, mostrar el foco del teclado de forma visible, ser utilizables solo con teclado y adaptarse a un ancho de 360 px sin desplazamiento horizontal.

#### Scenario: Navegación con teclado
- **WHEN** el usuario pulsa Tab al cargar una pantalla
- **THEN** el primer elemento enfocado es el enlace "Saltar al contenido" y el foco es visible

#### Scenario: Pantalla estrecha
- **WHEN** la aplicación se muestra con 360 px de ancho
- **THEN** no aparece desplazamiento horizontal y la navegación sigue siendo accesible
