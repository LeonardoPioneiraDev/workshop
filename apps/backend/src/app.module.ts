// src/app.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CumprimentoServicoModule } from './cumprimento-servico/cumprimento-servico.module';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
// --- NOVAS IMPORTAÇÕES PARA O MÓDULO ORACLE ---
import { OracleModule } from './database/oracle/oracle.module';
import { OracleExtractController } from './database/oracle/controllers/oracle.controller';
// Se você usa TypeORM para outras entidades, mantenha TypeOrmModule e as entidades correspondentes
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { OracleOS } from './database/oracle/entities/oracle-os.entity'; // Importe sua entidade OracleOS
// --- FIM DAS NOVAS IMPORTAÇÕES ---

@Module({
  imports: [
    // Configuração centralizada
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Cache global para melhorar performance
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('CACHE_TTL', 300),
        max: configService.get<number>('CACHE_MAX_ITEMS', 500),
      }),
      inject: [ConfigService],
    }),

    // HTTP Module com timeout aumentado e configurações otimizadas
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 30000),
        maxRedirects: 5,
        headers: {
          'User-Agent': 'NestJS/2.0',
          'Accept': 'application/json',
        },
        keepAlive: true,
        maxSockets: 25,
        maxFreeSockets: 10,
      }),
      inject: [ConfigService],
    }),

    // Proteção contra excesso de requisições
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 30,
    }]),

    // --- MÓDULO ORACLE ---
    OracleModule, // <--- Adicione seu módulo Oracle aqui!
    // --- FIM DO MÓDULO ORACLE ---

    // Se você usa TypeORM para outros bancos de dados (MySQL, PostgreSQL, SQLite),
    // mantenha seu TypeOrmModule.forRootAsync/forRoot para eles aqui.
    // Para a conexão Oracle, estamos usando o oracledb diretamente via OracleService.
    /*
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', // Ou 'postgres'
        host: configService.get<string>('DB_HOST'),
        // ... outras configurações do seu outro banco
        entities: [], // Suas entidades para o outro banco
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    */

    // Seus módulos existentes
    CumprimentoServicoModule,
  ],
  controllers: [
    // --- NOVO CONTROLADOR ORACLE ---
    OracleExtractController, // <--- Adicione seu controlador Oracle aqui!
    // --- FIM DOS NOVOS CONTROLADORES ---
  ],
  providers: [
    // Provedor global para lidar com erros não tratados
    {
      provide: 'APP_INTERCEPTOR',
      useClass: TimeoutInterceptor,
    },
    {
      provide: 'APP_FILTER',
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}