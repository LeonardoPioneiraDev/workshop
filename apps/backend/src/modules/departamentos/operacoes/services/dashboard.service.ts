// src/modules/departamentos/operacoes/services/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FrotaService } from './frota.service';
import { AcidentesService } from './acidentes.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstatisticasOperacoes } from '../entities/estatisticas-operacoes.entity';

@Injectable()
export class DashboardOperacoesService {
  private readonly logger = new Logger(DashboardOperacoesService.name);

  constructor(
    private readonly frotaService: FrotaService,
    private readonly acidentesService: AcidentesService,
    @InjectRepository(EstatisticasOperacoes)
    private readonly estatisticasRepository: Repository<EstatisticasOperacoes>,
  ) {}

  async gerarDashboardCompleto(filtros?: {
    ano?: number;
    mes?: number;
    garagem?: string;
  }) {
    this.logger.log('📊 Gerando dashboard completo de operações...');

    try {
      // ✅ USAR Promise.allSettled para não falhar se uma operação der erro
      const [
        estatisticasFrotaResult,
        estatisticasAcidentesResult,
        distribuicaoGaragemResult,
        topVeiculosAcidentesResult,
        mudancasRecentesResult,
        kpisOperacionaisResult,
        tendenciasAcidentesResult,
      ] = await Promise.allSettled([
        this.obterDadosFrota(),
        this.obterDadosAcidentes(filtros),
        this.obterDistribuicaoGaragem(),
        this.obterTopVeiculosAcidentes(filtros),
        this.obterMudancasRecentes(),
        this.calcularKPIsOperacionais(filtros),
        this.obterTendenciasAcidentes(filtros?.ano),
      ]);

      // ✅ EXTRAIR VALORES DOS RESULTADOS COM FALLBACKS
      const estatisticasFrota = this.extrairResultadoComFallback(
        estatisticasFrotaResult, 
        this.getFallbackFrota()
      );

      const estatisticasAcidentes = this.extrairResultadoComFallback(
        estatisticasAcidentesResult, 
        this.getFallbackAcidentes()
      );

      const distribuicaoGaragem = this.extrairResultadoComFallback(
        distribuicaoGaragemResult, 
        []
      );

      const topVeiculosAcidentes = this.extrairResultadoComFallback(
        topVeiculosAcidentesResult, 
        []
      );

      const mudancasRecentes = this.extrairResultadoComFallback(
        mudancasRecentesResult, 
        []
      );

      const kpisOperacionais = this.extrairResultadoComFallback(
        kpisOperacionaisResult, 
        this.getFallbackKPIs()
      );

      const tendenciasAcidentes = this.extrairResultadoComFallback(
        tendenciasAcidentesResult, 
        this.getFallbackTendencias()
      );

      const dashboard = {
        resumo: {
          frota: estatisticasFrota,
          acidentes: estatisticasAcidentes.resumo,
          kpis: kpisOperacionais,
        },
        distribuicoes: {
          frotaPorGaragem: distribuicaoGaragem,
          acidentesPorGaragem: estatisticasAcidentes.distribuicao.porGaragem,
          acidentesPorMes: estatisticasAcidentes.distribuicao.porMes,
          acidentesPorTurno: estatisticasAcidentes.distribuicao.porTurno,
        },
        rankings: {
          topVeiculosAcidentes,
          garagensMaisAcidentes: estatisticasAcidentes.distribuicao.porGaragem.slice(0, 5),
        },
        alertas: {
          mudancasRecentes: mudancasRecentes.slice(0, 10),
          veiculosRisco: topVeiculosAcidentes.filter(v => v.totalAcidentes >= 3),
          garagensProblematicas: estatisticasAcidentes.distribuicao.porGaragem
            .filter(g => g.comVitimas > 0)
            .slice(0, 3),
        },
        tendencias: tendenciasAcidentes,
        filtros,
        timestamp: new Date(),
        // ✅ ADICIONAR INFORMAÇÕES DE ERROS SE HOUVER
        erros: this.coletarErros([
          estatisticasFrotaResult,
          estatisticasAcidentesResult,
          distribuicaoGaragemResult,
          topVeiculosAcidentesResult,
          mudancasRecentesResult,
          kpisOperacionaisResult,
          tendenciasAcidentesResult,
        ])
      };

      // Salvar estatísticas para histórico (apenas se não houver erros críticos)
      if (estatisticasFrotaResult.status === 'fulfilled' && estatisticasAcidentesResult.status === 'fulfilled') {
        try {
          await this.salvarEstatisticasHistorico(dashboard, filtros);
        } catch (error) {
          this.logger.warn('⚠️ Erro ao salvar estatísticas no histórico:', error);
        }
      }

      return dashboard;

    } catch (error) {
      this.logger.error('❌ Erro ao gerar dashboard:', error);
      
      // ✅ RETORNAR DASHBOARD BÁSICO EM CASO DE ERRO TOTAL
      return this.getDashboardFallback(filtros, error.message);
    }
  }

  // ✅ MÉTODOS DE FALLBACK
  private getFallbackFrota() {
    return {
      total: 0,
      ativos: 0,
      inativos: 0,
      percentualAtivos: 0
    };
  }

  private getFallbackAcidentes() {
    return {
      resumo: {
        total: 0,
        comVitimas: 0,
        semVitimas: 0,
        valorTotalDanos: 0,
        percentualComVitimas: 0
      },
      distribuicao: {
        porGaragem: [],
        porMes: [],
        porTurno: []
      }
    };
  }

  private getFallbackKPIs() {
    return {
      indiceSinistralidade: 0,
      custoMedioAcidente: 0,
      percentualAcidentesComVitimas: 0,
      eficienciaOperacional: 85.0,
      veiculosDisponiveis: 0,
      totalVeiculos: 0,
      percentualDisponibilidade: 0
    };
  }

  private getFallbackTendencias() {
    const anoAtual = new Date().getFullYear();
    return {
      anoAtual: { ano: anoAtual, total: 0, comVitimas: 0, valorDanos: 0 },
      anoAnterior: { ano: anoAtual - 1, total: 0, comVitimas: 0, valorDanos: 0 },
      variacoes: { total: 0, comVitimas: 0, tendencia: 'ESTÁVEL' },
      porMes: []
    };
  }

  private getDashboardFallback(filtros?: any, erro?: string) {
    return {
      resumo: {
        frota: this.getFallbackFrota(),
        acidentes: this.getFallbackAcidentes().resumo,
        kpis: this.getFallbackKPIs(),
      },
      distribuicoes: {
        frotaPorGaragem: [],
        acidentesPorGaragem: [],
        acidentesPorMes: [],
        acidentesPorTurno: [],
      },
      rankings: {
        topVeiculosAcidentes: [],
        garagensMaisAcidentes: [],
      },
      alertas: {
        mudancasRecentes: [],
        veiculosRisco: [],
        garagensProblematicas: [],
      },
      tendencias: this.getFallbackTendencias(),
      filtros,
      timestamp: new Date(),
      erro: erro || 'Erro ao gerar dashboard completo',
      erros: ['Erro crítico no sistema de operações']
    };
  }

  // ✅ MÉTODO PARA EXTRAIR RESULTADOS COM FALLBACK
  private extrairResultadoComFallback(result: PromiseSettledResult<any>, fallback: any) {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      this.logger.warn(`⚠️ Usando fallback devido ao erro: ${result.reason?.message}`);
      return fallback;
    }
  }

  // ✅ MÉTODO PARA COLETAR ERROS
  private coletarErros(results: PromiseSettledResult<any>[]): string[] {
    const erros: string[] = [];
    const nomes = [
      'Estatísticas da frota',
      'Estatísticas de acidentes', 
      'Distribuição por garagem',
      'Top veículos com acidentes',
      'Mudanças recentes',
      'KPIs operacionais',
      'Tendências de acidentes'
    ];

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        erros.push(`Erro ao carregar ${nomes[index]}: ${result.reason?.message}`);
      }
    });

    return erros;
  }

  // ✅ MÉTODOS AUXILIARES COM TRATAMENTO DE ERRO
  private async obterDadosFrota() {
    try {
      return await this.frotaService.obterEstatisticasFrota();
    } catch (error) {
      this.logger.error('❌ Erro ao obter dados da frota:', error);
      throw error;
    }
  }

  private async obterDadosAcidentes(filtros?: any) {
    try {
      return await this.acidentesService.obterEstatisticasAcidentes(filtros);
    } catch (error) {
      this.logger.error('❌ Erro ao obter dados de acidentes:', error);
      throw error;
    }
  }

  private async obterDistribuicaoGaragem() {
    try {
      return await this.frotaService.obterVeiculosPorGaragem();
    } catch (error) {
      this.logger.error('❌ Erro ao obter distribuição por garagem:', error);
      throw error;
    }
  }

  private async obterTopVeiculosAcidentes(filtros?: any) {
    try {
      return await this.acidentesService.obterTopVeiculosAcidentes(10, filtros);
    } catch (error) {
      this.logger.error('❌ Erro ao obter top veículos com acidentes:', error);
      throw error;
    }
  }

  private async obterMudancasRecentes() {
    try {
      return await this.frotaService.obterMudancasRecentes(30);
    } catch (error) {
      this.logger.error('❌ Erro ao obter mudanças recentes:', error);
      throw error;
    }
  }

  private async calcularKPIsOperacionais(filtros?: any) {
    try {
      const [frotaStats, acidentesStats] = await Promise.all([
        this.frotaService.obterEstatisticasFrota(),
        this.acidentesService.obterEstatisticasAcidentes(filtros),
      ]);

      const indiceSinistralidade = frotaStats.ativos > 0 ? 
        (acidentesStats.resumo.total / frotaStats.ativos) * 100 : 0;

      const custoMedioAcidente = acidentesStats.resumo.total > 0 ? 
        acidentesStats.resumo.valorTotalDanos / acidentesStats.resumo.total : 0;

      const percentualAcidentesComVitimas = acidentesStats.resumo.total > 0 ? 
        (acidentesStats.resumo.comVitimas / acidentesStats.resumo.total) * 100 : 0;

      return {
        indiceSinistralidade: Number(indiceSinistralidade.toFixed(2)),
        custoMedioAcidente: Number(custoMedioAcidente.toFixed(2)),
        percentualAcidentesComVitimas: Number(percentualAcidentesComVitimas.toFixed(2)),
        eficienciaOperacional: Number((100 - indiceSinistralidade).toFixed(2)),
        veiculosDisponiveis: frotaStats.ativos,
        totalVeiculos: frotaStats.total,
        percentualDisponibilidade: Number(frotaStats.percentualAtivos.toFixed(2)),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao calcular KPIs operacionais:', error);
      throw error;
    }
  }

  private async obterTendenciasAcidentes(ano?: number) {
    try {
      const anoAtual = ano || new Date().getFullYear();
      const anoAnterior = anoAtual - 1;

      const [acidentesAnoAtual, acidentesAnoAnterior] = await Promise.all([
        this.acidentesService.obterEstatisticasAcidentes({ ano: anoAtual }),
        this.acidentesService.obterEstatisticasAcidentes({ ano: anoAnterior }),
      ]);

      const variacao = acidentesAnoAnterior.resumo.total > 0 ? 
        ((acidentesAnoAtual.resumo.total - acidentesAnoAnterior.resumo.total) / 
         acidentesAnoAnterior.resumo.total) * 100 : 0;

      const variacaoComVitimas = acidentesAnoAnterior.resumo.comVitimas > 0 ? 
        ((acidentesAnoAtual.resumo.comVitimas - acidentesAnoAnterior.resumo.comVitimas) / 
         acidentesAnoAnterior.resumo.comVitimas) * 100 : 0;

      return {
        anoAtual: {
          ano: anoAtual,
          total: acidentesAnoAtual.resumo.total,
          comVitimas: acidentesAnoAtual.resumo.comVitimas,
          valorDanos: acidentesAnoAtual.resumo.valorTotalDanos,
        },
        anoAnterior: {
          ano: anoAnterior,
          total: acidentesAnoAnterior.resumo.total,
          comVitimas: acidentesAnoAnterior.resumo.comVitimas,
          valorDanos: acidentesAnoAnterior.resumo.valorTotalDanos,
        },
        variacoes: {
          total: Number(variacao.toFixed(2)),
          comVitimas: Number(variacaoComVitimas.toFixed(2)),
          tendencia: variacao > 0 ? 'CRESCENTE' : variacao < 0 ? 'DECRESCENTE' : 'ESTÁVEL',
        },
        porMes: acidentesAnoAtual.distribuicao.porMes,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter tendências de acidentes:', error);
      throw error;
    }
  }

  private async salvarEstatisticasHistorico(dashboard: any, filtros?: any) {
    try {
      const estatistica = {
        data: new Date(),
        ano: filtros?.ano || new Date().getFullYear(),
        mes: filtros?.mes || new Date().getMonth() + 1,
        garagem: filtros?.garagem || 'TODAS',
        totalVeiculos: dashboard.resumo.frota.total,
        veiculosAtivos: dashboard.resumo.frota.ativos,
        veiculosInativos: dashboard.resumo.frota.inativos,
        totalAcidentes: dashboard.resumo.acidentes.total,
        acidentesComVitimas: dashboard.resumo.acidentes.comVitimas,
        acidentesSemVitimas: dashboard.resumo.acidentes.semVitimas,
        valorTotalDanos: dashboard.resumo.acidentes.valorTotalDanos,
        indiceSinistralidade: dashboard.resumo.kpis.indiceSinistralidade,
        custoMedioAcidente: dashboard.resumo.kpis.custoMedioAcidente,
        eficienciaOperacional: dashboard.resumo.kpis.eficienciaOperacional,
        dadosCompletos: dashboard,
      };

      await this.estatisticasRepository.save(estatistica);
      this.logger.log('📊 Estatísticas salvas no histórico');

    } catch (error) {
      this.logger.error('❌ Erro ao salvar estatísticas:', error);
    }
  }

  async obterHistoricoEstatisticas(
    ano?: number, 
    mes?: number, 
    garagem?: string,
    limite: number = 30
  ) {
    try {
      const query = this.estatisticasRepository.createQueryBuilder('stats');

      if (ano) query.andWhere('stats.ano = :ano', { ano });
      if (mes) query.andWhere('stats.mes = :mes', { mes });
      if (garagem) query.andWhere('stats.garagem = :garagem', { garagem });

      return await query
        .orderBy('stats.data', 'DESC')
        .limit(limite)
        .getMany();
    } catch (error) {
      this.logger.error('❌ Erro ao obter histórico de estatísticas:', error);
      return [];
    }
  }

  async obterComparativoMensal(ano: number) {
    try {
      const estatisticas = await this.estatisticasRepository
        .createQueryBuilder('stats')
        .where('stats.ano = :ano', { ano })
        .andWhere('stats.garagem = :garagem', { garagem: 'TODAS' })
        .orderBy('stats.mes', 'ASC')
        .getMany();

      return estatisticas.map(stat => ({
        mes: stat.mes,
        mesNome: this.obterNomeMes(stat.mes),
        frota: {
          total: stat.totalVeiculos,
          ativos: stat.veiculosAtivos,
          inativos: stat.veiculosInativos,
        },
        acidentes: {
          total: stat.totalAcidentes,
          comVitimas: stat.acidentesComVitimas,
          semVitimas: stat.acidentesSemVitimas,
          valorDanos: stat.valorTotalDanos,
        },
        kpis: {
          indiceSinistralidade: stat.indiceSinistralidade,
          custoMedioAcidente: stat.custoMedioAcidente,
          eficienciaOperacional: stat.eficienciaOperacional,
        },
      }));
    } catch (error) {
      this.logger.error('❌ Erro ao obter comparativo mensal:', error);
      return [];
    }
  }

  private obterNomeMes(mes: number): string {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1] || 'Mês Inválido';
  }

  async gerarRelatorioExecutivo(ano?: number, mes?: number) {
    try {
      const dashboard = await this.gerarDashboardCompleto({ ano, mes });
      const historico = await this.obterHistoricoEstatisticas(ano, mes, 'TODAS', 12);

      return {
        periodo: {
          ano: ano || new Date().getFullYear(),
          mes: mes || 'TODOS',
        },
        resumoExecutivo: {
          frotaTotal: dashboard.resumo.frota.total,
          frotaAtiva: dashboard.resumo.frota.ativos,
          percentualDisponibilidade: dashboard.resumo.kpis.percentualDisponibilidade,
          totalAcidentes: dashboard.resumo.acidentes.total,
          indiceSinistralidade: dashboard.resumo.kpis.indiceSinistralidade,
          custoTotalDanos: dashboard.resumo.acidentes.valorTotalDanos,
        },
        alertasCriticos: dashboard.alertas,
        tendenciaHistorica: historico.slice(0, 6).reverse(),
        recomendacoes: this.gerarRecomendacoes(dashboard),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao gerar relatório executivo:', error);
      return {
        periodo: {
          ano: ano || new Date().getFullYear(),
          mes: mes || 'TODOS',
        },
        resumoExecutivo: {
          frotaTotal: 0,
          frotaAtiva: 0,
          percentualDisponibilidade: 0,
          totalAcidentes: 0,
          indiceSinistralidade: 0,
          custoTotalDanos: 0,
        },
        alertasCriticos: { mudancasRecentes: [], veiculosRisco: [], garagensProblematicas: [] },
        tendenciaHistorica: [],
        recomendacoes: ['Erro ao gerar recomendações'],
        timestamp: new Date(),
        erro: 'Erro ao gerar relatório executivo'
      };
    }
  }

  private gerarRecomendacoes(dashboard: any): string[] {
    const recomendacoes: string[] = [];

    try {
      // Análise de sinistralidade
      if (dashboard.resumo.kpis.indiceSinistralidade > 10) {
        recomendacoes.push('🚨 Índice de sinistralidade elevado. Revisar treinamentos de motoristas.');
      }

      // Análise de veículos problemáticos
      if (dashboard.alertas.veiculosRisco.length > 0) {
        recomendacoes.push(`⚠️ ${dashboard.alertas.veiculosRisco.length} veículos com histórico de acidentes recorrentes. Avaliar manutenção.`);
      }

      // Análise de garagens
      if (dashboard.alertas.garagensProblematicas.length > 0) {
        recomendacoes.push(`📍 Garagens com acidentes com vítimas: ${dashboard.alertas.garagensProblematicas.map(g => g.garagem).join(', ')}.`);
      }

      // Análise de eficiência
      if (dashboard.resumo.kpis.eficienciaOperacional < 90) {
        recomendacoes.push('📈 Eficiência operacional abaixo do ideal. Implementar melhorias nos processos.');
      }

      // Análise de custos
      if (dashboard.resumo.kpis.custoMedioAcidente > 5000) {
        recomendacoes.push('💰 Custo médio de acidentes elevado. Revisar políticas de prevenção.');
      }

      if (recomendacoes.length === 0) {
        recomendacoes.push('✅ Operações dentro dos parâmetros normais. Manter monitoramento.');
      }

      return recomendacoes;
    } catch (error) {
      this.logger.error('❌ Erro ao gerar recomendações:', error);
      return ['⚠️ Erro ao gerar recomendações. Verificar sistema.'];
    }
  }
}