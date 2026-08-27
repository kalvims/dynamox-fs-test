# API
FROM node:22-alpine AS api
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
COPY libs ./libs
COPY tsconfig.base.json nx.json ./
RUN npm ci --omit=dev=false
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npx", "tsx", "src/main.ts"]

# Web build
FROM node:22-alpine AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY libs ./libs
COPY tsconfig.base.json nx.json ./
RUN npm ci
WORKDIR /app/apps/web
RUN npx vite build

FROM nginx:1.27-alpine AS web
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
