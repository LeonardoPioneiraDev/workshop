// src/modules/departamentos/operacoes/operacoes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OracleModule } from '../../../oracle/oracle.module';
import { CommonModule } from '../../../common/common.module';

// Controllers
import { OperacoesController } from './controllers/operacoes.controller';
import { FrotaController } from './controllers/frota.controller';
import { AcidentesController } from './controllers/acidentes.controller';
import { DashboardOperacoesController } from './controllers/dashboard.controller';

// Services
import { OperacoesService } from './services/operacoes.service';
import { FrotaService } from './services/frota.service';
import { AcidentesService } from './services/acidentes.service';
import { DashboardOperacoesService } from './services/dashboard.service';

// Entities
import { VeiculoOperacional } from './entities/veiculo-operacional.entity';
import { Acidente } from './entities/acidente.entity';
import { HistoricoVeiculo } from './entities/historico-veiculo.entity';
import { EstatisticasOperacoes } from './entities/estatisticas-operacoes.entity';
import { Linha } from './entities/linha.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VeiculoOperacional,
      Acidente,
      HistoricoVeiculo,
      EstatisticasOperacoes,
      Linha,
    ]),
    OracleModule,
    CommonModule,
  ],
  controllers: [
    OperacoesController,
    FrotaController,
    AcidentesController,
    DashboardOperacoesController,
  ],
  providers: [
    OperacoesService,
    FrotaService,
    AcidentesService,
    DashboardOperacoesService,
  ],
  exports: [
    OperacoesService,
    FrotaService,
    AcidentesService,
    DashboardOperacoesService,
  ],
})
export class OperacoesModule {}