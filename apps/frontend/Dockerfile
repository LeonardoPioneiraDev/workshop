# apps/frontend/Dockerfile

# ---- Base Stage (para dependências) ----
FROM node:18-alpine AS base
WORKDIR /app

# Instalar pnpm usando corepack (método recomendado)
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Instalar dependências de build que podem ser necessárias
RUN apk add --no-cache python3 make g++ git

# Copiar arquivos de manifesto do monorepo e do app frontend
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependências para o frontend e seus pacotes de workspace dependentes
RUN pnpm install --frozen-lockfile --filter @dashboard/frontend...

# ---- Builder Stage (para compilar a aplicação) ----
FROM base AS builder
WORKDIR /app

# Argumentos de build com valores padrão
ARG VITE_API_BASE_URL=http://ccoapi.vpioneira.com.br:3021
ARG NODE_ENV=production

# Definir variáveis de ambiente para o build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV NODE_ENV=${NODE_ENV}

# Copiar o código fonte completo (necessário para o turbo)
COPY . .

# Aumentar o limite de memória (4GB geralmente é suficiente)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Limpar cache do turbo antes do build
RUN pnpm turbo run build --filter=@dashboard/frontend --no-cache

# ---- Production Stage (imagem final com Nginx) ----
FROM nginx:1.25-alpine AS production 

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Remover configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copiar arquivo de configuração customizado do Nginx
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os ativos estáticos buildados do frontend
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Criar usuário não-root para segurança
RUN adduser -D -H -s /sbin/nologin nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx-user:nginx-user /var/run/nginx.pid

# Healthcheck para monitoramento
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expor porta 80
EXPOSE 80

# Executar como usuário não-root
USER nginx-user

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]