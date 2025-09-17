import { Module } from '@nestjs/common';
import { OperationRulesService } from './operation-rules.service';

@Module({
  providers: [OperationRulesService],       // Registra o serviço no módulo
  exports: [OperationRulesService],         // Torna o serviço disponível para outros módulos
})
export class OperationsModule {}

