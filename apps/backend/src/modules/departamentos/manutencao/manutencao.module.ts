// src/modules/departamentos/manutencao/manutencao.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OracleModule } from '../../../oracle/oracle.module';
import { CommonModule } from '../../../common/common.module';

// Controllers
import { ManutencaoController } from './controllers/manutencao.controller';

// Services
import { ManutencaoService } from './services/manutencao.service';

// Entities
import { OrdemServico } from './entities/ordem-servico.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdemServico]),
    OracleModule,
    CommonModule,
  ],
  controllers: [ManutencaoController],
  providers: [ManutencaoService],
  exports: [ManutencaoService],
})
export class ManutencaoModule {}
