// src/database/oracle/oracle.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleService } from './services/oracle.service';
import oracleConfig from './oracle.config';

@Module({
  imports: [
    ConfigModule.forFeature(oracleConfig), // Garante que as configs 'oracle' sejam carregadas
  ],
  providers: [OracleService],
  exports: [OracleService], // Exporta o serviço para ser usado em outros módulos
})
export class OracleModule {}