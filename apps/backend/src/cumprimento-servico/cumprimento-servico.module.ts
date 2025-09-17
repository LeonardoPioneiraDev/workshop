import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CumprimentoServicoController } from './cumprimento-servico.controller';
import { CumprimentoServicoService } from './cumprimento-servico.service';
import { OperationsModule } from '../operations/operations.module'; // 👈 Importa o módulo com regras

@Module({
  imports: [HttpModule, OperationsModule], // 👈 Agora pode usar o OperationRulesService
  controllers: [CumprimentoServicoController],
  providers: [CumprimentoServicoService],
})
export class CumprimentoServicoModule {}
