# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Ahora:** un operador interno de la plataforma (el propio equipo de Zefact) que trabaja en el entorno de **preproducción** de la AEAT. Su trabajo es:
  - emitir facturas de prueba;
  - comprobar que la AEAT las acepta;
  - revisar huellas, QR y XML enviados;
  - detectar errores antes de abrir la plataforma a clientes.

  Conoce VeriFactu y el backend.
- **Más adelante** (con el login multi-cliente, no en esta fase): el personal administrativo de las empresas cliente, que emitirá y consultará sus propias facturas sin conocimientos técnicos.

## Product Purpose

Zefact es una plataforma SaaS de facturación que cumple **VeriFactu** (RD 1007/2023, Orden HAC/1177/2024). Permite:
- emitir facturas;
- encadenarlas con huella SHA-256;
- remitirlas a la AEAT en nombre de cada empresa cliente con un único certificado de plataforma.

El frontal es la herramienta operativa sobre ese backend: emitir, consultar y verificar facturas sin usar la API a mano.

**Éxito:** el operador emite una factura y sabe en el momento, sin ambigüedad, si la AEAT la aceptó, la rechazó o hubo un fallo de conexión. Además puede comprobar la integridad de cualquier registro.

## Positioning

La plataforma actúa como representante ante la AEAT para varias empresas con un único certificado. Garantiza que cada registro es inalterable (cadena de huellas por emisor) y lo deja verificable desde la propia interfaz.

## Operating Context

- **Uso:** escritorio en una oficina y, ocasionalmente, móvil para consultar.
- **Acceso:** todo el sitio está protegido por usuario y contraseña (HTTP Basic) en el borde. No hay login propio hasta el change multi-cliente.
- **Emisión síncrona:** la emisión espera la respuesta de la AEAT y puede tardar hasta unos 10 s. Una emisión aceptada por el backend puede volver con estado `RECHAZADO` o `ERROR_CONEXION`.
- **Documentos y datos del dominio:**
  - factura (serie, número, fecha de expedición, tipo F1–F3/R1–R5, régimen de IVA);
  - destinatario (NIF, razón social);
  - líneas (cantidad, precio, descuento en euros, tipo de IVA);
  - registro VeriFactu (huella, huella anterior, fecha-hora de generación, estado de envío, código y mensaje AEAT, CSV, QR, XML enviado).

## Capabilities and Constraints

- **Fases:** ver `notes/plan-por-fases.md`.
  1. base;
  2. emitir factura;
  3. consultar factura y verificar huella;
  4. despliegue;
  5. listado (pendiente de un endpoint del backend).
- **El backend es la única fuente de verdad:** el frontal no calcula nada con valor legal y solo muestra la huella, el QR y los importes definitivos.
- **Idioma y formatos:** solo español (es-ES). Importes como `1.210,00 €` y fechas como `dd/mm/aaaa`.
- **Sin recursos de terceros en tiempo de ejecución:** ni fuentes remotas, ni CDN, ni analítica (la CSP lo impide).
- **Sin datos de facturación** persistidos en el navegador.
- **Una emisión nunca se reintenta automáticamente**, porque encadena una huella.
- **Undecided:** tema oscuro (fuera de esta fase; los tokens se nombran por función para poder añadirlo).

## Brand Commitments

- **Nombre del producto:** **Zefact**. "VeriFactu" es el nombre del sistema de la AEAT y se usa solo para referirse a él, nunca como marca propia.
- **Sin logo** ni colores corporativos definidos todavía.
- **Voz:** sobria, administrativa y precisa. Mensajes en español claro, sin jerga técnica salvo los términos oficiales (huella, CSV, registro de facturación).

## Evidence on Hand

- **No hay** clientes, testimonios, cifras ni capturas reales. No deben inventarse.
- **Datos de ejemplo:** solo los del README del backend (factura `2026-001`, cliente `EMPRESA CLIENTE S.A.`).

## Product Principles

1. **Estado inequívoco:** cada factura muestra de forma explícita su estado frente a la AEAT. Nunca se presenta un fallo de envío como un éxito.
2. **Verificable:** huella, cadena e integridad están siempre a un clic, porque la confianza del producto es la inalterabilidad.
3. **Pocas pantallas que funcionan bien:** antes operativo que completo.
4. **Errores accionables:** cada error dice qué pasó y qué hacer, con el identificador del error cuando lo hay.

## Accessibility & Inclusion

- **Estándar:** WCAG 2.2 AA.
- **Teclado:** uso completo solo con teclado y foco visible.
- **Estado:** nunca se comunica solo con el color.
- **Ancho mínimo:** 360 px sin desplazamiento horizontal.
- **Tema:** solo claro en esta fase.
