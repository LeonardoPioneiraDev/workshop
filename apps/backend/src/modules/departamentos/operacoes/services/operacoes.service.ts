// src/modules/departamentos/operacoes/services/operacoes.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FrotaService } from './frota.service';
import { AcidentesService } from './acidentes.service';
import { DashboardOperacoesService } from './dashboard.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VeiculoOperacional } from '../entities/veiculo-operacional.entity';
import { Acidente } from '../entities/acidente.entity';
import { HistoricoVeiculo } from '../entities/historico-veiculo.entity';
import { EstatisticasOperacoes } from '../entities/estatisticas-operacoes.entity';

@Injectable()
export class OperacoesService {
  private readonly logger = new Logger(OperacoesService.name);

  constructor(
    private readonly frotaService: FrotaService,
    private readonly acidentesService: AcidentesService,
    private readonly dashboardService: DashboardOperacoesService,
    @InjectRepository(VeiculoOperacional)
    private readonly veiculoRepository: Repository<VeiculoOperacional>,
    @InjectRepository(Acidente)
    private readonly acidenteRepository: Repository<Acidente>,
    @InjectRepository(HistoricoVeiculo)
    private readonly historicoRepository: Repository<HistoricoVeiculo>,
    @InjectRepository(EstatisticasOperacoes)
    private readonly estatisticasRepository: Repository<EstatisticasOperacoes>,
  ) {}

  /**
   * Obter status geral do departamento de operações
   */
  async obterStatusGeral() {
    this.logger.log('📊 Obtendo status geral das operações...');

    try {
      const [
        statusFrotaResult,
        statusAcidentesResult,
        ultimasSincronizacoesResult,
        alertasAtivosResult,
        kpisGeraisResult,
      ] = await Promise.allSettled([
        this.obterStatusFrota(),
        this.obterStatusAcidentes(),
        this.obterUltimasSincronizacoes(),
        this.obterAlertasAtivos(),
        this.obterKPIsGerais(),
      ]);

      return {
        departamento: 'Operações',
        status: 'OPERACIONAL',
        frota: statusFrotaResult.status === 'fulfilled' ? statusFrotaResult.value : { status: 'ERRO', total: 0, ativos: 0, inativos: 0 },
        acidentes: statusAcidentesResult.status === 'fulfilled' ? statusAcidentesResult.value : { status: 'ERRO', total: 0 },
        sincronizacoes: ultimasSincronizacoesResult.status === 'fulfilled' ? ultimasSincronizacoesResult.value : { frota: [], acidentes: [] },
        alertas: alertasAtivosResult.status === 'fulfilled' ? alertasAtivosResult.value : { mudancasRecentes: 0, veiculosRisco: 0, nivel: 'BAIXO' },
        kpis: kpisGeraisResult.status === 'fulfilled' ? kpisGeraisResult.value : { disponibilidadeFrota: 0, indiceSinistralidade: 0, scoreGeral: 0 },
        timestamp: new Date(),
        erros: [
          ...(statusFrotaResult.status === 'rejected' ? ['Erro ao obter status da frota'] : []),
          ...(statusAcidentesResult.status === 'rejected' ? ['Erro ao obter status de acidentes'] : []),
          ...(ultimasSincronizacoesResult.status === 'rejected' ? ['Erro ao obter sincronizações'] : []),
          ...(alertasAtivosResult.status === 'rejected' ? ['Erro ao obter alertas'] : []),
          ...(kpisGeraisResult.status === 'rejected' ? ['Erro ao obter KPIs'] : []),
        ]
      };

    } catch (error) {
      this.logger.error('❌ Erro ao obter status geral:', error);
      return {
        departamento: 'Operações',
        status: 'CRÍTICO',
        erro: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sincronização completa de todos os dados
   */
  async sincronizacaoCompleta(opcoes?: {
    dataInicio?: string;
    dataFim?: string;
    forcarSincronizacao?: boolean;
  }) {
    this.logger.log('🔄 Iniciando sincronização completa das operações...');

    const inicioProcesso = new Date();
    const resultados = {
      frota: null,
      acidentes: null,
      erros: [],
      tempoExecucao: 0,
      timestamp: inicioProcesso,
    };

    try {
      // 1. Sincronizar Frota
      this.logger.log('🚛 Sincronizando frota...');
      try {
        resultados.frota = await this.frotaService.sincronizarFrota();
        this.logger.log(`✅ Frota sincronizada: ${resultados.frota.sincronizados} veículos`);
      } catch (error) {
        this.logger.error('❌ Erro na sincronização da frota:', error);
        resultados.erros.push({
          modulo: 'FROTA',
          erro: error.message,
          timestamp: new Date(),
        });
      }

      // 2. Sincronizar Acidentes
      this.logger.log('🚨 Sincronizando acidentes...');
      try {
        resultados.acidentes = await this.acidentesService.sincronizarAcidentes(
          opcoes?.dataInicio,
          opcoes?.dataFim
        );
        this.logger.log(`✅ Acidentes sincronizados: ${resultados.acidentes.sincronizados} registros`);
      } catch (error) {
        this.logger.error('❌ Erro na sincronização de acidentes:', error);
        resultados.erros.push({
          modulo: 'ACIDENTES',
          erro: error.message,
          timestamp: new Date(),
        });
      }

      // 3. Atualizar estatísticas consolidadas
      this.logger.log('📊 Atualizando estatísticas...');
      try {
        await this.atualizarEstatisticasConsolidadas();
        this.logger.log('✅ Estatísticas atualizadas');
      } catch (error) {
        this.logger.error('❌ Erro ao atualizar estatísticas:', error);
        resultados.erros.push({
          modulo: 'ESTATISTICAS',
          erro: error.message,
          timestamp: new Date(),
        });
      }

      // Calcular tempo de execução
      const fimProcesso = new Date();
      resultados.tempoExecucao = fimProcesso.getTime() - inicioProcesso.getTime();

      this.logger.log(`✅ Sincronização completa finalizada em ${resultados.tempoExecucao}ms`);

      return {
        sucesso: resultados.erros.length === 0,
        resultados,
        resumo: {
          veiculosSincronizados: resultados.frota?.sincronizados || 0,
          acidentesSincronizados: resultados.acidentes?.sincronizados || 0,
          totalErros: resultados.erros.length,
          tempoExecucao: `${(resultados.tempoExecucao / 1000).toFixed(2)}s`,
        },
      };

    } catch (error) {
      this.logger.error('❌ Erro crítico na sincronização completa:', error);
      throw error;
    }
  }

  /**
   * Obter resumo executivo das operações
   */
  async obterResumoExecutivo(filtros?: {
    ano?: number;
    mes?: number;
    garagem?: string;
  }) {
    this.logger.log('📋 Gerando resumo executivo...');

    try {
      const [
        dashboardResult,
        tendenciasHistoricasResult,
        alertasCriticosResult,
        recomendacoesResult,
        comparativoAnteriorResult,
      ] = await Promise.allSettled([
        this.dashboardService.gerarDashboardCompleto(filtros),
        this.obterTendenciasHistoricas(filtros?.ano),
        this.obterAlertasCriticos(),
        this.gerarRecomendacoesExecutivas(),
        this.obterComparativoAnterior(filtros),
      ]);

      const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : {
        resumo: {
          frota: { total: 0, ativos: 0 },
          acidentes: { total: 0, valorTotalDanos: 0 },
          kpis: { percentualDisponibilidade: 0, indiceSinistralidade: 0, eficienciaOperacional: 0 }
        }
      };

      return {
        periodo: {
          ano: filtros?.ano || new Date().getFullYear(),
          mes: filtros?.mes || 'TODOS',
          garagem: filtros?.garagem || 'TODAS',
        },
        resumoExecutivo: {
          frotaTotal: dashboard.resumo.frota.total,
          frotaAtiva: dashboard.resumo.frota.ativos,
          percentualDisponibilidade: dashboard.resumo.kpis.percentualDisponibilidade,
          totalAcidentes: dashboard.resumo.acidentes.total,
          indiceSinistralidade: dashboard.resumo.kpis.indiceSinistralidade,
          custoTotalDanos: dashboard.resumo.acidentes.valorTotalDanos,
          eficienciaOperacional: dashboard.resumo.kpis.eficienciaOperacional,
        },
        comparativo: comparativoAnteriorResult.status === 'fulfilled' ? comparativoAnteriorResult.value : {},
        tendencias: tendenciasHistoricasResult.status === 'fulfilled' ? tendenciasHistoricasResult.value : [],
        alertasCriticos: alertasCriticosResult.status === 'fulfilled' ? alertasCriticosResult.value : {},
        recomendacoes: recomendacoesResult.status === 'fulfilled' ? recomendacoesResult.value : [],
        timestamp: new Date(),
        erros: [
          ...(dashboardResult.status === 'rejected' ? ['Erro ao gerar dashboard'] : []),
          ...(tendenciasHistoricasResult.status === 'rejected' ? ['Erro ao obter tendências'] : []),
          ...(alertasCriticosResult.status === 'rejected' ? ['Erro ao obter alertas críticos'] : []),
          ...(recomendacoesResult.status === 'rejected' ? ['Erro ao gerar recomendações'] : []),
        ]
      };

    } catch (error) {
      this.logger.error('❌ Erro ao gerar resumo executivo:', error);
      return {
        periodo: {
          ano: filtros?.ano || new Date().getFullYear(),
          mes: filtros?.mes || 'TODOS',
          garagem: filtros?.garagem || 'TODAS',
        },
        resumoExecutivo: {
          frotaTotal: 0,
          frotaAtiva: 0,
          percentualDisponibilidade: 0,
          totalAcidentes: 0,
          indiceSinistralidade: 0,
          custoTotalDanos: 0,
          eficienciaOperacional: 0,
        },
        erro: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Obter análise de performance operacional
   */
  async obterAnalisePerformance(periodo?: {
    dataInicio: string;
    dataFim: string;
  }) {
    this.logger.log('📈 Gerando análise de performance...');

    try {
      const [
        metricasResult,
        benchmarksResult,
        evolucaoResult,
        gargalosResult,
        oportunidadesResult,
      ] = await Promise.allSettled([
        this.calcularMetricasPerformance(periodo),
        this.obterBenchmarks(),
        this.analisarEvolucaoTemporal(periodo),
        this.identificarGargalos(),
        this.identificarOportunidades(),
      ]);

      const metricas = metricasResult.status === 'fulfilled' ? metricasResult.value : { disponibilidade: 0, pontualidade: 0, seguranca: 0, eficiencia: 0 };

      return {
        periodo,
        metricas,
        benchmarks: benchmarksResult.status === 'fulfilled' ? benchmarksResult.value : {},
        evolucao: evolucaoResult.status === 'fulfilled' ? evolucaoResult.value : [],
        analises: {
          gargalos: gargalosResult.status === 'fulfilled' ? gargalosResult.value : [],
          oportunidades: oportunidadesResult.status === 'fulfilled' ? oportunidadesResult.value : [],
        },
        score: this.calcularScorePerformance(metricas),
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('❌ Erro na análise de performance:', error);
      return {
        periodo,
        erro: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Obter relatório de compliance e segurança
   */
  async obterRelatorioCompliance() {
    this.logger.log('🛡️ Gerando relatório de compliance...');

    try {
      const [
        indicadoresSegurancaResult,
        conformidadeNormativaResult,
        auditoriasRecentesResult,
        planosAcaoResult,
      ] = await Promise.allSettled([
        this.calcularIndicadoresSeguranca(),
        this.verificarConformidadeNormativa(),
        this.obterAuditoriasRecentes(),
        this.obterPlanosAcao(),
      ]);

      const indicadoresSeguranca = indicadoresSegurancaResult.status === 'fulfilled' ? indicadoresSegurancaResult.value : { acidentes: 0, vitimas: 0, gravidade: 'BAIXA' };
      const conformidadeNormativa = conformidadeNormativaResult.status === 'fulfilled' ? conformidadeNormativaResult.value : { percentual: 0, status: 'DESCONHECIDO' };

      return {
        seguranca: indicadoresSeguranca,
        conformidade: conformidadeNormativa,
        auditorias: auditoriasRecentesResult.status === 'fulfilled' ? auditoriasRecentesResult.value : [],
        planosAcao: planosAcaoResult.status === 'fulfilled' ? planosAcaoResult.value : [],
        statusGeral: this.avaliarStatusCompliance(indicadoresSeguranca, conformidadeNormativa),
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('❌ Erro no relatório de compliance:', error);
      return {
        erro: error.message,
        timestamp: new Date(),
      };
    }
  }

  // =================== MÉTODOS PRIVADOS ===================

  private async obterStatusFrota() {
    try {
      const [estatisticas, ultimaAtualizacao] = await Promise.all([
        this.frotaService.obterEstatisticasFrota(),
        this.veiculoRepository
          .createQueryBuilder('veiculo')
          .select('MAX(veiculo.dataUltimaAtualizacao)', 'ultima')
          .getRawOne(),
      ]);

      return {
        ...estatisticas,
        ultimaAtualizacao: ultimaAtualizacao?.ultima,
        status: estatisticas.ativos > 0 ? 'OPERACIONAL' : 'CRÍTICO',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter status da frota:', error);
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        percentualAtivos: 0,
        status: 'ERRO',
        erro: error.message,
      };
    }
  }

  private async obterStatusAcidentes() {
    try {
      const [estatisticas, ultimaAtualizacao] = await Promise.all([
        this.acidentesService.obterEstatisticasAcidentes(),
        this.acidenteRepository
          .createQueryBuilder('acidente')
          .select('MAX(acidente.dataUltimaAtualizacao)', 'ultima')
          .getRawOne(),
      ]);

      return {
        ...estatisticas.resumo,
        ultimaAtualizacao: ultimaAtualizacao?.ultima,
        status: estatisticas.resumo.total < 10 ? 'BOM' : 'ATENÇÃO',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter status de acidentes:', error);
      return {
        total: 0,
        comVitimas: 0,
        semVitimas: 0,
        valorTotalDanos: 0,
        status: 'ERRO',
        erro: error.message,
      };
    }
  }

  private async obterUltimasSincronizacoes() {
    try {
      const [frotaSync, acidentesSync] = await Promise.all([
        this.veiculoRepository
          .createQueryBuilder('veiculo')
          .select('veiculo.dataSincronizacao', 'data')
          .addSelect('COUNT(*)', 'total')
          .groupBy('veiculo.dataSincronizacao')
          .orderBy('veiculo.dataSincronizacao', 'DESC')
          .limit(5)
          .getRawMany(),
        
        this.acidenteRepository
          .createQueryBuilder('acidente')
          .select('acidente.dataSincronizacao', 'data')
          .addSelect('COUNT(*)', 'total')
          .groupBy('acidente.dataSincronizacao')
          .orderBy('acidente.dataSincronizacao', 'DESC')
          .limit(5)
          .getRawMany(),
      ]);

      return {
        frota: frotaSync,
        acidentes: acidentesSync,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter últimas sincronizações:', error);
      return {
        frota: [],
        acidentes: [],
      };
    }
  }

  private async obterAlertasAtivos() {
    try {
      const [mudancasRecentes, veiculosRisco, garagensProblematicas] = await Promise.allSettled([
        this.historicoRepository
          .createQueryBuilder('historico')
          .where('historico.dataMudanca >= :data', { 
            data: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
          })
          .getCount(),
        
        this.acidentesService.obterTopVeiculosAcidentes(5),
        
        this.acidentesService.obterEstatisticasAcidentes(),
      ]);

      const mudancas = mudancasRecentes.status === 'fulfilled' ? mudancasRecentes.value : 0;
      const veiculos = veiculosRisco.status === 'fulfilled' ? veiculosRisco.value : [];
      const garagens = garagensProblematicas.status === 'fulfilled' ? garagensProblematicas.value : { distribuicao: { porGaragem: [] } };

      return {
        mudancasRecentes: mudancas,
        veiculosRisco: veiculos.filter(v => v.totalAcidentes >= 3).length,
        garagensProblematicas: garagens.distribuicao.porGaragem
          .filter(g => g.comVitimas > 0).length,
        nivel: this.calcularNivelAlerta(mudancas, veiculos.length),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter alertas ativos:', error);
      return {
        mudancasRecentes: 0,
        veiculosRisco: 0,
        garagensProblematicas: 0,
        nivel: 'BAIXO',
      };
    }
  }

  private async obterKPIsGerais() {
    try {
      const [frotaStats, acidentesStats] = await Promise.all([
        this.frotaService.obterEstatisticasFrota(),
        this.acidentesService.obterEstatisticasAcidentes(),
      ]);

      const indiceSinistralidade = frotaStats.ativos > 0 ? 
        (acidentesStats.resumo.total / frotaStats.ativos) * 100 : 0;

      return {
        disponibilidadeFrota: frotaStats.percentualAtivos,
        indiceSinistralidade: Number(indiceSinistralidade.toFixed(2)),
        custoMedioAcidente: acidentesStats.resumo.total > 0 ? 
          acidentesStats.resumo.valorTotalDanos / acidentesStats.resumo.total : 0,
        eficienciaOperacional: Number((100 - indiceSinistralidade).toFixed(2)),
        scoreGeral: this.calcularScoreGeral(frotaStats, acidentesStats.resumo),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter KPIs gerais:', error);
      return {
        disponibilidadeFrota: 0,
        indiceSinistralidade: 0,
        custoMedioAcidente: 0,
        eficienciaOperacional: 0,
        scoreGeral: 0,
      };
    }
  }

  private async atualizarEstatisticasConsolidadas() {
    try {
      const dashboard = await this.dashboardService.gerarDashboardCompleto();
      
      // As estatísticas já são salvas automaticamente no dashboard service
      this.logger.log('📊 Estatísticas consolidadas atualizadas');
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar estatísticas consolidadas:', error);
      throw error;
    }
  }

  private async obterTendenciasHistoricas(ano?: number) {
    try {
      const anoAtual = ano || new Date().getFullYear();
      
      const estatisticas = await this.estatisticasRepository
        .createQueryBuilder('stats')
        .where('stats.ano = :ano', { ano: anoAtual })
        .andWhere('stats.garagem = :garagem', { garagem: 'TODAS' })
        .orderBy('stats.mes', 'ASC')
        .getMany();

      return estatisticas.map(stat => ({
        mes: stat.mes,
        indiceSinistralidade: stat.indiceSinistralidade,
        eficienciaOperacional: stat.eficienciaOperacional,
        custoMedioAcidente: stat.custoMedioAcidente,
        totalAcidentes: stat.totalAcidentes,
      }));
    } catch (error) {
      this.logger.error('❌ Erro ao obter tendências históricas:', error);
      return [];
    }
  }

  private async obterAlertasCriticos() {
    try {
      const [veiculosRisco, mudancasCriticas] = await Promise.allSettled([
        this.acidentesService.obterTopVeiculosAcidentes(3),
        this.historicoRepository
          .createQueryBuilder('historico')
          .where('historico.tipoMudanca = :tipo', { tipo: 'STATUS' })
          .andWhere('historico.valorNovo = :valor', { valor: 'INATIVO' })
          .andWhere('historico.dataMudanca >= :data', { 
            data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // última semana
          })
          .getCount(),
      ]);

      const veiculos = veiculosRisco.status === 'fulfilled' ? veiculosRisco.value : [];
      const mudancas = mudancasCriticas.status === 'fulfilled' ? mudancasCriticas.value : 0;

      return {
        veiculosAltoRisco: veiculos.filter(v => v.totalAcidentes >= 5),
        veiculosInativadosRecentemente: mudancas,
        nivel: veiculos.length > 5 ? 'CRÍTICO' : 'NORMAL',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter alertas críticos:', error);
      return {
        veiculosAltoRisco: [],
        veiculosInativadosRecentemente: 0,
        nivel: 'NORMAL',
      };
    }
  }

  private async gerarRecomendacoesExecutivas() {
    try {
      const [frotaStats, acidentesStats, mudancas] = await Promise.allSettled([
        this.frotaService.obterEstatisticasFrota(),
        this.acidentesService.obterEstatisticasAcidentes(),
        this.frotaService.obterMudancasRecentes(30),
      ]);

      const frota = frotaStats.status === 'fulfilled' ? frotaStats.value : { percentualAtivos: 0, ativos: 0 };
      const acidentes = acidentesStats.status === 'fulfilled' ? acidentesStats.value : { resumo: { total: 0, valorTotalDanos: 0 } };
      const mudancasRecentes = mudancas.status === 'fulfilled' ? mudancas.value : [];

      const recomendacoes: string[] = [];

      // Análise de disponibilidade
      if (frota.percentualAtivos < 85) {
        recomendacoes.push('🚨 Disponibilidade da frota abaixo do ideal (85%). Revisar manutenção preventiva.');
      }

      // Análise de sinistralidade
      const sinistralidade = frota.ativos > 0 ? (acidentes.resumo.total / frota.ativos) * 100 : 0;
      if (sinistralidade > 8) {
        recomendacoes.push('⚠️ Índice de sinistralidade elevado. Implementar programa de capacitação de motoristas.');
      }

      // Análise de mudanças
      if (mudancasRecentes.length > 50) {
        recomendacoes.push('🔄 Alto número de mudanças na frota. Avaliar estabilidade operacional.');
      }

      // Análise de custos
      const custoMedio = acidentes.resumo.total > 0 ? acidentes.resumo.valorTotalDanos / acidentes.resumo.total : 0;
      if (custoMedio > 3000) {
        recomendacoes.push('💰 Custo médio de acidentes elevado. Revisar políticas de segurança.');
      }

      if (recomendacoes.length === 0) {
        recomendacoes.push('✅ Operações dentro dos parâmetros ideais. Manter monitoramento contínuo.');
      }

      return recomendacoes;
    } catch (error) {
      this.logger.error('❌ Erro ao gerar recomendações executivas:', error);
      return ['⚠️ Erro ao gerar recomendações. Verificar sistema.'];
    }
  }

  private async obterComparativoAnterior(filtros?: any) {
    try {
      // Implementar comparativo com período anterior
      return {
        frotaVariacao: 0,
        acidentesVariacao: 0,
        custosVariacao: 0,
        tendencia: 'ESTÁVEL',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter comparativo anterior:', error);
      return {
        frotaVariacao: 0,
        acidentesVariacao: 0,
        custosVariacao: 0,
        tendencia: 'DESCONHECIDO',
      };
    }
  }

  private async calcularMetricasPerformance(periodo?: any) {
    try {
      // Implementar cálculo de métricas de performance
      return {
        disponibilidade: 90,
        pontualidade: 85,
        seguranca: 92,
        eficiencia: 88,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao calcular métricas de performance:', error);
      return {
        disponibilidade: 0,
        pontualidade: 0,
        seguranca: 0,
        eficiencia: 0,
      };
    }
  }

  private async obterBenchmarks() {
    try {
      // Obter dados históricos para calcular benchmarks reais
      const dadosHistoricos = await this.estatisticasRepository
        .createQueryBuilder('stats')
        .select('AVG(stats.percentualDisponibilidade)', 'avgDisponibilidade')
        .addSelect('AVG(stats.indiceSinistralidade)', 'avgSinistralidade')
        .addSelect('AVG(stats.custoMedioAcidente)', 'avgCustoMedio')
        .where('stats.ano = :ano', { ano: new Date().getFullYear() - 1 })
        .andWhere('stats.garagem = :garagem', { garagem: 'TODAS' })
        .getRawOne();

      return {
        disponibilidadeSetor: Number((dadosHistoricos?.avgDisponibilidade || 85).toFixed(2)),
        sinistralidade: Number((dadosHistoricos?.avgSinistralidade || 6.5).toFixed(2)),
        custoMedioSetor: Number((dadosHistoricos?.avgCustoMedio || 3200).toFixed(2)),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter benchmarks:', error);
      // Retornar valores padrão baseados na indústria
      return {
        disponibilidadeSetor: 85,
        sinistralidade: 6.5,
        custoMedioSetor: 3200,
      };
    }
  }

  private async analisarEvolucaoTemporal(periodo?: any) {
    try {
      const anoAtual = new Date().getFullYear();
      const mesesAnalise = 12;
      
      const evolucao = await this.estatisticasRepository
        .createQueryBuilder('stats')
        .select('stats.mes', 'mes')
        .addSelect('stats.ano', 'ano')
        .addSelect('stats.percentualDisponibilidade', 'disponibilidade')
        .addSelect('stats.indiceSinistralidade', 'sinistralidade')
        .addSelect('stats.eficienciaOperacional', 'eficiencia')
        .addSelect('stats.custoMedioAcidente', 'custoMedio')
        .where('stats.ano >= :anoInicio', { anoInicio: anoAtual - 1 })
        .andWhere('stats.garagem = :garagem', { garagem: 'TODAS' })
        .orderBy('stats.ano', 'ASC')
        .addOrderBy('stats.mes', 'ASC')
        .limit(mesesAnalise)
        .getMany();
      
      return evolucao.map((item, index) => {
        const anterior = evolucao[index - 1];
        return {
          periodo: `${item.ano}-${item.mes.toString().padStart(2, '0')}`,
          mes: item.mes,
          ano: item.ano,
          disponibilidade: item.percentualDisponibilidade,
          sinistralidade: item.indiceSinistralidade,
          eficiencia: item.eficienciaOperacional,
          custoMedio: item.custoMedioAcidente,
          tendencias: anterior ? {
            disponibilidade: item.percentualDisponibilidade - anterior.percentualDisponibilidade,
            sinistralidade: item.indiceSinistralidade - anterior.indiceSinistralidade,
            eficiencia: item.eficienciaOperacional - anterior.eficienciaOperacional
          } : null
        };
      });
    } catch (error) {
      this.logger.error('❌ Erro ao analisar evolução temporal:', error);
      return [];
    }
  }

  private async identificarGargalos() {
    try {
      const gargalos = [];
      
      // 1. Verificar garagens com baixa disponibilidade
      const garagensBaixaDisponibilidade = await this.frotaService.obterVeiculosPorGaragem();
      for (const garagem of garagensBaixaDisponibilidade) {
        const percentualAtivos = (Number(garagem.ativos) / Number(garagem.total)) * 100;
        if (percentualAtivos < 80) {
          gargalos.push({
            tipo: 'DISPONIBILIDADE',
            categoria: 'Frota',
            descricao: `Garagem ${garagem.garagem} com baixa disponibilidade: ${percentualAtivos.toFixed(1)}%`,
            severidade: percentualAtivos < 70 ? 'ALTA' : 'MÉDIA',
            valor: percentualAtivos,
            meta: 85,
            acao: 'Revisar manutenção preventiva e processos de reparo'
          });
        }
      }
      
      // 2. Verificar veículos com muitos acidentes
      const veiculosProblematicos = await this.acidentesService.obterTopVeiculosAcidentes(10);
      for (const veiculo of veiculosProblematicos) {
        if (Number(veiculo.totalAcidentes) >= 5) {
          gargalos.push({
            tipo: 'SINISTRALIDADE',
            categoria: 'Veículo',
            descricao: `Veículo ${veiculo.prefixo} com ${veiculo.totalAcidentes} acidentes`,
            severidade: Number(veiculo.totalAcidentes) >= 8 ? 'ALTA' : 'MÉDIA',
            valor: Number(veiculo.totalAcidentes),
            meta: 3,
            acao: 'Avaliar estado do veículo e treinamento do motorista'
          });
        }
      }
      
      // 3. Verificar custos elevados
      const estatisticas = await this.acidentesService.obterEstatisticasAcidentes();
      const custoMedio = estatisticas.resumo.total > 0 ? 
        estatisticas.resumo.valorTotalDanos / estatisticas.resumo.total : 0;
        
      if (custoMedio > 4000) {
        gargalos.push({
          tipo: 'CUSTO',
          categoria: 'Financeiro',
          descricao: `Custo médio de acidentes elevado: R$ ${custoMedio.toFixed(2)}`,
          severidade: custoMedio > 6000 ? 'ALTA' : 'MÉDIA',
          valor: custoMedio,
          meta: 3500,
          acao: 'Implementar programa de prevenção de acidentes'
        });
      }
      
      return gargalos.sort((a, b) => {
        const severidadeOrder = { 'ALTA': 3, 'MÉDIA': 2, 'BAIXA': 1 };
        return severidadeOrder[b.severidade] - severidadeOrder[a.severidade];
      });
    } catch (error) {
      this.logger.error('❌ Erro ao identificar gargalos:', error);
      return [];
    }
  }

  private async identificarOportunidades() {
    try {
      const oportunidades = [];
      
      // 1. Analisar frota com baixo índice de acidentes
      const veiculosExcelentes = await this.acidentesService.obterTopVeiculosAcidentes(100);
      const veiculosSemAcidentes = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .leftJoin('operacoes_acidentes', 'acidente', 'acidente.prefixoVeiculo = veiculo.prefixo')
        .where('acidente.id IS NULL')
        .andWhere('veiculo.status = :status', { status: 'ATIVO' })
        .getCount();
        
      if (veiculosSemAcidentes > 0) {
        oportunidades.push({
          tipo: 'RECONHECIMENTO',
          categoria: 'Segurança',
          titulo: 'Veículos sem acidentes',
          descricao: `${veiculosSemAcidentes} veículos estão operando sem acidentes`,
          beneficio: 'Reconhecer e replicar boas práticas de condução',
          impacto: 'ALTO',
          facilidade: 'ALTA',
          valor: veiculosSemAcidentes,
          acao: 'Criar programa de reconhecimento para motoristas exemplares'
        });
      }
      
      // 2. Identificar garagens com alta disponibilidade
      const garagensExcelentes = await this.frotaService.obterVeiculosPorGaragem();
      for (const garagem of garagensExcelentes) {
        const percentualAtivos = (Number(garagem.ativos) / Number(garagem.total)) * 100;
        if (percentualAtivos >= 95) {
          oportunidades.push({
            tipo: 'BENCHMARK',
            categoria: 'Manutenção',
            titulo: `Garagem ${garagem.garagem} - Excelente disponibilidade`,
            descricao: `Disponibilidade de ${percentualAtivos.toFixed(1)}% dos veículos`,
            beneficio: 'Replicar processos para outras garagens',
            impacto: 'ALTO',
            facilidade: 'MÉDIA',
            valor: percentualAtivos,
            acao: 'Documentar e compartilhar processos de manutenção'
          });
        }
      }
      
      // 3. Analisar tendência de melhoria
      const ultimasEstatisticas = await this.estatisticasRepository
        .createQueryBuilder('stats')
        .where('stats.ano = :ano', { ano: new Date().getFullYear() })
        .andWhere('stats.garagem = :garagem', { garagem: 'TODAS' })
        .orderBy('stats.mes', 'DESC')
        .limit(3)
        .getMany();
        
      if (ultimasEstatisticas.length >= 2) {
        const atual = ultimasEstatisticas[0];
        const anterior = ultimasEstatisticas[1];
        
        if (atual.eficienciaOperacional > anterior.eficienciaOperacional) {
          const melhoria = atual.eficienciaOperacional - anterior.eficienciaOperacional;
          oportunidades.push({
            tipo: 'TENDENCIA',
            categoria: 'Performance',
            titulo: 'Melhoria na eficiência operacional',
            descricao: `Aumento de ${melhoria.toFixed(2)}% na eficiência`,
            beneficio: 'Consolidar melhorias e acelerar progressão',
            impacto: 'ALTO',
            facilidade: 'ALTA',
            valor: melhoria,
            acao: 'Identificar fatores de sucesso e potencializar'
          });
        }
      }
      
      // 4. Custos baixos comparado ao benchmark
      const estatisticas = await this.acidentesService.obterEstatisticasAcidentes();
      const custoMedio = estatisticas.resumo.total > 0 ? 
        estatisticas.resumo.valorTotalDanos / estatisticas.resumo.total : 0;
        
      if (custoMedio < 2500) {
        oportunidades.push({
          tipo: 'ECONOMIA',
          categoria: 'Financeiro',
          titulo: 'Baixo custo médio de acidentes',
          descricao: `Custo médio de R$ ${custoMedio.toFixed(2)} está abaixo da média do setor`,
          beneficio: 'Economia significativa em custos operacionais',
          impacto: 'MÉDIO',
          facilidade: 'ALTA',
          valor: 2500 - custoMedio,
          acao: 'Manter práticas atuais e compartilhar estratégias'
        });
      }
      
      return oportunidades.sort((a, b) => {
        const impactoOrder = { 'ALTO': 3, 'MÉDIO': 2, 'BAIXO': 1 };
        const facilidadeOrder = { 'ALTA': 3, 'MÉDIA': 2, 'BAIXA': 1 };
        
        const scoreA = impactoOrder[a.impacto] * facilidadeOrder[a.facilidade];
        const scoreB = impactoOrder[b.impacto] * facilidadeOrder[b.facilidade];
        
        return scoreB - scoreA;
      });
    } catch (error) {
      this.logger.error('❌ Erro ao identificar oportunidades:', error);
      return [];
    }
  }

  private calcularScorePerformance(metricas: any): number {
    try {
      // Implementar cálculo de score
      const { disponibilidade, pontualidade, seguranca, eficiencia } = metricas;
      return Math.round((disponibilidade + pontualidade + seguranca + eficiencia) / 4);
    } catch (error) {
      this.logger.error('❌ Erro ao calcular score de performance:', error);
      return 0;
    }
  }

  private async calcularIndicadoresSeguranca() {
    try {
      const acidentes = await this.acidentesService.obterEstatisticasAcidentes();
      
      return {
        acidentes: acidentes.resumo.total,
        vitimas: acidentes.resumo.comVitimas,
        gravidade: acidentes.resumo.comVitimas > 5 ? 'ALTA' : acidentes.resumo.comVitimas > 2 ? 'MÉDIA' : 'BAIXA',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao calcular indicadores de segurança:', error);
      return {
        acidentes: 0,
        vitimas: 0,
        gravidade: 'BAIXA',
      };
    }
  }

  private async verificarConformidadeNormativa() {
    try {
      // Implementar verificação de conformidade
      return {
        percentual: 95,
        status: 'CONFORME',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao verificar conformidade normativa:', error);
      return {
        percentual: 0,
        status: 'DESCONHECIDO',
      };
    }
  }

  private async obterAuditoriasRecentes() {
    try {
      // Simular auditorias baseadas em dados reais do sistema
      const auditorias = [];
      const hoje = new Date();
      
      // 1. Auditoria de Sincronização de Dados
      const ultimaSincronizacaoFrota = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select('MAX(veiculo.dataSincronizacao)', 'ultima')
        .getRawOne();
        
      if (ultimaSincronizacaoFrota?.ultima) {
        const diasSemSincronizacao = Math.floor(
          (hoje.getTime() - new Date(ultimaSincronizacaoFrota.ultima).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        auditorias.push({
          id: 'AUD-SYNC-001',
          tipo: 'SINCRONIA',
          titulo: 'Auditoria de Sincronização de Dados',
          data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: diasSemSincronizacao <= 1 ? 'CONFORME' : 'NAO_CONFORME',
          resultado: `Última sincronização há ${diasSemSincronizacao} dias`,
          responsavel: 'Sistema Automático',
          prazoCorrecao: diasSemSincronizacao > 1 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
        });
      }
      
      // 2. Auditoria de Qualidade dos Dados
      const [totalVeiculos, veiculosSemPlaca] = await Promise.all([
        this.veiculoRepository.count(),
        this.veiculoRepository.count({ where: { placa: '' } })
      ]);
      
      const percentualQualidade = totalVeiculos > 0 ? 
        ((totalVeiculos - veiculosSemPlaca) / totalVeiculos) * 100 : 100;
        
      auditorias.push({
        id: 'AUD-QUAL-001',
        tipo: 'QUALIDADE',
        titulo: 'Auditoria de Qualidade dos Dados',
        data: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: percentualQualidade >= 95 ? 'CONFORME' : 'NAO_CONFORME',
        resultado: `${percentualQualidade.toFixed(1)}% dos veículos com dados completos`,
        responsavel: 'Equipe de TI',
        prazoCorrecao: percentualQualidade < 95 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
      });
      
      // 3. Auditoria de Segurança Operacional
      const estatisticasAcidentes = await this.acidentesService.obterEstatisticasAcidentes();
      const frotaStats = await this.frotaService.obterEstatisticasFrota();
      
      const indiceSinistralidade = frotaStats.ativos > 0 ? 
        (estatisticasAcidentes.resumo.total / frotaStats.ativos) * 100 : 0;
        
      auditorias.push({
        id: 'AUD-SEG-001',
        tipo: 'SEGURANCA',
        titulo: 'Auditoria de Segurança Operacional',
        data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: indiceSinistralidade <= 8 ? 'CONFORME' : 'NAO_CONFORME',
        resultado: `Índice de sinistralidade: ${indiceSinistralidade.toFixed(2)}%`,
        responsavel: 'Gerente de Operações',
        prazoCorrecao: indiceSinistralidade > 8 ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) : null
      });
      
      // 4. Auditoria de Disponibilidade da Frota
      auditorias.push({
        id: 'AUD-DISP-001',
        tipo: 'DISPONIBILIDADE',
        titulo: 'Auditoria de Disponibilidade da Frota',
        data: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        status: frotaStats.percentualAtivos >= 85 ? 'CONFORME' : 'NAO_CONFORME',
        resultado: `${frotaStats.percentualAtivos.toFixed(1)}% da frota disponível`,
        responsavel: 'Coordenador de Manutenção',
        prazoCorrecao: frotaStats.percentualAtivos < 85 ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) : null
      });
      
      return auditorias.sort((a, b) => b.data.getTime() - a.data.getTime());
    } catch (error) {
      this.logger.error('❌ Erro ao obter auditorias recentes:', error);
      return [];
    }
  }

  private async obterPlanosAcao() {
    try {
      const planosAcao = [];
      
      // 1. Planos baseados em gargalos identificados
      const gargalos = await this.identificarGargalos();
      
      for (const gargalo of gargalos.slice(0, 5)) { // Top 5 gargalos
        let plano = {
          id: `PA-${gargalo.tipo}-${Date.now()}`,
          titulo: `Plano de Ação: ${gargalo.descricao}`,
          tipo: gargalo.tipo,
          categoria: gargalo.categoria,
          prioridade: gargalo.severidade,
          status: 'PLANEJADO',
          dataInicio: new Date(),
          prazoEstimado: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          responsavel: '',
          objetivo: '',
          acoes: [],
          kpis: [],
          orcamento: 0
        };
        
        switch (gargalo.tipo) {
          case 'DISPONIBILIDADE':
            plano.responsavel = 'Coordenador de Manutenção';
            plano.objetivo = `Elevar disponibilidade para ${gargalo.meta}%`;
            plano.acoes = [
              'Revisar cronograma de manutenção preventiva',
              'Identificar gargalos no processo de reparo',
              'Capacitar equipe técnica',
              'Otimizar estoque de peças de reposição'
            ];
            plano.kpis = [
              'Percentual de disponibilidade da frota',
              'Tempo médio de reparo (MTTR)',
              'Número de manutenções preventivas realizadas'
            ];
            plano.orcamento = 50000;
            break;
            
          case 'SINISTRALIDADE':
            plano.responsavel = 'Gerente de Operações';
            plano.objetivo = `Reduzir acidentes para menos de ${gargalo.meta} por veículo`;
            plano.acoes = [
              'Implementar programa de capacitação de motoristas',
              'Revisar condições do veículo problemático',
              'Análise comportamental do condutor',
              'Implementar sistema de monitoramento'
            ];
            plano.kpis = [
              'Número de acidentes por veículo',
              'Índice de sinistralidade geral',
              'Score de segurança por motorista'
            ];
            plano.orcamento = 25000;
            break;
            
          case 'CUSTO':
            plano.responsavel = 'Controller Financeiro';
            plano.objetivo = `Reduzir custo médio para R$ ${gargalo.meta.toFixed(2)}`;
            plano.acoes = [
              'Revisar processos de negociação com seguradoras',
              'Implementar programa de prevenção de acidentes',
              'Otimizar processo de aprovação de reparos',
              'Buscar fornecedores alternativos'
            ];
            plano.kpis = [
              'Custo médio por acidente',
              'Tempo de resolução de sinistros',
              'Percentual de economia em reparos'
            ];
            plano.orcamento = 15000;
            break;
        }
        
        planosAcao.push(plano);
      }
      
      // 2. Planos proativos baseados em oportunidades
      const oportunidades = await this.identificarOportunidades();
      
      for (const oportunidade of oportunidades.slice(0, 3)) { // Top 3 oportunidades
        const planoOportunidade = {
          id: `PA-OPP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          titulo: `Plano de Oportunidade: ${oportunidade.titulo}`,
          tipo: 'OPORTUNIDADE',
          categoria: oportunidade.categoria,
          prioridade: oportunidade.impacto,
          status: 'EM_ANALISE',
          dataInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          prazoEstimado: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 dias
          responsavel: 'Coordenador de Melhoria Contínua',
          objetivo: oportunidade.beneficio,
          acoes: [oportunidade.acao],
          kpis: ['ROI do projeto', 'Impacto na eficiência operacional'],
          orcamento: 10000
        };
        
        planosAcao.push(planoOportunidade);
      }
      
      // 3. Planos de compliance baseados em auditorias
      const auditorias = await this.obterAuditoriasRecentes();
      const auditoriasNaoConformes = auditorias.filter(a => a.status === 'NAO_CONFORME');
      
      for (const auditoria of auditoriasNaoConformes) {
        const planoCompliance = {
          id: `PA-COMP-${auditoria.id}`,
          titulo: `Plano de Conformidade: ${auditoria.titulo}`,
          tipo: 'COMPLIANCE',
          categoria: 'Auditoria',
          prioridade: 'ALTA',
          status: 'URGENTE',
          dataInicio: new Date(),
          prazoEstimado: auditoria.prazoCorrecao || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          responsavel: auditoria.responsavel,
          objetivo: `Adequar ${auditoria.titulo} aos padrões de conformidade`,
          acoes: [`Corrigir: ${auditoria.resultado}`],
          kpis: ['Status de conformidade', 'Prazo de adequação'],
          orcamento: 5000
        };
        
        planosAcao.push(planoCompliance);
      }
      
      // 4. Plano de Manutenção Preventiva (sempre ativo)
      const frotaStats = await this.frotaService.obterEstatisticasFrota();
      
      planosAcao.push({
        id: 'PA-PREV-001',
        titulo: 'Plano de Manutenção Preventiva 2024',
        tipo: 'MANUTENCAO',
        categoria: 'Preventiva',
        prioridade: 'ALTA',
        status: 'EM_ANDAMENTO',
        dataInicio: new Date(new Date().getFullYear(), 0, 1), // 1º de janeiro
        prazoEstimado: new Date(new Date().getFullYear(), 11, 31), // 31 de dezembro
        responsavel: 'Coordenador de Manutenção',
        objetivo: `Manter disponibilidade de ${frotaStats.total} veículos acima de 85%`,
        acoes: [
          'Manutenção preventiva mensal em 100% da frota',
          'Revisões programadas por quilometragem',
          'Substituição de peças conforme cronograma',
          'Capacitação contínua da equipe técnica'
        ],
        kpis: [
          'Disponibilidade da frota (%)',
          'MTBF (Mean Time Between Failures)',
          'Custo de manutenção por veículo',
          'Número de quebras não programadas'
        ],
        orcamento: 200000
      });
      
      return planosAcao.sort((a, b) => {
        const prioridadeOrder = { 'URGENTE': 5, 'ALTA': 4, 'MÉDIA': 3, 'BAIXA': 2, 'PLANEJADO': 1 };
        return (prioridadeOrder[b.prioridade] || 0) - (prioridadeOrder[a.prioridade] || 0);
      });
    } catch (error) {
      this.logger.error('❌ Erro ao obter planos de ação:', error);
      return [];
    }
  }

  private avaliarStatusCompliance(seguranca: any, conformidade: any): string {
    try {
      if (conformidade.percentual >= 95 && seguranca.gravidade === 'BAIXA') {
        return 'CONFORME';
      } else if (conformidade.percentual >= 80) {
        return 'PARCIALMENTE_CONFORME';
      } else {
        return 'NÃO_CONFORME';
      }
    } catch (error) {
      this.logger.error('❌ Erro ao avaliar status de compliance:', error);
      return 'DESCONHECIDO';
    }
  }

  private calcularNivelAlerta(mudancas: number, veiculosRisco: number): string {
    if (mudancas > 20 || veiculosRisco > 5) return 'ALTO';
    if (mudancas > 10 || veiculosRisco > 2) return 'MÉDIO';
    return 'BAIXO';
  }

  private calcularScoreGeral(frotaStats: any, acidentesStats: any): number {
    try {
      const disponibilidade = frotaStats.percentualAtivos;
      const sinistralidade = frotaStats.ativos > 0 ? (acidentesStats.total / frotaStats.ativos) * 100 : 0;
      
      // Score baseado em disponibilidade (peso 40%) e segurança (peso 60%)
      const scoreDisponibilidade = Math.min(disponibilidade, 100) * 0.4;
      const scoreSeguranca = Math.max(0, 100 - sinistralidade * 10) * 0.6;
      
      return Number((scoreDisponibilidade + scoreSeguranca).toFixed(1));
    } catch (error) {
      this.logger.error('❌ Erro ao calcular score geral:', error);
      return 0;
    }
  }

  /**
   * Verificar saúde geral do sistema
   */
  async verificarSaudeGeral() {
    this.logger.log('🏥 Verificando saúde geral do sistema...');

    try {
      const [
        statusBancoResult,
        statusSincronizacaoResult,
        statusCacheResult,
        alertasAtivosResult,
      ] = await Promise.allSettled([
        this.verificarStatusBancoDados(),
        this.verificarStatusSincronizacao(),
        this.verificarStatusCache(),
        this.obterAlertasAtivos(),
      ]);

      const statusBanco = statusBancoResult.status === 'fulfilled' ? statusBancoResult.value : { status: 'ERRO' };
      const statusSincronizacao = statusSincronizacaoResult.status === 'fulfilled' ? statusSincronizacaoResult.value : { status: 'ERRO' };
      const statusCache = statusCacheResult.status === 'fulfilled' ? statusCacheResult.value : { status: 'ERRO' };
      const alertasAtivos = alertasAtivosResult.status === 'fulfilled' ? alertasAtivosResult.value : { nivel: 'ALTO' };

      const saudeGeral = this.calcularSaudeGeral(statusBanco, statusSincronizacao, statusCache, alertasAtivos);

      return {
        status: saudeGeral.status,
        score: saudeGeral.score,
        componentes: {
          bancoDados: statusBanco,
          sincronizacao: statusSincronizacao,
          cache: statusCache,
          alertas: alertasAtivos,
        },
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('❌ Erro na verificação de saúde:', error);
      return {
        status: 'CRÍTICO',
        score: 0,
        erro: error.message,
        timestamp: new Date(),
      };
    }
  }

  private async verificarStatusBancoDados() {
    try {
      const [countVeiculos, countAcidentes] = await Promise.all([
        this.veiculoRepository.count(),
        this.acidenteRepository.count(),
      ]);

      return {
        status: 'OK',
        veiculos: countVeiculos,
        acidentes: countAcidentes,
        conectividade: 'ESTÁVEL',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao verificar status do banco de dados:', error);
      return {
        status: 'ERRO',
        erro: error.message,
      };
    }
  }

  private async verificarStatusSincronizacao() {
    try {
      const ultimaSincronizacao = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select('MAX(veiculo.dataSincronizacao)', 'ultima')
        .getRawOne();

      const agora = new Date();
      const ultima = new Date(ultimaSincronizacao?.ultima || 0);
      const horasDesdeUltima = (agora.getTime() - ultima.getTime()) / (1000 * 60 * 60);

      return {
        status: horasDesdeUltima < 24 ? 'OK' : 'ATRASADO',
        ultimaSincronizacao: ultima,
        horasDesdeUltima: Math.round(horasDesdeUltima),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao verificar status de sincronização:', error);
      return {
        status: 'ERRO',
        erro: error.message,
      };
    }
  }

  private async verificarStatusCache() {
    try {
      // Obter a data de hoje como Date
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas a data
    
      // Verificar se há dados recentes no cache
      const dadosRecentes = await this.veiculoRepository.count({
        where: {
          dataSincronizacao: hoje
        }
      });
    
      return {
        status: dadosRecentes > 0 ? 'OK' : 'VAZIO',
        registrosCache: dadosRecentes,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao verificar status do cache:', error);
      return {
        status: 'ERRO',
        erro: error.message,
      };
    }
  }

  private calcularSaudeGeral(statusBanco: any, statusSync: any, statusCache: any, alertas: any) {
    let score = 100;
    
    if (statusBanco.status !== 'OK') score -= 40;
    if (statusSync.status !== 'OK') score -= 30;
    if (statusCache.status !== 'OK') score -= 20;
    if (alertas.nivel === 'ALTO') score -= 10;

    let status = 'EXCELENTE';
    if (score < 90) status = 'BOM';
    if (score < 70) status = 'ATENÇÃO';
    if (score < 50) status = 'CRÍTICO';

    return { status, score };
  }
}