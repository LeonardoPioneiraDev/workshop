// apps/backend/src/modules/departamentos/juridico/juridico.module.ts
import { Module, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ModuleRef } from '@nestjs/core';

// ✅ ADICIONAR IMPORTS ENHANCED
import { MultaSetorMappingService } from './services/multa-setor-mapping.service';
import { MultaSetorController } from './controllers/multa-setor.controller';
import { MultaCompletaEnhancedService } from './services/multa-completa-enhanced.service';
import { MultaCompletaEnhancedController } from './controllers/multa-completa-enhanced.controller';

// ✅ ENTITIES POSTGRESQL
import { MultaCacheEntity } from './entities/multa-cache.entity';
import { AgenteEntity } from './entities/agente.entity';
import { VeiculoEntity } from './entities/veiculo.entity';
import { InfracaoEntity } from './entities/infracao.entity';
import { MetricasDiariasEntity } from './entities/metricas-diarias.entity';
import { AlertaEntity } from './entities/alerta.entity';
import { ConfiguracaoEntity } from './entities/configuracao.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { SincronizacaoLogEntity } from './entities/sincronizacao-log.entity';
import { MultaCompleta } from './entities/multa-completa.entity';
import { VeiculoFrotaEntity } from './entities/veiculo-frota.entity';

// ✅ REPOSITORIES
import { MultaCacheRepository } from './repositories/multa-cache.repository';
import { AgenteRepository } from './repositories/agente.repository';
import { VeiculoRepository } from './repositories/veiculo.repository';
import { InfracaoRepository } from './repositories/infracao.repository';
import { MetricasRepository } from './repositories/metricas.repository';
import { AlertaRepository } from './repositories/alerta.repository';
import { ConfiguracaoRepository } from './repositories/configuracao.repository';

// ✅ ADICIONAR IMPORTS HISTÓRICO
import { VeiculoHistoricoSetorEntity } from './entities/veiculo-historico-setor.entity';
import { VeiculoHistoricoSetorService } from './services/veiculo-historico-setor.service';
import { MultaSetorMappingHistoricoService } from './services/multa-setor-mapping-historico.service';
import { VeiculoHistoricoSetorController } from './controllers/veiculo-historico-setor.controller';

// ✅ SERVICES
import { JuridicoService } from './services/juridico.service';
import { AnalyticsService } from './services/analytics.service';
import { SyncService } from './services/sync.service';
import { AlertaService } from './services/alerta.service';
import { RelatorioService } from './services/relatorio.service';
import { JobService } from './services/job.service';
import { DashboardRealtimeService } from './services/dashboard-realtime.service';
import { ConfiguracaoService } from './services/configuracao.service';
import { AuditService } from './services/audit.service';
import { MultaCompletaService } from './services/multa-completa.service';
import { DvsInfracaoService } from './services/dvs-infracao.service';
import { FrtCadveiculosService } from './services/frt-cadveiculos.service';
import { DvsAgenteAutuadorService } from './services/dvs-agente-autuador.service';
import { DvsMultaService } from './services/dvs-multa.service';

// ✅ CONTROLLERS
import { JuridicoController } from './controllers/juridico.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { GestaoController } from './controllers/gestao.controller';
import { AlertaController } from './controllers/alerta.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ConfiguracaoController } from './controllers/configuracao.controller';
import { JuridicoSyncController } from './controllers/juridico-sync.controller';
import { MultaCompletaController } from './controllers/multa-completa.controller';
import { DvsInfracaoController } from './controllers/dvs-infracao.controller';
import { DvsAgenteAutuadorController } from './controllers/dvs-agente-autuador.controller';
import { FrtCadveiculosController } from './controllers/frt-cadveiculos.controller';
import { DvsMultaController } from './controllers/dvs-multa.controller';

// ✅ ORACLE ENTITIES (só para referência, não serão registradas aqui)
import { DvsMultaEntity } from './entities/dvs-multa.entity';
import { DvsInfracaoEntity } from './entities/dvs-infracao.entity';
import { DvsAgenteAutuadorEntity } from './entities/dvs-agente-autuador.entity';
import { FrtCadveiculosEntity } from './entities/frt-cadveiculos.entity';

import { OracleModule } from '../../../oracle/oracle.module';
import { OracleReadOnlyService } from '../../../oracle/services/oracle-readonly.service';

@Module({
  imports: [
    OracleModule,
    ScheduleModule.forRoot(),
    // ✅ APENAS ENTITIES POSTGRESQL
    TypeOrmModule.forFeature([
      MultaCacheEntity,
      AgenteEntity,
      VeiculoHistoricoSetorEntity,
      VeiculoEntity,
      InfracaoEntity,
      MetricasDiariasEntity,
      AlertaEntity,
      ConfiguracaoEntity,
      AuditLogEntity,
      SincronizacaoLogEntity,
      MultaCompleta,
      VeiculoFrotaEntity,
      // ✅ ORACLE ENTITIES PARA REFERÊNCIA NO POSTGRESQL
      DvsMultaEntity,
      DvsInfracaoEntity,
      DvsAgenteAutuadorEntity,
      FrtCadveiculosEntity,
    ]),
  ],
  controllers: [
    JuridicoController,
    AnalyticsController,
    GestaoController,
    AlertaController,
    DashboardController,
    ConfiguracaoController,
    JuridicoSyncController,
    MultaCompletaController,
    MultaCompletaEnhancedController, // ✅ ADICIONAR ENHANCED
    DvsInfracaoController,
    DvsAgenteAutuadorController,
    FrtCadveiculosController,
    DvsMultaController,
    MultaSetorController,
    VeiculoHistoricoSetorController,
  ],
  providers: [
    // ✅ SERVICES PRINCIPAIS
    { provide: JuridicoService, useClass: JuridicoService },
    { provide: AnalyticsService, useClass: AnalyticsService },
    { provide: SyncService, useClass: SyncService },
    { provide: AlertaService, useClass: AlertaService },
    { provide: RelatorioService, useClass: RelatorioService },
    { provide: JobService, useClass: JobService },
    { provide: DashboardRealtimeService, useClass: DashboardRealtimeService },
    { provide: ConfiguracaoService, useClass: ConfiguracaoService },
    { provide: AuditService, useClass: AuditService },
    { provide: MultaCompletaService, useClass: MultaCompletaService },
    { provide: MultaCompletaEnhancedService, useClass: MultaCompletaEnhancedService }, // ✅ ADICIONAR ENHANCED
    { provide: DvsInfracaoService, useClass: DvsInfracaoService },
    { provide: FrtCadveiculosService, useClass: FrtCadveiculosService },
    { provide: DvsAgenteAutuadorService, useClass: DvsAgenteAutuadorService },
    { provide: DvsMultaService, useClass: DvsMultaService },
    { provide: OracleReadOnlyService, useClass: OracleReadOnlyService },

    { provide: VeiculoHistoricoSetorService, useClass: VeiculoHistoricoSetorService },
    { provide: MultaSetorMappingHistoricoService, useClass: MultaSetorMappingHistoricoService },
    { provide: MultaSetorMappingService, useClass: MultaSetorMappingService },

    // ✅ REPOSITORIES CUSTOMIZADOS
    { provide: MultaCacheRepository, useClass: MultaCacheRepository },
    { provide: AgenteRepository, useClass: AgenteRepository },
    { provide: VeiculoRepository, useClass: VeiculoRepository },
    { provide: InfracaoRepository, useClass: InfracaoRepository },
    { provide: MetricasRepository, useClass: MetricasRepository },
    { provide: AlertaRepository, useClass: AlertaRepository },
    { provide: ConfiguracaoRepository, useClass: ConfiguracaoRepository },
    
    // ✅ CONFIGURAÇÃO DO MÓDULO
    {
      provide: 'JURIDICO_MODULE_CONFIG',
      useFactory: () => {
        const logger = new Logger('JuridicoModule');
        logger.log('⚖️ ===============================================');
        logger.log('⚖️ DEPARTAMENTO JURÍDICO - SISTEMA ENTERPRISE');
        logger.log('⚖️ ===============================================');
        logger.log('🔄 CACHE INTELIGENTE HÍBRIDO ATIVADO');
        logger.log('💾 PostgreSQL + Oracle integrados');
        logger.log('🚀 Agentes com cache automático');
        logger.log('✨ MULTAS COMPLETAS: Sistema híbrido Oracle->PostgreSQL');
        logger.log('🚗 FROTA SINCRONIZADA: Sistema completo de gestão de veículos');
        logger.log('🎯 MULTAS ENHANCED: Sistema avançado com regras de negócio');
        return { 
          name: 'Departamento Jurídico Enterprise',
          cacheEnabled: true,
          hybridMode: true,
          multasCompletas: true,
          frotaSincronizada: true,
          multasEnhanced: true // ✅ NOVO
        };
      },
    },
  ],
  exports: [
    JuridicoService,
    AnalyticsService,
    SyncService,
    AlertaService,
    RelatorioService,
    JobService,
    DashboardRealtimeService,
    ConfiguracaoService,
    AuditService,
    MultaCompletaService,
    MultaCompletaEnhancedService, // ✅ ADICIONAR ENHANCED
    DvsInfracaoService,
    FrtCadveiculosService,
    DvsAgenteAutuadorService,
    DvsMultaService,
    OracleReadOnlyService,
    MultaCacheRepository,
    AgenteRepository,
    VeiculoRepository,
    InfracaoRepository,
    MetricasRepository,
    AlertaRepository,
    ConfiguracaoRepository,
    MultaSetorMappingService,
    VeiculoHistoricoSetorService,
    MultaSetorMappingHistoricoService,
  ],
})
export class JuridicoModule implements OnModuleInit, OnModuleDestroy {
  private static readonly logger = new Logger(JuridicoModule.name);

  constructor(private readonly moduleRef: ModuleRef) {
    JuridicoModule.logger.log('🎯 JuridicoModule Enterprise inicializado com sucesso');
    JuridicoModule.logger.log('🏗️ Arquitetura: 15 entities + 8 repositories + 15 services + 13 controllers');
    JuridicoModule.logger.log('⚙️ Features: Cache + Analytics + Alertas + Sync + Jobs + Dashboard + Audit + MultasCompletas + FrotaSincronizada + MultasEnhanced');
    JuridicoModule.logger.log('�� Integração Oracle: Ativa (Read-Only) com fallback local');
    JuridicoModule.logger.log('💾 Cache PostgreSQL: Inteligente + Permanente + HÍBRIDO');
    JuridicoModule.logger.log('✨ Sistema Multas Completas: Cache inteligente Oracle->PostgreSQL');
    JuridicoModule.logger.log('🚗 Sistema Frota Sincronizada: Gestão completa de veículos por setor');
    JuridicoModule.logger.log('🎯 Sistema Multas Enhanced: Regras de negócio avançadas + Analytics');
    JuridicoModule.logger.log('🚨 Sistema de alertas: Ativo com 4 níveis de severidade');
    JuridicoModule.logger.log('⚡ Jobs automáticos: 4 schedules configurados');
    JuridicoModule.logger.log('📊 Analytics: BI + KPIs + Dashboard tempo real');
    JuridicoModule.logger.log('🔐 Segurança: JWT + RBAC + Audit + LGPD compliance');
    JuridicoModule.logger.log('🔶 Oracle Services: 4 services integrados');
    JuridicoModule.logger.log('🌐 API: 85+ endpoints especializados disponíveis');
    JuridicoModule.logger.log('💡 CACHE HÍBRIDO: Agentes + Multas Completas + Frota + Enhanced com sincronização automática');
  }

  async onModuleInit() {
    JuridicoModule.logger.log('🔧 Inicializando componentes do Departamento Jurídico...');
    
    setTimeout(async () => {
      try {
        // ✅ TESTAR SISTEMA ENHANCED
        const multaEnhancedService = this.moduleRef.get(MultaCompletaEnhancedService, { strict: false });
        
        JuridicoModule.logger.log('🧪 Testando sistema Enhanced...');
        
        try {
          const statsEnhanced = await multaEnhancedService.estatisticasCache();
          JuridicoModule.logger.log(`📊 Enhanced Cache: ${statsEnhanced.totalRegistros} registros`);
          JuridicoModule.logger.log(`🎯 Enhanced Features: SEMOB=${statsEnhanced.totalSemob}, TRÂNSITO=${statsEnhanced.totalTransito}`);
          JuridicoModule.logger.log(`⚖️ Enhanced Responsabilidade: F=${statsEnhanced.totalFuncionario}, E=${statsEnhanced.totalEmpresa}`);
          JuridicoModule.logger.log(`🏷️ Enhanced Gravidade: A=${statsEnhanced.totalLeves}, B=${statsEnhanced.totalMedias}, C=${statsEnhanced.totalGraves}`);
          
          if (statsEnhanced.totalRegistros === 0) {
            JuridicoModule.logger.log('🔄 Enhanced cache vazio - Pronto para sincronização sob demanda');
          }
        } catch (error) {
          JuridicoModule.logger.warn(`⚠️ Erro ao verificar sistema enhanced: ${error.message}`);
        }

        // ✅ TESTAR SISTEMA FROTA SINCRONIZADA
        const frtCadveiculosService = this.moduleRef.get(FrtCadveiculosService, { strict: false });
        
        JuridicoModule.logger.log('🧪 Testando sistema de Frota Sincronizada...');
        
        try {
          const estatisticasFrota = await frtCadveiculosService.estatisticasFrotaSincronizada();
          JuridicoModule.logger.log(`📊 Frota Sincronizada: ${estatisticasFrota.data.resumo.totalVeiculos} veículos`);
          JuridicoModule.logger.log(`🚗 Ativos: ${estatisticasFrota.data.resumo.veiculosAtivos}, Inativos: ${estatisticasFrota.data.resumo.veiculosInativos}`);
          JuridicoModule.logger.log(`🏢 Setores: ${estatisticasFrota.data.distribuicao.porGaragem.length} garagens mapeadas`);
          
          if (estatisticasFrota.data.resumo.totalVeiculos === 0) {
            JuridicoModule.logger.log('🔄 Frota não sincronizada - Execute POST /juridico/veiculos/sincronizar-frota');
          }
        } catch (error) {
          JuridicoModule.logger.warn(`⚠️ Erro ao verificar frota sincronizada: ${error.message}`);
        }

        // ✅ TESTAR CACHE DE AGENTES
        const agenteService = this.moduleRef.get(DvsAgenteAutuadorService, { strict: false });
        
        JuridicoModule.logger.log('🧪 Testando cache híbrido de agentes...');
        
        try {
          const statusCache = await agenteService.obterStatusCache();
          JuridicoModule.logger.log(`📊 Status Cache Agentes: ${statusCache.totalRegistros} registros, Hit Rate: ${statusCache.hitRate.toFixed(1)}%`);
          
          if (statusCache.totalRegistros === 0) {
            JuridicoModule.logger.log('�� Cache vazio - Iniciando sincronização inicial...');
            const resultado = await agenteService.sincronizarComOracle();
            JuridicoModule.logger.log(`✅ Sincronização inicial: ${resultado.sincronizados} agentes sincronizados`);
          }
        } catch (error) {
          JuridicoModule.logger.warn(`⚠️ Erro ao verificar cache de agentes: ${error.message}`);
        }

        // ✅ TESTAR SISTEMA MULTAS COMPLETAS
        const multaCompletaService = this.moduleRef.get(MultaCompletaService, { strict: false });
        
        JuridicoModule.logger.log('🧪 Testando sistema de Multas Completas...');
        
        try {
          const statsCache = await multaCompletaService.estatisticasCache();
          JuridicoModule.logger.log(`📊 Cache Multas Completas: ${statsCache.totalRegistros} registros`);
          
          if (statsCache.totalRegistros === 0) {
            JuridicoModule.logger.log('�� Cache de multas vazio - Pronto para sincronização sob demanda');
          } else {
            JuridicoModule.logger.log(`✅ Cache ativo: ${statsCache.totalVeiculos} veículos, ${statsCache.totalAgentes} agentes, ${statsCache.totalInfracoes} infrações`);
          }
        } catch (error) {
          JuridicoModule.logger.warn(`⚠️ Erro ao verificar cache de multas completas: ${error.message}`);
        }

        // ✅ SINCRONIZAÇÃO GERAL (EXISTENTE)
        const syncService = this.moduleRef.get(SyncService, { strict: false });
        JuridicoModule.logger.log('🔄 Disparando sincronização completa inicial dos dados Oracle para o PostgreSQL...');
        await syncService.executarSincronizacaoCompleta();
        JuridicoModule.logger.log('✅ Sincronização completa inicial CONCLUÍDA. Os dados já devem estar no PostgreSQL.');

        JuridicoModule.logger.log('✅ Verificação de saúde do módulo:');
        JuridicoModule.logger.log('   💾 Cache: Operacional');
        JuridicoModule.logger.log('   🔶 Oracle: Conectado');
        JuridicoModule.logger.log('   🔶 Oracle Services: DvsInfracaoService, FrtCadveiculosService, DvsAgenteAutuadorService, DvsMultaService');
        JuridicoModule.logger.log('   🔄 Cache Híbrido: Agentes + Multas Completas + Frota + Enhanced com sincronização automática');
        JuridicoModule.logger.log('   ✨ Multas Completas: Sistema híbrido Oracle->PostgreSQL ativo');
        JuridicoModule.logger.log('   🎯 Multas Enhanced: Sistema avançado com regras de negócio ativo');
        JuridicoModule.logger.log('   🚗 Frota Sincronizada: Sistema de gestão por setores ativo');
        JuridicoModule.logger.log('   🚨 Alertas: Ativos');
        JuridicoModule.logger.log('   ⚙️ Jobs: Agendados');
        JuridicoModule.logger.log('   📈 Dashboard: Disponível');
        JuridicoModule.logger.log('   🔧 Config: Carregadas');
        JuridicoModule.logger.log('   📝 Audit: Ativo');
        JuridicoModule.logger.log('🎯 Departamento Jurídico Enterprise: 100% Operacional com CACHE HÍBRIDO + MULTAS COMPLETAS + FROTA SINCRONIZADA + ENHANCED');
      } catch (error) {
        JuridicoModule.logger.error(`❌ Erro na sincronização inicial ou verificação de saúde: ${error.message}`, error.stack);
      }
    }, 5000);
  }

  async onModuleDestroy() {
    JuridicoModule.logger.log('🛑 Finalizando Departamento Jurídico...');
    JuridicoModule.logger.log('🔄 Interrompendo jobs automáticos...');
    JuridicoModule.logger.log('💾 Salvando cache pendente...');
    JuridicoModule.logger.log('🔶 Desconectando services Oracle...');
    JuridicoModule.logger.log('🧹 Limpando cache de agentes...');
    JuridicoModule.logger.log('✨ Finalizando cache de multas completas...');
    JuridicoModule.logger.log('🎯 Finalizando sistema enhanced...');
    JuridicoModule.logger.log('🚗 Finalizando cache de frota sincronizada...');
    JuridicoModule.logger.log('📝 Finalizando logs de auditoria...');
    JuridicoModule.logger.log('✅ Departamento Jurídico finalizado com segurança');
  }
}