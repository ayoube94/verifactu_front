---
name: Zefact
description: Frontal operativo de facturación VeriFactu, construido como un libro registro de facturas expedidas.
colors:
  verde-botella: "#1e3b32"
  texto-cabecera: "#eaf1ec"
  texto-cabecera-sec: "#c8d8ce"
  papel: "#f5f6f0"
  papel-hundido: "#eaefe6"
  superficie: "#ffffff"
  tinta-indigo: "#24346e"
  tinta-indigo-honda: "#1a2654"
  texto: "#1b2420"
  texto-sec: "#55615a"
  texto-inactivo: "#626d66"
  pauta: "#c9d6cc"
  pauta-fuerte: "#8fae9a"
  borde-control: "#6b7a70"
  ok: "#1f6b45"
  ok-fondo: "#e3f0e8"
  aviso: "#8a5300"
  aviso-fondo: "#fbf0dc"
  error: "#b42318"
  error-fondo: "#fbe9e7"
typography:
  titular:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  titulo:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  destacado:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  cuerpo:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  etiqueta:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.5
  datos:
    fontFamily: "ui-monospace, Cascadia Mono, SF Mono, Consolas, Liberation Mono, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "6px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "40px"
  "8": "48px"
components:
  button-principal:
    backgroundColor: "{colors.tinta-indigo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "40px"
  button-principal-hover:
    backgroundColor: "{colors.tinta-indigo-honda}"
  button-secundario:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-indigo}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "40px"
  button-secundario-hover:
    backgroundColor: "{colors.papel-hundido}"
  cabecera:
    backgroundColor: "{colors.verde-botella}"
    textColor: "{colors.texto-cabecera}"
    height: "64px"
  aviso-error:
    backgroundColor: "{colors.error-fondo}"
    textColor: "{colors.texto}"
    padding: "16px 24px"
---

# Design System: Zefact

## Overview

**Creative North Star: "El Libro Registro"**

Zefact se dibuja como el libro registro de facturas expedidas que cualquier administrativo español ha tenido delante: papel claro y pautado, tapas verde botella y la tinta índigo de la pluma. Cada factura es un asiento numerado, y la huella de cada registro arrastra la del anterior, igual que el «suma y sigue» al pie de cada folio. El mundo no decora: da paleta, tipografía, densidad y un gesto propio. La estructura y los controles son los estándar de una aplicación web.

Es una herramienta de trabajo (modo Operate): el operador debe saber dónde está todo antes de fijarse en el estilo. La confianza sale de la precisión: cifras alineadas, filetes finos y estados que siempre dicen con palabras lo que pasa.

**Key Characteristics:**
- Cabecera verde botella fija sobre un fondo papel.
- Un único color reservado, la tinta índigo, para la acción principal, lo activo y los titulares de registro.
- Filetes de pauta en lugar de tarjetas y sombras.
- Cifras tabulares en todo el texto; monoespaciada solo para datos (huellas, CSV, identificadores).
- El «suma y sigue» como gesto propio: la huella anterior arrastrada antes de la huella del registro.

## Colors

Estrategia contenida: neutros teñidos del verde del libro, un acento de tinta y colores de estado solo donde significan algo.

### Primary
- **Tinta índigo** (`#24346e`): botón principal, enlace, elemento activo, titular de serie-número. Nunca decorativa.

### Neutral
- **Verde botella** (`#1e3b32`): solo la cabecera, como las tapas del libro.
- **Papel** (`#f5f6f0`) y **papel hundido** (`#eaefe6`): fondo y bloques de arrastre.
- **Pauta** (`#c9d6cc`) y **pauta fuerte** (`#8fae9a`): filetes. No son texto ni bordes de controles (2,2:1).
- **Borde de control** (`#6b7a70`): bordes de campos y botones deshabilitados (≥ 3:1).

### Estados
- **Correcto** `#1f6b45`, **aviso** `#8a5300` y **error** `#b42318`, cada uno con su fondo claro. Siempre acompañados de texto.

**The Reserved Ink Rule.** La tinta índigo marca lo que se puede hacer o lo que está activo. Si algo es índigo y no es accionable ni un titular de registro, sobra.

**The Words First Rule.** Ningún estado se comunica solo con color: «Aceptada por la AEAT», «No disponible». El color refuerza.

## Typography

Pila del sistema: la CSP impide cargar fuentes remotas y la herramienta debe sentirse nativa. Escala fija en rem con razón de alrededor de 1,2.

### Hierarchy
- **Titular** (2.5rem/700): serie-número de una factura y título de la pantalla de inicio.
- **Título** (1.75rem/700): títulos de pantalla.
- **Destacado** (1.25rem/700): estado frente a la AEAT, total, estado del servicio.
- **Cuerpo** (1rem/400): casi todo. Medida máxima de 70ch en párrafos.
- **Etiqueta** (0.9375rem/600): navegación, subtítulos de sección en gris.
- **Datos** (monoespaciada): huellas, CSV, errorId, rutas.

**The One Size Rule.** Una talla, la de cuerpo, hace casi todo el trabajo. La jerarquía va por peso y posición, no por multiplicar tamaños.

## Layout

- **Contenedor:** máximo 80rem, centrado. Márgenes laterales de 16px en móvil y 48px desde 48rem.
- **Pantallas de trabajo:** columna principal más un lateral de 22rem separado por un filete fuerte a partir de 60rem. En móvil el lateral cae debajo.
- **Listas pautadas:** filete fuerte arriba y pauta fina entre asientos, nunca tarjetas.
- **Espaciado:** base de 4px; más espacio encima de un título que debajo.
- **Ancho mínimo:** 360px sin desplazamiento horizontal.

**The Fixed Columns Rule.** En tablas y listas, las columnas no se mueven al cambiar un estado: el estado restila la fila.

## Elevation & Depth

Plano. La profundidad se expresa con filetes y con el papel hundido, no con sombras.

## Shapes

Un único radio de 6px para controles. Superficies y bloques sin redondeo: el libro es papel, no tarjetas.

## Components

### Buttons
- **Principal:** fondo índigo con texto blanco; al pasar el ratón, índigo hondo. Uno por pantalla.
- **Secundario:** contorno índigo y fondo papel hundido al pasar el ratón.
- **Ambos:** 40px de alto, foco con anillo índigo de 2px y desplazamiento de 2px. Deshabilitados en gris (`texto-inactivo` y `borde-control`). `aria-busy` mientras dura una operación.

### Navigation
- Enlaces en la cabecera verde.
- El activo se marca con `aria-current="page"`, texto claro y un filete inferior de 3px.
- El foco sobre la cabecera usa el anillo claro.

### Aviso de error
- Fondo de error claro con filete de error arriba y abajo (nunca un borde lateral grueso).
- Título en rojo, cuerpo en texto normal y acción (Reintentar o Recargar) debajo.
- `role="alert"`.

### Estado del servicio
- `<output>` en la cabecera: punto de color decorativo más «Servicio operativo» o «Servicio no disponible».
- En el inicio, el detalle con la acción «Comprobar de nuevo».

### Suma y sigue (signature)
En el detalle de una factura (fase 3): un bloque de papel hundido con «Suma y sigue · huella anterior», seguido del bloque de la huella propia, que cierra con un filete índigo de 2px. Es el único sitio donde la cadena de huellas se ve como cadena.

## Do's and Don'ts

### Do:
- **Do** reservar la tinta índigo para la acción principal y lo activo.
- **Do** escribir cada estado con palabras, en español claro.
- **Do** separar con filetes de pauta y alinear las cifras en columnas tabulares.
- **Do** aislar con espacio vacío las acciones irreversibles (anular, en fases futuras).
- **Do** mostrar el `errorId` cuando el backend lo dé.

### Don't:
- **Don't** usar tarjetas, sombras ni tarjetas dentro de tarjetas.
- **Don't** usar etiquetas tipo píldora de color como único indicador de estado.
- **Don't** usar monoespaciada como disfraz técnico: solo para datos.
- **Don't** cargar fuentes, iconos ni imágenes de otros orígenes.
- **Don't** dibujar la pauta del libro literalmente (papel rayado de fondo): solo filetes y cifras alineadas.
- **Don't** poner un rótulo pequeño encima de un título.

## Componentes de la emisión (fase 2)

- **Campos** (`src/componentes/Campos.tsx`): etiqueta visible, ayuda opcional y error asociado con `aria-describedby` y `aria-invalid`. El error se marca con borde, texto y mensaje, nunca solo con color.
- **Tabla de líneas**: en escritorio, una cabecera pautada con columnas fijas (descripción, cantidad, precio, descuento, IVA, base) y las etiquetas de cada campo ocultas visualmente. A partir de 360 px, cada línea es un bloque apilado con etiquetas visibles.
- **Totales orientativos**: pie con filete índigo de 2 px; el importe total es el único texto índigo en negrita.
- **«Suma y sigue» en el resultado** (`src/paginas/emitir/SumaYSigue.tsx`): la huella se agrupa en bloques de 4 solo visualmente; el texto copiado es la huella completa.
