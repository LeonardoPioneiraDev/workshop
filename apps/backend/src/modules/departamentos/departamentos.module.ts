// src/modules/departamentos/departamentos.module.ts
import { Module } from '@nestjs/common';
import { JuridicoModule } from './juridico/juridico.module';
import { PessoalModule } from './pessoal/pessoal.module';
import { OperacoesModule } from './operacoes/operacoes.module'; // ✅ NOVO
import { ManutencaoModule } from './manutencao/manutencao.module';
import { DepartamentosController } from './departamentos.controller';

@Module({
  imports: [
    JuridicoModule,
    PessoalModule,
    OperacoesModule, // ✅ ADICIONAR
    ManutencaoModule,
  ],
  controllers: [DepartamentosController],
  exports: [
    JuridicoModule,
    PessoalModule,
    OperacoesModule, // ✅ ADICIONAR
    ManutencaoModule,
  ],
})
export class DepartamentosModule {}
