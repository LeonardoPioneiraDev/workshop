# ==========================================
# 🚀 WORKSHOP BACKEND - MULTI-STAGE LIMPO
# ==========================================

# ---- Build Stage ----
  FROM node:20-alpine AS builder

  WORKDIR /app
  
  # Instalar dependências de build
  RUN apk add --no-cache python3 make g++ git
  
  # Copiar package.json e instalar dependências
  COPY apps/backend/package.json ./
  RUN npm install
  
  # Copiar código fonte e buildar
  COPY apps/backend/src ./src
  COPY apps/backend/tsconfig*.json ./
  COPY apps/backend/nest-cli.json ./
  
  # Build
  RUN npm run build
  
  # ---- Production Stage ----
  FROM node:20-slim AS production
  
  # Instalar dependências de runtime
  RUN apt-get update && apt-get install -y \
      curl bash netcat-openbsd wget unzip libaio1 libaio-dev ca-certificates \
      && rm -rf /var/lib/apt/lists/*
  
  # ==========================================
  # 🔶 ORACLE INSTANT CLIENT
  # ==========================================
  RUN mkdir -p /opt/oracle
  WORKDIR /tmp
  
  RUN wget -q https://download.oracle.com/otn_software/linux/instantclient/1923000/instantclient-basic-linux.x64-19.23.0.0.0dbru.zip \
      && wget -q https://download.oracle.com/otn_software/linux/instantclient/1923000/instantclient-sqlplus-linux.x64-19.23.0.0.0dbru.zip \
      && unzip -o instantclient-basic-linux.x64-19.23.0.0.0dbru.zip -d /opt/oracle/ \
      && unzip -o instantclient-sqlplus-linux.x64-19.23.0.0.0dbru.zip -d /opt/oracle/ \
      && rm -f instantclient-*.zip \
      && mv /opt/oracle/instantclient_19_23 /opt/oracle/instantclient
  
  RUN echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig
  RUN cd /opt/oracle/instantclient && ln -sf libclntsh.so.19.1 libclntsh.so && ln -sf libocci.so.19.1 libocci.so
  
  # ==========================================
  # 🚀 APLICAÇÃO
  # ==========================================
  WORKDIR /app
  
  # Instalar apenas dependências de produção
  COPY apps/backend/package.json ./
  RUN npm install --only=production
  
  # Copiar build da aplicação
  COPY --from=builder /app/dist ./dist
  
  # Criar diretórios e usuário
  RUN mkdir -p logs uploads \
      && groupadd -g 1001 nodejs \
      && useradd -u 1001 -g nodejs -m nestjs \
      && chown -R nestjs:nodejs /app
  
  # Environment
  ENV NODE_ENV=production
  ENV HOST=0.0.0.0
  ENV PORT=3333
  ENV ORACLE_HOME=/opt/oracle/instantclient
  ENV LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH
  ENV PATH=/opt/oracle/instantclient:$PATH
  ENV ORACLE_CLIENT_PATH=/opt/oracle/instantclient
  ENV TNS_ADMIN=/opt/oracle/instantclient
  ENV NLS_LANG=AMERICAN_AMERICA.UTF8
  
  HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
      CMD curl -f http://localhost:3333/health || exit 1
  
  EXPOSE 3333
  USER nestjs
  
  CMD ["node", "dist/main.js"]