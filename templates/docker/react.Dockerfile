# Alvo `dev`: usado pelo Compose local (Vite com hot reload, código por bind mount).
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && cat package.json package-lock.json | md5sum | cut -d' ' -f1 > node_modules/.deps-hash
COPY . .
EXPOSE 3000
CMD ["sh", "docker/dev-entrypoint.sh"]

# Estágios abaixo: imagem de produção (último estágio = padrão de `docker build`).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
# O nginx da imagem oficial já roda como usuário sem privilégio quando a porta é alta (8080).
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:4000
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:8080/nginx-health >/dev/null || exit 1
