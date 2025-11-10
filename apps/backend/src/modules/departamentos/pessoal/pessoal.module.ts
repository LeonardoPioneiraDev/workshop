// apps/backend/src/modules/departamentos/pessoal/pessoal.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PessoalController } from './controllers/pessoal.controller';
import { PessoalService } from './services/pessoal.service';
import { FuncionarioEntity } from './entities/funcionario.entity';
import { FuncionarioCompletoEntity } from './entities/funcionario-completo.entity'; // ✅ ADICIONAR
import { OracleModule } from '../../../oracle/oracle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FuncionarioEntity,
      FuncionarioCompletoEntity, // ✅ ADICIONAR AQUI
    ]),
    OracleModule, // Para usar OracleReadOnlyService
  ],
  controllers: [PessoalController],
  providers: [PessoalService],
  exports: [PessoalService],
})
export class PessoalModule {}