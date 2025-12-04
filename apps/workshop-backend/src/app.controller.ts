// apps/backend/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';
import { EmailService } from './email/email.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Informações da API' })
  @ApiResponse({ status: 200, description: 'Informações gerais da API' })
  getInfo() {
    return this.appService.getAppInfo();
  }

  @Public()
  @Get('ping')
  @ApiOperation({ summary: 'Ping simples' })
  @ApiResponse({ status: 200, description: 'Pong' })
  ping() {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('test-email-direct')
  @ApiOperation({ summary: 'Teste direto de e-mail (desenvolvimento)' })
  @ApiResponse({ status: 200, description: 'Resultado do teste de e-mail' })
  async testEmailDirect() {
    try {
      console.log('🧪 [APP_CONTROLLER] Iniciando teste direto de e-mail...');
      
      const result = await this.emailService.sendTestEmail(
        'leonardolopes@vpioneira.com.br',
        'Teste Direto via AppController'
      );
      
      console.log('📧 [APP_CONTROLLER] Resultado do teste:', result);
      
      return {
        success: result,
        message: result ? 'E-mail enviado com sucesso' : 'Falha no envio do e-mail',
        timestamp: new Date().toISOString(),
        recipient: 'leonardolopes@vpioneira.com.br',
        service: 'EmailService',
        method: 'sendTestEmail'
      };
    } catch (error) {
      console.error('❌ [APP_CONTROLLER] Erro no teste de e-mail:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'Erro interno no teste de e-mail',
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  @Public()
  @Get('test-email-connection')
  @ApiOperation({ summary: 'Teste de conexão SMTP (desenvolvimento)' })
  @ApiResponse({ status: 200, description: 'Status da conexão SMTP' })
  async testEmailConnection() {
    try {
      console.log('🔍 [APP_CONTROLLER] Testando conexão SMTP...');
      
      const isConnected = await this.emailService.testConnection();
      
      console.log('📡 [APP_CONTROLLER] Status da conexão:', isConnected);
      
      return {
        connected: isConnected,
        message: isConnected ? 'Conexão SMTP estabelecida com sucesso' : 'Falha na conexão SMTP',
        timestamp: new Date().toISOString(),
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          secure: process.env.SMTP_SECURE,
          enabled: process.env.EMAIL_ENABLED
        }
      };
    } catch (error) {
      console.error('❌ [APP_CONTROLLER] Erro no teste de conexão:', error);
      
      return {
        connected: false,
        error: error.message,
        message: 'Erro ao testar conexão SMTP',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Public()
  @Get('health-extended')
  @ApiOperation({ summary: 'Health check estendido com status de serviços' })
  @ApiResponse({ status: 200, description: 'Status detalhado do sistema' })
  async healthExtended() {
    try {
      const appInfo = this.appService.getAppInfo();
      
      // Testar conexão de e-mail
      let emailStatus = 'unknown';
      try {
        const emailConnected = await this.emailService.testConnection();
        emailStatus = emailConnected ? 'connected' : 'disconnected';
      } catch (error) {
        emailStatus = 'error';
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        system: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
        },
        application: appInfo,
        services: {
          database: 'connected', // Assumindo que está conectado se chegou até aqui
          email: emailStatus,
          authentication: 'active',
          api: 'active',
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          EMAIL_ENABLED: process.env.EMAIL_ENABLED,
          ORACLE_ENABLED: process.env.ORACLE_ENABLED,
          JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'Erro no health check estendido'
      };
    }
  }

  @Public()
  @Get('system-info')
  @ApiOperation({ summary: 'Informações do sistema (desenvolvimento)' })
  @ApiResponse({ status: 200, description: 'Informações técnicas do sistema' })
  getSystemInfo() {
    // Só mostrar em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return {
        message: 'Informações do sistema disponíveis apenas em desenvolvimento',
        environment: process.env.NODE_ENV
      };
    }

    return {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        cwd: process.cwd(),
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HOST: process.env.HOST,
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_NAME: process.env.DATABASE_NAME,
        EMAIL_ENABLED: process.env.EMAIL_ENABLED,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
      },
      features: {
        authentication: true,
        userManagement: true,
        emailService: process.env.EMAIL_ENABLED === 'true',
        oracleIntegration: process.env.ORACLE_ENABLED === 'true',
        swagger: true,
        cors: true,
        compression: true,
        helmet: true,
        validation: true,
      }
    };
  }

  @Public()
  @Get('endpoints')
  @ApiOperation({ summary: 'Lista de endpoints disponíveis' })
  @ApiResponse({ status: 200, description: 'Endpoints da API' })
  getEndpoints() {
    return {
      timestamp: new Date().toISOString(),
      baseUrl: `http://localhost:${process.env.PORT || 3333}`,
      documentation: `http://localhost:${process.env.PORT || 3333}/api`,
      endpoints: {
        public: [
          'GET /',
          'GET /ping',
          'GET /health',
          'GET /health-extended',
          'GET /system-info',
          'GET /endpoints',
          'GET /test-email-direct',
          'GET /test-email-connection',
          'POST /auth/login',
          'POST /auth/register',
          'POST /auth/forgot-password',
          'POST /auth/reset-password',
          'POST /auth/validate-temporary',
          'POST /auth/first-login',
        ],
        protected: [
          'GET /auth/profile',
          'POST /auth/change-password',
          'POST /auth/refresh',
          'POST /auth/logout',
          'GET /users',
          'POST /users',
          'GET /users/me',
          'GET /users/statistics',
          'GET /users/:id',
          'PATCH /users/:id',
          'DELETE /users/:id',
          'GET /email/test-connection',
          'POST /email/test-send',
        ],
        admin: [
          'POST /users',
          'DELETE /users/:id',
          'PATCH /users/:id/admin-change-password',
          'PATCH /users/:id/reset-temporary-password',
          'POST /users/:id/send-welcome-email',
          'GET /users/:id/temporary-credentials',
        ]
      },
      authentication: {
        type: 'Bearer Token (JWT)',
        header: 'Authorization: Bearer <token>',
        loginEndpoint: 'POST /auth/login',
        tokenExpiry: process.env.JWT_EXPIRES_IN || '24h',
        refreshEndpoint: 'POST /auth/refresh'
      }
    };
  }
}