import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeptPessoalController } from './dept-pessoal.controller';
import { DeptPessoalService } from './dept-pessoal.service';
import { DeptPessoalSnapshot } from './entities/dept-pessoal-snapshot.entity';
import { OracleModule } from '../oracle/oracle.module';
import { DeptPessoalSchedulerService } from './dept-pessoal.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeptPessoalSnapshot]),
    OracleModule,
  ],
  controllers: [DeptPessoalController],
  providers: [DeptPessoalService, DeptPessoalSchedulerService],
  exports: [DeptPessoalService],
})
export class DeptPessoalModule {}
