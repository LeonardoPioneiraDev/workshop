// apps/backend/src/main.ts
import { randomUUID } from 'crypto';

// ==========================================
// 🔧 POLYFILL PARA CRYPTO (COMPATIBILIDADE)
// ==========================================
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => randomUUID(),
    subtle: {} as any,
    getRandomValues: (array: any) => {
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(array.length);
      array.set(bytes);
      return array;
    }
  } as any;
}

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
 
import helmet from 'helmet';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Iniciando Workshop Backend...');
    
    // ==========================================
    // 🏗️ CRIAR APLICAÇÃO
    // ==========================================
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      cors: false, // Configuraremos CORS manualmente
    });

    // Obter ConfigService
    const configService = app.get(ConfigService);
    
    // Configurações básicas
    const port = configService.get<number>('PORT', 3333);
    const host = configService.get<string>('HOST', '0.0.0.0');
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    // ==========================================
    // 🔧 CONFIGURAÇÕES EXPRESS E SEGURANÇA
    // ==========================================
    
    // Trust proxy
    const trustProxy = configService.get<string>('TRUST_PROXY', 'false');
    if (trustProxy === 'true') {
      app.set('trust proxy', 1);
      logger.log('🔧 Trust proxy habilitado');
    } else {
      app.set('trust proxy', false);
      logger.log('🔧 Trust proxy desabilitado');
    }

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression - CORREÇÃO DO ERRO
    const compressionEnabled = configService.get<boolean>('COMPRESSION_ENABLED', true);
    if (compressionEnabled) {
      // Converter string para number explicitamente
      const compressionLevel = parseInt(configService.get<string>('COMPRESSION_LEVEL', '6'), 10);
      
      // Validar se o nível está dentro do range válido (0-9)
      const validLevel = Math.max(0, Math.min(9, compressionLevel));
      
      
      
      logger.log(`🗜️ Compressão habilitada (nível: ${validLevel})`);
    } else {
      logger.log('🗜️ Compressão desabilitada');
    }

    // Helmet para segurança (relaxado para testes)
    const helmetEnabled = configService.get<boolean>('HELMET_ENABLED', true);
    if (helmetEnabled) {
      app.use(helmet({
        contentSecurityPolicy: false, // Desabilitado para testes
        crossOriginEmbedderPolicy: false, // Desabilitado para testes
        crossOriginResourcePolicy: false, // Desabilitado para testes
        hsts: nodeEnv === 'production' ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        } : false,
      }));
      logger.log('🛡️ Helmet configurado (modo relaxado para testes)');
    }

    // ==========================================
    // 🌐 CONFIGURAÇÃO CORS TOTALMENTE PÚBLICO
    // ==========================================
    app.enableCors({
      origin: true, // Permite qualquer origem
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Credentials',
        'X-HTTP-Method-Override',
        'Set-Cookie',
        'Cookie'
      ],
      exposedHeaders: [
        'Authorization',
        'Content-Length',
        'X-Requested-With',
        'Set-Cookie'
      ],
      credentials: true, // Permite cookies e credenciais
      preflightContinue: false,
      optionsSuccessStatus: 204, // Para suporte a navegadores legados
    });

    // Middleware adicional para CORS manual (garantia extra)
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      
      // Permite qualquer origem
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma'
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, PUT, POST, DELETE, OPTIONS, PATCH'
      );
      
      // Responder a requisições OPTIONS
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      
      next();
    });
    
    logger.log('🌐 CORS TOTALMENTE PÚBLICO configurado:');
    logger.log('   ✅ Todas as origens permitidas');
    logger.log('   ✅ Todos os métodos HTTP permitidos');
    logger.log('   ✅ Credenciais habilitadas');
    logger.log('   ✅ Headers customizados permitidos');
    logger.log('   ✅ Preflight requests tratados');

    // ==========================================
    // ✅ VALIDAÇÃO GLOBAL
    // ==========================================
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true, // Remove propriedades que não estão no DTO
        forbidNonWhitelisted: true, // Lança erro se propriedades extras forem enviadas
        disableErrorMessages: nodeEnv === 'production',
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          if (nodeEnv === 'development') {
            const validationLogger = new Logger('ValidationError');
            validationLogger.warn('Erro de validação:', JSON.stringify(errors, null, 2));
          }
          return new BadRequestException({
            statusCode: 400,
            message: 'Dados de entrada inválidos',
            errors: errors.map(error => ({
              field: error.property,
              value: error.value,
              constraints: error.constraints
            }))
          });
        },
      }),
    );
    logger.log('✅ Validação global habilitada');

    // Aplicar filtro de validação global
    app.useGlobalFilters(new ValidationExceptionFilter());

    // ==========================================
    // 📚 SWAGGER DOCUMENTATION
    // ==========================================
    const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
    if (swaggerEnabled && nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Workshop Backend API')
        .setDescription(`
          ## 🎯 Sistema de Autenticação e Gestão de Usuários
          
          ### 🚀 Funcionalidades Principais:
          - 🔐 **Autenticação JWT** com refresh tokens e segurança avançada
          - 👥 **Gestão de Usuários** com hierarquia organizacional completa
          - 📧 **Sistema de E-mail** para notificações e recuperação de senhas
          - �� **Reset de Senhas** com tokens seguros e expiração automática
          - 🏢 **Estrutura Organizacional** (departamentos, cargos, roles)
          - 🛡️ **Segurança Avançada** com validações e rate limiting
          - 🔒 **Bloqueio de Contas** por tentativas de login falhadas
          - 📊 **Logs Detalhados** para auditoria e monitoramento
          
          ### 🌍 Ambientes:
          - **Desenvolvimento**: Todas as funcionalidades habilitadas com logs verbosos
          - **Produção**: Configurações otimizadas para performance e segurança
          
          ### 🔑 Como Usar a Autenticação:
          1. **Registrar**: \`POST /auth/register\` - Criar nova conta
          2. **Login**: \`POST /auth/login\` - Obter tokens de acesso
          3. **Autorização**: Adicionar header \`Authorization: Bearer <access_token>\`
          4. **Refresh**: \`POST /auth/refresh\` - Renovar token expirado
          5. **Reset Senha**: \`POST /auth/forgot-password\` - Solicitar reset por e-mail
          
          ### 📧 Sistema de E-mail:
          - E-mails de boas-vindas automáticos
          - Notificações de alteração de senha
          - Reset de senha com links seguros
          - Templates personalizáveis
          
          ### 🛡️ Recursos de Segurança:
          - Senhas com validação de força
          - Bloqueio automático após tentativas falhadas
          - Tokens JWT com expiração configurável
          - Rate limiting por endpoint
          - Logs de segurança detalhados
          
          ### 🌐 CORS:
          - **MODO TESTE**: CORS totalmente liberado para desenvolvimento
          - **Todas as origens permitidas** para facilitar testes
          - **Credenciais habilitadas** para autenticação cross-origin
        `)
        .setVersion('1.0.0')
        .setContact(
          'Equipe Workshop',
          'https://workshop.com',
          'suporte@workshop.com'
        )
        .setLicense(
          'MIT License',
          'https://opensource.org/licenses/MIT'
        )
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Token JWT obtido no endpoint de login',
            in: 'header',
          },
          'JWT-auth',
        )
        .addTag('Authentication', '🔐 Autenticação, login, registro e tokens')
        .addTag('users', '👥 Gestão completa de usuários e perfis')
        .addTag('Password Reset', '🔄 Recuperação e reset de senhas')
        .addTag('Email', '📧 Funcionalidades de e-mail e notificações')
        .addTag('health', '🏥 Health checks e monitoramento do sistema')
        .addServer(`http://localhost:${port}`, 'Servidor de Desenvolvimento')
        .addServer(`http://${host}:${port}`, 'Servidor Local')
        .addServer(`https://api.workshop.com`, 'Servidor de Produção')
        .build();

      const document = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
        deepScanRoutes: true,
      });
      
      SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'none',
          filter: true,
          showRequestDuration: true,
          tryItOutEnabled: true,
          requestInterceptor: (req: any) => {
            // Log requests in development
            if (nodeEnv === 'development') {
              console.log('Swagger Request:', req.method, req.url);
            }
            return req;
          },
        },
        customSiteTitle: 'Workshop Backend API Documentation',
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .info .title { color: #2c3e50; }
        `,
        customfavIcon: '/favicon.ico',
      });
      
      logger.log(`📚 Swagger habilitado: http://localhost:${port}/api`);
    }

    // ==========================================
    // 🚀 INICIAR SERVIDOR
    // ==========================================
    await app.listen(port, host);
    
    // ==========================================
    // 📊 LOG DE INICIALIZAÇÃO COMPLETO
    // ==========================================
    logger.log('');
    logger.log('🎉 ===============================================');
    logger.log('🎉      WORKSHOP BACKEND INICIADO COM SUCESSO!');
    logger.log('🎉 ===============================================');
    logger.log('');
    logger.log(`🌍 Ambiente: ${nodeEnv.toUpperCase()}`);
    logger.log(`🖥️  Servidor: http://${host}:${port}`);
    logger.log(`📚 API Docs: http://localhost:${port}/api`);
    logger.log(`🏥 Health: http://localhost:${port}/health`);
    logger.log('');
    logger.log('�� Endpoints Principais:');
    logger.log(`   🔐 Login:           POST /auth/login`);
    logger.log(`   📝 Registro:        POST /auth/register`);
    logger.log(`   👥 Usuários:        GET  /users`);
    logger.log(`   🔄 Reset Senha:     POST /auth/forgot-password`);
    logger.log(`   🔑 Alterar Senha:   POST /auth/change-password`);
    logger.log(`   🔄 Refresh Token:   POST /auth/refresh`);
    logger.log(`   👤 Perfil:          GET  /auth/profile`);
    logger.log(`   📧 Teste E-mail:    POST /email/test`);
    logger.log('');
    logger.log('🔧 Funcionalidades Ativas:');
    logger.log(`   �� E-mail:          ${configService.get('EMAIL_ENABLED', false) ? '✅ Habilitado' : '❌ Desabilitado'}`);
    logger.log(`   🔶 Oracle:          ${configService.get('ORACLE_ENABLED', false) ? '✅ Habilitado' : '❌ Desabilitado'}`);
    logger.log(`   📊 Swagger:         ${swaggerEnabled && nodeEnv !== 'production' ? '✅ Habilitado' : '❌ Desabilitado'}`);
    logger.log(`   🌐 CORS:            ✅ TOTALMENTE PÚBLICO (modo teste)`);
    logger.log(`   ✅ Validação:       ✅ Habilitada`);
    logger.log(`   🗜️ Compressão:      ${compressionEnabled ? '✅ Habilitada' : '❌ Desabilitada'}`);
    logger.log(`   🛡️ Helmet:          ${helmetEnabled ? '✅ Habilitado (relaxado)' : '❌ Desabilitado'}`);
    logger.log(`   🔒 Trust Proxy:     ${trustProxy === 'true' ? '✅ Habilitado' : '❌ Desabilitado'}`);
    logger.log('');
    logger.log('🌐 Configurações CORS (MODO TESTE):');
    logger.log('   ✅ Origin: Qualquer origem permitida');
    logger.log('   ✅ Methods: GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
    logger.log('   ✅ Headers: Todos os headers permitidos');
    logger.log('   ✅ Credentials: Habilitadas');
    logger.log('   ✅ Preflight: Tratado automaticamente');
    logger.log('   ⚠️  ATENÇÃO: Esta configuração é apenas para TESTES!');
    logger.log('');
    
    // Log da configuração de compressão
    if (compressionEnabled) {
      const compressionLevel = parseInt(configService.get<string>('COMPRESSION_LEVEL', '6'), 10);
      const validLevel = Math.max(0, Math.min(9, compressionLevel));
      logger.log('🗜️ Configurações de Compressão:');
      logger.log(`   📊 Nível:           ${validLevel} (0=mais rápido, 9=melhor compressão)`);
      logger.log(`   📏 Threshold:       1024 bytes`);
      logger.log(`   🔧 Chunk Size:      16KB`);
      logger.log(`   💾 Window Bits:     15`);
      logger.log(`   🧠 Memory Level:    8`);
      logger.log('');
    }
    
    logger.log('📊 Configurações de Segurança:');
    logger.log(`   🔐 JWT Expiry:      ${configService.get('JWT_EXPIRES_IN', '24h')}`);
    logger.log(`   🔄 Refresh Expiry:  ${configService.get('JWT_REFRESH_EXPIRES_IN', '7d')}`);
    logger.log(`   🚫 Max Tentativas:  ${configService.get('AUTH_MAX_LOGIN_ATTEMPTS', 5)}`);
    logger.log(`   ⏱️ Bloqueio:        ${configService.get('AUTH_LOCK_TIME_MINUTES', 15)} minutos`);
    logger.log(`   🔒 BCrypt Rounds:   ${configService.get('BCRYPT_ROUNDS', 12)}`);
    logger.log('');
    logger.log('📧 Configurações de E-mail:');
    if (configService.get('EMAIL_ENABLED', false)) {
      logger.log(`   📡 SMTP Host:       ${configService.get('SMTP_HOST', 'N/A')}`);
      logger.log(`   🔌 SMTP Port:       ${configService.get('SMTP_PORT', 'N/A')}`);
      logger.log(`   👤 SMTP User:       ${configService.get('SMTP_USER', 'N/A')}`);
      logger.log(`   🔐 SMTP Secure:     ${configService.get('SMTP_SECURE', false) ? 'SSL' : 'TLS'}`);
    } else {
      logger.log(`   📧 Status:          Desabilitado`);
    }
    logger.log('');
    logger.log('�� Dicas de Uso:');
    logger.log(`   • Acesse a documentação em http://localhost:${port}/api`);
    logger.log(`   • Use o Swagger para testar os endpoints interativamente`);
    logger.log(`   • CORS está totalmente liberado para facilitar testes`);
    logger.log(`   • Teste de qualquer origem (localhost, IP, domínio)`);
    logger.log(`   • Verifique logs em tempo real para debugging`);
    logger.log(`   • Para produção, configure CORS específico e HTTPS`);
    logger.log('');
    logger.log('⚠️  AVISOS IMPORTANTES:');
    logger.log('   🔴 CORS está em modo TESTE (totalmente público)');
    logger.log('   🔴 Helmet está em modo relaxado');
    logger.log('   🔴 Não use esta configuração em PRODUÇÃO');
    logger.log('   🔧 Configure origens específicas para produção');
    logger.log('');
    logger.log('===============================================');
    logger.log('🚀 Sistema pronto para receber requisições!');
    logger.log('===============================================');

    // ==========================================
    // 🧹 LIMPEZA AUTOMÁTICA (SE HABILITADA)
    // ==========================================
    /*
    const cleanupEnabled = configService.get<boolean>('CLEANUP_ENABLED', true);
    if (cleanupEnabled) {
      const cleanupInterval = configService.get<number>('CLEANUP_INTERVAL_MINUTES', 60);
      setInterval(async () => {
        try {
          logger.debug(`🧹 Executando limpeza automática...`);
          // Aqui você pode adicionar lógicas de limpeza
          // Exemplo: limpar tokens expirados, logs antigos, etc.
        } catch (error) {
          logger.error('❌ Erro na limpeza automática:', error);
        }
      }, cleanupInterval * 60 * 1000);
      
      logger.log(`🧹 Limpeza automática configurada: a cada ${cleanupInterval} minutos`);
    }
    */
  } catch (error) {
    logger.error('❌ Erro crítico ao iniciar aplicação:', error);
    logger.error('💡 Verifique as configurações do banco de dados e variáveis de ambiente');
    process.exit(1);
  }
}

// ==========================================
// 🚨 TRATAMENTO DE ERROS GLOBAIS
// ==========================================
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('🚨 Unhandled Promise Rejection at:', promise);
  logger.error('🚨 Reason:', reason);
  
  // Em produção, fazer graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    logger.error('🛑 Finalizando aplicação devido a erro não tratado...');
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('🚨 Uncaught Exception:', error);
  logger.error('�� Finalizando aplicação devido a exceção não capturada...');
  process.exit(1);
});

// ==========================================
// 🛑 GRACEFUL SHUTDOWN
// ==========================================
const gracefulShutdown = (signal: string) => {
  const logger = new Logger('GracefulShutdown');
  logger.log(`�� ${signal} recebido, finalizando aplicação graciosamente...`);
  
  // Aqui você pode adicionar lógica de cleanup:
  // - Fechar conexões de banco
  // - Finalizar jobs em andamento
  // - Salvar estado da aplicação
  
  setTimeout(() => {
    logger.log('✅ Aplicação finalizada graciosamente');
    process.exit(0);
  }, 9000); // 5 segundos para cleanup
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==========================================
// 🚀 INICIALIZAR APLICAÇÃO
// ==========================================
bootstrap().catch(err => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Falha crítica na inicialização:', err);
  logger.error('💡 Verifique:');
  logger.error('   • Conexão com banco de dados');
  logger.error('   • Variáveis de ambiente (.env)');
  logger.error('   • Dependências instaladas (npm install)');
  logger.error('   • Porta disponível');
  process.exit(1);
});

// ==========================================
// 📊 INFORMAÇÕES DO PROCESSO
// ==========================================
if (process.env.NODE_ENV === 'development') {
  const logger = new Logger('ProcessInfo');
  logger.log(`🔧 Node.js: ${process.version}`);
  logger.log(`🔧 Platform: ${process.platform}`);
  logger.log(`🔧 Architecture: ${process.arch}`);
  logger.log(`🔧 PID: ${process.pid}`);
  logger.log(`🔧 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
}