// apps/backend/src/database/postgres/postgres.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OracleQueryResult } from '../entities/oracle-query-result.entity';
import { QueryLog } from '../entities/query-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'postgres'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'admin'),
        password: configService.get('POSTGRES_PASSWORD', 'admin123'),
        database: configService.get('POSTGRES_DB', 'dashboard_db'),
        schema: 'oracle_cache',
        entities: [OracleQueryResult, QueryLog],
        synchronize: false, // Em produção, use migrations
        logging: configService.get('NODE_ENV') === 'development',
        autoLoadEntities: true,
        ssl: configService.get('POSTGRES_SSL', false) ? {
          rejectUnauthorized: false
        } : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OracleQueryResult, QueryLog]),
  ],
  exports: [TypeOrmModule],
})
export class PostgresModule {}