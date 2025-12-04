import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleReadOnlyService } from './services/oracle-readonly.service';
import { OracleController } from './oracle.controller';
import oracleConfig from '../config/oracle.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(oracleConfig),
  ],
  controllers: [OracleController],
  providers: [
    OracleReadOnlyService,
  ],
  exports: [
    OracleReadOnlyService,
  ],
})
export class OracleModule {
  constructor() {
    console.log('🔶 ===============================================');
    console.log('🔶 ORACLE MODULE - WORKSHOP READ-ONLY MODE');
    console.log('🔶 ===============================================');
    console.log('   🔒 Modo: READ-ONLY (Apenas consultas)');
    console.log('   🚫 Operações bloqueadas: INSERT, UPDATE, DELETE');
    console.log('   ✅ Operações permitidas: SELECT, WITH');
    console.log('   🛡️ Segurança: MÁXIMA');
    console.log('   🎯 Finalidade: Consultas ERP Workshop');
    console.log('   📋 Controller: OracleController ATIVO');
    console.log('   🌐 Endpoints: /oracle/* DISPONÍVEIS');
    console.log('🔶 ===============================================');
  }
}