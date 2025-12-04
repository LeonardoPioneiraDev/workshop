# Workshop Backend

> Simplified API with User Management, Email System, Globus/Oracle Connection and Authentication

## 📋 Descrição

Workshop Backend é uma API simplificada construída com NestJS que fornece funcionalidades essenciais de autenticação, gestão de usuários, sistema de e-mail e integração com Oracle Database (Globus).

## ✨ Funcionalidades

- 🔐 **Autenticação JWT** - Login seguro com tokens JWT
- 👥 **Gestão de Usuários** - CRUD completo de usuários
- 📝 **Logs de Login** - Auditoria completa de acessos
- 📧 **Sistema de E-mail** - Envio de e-mails com templates
- 🔶 **Integração Oracle** - Conexão com banco Oracle (Globus)
- ❤️ **Health Checks** - Monitoramento de saúde da aplicação
- 📚 **Swagger/OpenAPI** - Documentação automática da API

## 🚀 Tecnologias

- **NestJS** - Framework Node.js progressivo
- **TypeORM** - ORM para TypeScript e JavaScript
- **PostgreSQL** - Banco de dados principal
- **Oracle Database** - Integração com sistema Globus
- **JWT** - Autenticação baseada em tokens
- **Nodemailer** - Sistema de envio de e-mails
- **Swagger** - Documentação da API

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Ou com pnpm (recomendado)
pnpm install
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Servidor
NODE_ENV=development
PORT=3333
HOST=0.0.0.0

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=workshop
DATABASE_PASSWORD=workshop123
DATABASE_NAME=workshop_db
DATABASE_SCHEMA=public

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Segurança
ALLOWED_EMAIL_DOMAIN=@vpioneira.com.br
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_LOCK_TIME_MINUTES=15

# E-mail (Opcional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@example.com

# Oracle/Globus (Opcional)
ORACLE_ENABLED=true
ORACLE_USER=your-oracle-user
ORACLE_PASSWORD=your-oracle-password
ORACLE_CONNECTION_STRING=your-connection-string
ORACLE_CLIENT_PATH=C:/oracle/instantclient_21_3
```

## 🏃 Executando

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start:prod

# Debug
npm run start:debug
```

## 📚 Endpoints Principais

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário
- `GET /auth/profile` - Perfil do usuário autenticado

### Usuários
- `GET /users` - Listar todos os usuários
- `GET /users/:id` - Buscar usuário por ID
- `POST /users` - Criar novo usuário
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Logs de Login
- `GET /users/logs` - Listar logs de login
- `GET /users/logs/stats` - Estatísticas de logs

### E-mail
- `GET /email/test-connection` - Testar conexão SMTP

### Oracle
- `GET /oracle/health` - Health check Oracle
- `GET /oracle/test` - Testar conexão Oracle

### Health
- `GET /health` - Health check geral

### Documentação
- `GET /api` - Swagger UI

## 🗄️ Banco de Dados

### Migrations

```bash
# Executar migrations
npm run db:migrate

# Reverter última migration
npm run db:migrate:revert

# Ver status das migrations
npm run typeorm:migration:show
```

### Entidades

- **User** - Usuários do sistema
- **LoginLog** - Logs de login e auditoria

## 🔒 Segurança

- Autenticação JWT com expiração configurável
- Restrição de domínio de e-mail
- Bloqueio automático após tentativas falhadas
- Logs detalhados de todas as atividades
- Passwords hasheados com bcrypt

## 📝 Scripts Disponíveis

```bash
npm run build          # Compilar TypeScript
npm run dev            # Modo desenvolvimento
npm run start          # Iniciar produção
npm run type-check     # Verificar tipos TypeScript
npm run db:migrate     # Executar migrations
npm run email:test     # Testar configuração de e-mail
```

## 🏗️ Estrutura do Projeto

```
src/
├── auth/              # Módulo de autenticação
├── users/             # Módulo de usuários
├── email/             # Módulo de e-mail
├── oracle/            # Módulo Oracle/Globus
├── health/            # Health checks
├── common/            # Módulos compartilhados
├── config/            # Configurações
├── database/          # Configuração de banco
└── main.ts            # Ponto de entrada
```

## 📄 Licença

Este projeto é privado e de uso interno.

## 👨‍💻 Desenvolvimento

Desenvolvido para Workshop - Sistema de Gestão Empresarial

---

**Versão:** 3.0.0
