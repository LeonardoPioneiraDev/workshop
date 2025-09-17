# Dockerfile

# Estágio de build
FROM node:18-alpine AS build

# Instalar PNPM globalmente
RUN npm install -g pnpm turbo

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do monorepo
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json ./

# Copiar pacotes
COPY apps ./apps
COPY packages ./packages

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Construir todos os pacotes
RUN pnpm build

# Estágio de produção para o frontend
FROM nginx:alpine AS frontend

# Copiar configuração do Nginx
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do frontend
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Estágio de produção para o backend
FROM node:18-alpine AS backend

ENV NODE_ENV=production

WORKDIR /app

# Copiar package.json do backend
COPY --from=build /app/apps/backend/package.json ./

# Instalar apenas dependências de produção
RUN npm install --production

# Copiar build do backend
COPY --from=build /app/apps/backend/dist ./dist

# Comando para iniciar a aplicação
CMD ["node", "dist/main"]