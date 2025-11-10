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

// ==========================================
// 🔶 MÓDULOS ORACLE E DEPARTAMENTOS
// ==========================================
import { OracleModule } from './oracle/oracle.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';

// ==========================================
// 🏗️ ENTIDADES PRINCIPAIS
// ==========================================
import { User } from './users/entities/user.entity';
import { LoginLog } from './users/entities/login-log.entity';

// ✅ ENTITIES JURÍDICO (CACHE LOCAL)
import { MultaCacheEntity } from './modules/departamentos/juridico/entities/multa-cache.entity';
import { AgenteEntity } from './modules/departamentos/juridico/entities/agente.entity';
import { VeiculoEntity } from './modules/departamentos/juridico/entities/veiculo.entity';
import { InfracaoEntity } from './modules/departamentos/juridico/entities/infracao.entity';
import { MetricasDiariasEntity } from './modules/departamentos/juridico/entities/metricas-diarias.entity';
import { AlertaEntity } from './modules/departamentos/juridico/entities/alerta.entity';
import { ConfiguracaoEntity } from './modules/departamentos/juridico/entities/configuracao.entity';
import { AuditLogEntity } from './modules/departamentos/juridico/entities/audit-log.entity';
import { SincronizacaoLogEntity } from './modules/departamentos/juridico/entities/sincronizacao-log.entity';

// ✅ ENTITIES PESSOAL
import { FuncionarioEntity } from './modules/departamentos/pessoal/entities/funcionario.entity';
import { FuncionarioCompletoEntity } from './modules/departamentos/pessoal/entities/funcionario-completo.entity';

// ✅ ENTITIES OPERAÇÕES - ADICIONADAS
import { VeiculoOperacional } from './modules/departamentos/operacoes/entities/veiculo-operacional.entity';
import { Linha } from './modules/departamentos/operacoes/entities/linha.entity';
import { HistoricoVeiculo } from './modules/departamentos/operacoes/entities/historico-veiculo.entity';
import { EstatisticasOperacoes } from './modules/departamentos/operacoes/entities/estatisticas-operacoes.entity';
import { Acidente } from './modules/departamentos/operacoes/entities/acidente.entity';

// ==========================================
// ⚙️ CONFIGURAÇÕES
// ==========================================
import oracleConfig from './config/oracle.config';

// ==========================================
// 🎯 CONTROLLERS E SERVICES PRINCIPAIS
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
    // 🗄️ CONFIGURAÇÃO DE BANCO PRINCIPAL - CORRIGIDA
    // ==========================================
    TypeOrmModule.forRootAsync({
      name: 'default',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConnection');
        
        const config = {
          type: 'postgres' as const,
          host: configService.get('DATABASE_HOST', 'postgres'), // ✅ CORRIGIDO
          port: configService.get('DATABASE_PORT', 5432), // ✅ CORRIGIDO
          username: configService.get('DATABASE_USERNAME', 'workshop'), // ✅ CORRIGIDO
          password: configService.get('DATABASE_PASSWORD', 'workshop123'), // ✅ CORRIGIDO
          database: configService.get('DATABASE_NAME', 'workshop_db'),
          schema: configService.get('DATABASE_SCHEMA', 'public'),
          entities: [
            // ✅ ENTITIES PRINCIPAIS
            User,
            LoginLog,

            // ✅ ENTITIES JURÍDICO (CACHE LOCAL)
            MultaCacheEntity,
            AgenteEntity,
            VeiculoEntity,
            InfracaoEntity,
            MetricasDiariasEntity,
            AlertaEntity,
            ConfiguracaoEntity,
            AuditLogEntity,
            SincronizacaoLogEntity,

            // ✅ ENTITIES PESSOAL
            FuncionarioEntity,
            FuncionarioCompletoEntity,

            // ✅ ENTITIES OPERAÇÕES - ADICIONADAS
            VeiculoOperacional,
            Linha,
            HistoricoVeiculo,
            EstatisticasOperacoes,
            Acidente,

            // ✅ Auto-descoberta para outras entities
            __dirname + '/modules/**/*.entity{.ts,.js}',
          ],
          synchronize: false, // ✅ SEMPRE FALSE - CORRIGIDO!
          logging: false, // ✅ SEMPRE FALSE - CORRIGIDO!
          migrationsRun: false, // ✅ ADICIONADO
          dropSchema: false, // ✅ ADICIONADO
          ssl: false,
          extra: {
            max: 20,
            connectionTimeoutMillis: 1800000,
            query_timeout: 1800000,
            idleTimeoutMillis: 1800000,
          },
        };
        
        logger.log('🐘 PostgreSQL configurado com sucesso');
        logger.log(`   🌐 Host: ${config.host}:${config.port}`);
        logger.log(`   📊 Database: ${config.database}`);
        logger.log(`   🔄 Sync: ${config.synchronize ? 'Habilitado' : 'Desabilitado'}`);
        
        return config;
      },
      inject: [ConfigService],
    }),

    // ==========================================
    // 📦 MÓDULOS DA APLICAÇÃO (ORDEM IMPORTANTE)
    // ==========================================
    EmailModule,
    CommonModule,
    UsersModule,
    AuthModule,
    OracleModule,
    DepartamentosModule,
    HealthModule,
  ],
  controllers: [
    AppController,
    LoginLogsController,
  ],
  providers: [
    AppService,
    
    // ==========================================
    // 📊 PROVIDER DE CONFIGURAÇÃO GLOBAL
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
        const juridicoEnabled = configService.get<boolean>('JURIDICO_ENABLED', true);
        const pessoalEnabled = configService.get<boolean>('PESSOAL_ENABLED', true);
        const allowedEmailDomain = configService.get<string>('ALLOWED_EMAIL_DOMAIN', '@vpioneira.com.br');
        const jwtExpiry = configService.get<string>('JWT_EXPIRES_IN', '24h'); // ✅ CORRIGIDO
        
        logger.log('🚀 WORKSHOP BACKEND - SISTEMA INICIALIZADO');
        logger.log('='.repeat(60));
        logger.log(`🌍 Ambiente: ${nodeEnv.toUpperCase()}`);
        logger.log(`🖥️ Servidor: ${host}:${port}`);
        logger.log(`🐘 PostgreSQL: ${configService.get('DATABASE_HOST')}:${configService.get('DATABASE_PORT')}`);
        logger.log(`🔶 Oracle: ${oracleEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        logger.log(`📧 E-mail: ${emailEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        logger.log(`⚖️ Jurídico: ${juridicoEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        logger.log(`👥 Pessoal: ${pessoalEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        logger.log(`🚗 Operações: ✅ Habilitado`); // ✅ NOVO
        logger.log(`🔐 JWT Expiry: ${jwtExpiry}`);
        logger.log(`📧 Domínio Permitido: ${allowedEmailDomain}`);
        logger.log(`📝 Logs de Login: ✅ Habilitado`);
        logger.log(`🔒 Segurança Avançada: ✅ Habilitada`);
        logger.log('='.repeat(60));
        
        return {
          name: 'Workshop Backend',
          version: '2.5.0', // ✅ Atualizado para incluir Operações
          environment: nodeEnv,
          server: { host, port },
          features: {
            email: emailEnabled,
            oracle: oracleEnabled,
            authentication: true,
            userManagement: true,
            loginLogs: true,
            advancedSecurity: true,
            emailDomainRestriction: true,
            inactivityLogout: true,
            departamentos: {
              juridico: juridicoEnabled,
              pessoal: pessoalEnabled,
              operacoes: true, // ✅ NOVO
            },
            enhanced: {
              multasEnhanced: juridicoEnabled,
              analytics: juridicoEnabled,
              alertas: juridicoEnabled,
              buscaAvancada: juridicoEnabled,
              cacheInteligente: true,
              sincronizacaoOtimizada: true,
              funcionariosCompletos: pessoalEnabled,
              loginAuditoria: true,
              deteccaoAtividadeSuspeita: true,
              operacoesCompletas: true, // ✅ NOVO
            },
          },
          security: {
            allowedEmailDomain,
            jwtExpiry,
            maxLoginAttempts: configService.get('AUTH_MAX_LOGIN_ATTEMPTS', 5),
            lockTimeMinutes: configService.get('AUTH_LOCK_TIME_MINUTES', 15),
            passwordPolicy: {
              minLength: configService.get('PASSWORD_MIN_LENGTH', 8),
              requireUppercase: configService.get('PASSWORD_REQUIRE_UPPERCASE', true),
              requireLowercase: configService.get('PASSWORD_REQUIRE_LOWERCASE', true),
              requireNumbers: configService.get('PASSWORD_REQUIRE_NUMBERS', true),
              requireSymbols: configService.get('PASSWORD_REQUIRE_SYMBOLS', true),
            }
          },
          startTime: new Date().toISOString(),
        };
      },
      inject: [ConfigService],
    },

    // ==========================================
    // 🔐 PROVIDER DE CONFIGURAÇÃO DE SEGURANÇA
    // ==========================================
    {
      provide: 'SECURITY_CONFIG',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('SecurityConfig');
        
        const allowedEmailDomain = configService.get<string>('ALLOWED_EMAIL_DOMAIN', '@vpioneira.com.br');
        const jwtExpiry = configService.get<string>('JWT_EXPIRES_IN', '24h'); // ✅ CORRIGIDO
        const maxLoginAttempts = configService.get<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5);
        const lockTimeMinutes = configService.get<number>('AUTH_LOCK_TIME_MINUTES', 15);
        
        logger.log('🔐 [SECURITY_CONFIG] Configurações de Segurança:');
        logger.log(`   📧 Domínio Permitido: ${allowedEmailDomain}`);
        logger.log(`   ⏰ JWT Expiry: ${jwtExpiry} (logout por inatividade)`);
        logger.log(`   🚫 Max Tentativas: ${maxLoginAttempts}`);
        logger.log(`   🔒 Tempo Bloqueio: ${lockTimeMinutes} minutos`);
        logger.log(`   📝 Logs de Login: ✅ Habilitado`);
        logger.log(`   🕵️ Detecção Suspeita: ✅ Habilitada`);
        logger.log(`   🔍 Auditoria Completa: ✅ Habilitada`);
        
        return {
          allowedEmailDomain,
          jwtExpiry,
          maxLoginAttempts,
          lockTimeMinutes,
          loginLogs: true,
          suspiciousActivityDetection: true,
          fullAudit: true,
        };
      },
      inject: [ConfigService],
    },

    // ==========================================
    // 🧹 PROVIDER DE LIMPEZA AUTOMÁTICA
    // ==========================================
    {
      provide: 'CLEANUP_SERVICE',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('CleanupService');
        
        const cleanupInterval = configService.get<number>('CLEANUP_INTERVAL_MINUTES', 60);
        const logRetentionDays = configService.get<number>('LOG_RETENTION_DAYS', 90);
        
        if (cleanupInterval > 0) {
          logger.log(`🧹 Limpeza automática configurada: a cada ${cleanupInterval} minutos`);
          logger.log(`📝 Retenção de logs: ${logRetentionDays} dias`);
        }
        
        return {
          enabled: cleanupInterval > 0,
          interval: cleanupInterval,
          logRetentionDays,
        };
      },
      inject: [ConfigService],
    },

    // ==========================================
    // 🔶 PROVIDER DE CONFIGURAÇÃO ORACLE
    // ==========================================
    {
      provide: 'ORACLE_CONFIG',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('OracleConfig');
        
        const oracleEnabled = configService.get<boolean>('ORACLE_ENABLED', true);
        const oracleHost = configService.get<string>('ORACLE_HOST', '10.0.1.191');
        const oraclePort = configService.get<string>('ORACLE_PORT', '1521');
        const oracleUser = configService.get<string>('ORACLE_USER', 'glbconsult');
        
        logger.log('🔶 [ORACLE_CONFIG] Configurações Oracle:');
        logger.log(`   🔶 Habilitado: ${oracleEnabled ? '✅' : '❌'}`);
        logger.log(`   🌐 Host: ${oracleHost || 'N/A'}`);
        logger.log(`   🔌 Porta: ${oraclePort || 'N/A'}`);
        logger.log(`   👤 Usuário: ${oracleUser || 'N/A'}`);
        logger.log(`   🔒 Modo: READ-ONLY`);
        
        return {
          enabled: oracleEnabled,
          host: oracleHost,
          port: oraclePort,
          user: oracleUser,
          mode: 'read-only',
        };
      },
      inject: [ConfigService],
    },

    // ==========================================
    // 🎯 PROVIDER DE CONFIGURAÇÃO ENHANCED
    // ==========================================
    {
      provide: 'ENHANCED_CONFIG',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('EnhancedConfig');
        
        const juridicoEnabled = configService.get<boolean>('JURIDICO_ENABLED', true);
        const pessoalEnabled = configService.get<boolean>('PESSOAL_ENABLED', true);
        const operacoesEnabled = true; // ✅ NOVO
        const enhancedEnabled = juridicoEnabled || pessoalEnabled || operacoesEnabled;
        
        if (enhancedEnabled) {
          logger.log('🎯 [ENHANCED_CONFIG] Sistema Enhanced ativado:');
          if (juridicoEnabled) {
            logger.log('   🎯 Multas Enhanced: ✅ Habilitado');
            logger.log('   📊 Analytics Avançados: ✅ Habilitado');
            logger.log('   🚨 Alertas Inteligentes: ✅ Habilitado');
            logger.log('   🔍 Busca Avançada: ✅ Habilitado');
            logger.log('   🏷️ Classificação Automática: ✅ Habilitado');
          }
          if (pessoalEnabled) {
            logger.log('   👥 RH Enhanced: ✅ Habilitado');
            logger.log('   💾 Cache Inteligente: ✅ Habilitado');
            logger.log('   🔄 Sincronização Otimizada: ✅ Habilitado');
            logger.log('   📊 Analytics RH: ✅ Habilitado');
            logger.log('   👤 Funcionários Completos: ✅ Habilitado');
            logger.log('   📋 Dashboards Comparativos: ✅ Habilitado');
          }
          if (operacoesEnabled) {
            logger.log('   🚗 Operações Enhanced: ✅ Habilitado'); // ✅ NOVO
            logger.log('   📊 Analytics Operacionais: ✅ Habilitado'); // ✅ NOVO
            logger.log('   🚨 Alertas de Frota: ✅ Habilitado'); // ✅ NOVO
            logger.log('   📈 Estatísticas Avançadas: ✅ Habilitado'); // ✅ NOVO
            logger.log('   🛣️ Gestão de Linhas: ✅ Habilitado'); // ✅ NOVO
          }
          logger.log('   ⚖️ Regras de Negócio: ✅ Ativas');
          logger.log('   🔐 Segurança Avançada: ✅ Ativa');
          logger.log('   📝 Auditoria Completa: ✅ Ativa');
        }
        
        return {
          enabled: enhancedEnabled,
          features: {
            multasEnhanced: juridicoEnabled,
            analytics: enhancedEnabled,
            alertas: juridicoEnabled || operacoesEnabled,
            buscaAvancada: juridicoEnabled || operacoesEnabled,
            classificacao: juridicoEnabled,
            regrasNegocio: enhancedEnabled,
            cacheInteligente: pessoalEnabled,
            sincronizacaoOtimizada: pessoalEnabled,
            rhEnhanced: pessoalEnabled,
            funcionariosCompletos: pessoalEnabled,
            dashboardsComparativos: pessoalEnabled || operacoesEnabled,
            operacoesEnhanced: operacoesEnabled, // ✅ NOVO
            analyticsOperacionais: operacoesEnabled, // ✅ NOVO
            alertasFrota: operacoesEnabled, // ✅ NOVO
            estatisticasAvancadas: operacoesEnabled, // ✅ NOVO
            gestaoLinhas: operacoesEnabled, // ✅ NOVO
            segurancaAvancada: true,
            auditoriaCompleta: true,
          },
        };
      },
      inject: [ConfigService],
    },

    // ==========================================
    // 💾 PROVIDER DE CONFIGURAÇÃO DE CACHE
    // ==========================================
    {
      provide: 'CACHE_CONFIG',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('CacheConfig');
        
        const cacheEnabled = configService.get<boolean>('CACHE_ENABLED', true);
        const cacheExpiryHours = configService.get<number>('CACHE_EXPIRY_HOURS', 24);
        const cacheMaxSize = configService.get<number>('CACHE_MAX_SIZE', 1000);
        
        if (cacheEnabled) {
          logger.log('💾 [CACHE_CONFIG] Sistema de Cache ativado:');
          logger.log(`   ⏰ Expiração: ${cacheExpiryHours} horas`);
          logger.log(`   📦 Tamanho máximo: ${cacheMaxSize} registros`);
          logger.log(`   🧹 Auto-limpeza: ✅ Habilitada`);
          logger.log(`   📊 Métricas: ✅ Habilitadas`);
          logger.log(`   🧠 Cache Inteligente: ✅ Habilitado`);
          logger.log(`   ⚡ Otimização Oracle: ✅ Habilitada`);
        }
        
        return {
          enabled: cacheEnabled,
          expiryHours: cacheExpiryHours,
          maxSize: cacheMaxSize,
          autoCleanup: true,
          metrics: true,
          intelligentCache: true,
          oracleOptimization: true,
        };
      },
      inject: [ConfigService],
    },

    // ==========================================
    // 📝 PROVIDER DE CONFIGURAÇÃO DE LOGS
    // ==========================================
    {
      provide: 'LOGS_CONFIG',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('LogsConfig');
        
        const logRetentionDays = configService.get<number>('LOG_RETENTION_DAYS', 90);
        const logSecurityEvents = configService.get<boolean>('LOG_SECURITY_EVENTS', true);
        const logSlowQueries = configService.get<boolean>('LOG_SLOW_QUERIES', true);
        const logConnections = configService.get<boolean>('LOG_CONNECTIONS', true);
        
        logger.log('📝 [LOGS_CONFIG] Sistema de Logs ativado:');
        logger.log(`   📅 Retenção: ${logRetentionDays} dias`);
        logger.log(`   🔐 Eventos de Segurança: ${logSecurityEvents ? '✅' : '❌'}`);
        logger.log(`   🐌 Queries Lentas: ${logSlowQueries ? '✅' : '❌'}`);
        logger.log(`   🔗 Conexões: ${logConnections ? '✅' : '❌'}`);
        logger.log(`   🕵️ Detecção de Atividade Suspeita: ✅ Habilitada`);
        logger.log(`   📊 Analytics de Logs: ✅ Habilitado`);
        logger.log(`   🧹 Auto-limpeza: ✅ Habilitada`);
        
        return {
          retentionDays: logRetentionDays,
          securityEvents: logSecurityEvents,
          slowQueries: logSlowQueries,
          connections: logConnections,
          suspiciousActivityDetection: true,
          analytics: true,
          autoCleanup: true,
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
    
    // ==========================================
    // 📧 VERIFICAÇÃO DE E-MAIL
    // ==========================================
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');
    
    AppModule.logger.log('📧 Configurações de E-mail:');
    AppModule.logger.log(`   📧 Habilitado: ${emailEnabled ? '✅' : '❌'}`);
    AppModule.logger.log(`   📡 Host: ${smtpHost || 'N/A'}`);
    AppModule.logger.log(`   🔌 Porta: ${smtpPort || 'N/A'}`);

    // ==========================================
    // 🔐 VERIFICAÇÃO DE SEGURANÇA
    // ==========================================
    const allowedEmailDomain = this.configService.get<string>('ALLOWED_EMAIL_DOMAIN', '@vpioneira.com.br');
    const jwtExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '24h');
    const maxLoginAttempts = this.configService.get<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5);
    const lockTimeMinutes = this.configService.get<number>('AUTH_LOCK_TIME_MINUTES', 15);
    
    AppModule.logger.log('🔐 Configurações de Segurança:');
    AppModule.logger.log(`   📧 Domínio Permitido: ${allowedEmailDomain}`);
    AppModule.logger.log(`   ⏰ JWT Expiry: ${jwtExpiry} (logout por inatividade)`);
    AppModule.logger.log(`   🚫 Max Tentativas: ${maxLoginAttempts}`);
    AppModule.logger.log(`   🔒 Tempo Bloqueio: ${lockTimeMinutes} minutos`);
    AppModule.logger.log(`   📝 Logs de Login: ✅ Habilitado`);
    AppModule.logger.log(`   🕵️ Detecção Suspeita: ✅ Habilitada`);

    // ==========================================
    // 🔶 VERIFICAÇÃO DE ORACLE
    // ==========================================
    const oracleEnabled = this.configService.get<boolean>('ORACLE_ENABLED', true);
    const oracleHost = this.configService.get<string>('ORACLE_HOST', '10.0.1.191');
    const oraclePort = this.configService.get<string>('ORACLE_PORT', '1521');
    
    AppModule.logger.log('🔶 Configurações Oracle:');
    AppModule.logger.log(`   🔶 Habilitado: ${oracleEnabled ? '✅' : '❌'}`);
    AppModule.logger.log(`   🌐 Host: ${oracleHost}:${oraclePort}`);
    AppModule.logger.log(`   🔒 Modo: READ-ONLY`);

    // ==========================================
    // 🏢 VERIFICAÇÃO DE DEPARTAMENTOS
    // ==========================================
    const juridicoEnabled = this.configService.get<boolean>('JURIDICO_ENABLED', true);
    const pessoalEnabled = this.configService.get<boolean>('PESSOAL_ENABLED', true);
    
    AppModule.logger.log('🏢 Departamentos:');
    AppModule.logger.log(`   ⚖️ Jurídico: ${juridicoEnabled ? '✅' : '❌'}`);
    AppModule.logger.log(`   👥 Pessoal: ${pessoalEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
    AppModule.logger.log(`   🚗 Operações: ✅ Habilitado`); // ✅ NOVO

    // ==========================================
    // 🚗 VERIFICAÇÃO DE OPERAÇÕES - NOVO
    // ==========================================
    AppModule.logger.log('🚗 Departamento de Operações:');
    AppModule.logger.log('   🚗 Gestão de Veículos: ✅ Ativo');
    AppModule.logger.log('   📊 Acidentes e Sinistros: ✅ Ativo');
    AppModule.logger.log('   🛣️ Linhas e Rotas: ✅ Ativo');
    AppModule.logger.log('   📈 Estatísticas Operacionais: ✅ Ativo');
    AppModule.logger.log('   📝 Histórico de Mudanças: ✅ Ativo');

    // ==========================================
    // 💾 VERIFICAÇÃO DE CACHE
    // ==========================================
    const cacheEnabled = this.configService.get<boolean>('CACHE_ENABLED', true);
    const cacheExpiryHours = this.configService.get<number>('CACHE_EXPIRY_HOURS', 24);
    
    AppModule.logger.log('💾 Sistema de Cache:');
    AppModule.logger.log(`   💾 Habilitado: ${cacheEnabled ? '✅' : '❌'}`);
    AppModule.logger.log(`   ⏰ Expiração: ${cacheExpiryHours} horas`);
    AppModule.logger.log(`   🔄 Auto-sincronização: ✅ Ativa`);
    AppModule.logger.log(`   🧠 Cache Inteligente: ✅ Ativo`);

    // ==========================================
    // 📝 VERIFICAÇÃO DE LOGS
    // ==========================================
    const logRetentionDays = this.configService.get<number>('LOG_RETENTION_DAYS', 90);
    
    AppModule.logger.log('📝 Sistema de Logs:');
    AppModule.logger.log(`   📅 Retenção: ${logRetentionDays} dias`);
    AppModule.logger.log(`   🔐 Eventos de Segurança: ✅ Habilitado`);
    AppModule.logger.log(`   🕵️ Detecção Suspeita: ✅ Habilitada`);
    AppModule.logger.log(`   📊 Analytics: ✅ Habilitado`);
    AppModule.logger.log(`   🧹 Auto-limpeza: ✅ Habilitada`);

    // ==========================================
    // 🎯 VERIFICAÇÃO DE ENHANCED
    // ==========================================
    if (juridicoEnabled || pessoalEnabled) {
      AppModule.logger.log('🎯 Sistema Enhanced:');
      if (juridicoEnabled) {
        AppModule.logger.log('   🎯 Multas Enhanced: ✅ Ativo');
        AppModule.logger.log('   📊 Analytics Avançados: ✅ Ativo');
        AppModule.logger.log('   🚨 Alertas Inteligentes: ✅ Ativo');
        AppModule.logger.log('   🔍 Busca Avançada: ✅ Ativo');
        AppModule.logger.log('   🏷️ Classificação Automática: ✅ Ativo');
      }
      if (pessoalEnabled) {
        AppModule.logger.log('   👥 RH Enhanced: ✅ Ativo');
        AppModule.logger.log('   💾 Cache Inteligente: ✅ Ativo');
        AppModule.logger.log('   🔄 Sincronização Otimizada: ✅ Ativo');
        AppModule.logger.log('   📊 Analytics RH: ✅ Ativo');
        AppModule.logger.log('   👤 Funcionários Completos: ✅ Ativo');
        AppModule.logger.log('   📋 Dashboards Comparativos: ✅ Ativo');
        AppModule.logger.log('   🔍 Busca Avançada RH: ✅ Ativo');
      }
      // ✅ ADICIONAR OPERAÇÕES
      AppModule.logger.log('   🚗 Operações Enhanced: ✅ Ativo');
      AppModule.logger.log('   📊 Analytics Operacionais: ✅ Ativo');
      AppModule.logger.log('   🚨 Alertas de Frota: ✅ Ativo');
      AppModule.logger.log('   📈 Estatísticas Avançadas: ✅ Ativo');
      AppModule.logger.log('   🛣️ Gestão de Linhas: ✅ Ativo');
      
      AppModule.logger.log('   ⚖️ Regras de Negócio: ✅ Ativas');
      AppModule.logger.log('   🔐 Segurança Avançada: ✅ Ativa');
      AppModule.logger.log('   📝 Auditoria Completa: ✅ Ativa');
    }
    
    setTimeout(() => {
      AppModule.logger.log('✅ Workshop Backend inicializado com sucesso');
      
      if (oracleEnabled && (juridicoEnabled || pessoalEnabled)) {
        AppModule.logger.log('🔶 Oracle Database integrado');
        
        if (juridicoEnabled) {
          AppModule.logger.log('🏢 Departamento Jurídico ativo');
          AppModule.logger.log('💾 Cache de multas configurado');
          AppModule.logger.log('📊 Analytics jurídico disponível');
          AppModule.logger.log('🚨 Sistema de alertas ativo');
          AppModule.logger.log('🎯 Sistema Enhanced operacional');
        }
        
        if (pessoalEnabled) {
          AppModule.logger.log('👥 Departamento Pessoal ativo');
          AppModule.logger.log('📋 Gestão de funcionários configurada');
          AppModule.logger.log('📊 Analytics RH disponível');
          AppModule.logger.log('🔄 Sincronização otimizada ativa');
          AppModule.logger.log('💾 Cache inteligente operacional');
          AppModule.logger.log('👤 Funcionários completos disponível');
          AppModule.logger.log('📋 Dashboards comparativos ativos');
        }
      }
      
      // ✅ ADICIONAR LOG PARA OPERAÇÕES
      AppModule.logger.log('🚗 Departamento de Operações ativo');
      AppModule.logger.log('🚗 Gestão de frota operacional');
      AppModule.logger.log('📊 Analytics operacionais disponível');
      AppModule.logger.log('🚨 Sistema de alertas de frota ativo');
      AppModule.logger.log('📈 Estatísticas avançadas operacionais');
      AppModule.logger.log('🛣️ Gestão de linhas e rotas ativa');
      
      AppModule.logger.log('🔐 Sistema de Segurança Avançada ativo');
      AppModule.logger.log('📝 Sistema de Logs e Auditoria operacional');
      AppModule.logger.log('🕵️ Detecção de Atividade Suspeita ativa');
      
    }, 2000);
  }

  private logStartupInfo(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const port = this.configService.get<number>('PORT', 3333);
    const oracleEnabled = this.configService.get<boolean>('ORACLE_ENABLED', true);
    const juridicoEnabled = this.configService.get<boolean>('JURIDICO_ENABLED', true);
    const pessoalEnabled = this.configService.get<boolean>('PESSOAL_ENABLED', true);
    
    AppModule.logger.log('🔗 URLs disponíveis:');
    AppModule.logger.log(`   🌐 API: http://10.10.100.176:${port}/api`);
    AppModule.logger.log(`   📚 Swagger: http://10.10.100.176:${port}/api`);
    AppModule.logger.log(`   ❤️ Health: http://10.10.100.176:${port}/health`);
    AppModule.logger.log(`   🧪 Teste E-mail: http://10.10.100.176:${port}/email/test-connection`);
    
    // ✅ URLS DEPARTAMENTOS CENTRALIZADAS
    AppModule.logger.log(`   🏢 Departamentos: http://10.10.100.176:${port}/departamentos`);
    AppModule.logger.log(`   🏢 Status Departamentos: http://10.10.100.176:${port}/departamentos/status`);
    
    // ✅ URLS DE AUTENTICAÇÃO E USUÁRIOS
    AppModule.logger.log(`   🔐 Login: http://10.10.100.176:${port}/auth/login`);
    AppModule.logger.log(`   👥 Usuários: http://10.10.100.176:${port}/users`);
    AppModule.logger.log(`   📝 Logs de Login: http://10.10.100.176:${port}/users/logs`);
    AppModule.logger.log(`   📊 Estatísticas de Logs: http://10.10.100.176:${port}/users/logs/stats`);
    
    // ✅ URLs JURÍDICO COMPLETAS
    if (oracleEnabled && juridicoEnabled) {
      AppModule.logger.log(`   🔶 Oracle Health: http://10.10.100.176:${port}/oracle/health`);
      AppModule.logger.log(`   🔶 Oracle Test: http://10.10.100.176:${port}/oracle/test`);
      
      AppModule.logger.log(`   ⚖️ Jurídico Dashboard: http://10.10.100.176:${port}/departamentos/juridico/dashboard`);
      AppModule.logger.log(`   ⚖️ Jurídico Multas: http://10.10.100.176:${port}/departamentos/juridico/multas`);
      AppModule.logger.log(`   ⚖️ Jurídico Analytics: http://10.10.100.176:${port}/departamentos/juridico/analytics`);
      AppModule.logger.log(`   ⚖️ Jurídico Gestão: http://10.10.100.176:${port}/departamentos/juridico/gestao`);
      AppModule.logger.log(`   ⚖️ Jurídico Alertas: http://10.10.100.176:${port}/departamentos/juridico/alertas`);
    }

    // ✅ URLs PESSOAL COMPLETAS
    if (oracleEnabled && pessoalEnabled) {
      AppModule.logger.log(`   👥 Pessoal Dashboard: http://10.10.100.176:${port}/departamentos/pessoal/dashboard`);
      AppModule.logger.log(`   👥 Pessoal Dashboard Comparativo: http://10.10.100.176:${port}/departamentos/pessoal/dashboard-comparativo`);
      AppModule.logger.log(`   👥 Pessoal Dashboard Acumulado: http://10.10.100.176:${port}/departamentos/pessoal/dashboard-acumulado`);
      AppModule.logger.log(`   👥 Pessoal Dashboard Acumulado Comparativo: http://10.10.100.176:${port}/departamentos/pessoal/dashboard-acumulado-comparativo`);
      AppModule.logger.log(`   👥 Pessoal Funcionários: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios`);
      AppModule.logger.log(`   👤 Funcionários Completos: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios-completos`);
      AppModule.logger.log(`   👤 Dashboard Funcionários Completos: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios-completos/dashboard`);
      AppModule.logger.log(`   🔍 Busca Avançada Funcionários: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios-completos/busca-avancada`);
      AppModule.logger.log(`   📊 Agrupamentos: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios-completos/agrupamentos/:tipo`);
      AppModule.logger.log(`   👥 Pessoal Estatísticas: http://10.10.100.176:${port}/departamentos/pessoal/estatisticas`);
      AppModule.logger.log(`   👥 Pessoal Estatísticas Comparativas: http://10.10.100.176:${port}/departamentos/pessoal/estatisticas-comparativas`);
      AppModule.logger.log(`   🔄 Pessoal Sincronizar: http://10.10.100.176:${port}/departamentos/pessoal/sincronizar`);
      AppModule.logger.log(`   🔄 Sincronizar Funcionários Completos: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios-completos/sincronizar`);
      AppModule.logger.log(`   🔄 Pessoal Sincronizar Múltiplos: http://10.10.100.176:${port}/departamentos/pessoal/sincronizar-multiplos`);
      AppModule.logger.log(`   🔄 Pessoal Sincronizar Acumulado: http://10.10.100.176:${port}/departamentos/pessoal/sincronizar-acumulado`);
      AppModule.logger.log(`   💾 Pessoal Status Cache: http://10.10.100.176:${port}/departamentos/pessoal/status-cache`);
      AppModule.logger.log(`   📊 Pessoal Status Sincronização: http://10.10.100.176:${port}/departamentos/pessoal/status-sincronizacao`);
      AppModule.logger.log(`   🔍 Busca por CPF: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios/cpf/:cpf`);
      AppModule.logger.log(`   🔍 Busca por Código: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios/codigo/:codigo`);
      AppModule.logger.log(`   🔍 Busca por Nome: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios/busca/:nome`);
      AppModule.logger.log(`   🔍 Busca por Situação: http://10.10.100.176:${port}/departamentos/pessoal/funcionarios/situacao/:situacao`);
    }

    // ✅ URLs OPERAÇÕES - NOVO
    AppModule.logger.log(`   🚗 Operações Dashboard: http://10.10.100.176:${port}/departamentos/operacoes/dashboard`);
    AppModule.logger.log(`   🚗 Operações Veículos: http://10.10.100.176:${port}/departamentos/operacoes/veiculos`);
    AppModule.logger.log(`   📊 Operações Acidentes: http://10.10.100.176:${port}/departamentos/operacoes/acidentes`);
    AppModule.logger.log(`   🛣️ Operações Linhas: http://10.10.100.176:${port}/departamentos/operacoes/linhas`);
    AppModule.logger.log(`   📈 Operações Estatísticas: http://10.10.100.176:${port}/departamentos/operacoes/estatisticas`);
    AppModule.logger.log(`   📝 Operações Histórico: http://10.10.100.176:${port}/departamentos/operacoes/historico`);
    AppModule.logger.log(`   🔍 Busca Veículos: http://10.10.100.176:${port}/departamentos/operacoes/veiculos/busca/:termo`);
    AppModule.logger.log(`   📊 Analytics Operacionais: http://10.10.100.176:${port}/departamentos/operacoes/analytics`);

    // ✅ RESUMO DE FUNCIONALIDADES ENHANCED ATUALIZADO COM OPERAÇÕES
    if (juridicoEnabled || pessoalEnabled) {
      AppModule.logger.log('');
      AppModule.logger.log('🎯 FUNCIONALIDADES ENHANCED DISPONÍVEIS:');
      
      AppModule.logger.log('   🔐 Segurança Avançada:');
      AppModule.logger.log('      • Restrição de domínio de email (@vpioneira.com.br)');
      AppModule.logger.log('      • Login por username OU email');
      AppModule.logger.log('      • Logout automático por inatividade (24h)'); // ✅ CORRIGIDO
      AppModule.logger.log('      • Logs detalhados de todas as atividades');
      AppModule.logger.log('      • Detecção de atividade suspeita');
      AppModule.logger.log('      • Bloqueio automático por tentativas falhadas');
      AppModule.logger.log('      • Auditoria completa de usuários');
      AppModule.logger.log('      • Novos roles: ENCARREGADO');
      
      if (juridicoEnabled) {
        AppModule.logger.log('   🏷️ Classificação Automática (Jurídico):');
        AppModule.logger.log('      • SEMOB vs TRÂNSITO (codigo_org = 16)');
        AppModule.logger.log('      • Funcionário vs Empresa (responsavel_multa F/E)');
        AppModule.logger.log('      • Gravidade A/B/C (valores 495/990/1980)');
        AppModule.logger.log('   📊 Analytics Avançados (Jurídico):');
        AppModule.logger.log('      • Distribuição por tipo, gravidade, área, horário');
        AppModule.logger.log('      • Rankings de agentes, locais, causas reais');
        AppModule.logger.log('      • Evolução temporal e estatísticas');
      }
      
      if (pessoalEnabled) {
        AppModule.logger.log('   💾 Cache Inteligente (Pessoal):');
        AppModule.logger.log('      • Verificação automática de dados locais');
        AppModule.logger.log('      • Expiração configurável (24h padrão)');
        AppModule.logger.log('      • Economia de consultas Oracle');
        AppModule.logger.log('      • Métricas de performance');
        AppModule.logger.log('   🔄 Sincronização Otimizada (Pessoal):');
        AppModule.logger.log('      • Prioriza mês atual para sincronização');
        AppModule.logger.log('      • Usa cache para meses anteriores');
        AppModule.logger.log('      • Sincronização seletiva e paralela');
        AppModule.logger.log('      • Relatórios de economia de recursos');
        AppModule.logger.log('   👤 Funcionários Completos:');
        AppModule.logger.log('      • Dados completos da consulta Oracle');
        AppModule.logger.log('      • 20+ filtros avançados');
        AppModule.logger.log('      • Dashboard específico com salários');
        AppModule.logger.log('      • Busca avançada com múltiplos critérios');
        AppModule.logger.log('      • Agrupamentos por departamento, área, cidade');
      }
      
      // ✅ ADICIONAR FUNCIONALIDADES DE OPERAÇÕES
      AppModule.logger.log('   🚗 Sistema de Operações:');
      AppModule.logger.log('      • Gestão completa de frota');
      AppModule.logger.log('      • Controle de acidentes e sinistros');
      AppModule.logger.log('      • Gestão de linhas e rotas');
      AppModule.logger.log('      • Estatísticas operacionais avançadas');
      AppModule.logger.log('      • Histórico de mudanças de veículos');
      AppModule.logger.log('      • Analytics de performance da frota');
      AppModule.logger.log('      • Alertas de manutenção e vencimentos');
      AppModule.logger.log('      • Dashboard operacional em tempo real');
      AppModule.logger.log('      • Relatórios de produtividade');
      AppModule.logger.log('      • Controle de combustível e custos');
      
      AppModule.logger.log('   🚨 Sistema de Alertas:');
      AppModule.logger.log('      • Alertas de defesa (1 semana antes)');
      AppModule.logger.log('      • Campos importantes destacados');
      AppModule.logger.log('      • Validação de dados');
      AppModule.logger.log('      • Alertas de segurança');
      AppModule.logger.log('      • Alertas de vencimento de documentos'); // ✅ NOVO
      AppModule.logger.log('      • Alertas de manutenção preventiva'); // ✅ NOVO
      AppModule.logger.log('      • Alertas de acidentes recorrentes'); // ✅ NOVO
      
      AppModule.logger.log('   🔍 Busca Avançada:');
      AppModule.logger.log('      • Múltiplos campos simultaneamente');
      AppModule.logger.log('      • Operadores AND/OR');
      AppModule.logger.log('      • Filtros combinados');
      AppModule.logger.log('      • Busca por salário, tempo de empresa, etc.');
      AppModule.logger.log('      • Busca por veículos, prefixo, placa'); // ✅ NOVO
      AppModule.logger.log('      • Busca por linhas e rotas'); // ✅ NOVO
      AppModule.logger.log('      • Busca por histórico de acidentes'); // ✅ NOVO
      
      AppModule.logger.log('   ⚖️ Regras de Negócio:');
      AppModule.logger.log('      • Mapeamento de áreas de competência');
      AppModule.logger.log('      • Responsáveis por notificação');
      AppModule.logger.log('      • Status automático de dados');
      AppModule.logger.log('      • Hierarquia de roles e permissões');
      AppModule.logger.log('      • Controle de acesso por departamento');
      AppModule.logger.log('      • Regras de manutenção preventiva'); // ✅ NOVO
      AppModule.logger.log('      • Políticas de segurança operacional'); // ✅ NOVO
      
      AppModule.logger.log('   📝 Sistema de Logs e Auditoria:');
      AppModule.logger.log('      • Registro de todos os logins/logouts');
      AppModule.logger.log('      • Tracking de mudanças de senha');
      AppModule.logger.log('      • Logs de refresh de token');
      AppModule.logger.log('      • Detecção de múltiplos IPs');
      AppModule.logger.log('      • Análise de horários suspeitos');
      AppModule.logger.log('      • Estatísticas de uso por usuário');
      AppModule.logger.log('      • Limpeza automática de logs antigos');
      AppModule.logger.log('      • Dashboard administrativo de logs');
      AppModule.logger.log('      • Auditoria de mudanças em veículos'); // ✅ NOVO
      AppModule.logger.log('      • Logs de acidentes e ocorrências'); // ✅ NOVO
      AppModule.logger.log('      • Rastreamento de alterações operacionais'); // ✅ NOVO
    }
  }

  async onModuleDestroy() {
    AppModule.logger.log('🛑 Workshop Backend finalizando...');
    AppModule.logger.log('🔶 Desconectando Oracle Database...');
    AppModule.logger.log('💾 Limpando cache de multas...');
    AppModule.logger.log('🎯 Finalizando sistema enhanced...');
    AppModule.logger.log('👥 Finalizando cache de funcionários...');
    AppModule.logger.log('💾 Finalizando cache inteligente...');
    AppModule.logger.log('🚨 Finalizando sistema de alertas...');
    AppModule.logger.log('🚗 Finalizando sistema de operações...'); // ✅ NOVO
    AppModule.logger.log('📊 Finalizando analytics operacionais...'); // ✅ NOVO
    AppModule.logger.log('🛣️ Finalizando gestão de linhas...'); // ✅ NOVO
    AppModule.logger.log('🔐 Finalizando sistema de segurança...');
    AppModule.logger.log('📝 Finalizando sistema de logs...');
    AppModule.logger.log('🕵️ Finalizando detecção de atividade suspeita...');
    AppModule.logger.log('✅ Workshop Backend finalizado');
  }
}