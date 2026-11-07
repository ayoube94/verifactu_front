#!/usr/bin/env bash
# Prueba de humo de la imagen del frontal contra el contrato del backend (docs/operacion/frontal.md, §7)
# y el spec publicacion-frontal. Uso: ./scripts/comprobar-imagen.sh [imagen]   (por defecto verifactu-web:local)
set -euo pipefail

imagen="${1:-verifactu-web:local}"
puerto="${PUERTO:-18080}"
contenedor="comprobar-verifactu-web-$$"
fallos=0

limpiar() { docker rm -f "$contenedor" >/dev/null 2>&1 || true; }
trap limpiar EXIT

ok() { printf '  ✔ %s\n' "$1"; }
ko() { printf '  ✘ %s\n' "$1"; fallos=$((fallos + 1)); }

docker run -d --name "$contenedor" -p "127.0.0.1:${puerto}:8080" "$imagen" >/dev/null
base="http://127.0.0.1:${puerto}"
for _ in $(seq 1 30); do
  curl -fs -o /dev/null "$base/" && break
  sleep 0.5
done

echo "Comprobando $imagen"

# Cabeceras de una respuesta (en minúsculas y sin \r)
cabeceras() { curl -s -D - -o /dev/null "$1" | tr -d '\r' | tr '[:upper:]' '[:lower:]'; }

# 1. GET / → 200 con index.html y no-cache
inicio="$(curl -s -w '\n%{http_code}' "$base/")"
codigo="${inicio##*$'\n'}"
html="${inicio%$'\n'*}"
if [[ "$codigo" == "200" && "$html" == *'<div id="root">'* ]]; then ok "GET / devuelve index.html (200)"; else ko "GET / devolvió $codigo"; fi
if cabeceras "$base/" | grep -q '^cache-control: no-cache'; then ok "index.html con Cache-Control: no-cache"; else ko "index.html sin no-cache"; fi

# 2. Fallback de SPA: una ruta de cliente devuelve el mismo index.html
ruta="$(curl -s -w '\n%{http_code}' "$base/facturas/42")"
if [[ "${ruta##*$'\n'}" == "200" && "${ruta%$'\n'*}" == "$html" ]]; then ok "GET /facturas/42 devuelve index.html"; else ko "GET /facturas/42 no devuelve index.html"; fi

# 3. Recurso con huella: se sirve como fichero, inmutable y cacheable un año
recurso="$(grep -oE '/assets/[^"]+\.js' <<<"$html" | head -n1)"
cab_recurso="$(cabeceras "$base$recurso")"
if grep -q '^content-type: text/javascript' <<<"$cab_recurso"; then ok "$recurso se sirve como JavaScript"; else ko "$recurso no se sirve como fichero"; fi
if grep -qE '^cache-control: .*max-age=31536000.*immutable' <<<"$cab_recurso"; then ok "/assets/* con caché inmutable de un año"; else ko "/assets/* sin caché inmutable"; fi

# 4. CSP restringida al propio origen
csp="$(cabeceras "$base/" | grep '^content-security-policy:' || true)"
if [[ "$csp" == *"default-src 'self'"* && "$csp" != *"http"* ]]; then ok "CSP con default-src 'self' y sin orígenes externos"; else ko "CSP ausente o con orígenes externos: $csp"; fi

# 5. Proceso sin privilegios
uid="$(docker exec "$contenedor" sh -c "awk '/^Uid:/{print \$2}' /proc/1/status")"
if [[ "$uid" != "0" ]]; then ok "el servidor corre con uid $uid (no root)"; else ko "el servidor corre como root"; fi

# 6. Solo escucha en el 8080 (la imagen base de caddy declara EXPOSE 80/443/2019 en sus metadatos, pero con
#    admin off y un único sitio :8080 no abre ninguno de ellos; publicar puertos en el host lo decide el compose)
escuchando="$(docker exec "$contenedor" netstat -tln | awk 'NR>2 {n=split($4,a,":"); print a[n]}' | sort -u | tr '\n' ' ')"
if [[ "$escuchando" == "8080 " ]]; then ok "solo escucha en el puerto 8080"; else ko "puertos en escucha: $escuchando"; fi

if (( fallos > 0 )); then
  echo "$fallos comprobaciones fallidas"
  exit 1
fi
echo "Imagen conforme al contrato."
