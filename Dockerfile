# Imagen del frontal: ghcr.io/<owner>/verifactu-web:<sha> (contrato docs/operacion/frontal.md del backend).

# 1) Compilación
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# build = tsc + vite build + comprobación de secretos en dist/ (postbuild)
RUN npm run build

# 2) Servicio estático con Caddy, sin root
FROM caddy:2-alpine
# Caddy no escribe en disco (admin y persist_config desactivados), pero sus rutas XDG deben ser escribibles
ENV XDG_CONFIG_HOME=/tmp/caddy/config \
    XDG_DATA_HOME=/tmp/caddy/data
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile \
    && addgroup -S -g 10001 web \
    && adduser -S -D -H -u 10001 -G web web
USER 10001:10001
EXPOSE 8080
