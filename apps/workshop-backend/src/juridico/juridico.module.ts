import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JuridicoController } from './juridico.controller';
import { JuridicoService } from './juridico.service';
import { JuridicoSchedulerService } from './juridico.scheduler';
import { Multa } from './entities/multa.entity';
import { MultaCompleta } from './entities/multa-completa.entity';
import { OracleModule } from '../oracle/oracle.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Multa, MultaCompleta]),
        OracleModule
    ],
    controllers: [JuridicoController],
    providers: [JuridicoService, JuridicoSchedulerService],
    exports: [JuridicoService]
})
export class JuridicoModule { }
