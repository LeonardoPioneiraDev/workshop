# ==========================================
# 🎨 WORKSHOP FRONTEND - USANDO NPM
# ==========================================

# ---- Build Stage ----
  FROM node:18-alpine AS builder

  WORKDIR /app
  
  # Instalar dependências do sistema
  RUN apk add --no-cache \
      python3 \
      make \
      g++ \
      git
  
  # Copiar package.json e instalar dependências
  COPY apps/frontend/package.json ./
  RUN npm install
  
  # Copiar código fonte
  COPY apps/frontend/src ./src
  COPY apps/frontend/public ./public
  COPY apps/frontend/index.html ./
  COPY apps/frontend/vite.config.ts ./
  COPY apps/frontend/tsconfig*.json ./
  COPY apps/frontend/tailwind.config.js ./
  COPY apps/frontend/postcss.config.js ./
  COPY apps/frontend/components.json ./
  
  # Argumentos de build
  ARG VITE_API_BASE_URL=http://10.10.100.176:3333
  ARG NODE_ENV=production
  
  # Variáveis de ambiente para build
  ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
  ENV NODE_ENV=${NODE_ENV}
  ENV NODE_OPTIONS="--max-old-space-size=4096"
  
  # Build da aplicação
  RUN npm run build
  
  # ---- Production Stage ----
  FROM nginx:1.25-alpine AS production
  
  # Instalar curl para healthcheck
  RUN apk add --no-cache curl
  
  # Remover configuração padrão do nginx
  RUN rm -rf /etc/nginx/conf.d/*
  
  # Copiar configuração customizada do nginx
  COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
  
  # Copiar arquivos buildados
  COPY --from=builder /app/dist /usr/share/nginx/html
  
  # Criar usuário não-root
  RUN adduser -D -H -s /sbin/nologin nginx-user && \
      chown -R nginx-user:nginx-user /usr/share/nginx/html && \
      chown -R nginx-user:nginx-user /var/cache/nginx && \
      chown -R nginx-user:nginx-user /var/log/nginx && \
      touch /var/run/nginx.pid && \
      chown nginx-user:nginx-user /var/run/nginx.pid
  
  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3008/ || exit 1
  
  # Expor porta
  EXPOSE 3008
  
  # Executar como usuário não-root
  USER nginx-user
  
  # Comando de inicialização
  CMD ["nginx", "-g", "daemon off;"]