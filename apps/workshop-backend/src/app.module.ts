// apps/backend/src/app.module.ts
import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ==========================================
// 📦 MÓDULOS PRINCIPAIS
// ==========================================
import { EmailModule } from './email/email.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { OracleModule } from './oracle/oracle.module';
import { JuridicoModule } from './juridico/juridico.module';
import { DeptPessoalModule } from './dept-pessoal/dept-pessoal.module';

// ==========================================
// 🏗️ ENTIDADES
// ==========================================
import { User } from './users/entities/user.entity';
import { LoginLog } from './users/entities/login-log.entity';
import { Multa } from './juridico/entities/multa.entity';
import { MultaCompleta } from './juridico/entities/multa-completa.entity';
import { DeptPessoalSnapshot } from './dept-pessoal/entities/dept-pessoal-snapshot.entity';

// ==========================================
// ⚙️ CONFIGURAÇÕES
// ==========================================
import oracleConfig from './config/oracle.config';

// ==========================================
// 🎯 CONTROLLERS E SERVICES
// ==========================================
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginLogsController } from './users/controllers/login-logs.controller';

@Module({
  imports: [
    // ==========================================
    // 🔧 CONFIGURAÇÃO GLOBAL
    // ==========================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
      load: [oracleConfig],
    }),

    // ==========================================
    // 🗄️ CONFIGURAÇÃO DE BANCO DE DADOS
    // ==========================================
    TypeOrmModule.forRootAsync({
      name: 'default',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConnection');

        const config = {
          type: 'postgres' as const,
          host: configService.get('DATABASE_HOST', 'localhost'), // Default changed to localhost
          port: configService.get('DATABASE_PORT', 5433),      // Default changed to 5433
          username: configService.get('DATABASE_USERNAME', 'workshop'),
          password: configService.get('DATABASE_PASSWORD', 'workshop123'),
          database: configService.get('DATABASE_NAME', 'workshop_db'),
          schema: configService.get('DATABASE_SCHEMA', 'public'),
          entities: [User, LoginLog, Multa, MultaCompleta, DeptPessoalSnapshot],
          synchronize: false,
          logging: false,
          migrationsRun: false,
          dropSchema: false,
          ssl: false,
          extra: {
            max: 20,
            connectionTimeoutMillis: 30000,
            query_timeout: 30000,
            idleTimeoutMillis: 30000,
          },
        };

        logger.log('🐘 PostgreSQL configurado com sucesso');
        logger.log(`   🌐 Host: ${config.host}:${config.port}`);
        logger.log(`   📊 Database: ${config.database}`);

        return config;
      },
      inject: [ConfigService],
    }),

    // ==========================================
    // 📦 MÓDULOS DA APLICAÇÃO
    // ==========================================
    EmailModule,
    CommonModule,
    UsersModule,
    AuthModule,
    OracleModule,
    HealthModule,
    JuridicoModule,
    DeptPessoalModule,
  ],
  controllers: [
    AppController,
    LoginLogsController,
  ],
  providers: [
    AppService,

    // ==========================================
    // 📊 CONFIGURAÇÃO GLOBAL
    // ==========================================
    {
      provide: 'APP_CONFIG',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('AppConfig');

        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const port = configService.get<number>('PORT', 3333);
        const host = configService.get<string>('HOST', '0.0.0.0');
        const emailEnabled = configService.get<boolean>('EMAIL_ENABLED', false);
        const oracleEnabled = configService.get<boolean>('ORACLE_ENABLED', true);
        const allowedEmailDomain = configService.get<string>('ALLOWED_EMAIL_DOMAIN', '@vpioneira.com.br');
        const jwtExpiry = configService.get<string>('JWT_EXPIRES_IN', '24h');

        logger.log('🚀 WORKSHOP BACKEND - SISTEMA INICIALIZADO');
        logger.log('='.repeat(60));
        logger.log(`🌍 Ambiente: ${nodeEnv.toUpperCase()}`);
        logger.log(`🖥️ Servidor: ${host}:${port}`);
        logger.log(`🐘 PostgreSQL: ${configService.get('DATABASE_HOST')}:${configService.get('DATABASE_PORT')}`);
        logger.log(`🔶 Oracle: ${oracleEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        logger.log(`📧 E-mail: ${emailEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        logger.log(`🔐 JWT Expiry: ${jwtExpiry}`);
        logger.log(`📧 Domínio Permitido: ${allowedEmailDomain}`);
        logger.log('='.repeat(60));

        return {
          name: 'Workshop Backend',
          version: '3.0.0',
          environment: nodeEnv,
          server: { host, port },
          features: {
            email: emailEnabled,
            oracle: oracleEnabled,
            authentication: true,
            userManagement: true,
            loginLogs: true,
            juridico: true,
          },
          security: {
            allowedEmailDomain,
            jwtExpiry,
            maxLoginAttempts: configService.get('AUTH_MAX_LOGIN_ATTEMPTS', 5),
            lockTimeMinutes: configService.get('AUTH_LOCK_TIME_MINUTES', 15),
          },
          startTime: new Date().toISOString(),
        };
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule implements OnModuleInit {
  private static readonly logger = new Logger(AppModule.name);

  constructor(private configService: ConfigService) {
    this.logStartupInfo();
  }

  async onModuleInit() {
    AppModule.logger.log('🎯 Workshop Backend Module carregado com sucesso');

    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');

    AppModule.logger.log('📧 Configurações de E-mail:');
    AppModule.logger.log(`   📧 Habilitado: ${emailEnabled ? '✅' : '❌'}`);
    AppModule.logger.log(`   📡 Host: ${smtpHost || 'N/A'}`);
    AppModule.logger.log(`   🔌 Porta: ${smtpPort || 'N/A'}`);

    const oracleEnabled = this.configService.get<boolean>('ORACLE_ENABLED', true);
    const oracleHost = this.configService.get<string>('ORACLE_HOST', '10.0.1.191');
    const oraclePort = this.configService.get<string>('ORACLE_PORT', '1521');

    AppModule.logger.log('🔶 Configurações Oracle:');
    AppModule.logger.log(`   🔶 Habilitado: ${oracleEnabled ? '✅' : '❌'}`);
    AppModule.logger.log(`   🌐 Host: ${oracleHost}:${oraclePort}`);
    AppModule.logger.log(`   🔒 Modo: READ-ONLY`);

    setTimeout(() => {
      AppModule.logger.log('✅ Workshop Backend inicializado com sucesso');
      AppModule.logger.log('🔐 Sistema de Autenticação ativo');
      AppModule.logger.log('👥 Gestão de Usuários operacional');
      AppModule.logger.log('⚖️ Módulo Jurídico ativo');
      AppModule.logger.log('📝 Sistema de Logs ativo');

      if (oracleEnabled) {
        AppModule.logger.log('🔶 Oracle Database integrado');
      }

      if (emailEnabled) {
        AppModule.logger.log('📧 Sistema de E-mail configurado');
      }
    }, 1000);
  }

  private logStartupInfo(): void {
    const port = this.configService.get<number>('PORT', 3333);

    AppModule.logger.log('🔗 URLs disponíveis:');
    AppModule.logger.log(`   🌐 API: http://localhost:${port}/api`);
    AppModule.logger.log(`   📚 Swagger: http://localhost:${port}/api`);
    AppModule.logger.log(`   ❤️ Health: http://localhost:${port}/health`);
    AppModule.logger.log(`   🔐 Login: http://localhost:${port}/auth/login`);
    AppModule.logger.log(`   👥 Usuários: http://localhost:${port}/users`);
    AppModule.logger.log(`   ⚖️ Jurídico: http://localhost:${port}/juridico/dashboard`);
    AppModule.logger.log(`   📝 Logs de Login: http://localhost:${port}/users/logs`);
    AppModule.logger.log(`   🧪 Teste E-mail: http://localhost:${port}/email/test-connection`);

    const oracleEnabled = this.configService.get<boolean>('ORACLE_ENABLED', true);
    if (oracleEnabled) {
      AppModule.logger.log(`   🔶 Oracle Health: http://localhost:${port}/oracle/health`);
      AppModule.logger.log(`   🔶 Oracle Test: http://localhost:${port}/oracle/test`);
    }
  }
}
