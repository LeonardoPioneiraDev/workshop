// apps/frontend/src/services/departments/legal/core/dashboardService.ts

import { apiClient } from '../../../api/client';
import { 
  DashboardJuridico,
  ResumoExecutivo,
  KPI,
  Alerta,
  Rankings,
  EvolucaoTemporal,
  Distribuicoes,
  Meta
} from '../types';
import { 
  legalCache, 
  createDashboardKey, 
  CacheTTL 
} from '../utils/cache';

// =========================================================================
// INTERFACES ESPECÍFICAS PARA DASHBOARD
// =========================================================================

export interface DashboardFiltros {
  periodo?: 'DIA' | 'SEMANA' | 'MES' | 'ANO' | 'PERSONALIZADO';
  dataInicio?: string;
  dataFim?: string;
  setor?: number;
  tipoMulta?: 'TODOS' | 'TRANSITO' | 'SEMOB';
  incluirComparacao?: boolean;
  incluirPrevisoes?: boolean;
  forcarAtualizacao?: boolean;
}

export interface DashboardResposta {
  success: boolean;
  message: string;
  data: DashboardJuridico;
  metadata: {
    ultimaAtualizacao: string;
    proximaAtualizacao: string;
    tempoExecucao: string;
    fonteDados: string;
  };
  cache: {
    fromCache: boolean;
    fonte: string;
    tempoConsulta: number;
  };
  timestamp: string;
}

// =========================================================================
// CLASSE DO SERVIÇO DE DASHBOARD
// =========================================================================

class DashboardService {
  private readonly baseUrl = '/departamentos/juridico';

  // =========================================================================
  // MÉTODOS PRINCIPAIS
  // =========================================================================

  /**
   * Obter dashboard completo
   */
  async obterDashboard(filtros: DashboardFiltros = {}): Promise<DashboardResposta> {
    console.log('📊 [DASHBOARD] Obtendo dashboard:', filtros);

    try {
      // Tentar cache primeiro
      const cacheResult = await this.applyCacheStrategy(filtros);
      if (cacheResult) {
        console.log('💾 [DASHBOARD] Dashboard obtido do cache');
        return cacheResult;
      }

      // Buscar dados da API
      const response = await this.fetchFromApi(filtros);
      
      // Processar resposta
      const processedResponse = this.processResponse(response, filtros);
      
      // Cachear resultado
      this.cacheResponse(filtros, processedResponse);
      
      console.log('✅ [DASHBOARD] Dashboard obtido da API');
      return processedResponse;

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter dashboard:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obter apenas resumo executivo
   */
  async obterResumoExecutivo(filtros: DashboardFiltros = {}): Promise<ResumoExecutivo> {
    console.log('📈 [DASHBOARD] Obtendo resumo executivo:', filtros);

    try {
      const dashboard = await this.obterDashboard(filtros);
      return dashboard.data.resumoExecutivo;

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter resumo executivo:', error);
      
      // Retornar resumo vazio em caso de erro
      return {
        totalMultas: 0,
        valorTotal: 0,
        crescimentoMensal: 0,
        taxaArrecadacao: 0,
        eficienciaCobranca: 0,
        alertasAtivos: 0
      };
    }
  }

  /**
   * Obter KPIs principais
   */
  async obterKPIs(filtros: DashboardFiltros = {}): Promise<KPI[]> {
    console.log('📊 [DASHBOARD] Obtendo KPIs:', filtros);

    try {
      const dashboard = await this.obterDashboard(filtros);
      return dashboard.data.kpis;

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter KPIs:', error);
      return [];
    }
  }

  /**
   * Obter alertas críticos
   */
  async obterAlertas(filtros: DashboardFiltros = {}): Promise<Alerta[]> {
    console.log('🚨 [DASHBOARD] Obtendo alertas:', filtros);

    try {
      // Buscar alertas específicos
      const response = await apiClient.get<any>(
        `${this.baseUrl}/alertas`,
        this.buildQueryParams(filtros)
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter alertas:', error);
      return [];
    }
  }

  /**
   * Obter rankings
   */
  async obterRankings(filtros: DashboardFiltros = {}): Promise<Rankings> {
    console.log('🏆 [DASHBOARD] Obtendo rankings:', filtros);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/analytics/rankings`,
        this.buildQueryParams(filtros)
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        agentes: [],
        locais: [],
        veiculos: [],
        infracoes: [],
        setores: []
      };

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter rankings:', error);
      return {
        agentes: [],
        locais: [],
        veiculos: [],
        infracoes: [],
        setores: []
      };
    }
  }

  /**
   * Obter evolução temporal
   */
  async obterEvolucaoTemporal(filtros: DashboardFiltros = {}): Promise<EvolucaoTemporal> {
    console.log('📈 [DASHBOARD] Obtendo evolução temporal:', filtros);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/analytics/tendencias`,
        this.buildQueryParams(filtros)
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        mensal: [],
        semanal: [],
        diaria: []
      };

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter evolução temporal:', error);
      return {
        mensal: [],
        semanal: [],
        diaria: []
      };
    }
  }

  /**
   * Obter distribuições
   */
  async obterDistribuicoes(filtros: DashboardFiltros = {}): Promise<Distribuicoes> {
    console.log('📊 [DASHBOARD] Obtendo distribuições:', filtros);

    try {
      const dashboard = await this.obterDashboard(filtros);
      return dashboard.data.distribuicoes;

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter distribuições:', error);
      return {
        porTipo: [],
        porGravidade: [],
        porStatus: [],
        porHorario: [],
        porSetor: []
      };
    }
  }

  /**
   * Obter metas
   */
  async obterMetas(filtros: DashboardFiltros = {}): Promise<Meta[]> {
    console.log('🎯 [DASHBOARD] Obtendo metas:', filtros);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/metas`,
        this.buildQueryParams(filtros)
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter metas:', error);
      return [];
    }
  }

  // =========================================================================
  // MÉTODOS ESPECÍFICOS
  // =========================================================================

  /**
   * Obter dashboard em tempo real
   */
  async obterDashboardTempoReal(): Promise<DashboardResposta> {
    console.log('⚡ [DASHBOARD] Obtendo dashboard em tempo real...');

    return this.obterDashboard({
      periodo: 'DIA',
      forcarAtualizacao: true
    });
  }

  /**
   * Obter comparação de períodos
   */
  async obterComparacaoPeriodos(
    periodoAtual: { inicio: string; fim: string },
    periodoAnterior: { inicio: string; fim: string }
  ): Promise<{
    atual: DashboardJuridico;
    anterior: DashboardJuridico;
    comparacao: {
      crescimentoMultas: number;
      crescimentoValor: number;
      variacaoTaxaArrecadacao: number;
      variacaoEficiencia: number;
    };
  }> {
    console.log('📊 [DASHBOARD] Obtendo comparação de períodos:', {
      periodoAtual,
      periodoAnterior
    });

    try {
      // Buscar dados dos dois períodos em paralelo
      const [dashboardAtual, dashboardAnterior] = await Promise.all([
        this.obterDashboard({
          periodo: 'PERSONALIZADO',
          dataInicio: periodoAtual.inicio,
          dataFim: periodoAtual.fim
        }),
        this.obterDashboard({
          periodo: 'PERSONALIZADO',
          dataInicio: periodoAnterior.inicio,
          dataFim: periodoAnterior.fim
        })
      ]);

      // Calcular comparações
      const atual = dashboardAtual.data.resumoExecutivo;
      const anterior = dashboardAnterior.data.resumoExecutivo;

      const comparacao = {
        crescimentoMultas: this.calculateGrowth(atual.totalMultas, anterior.totalMultas),
        crescimentoValor: this.calculateGrowth(atual.valorTotal, anterior.valorTotal),
        variacaoTaxaArrecadacao: atual.taxaArrecadacao - anterior.taxaArrecadacao,
        variacaoEficiencia: atual.eficienciaCobranca - anterior.eficienciaCobranca
      };

      return {
        atual: dashboardAtual.data,
        anterior: dashboardAnterior.data,
        comparacao
      };

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter comparação de períodos:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obter previsões baseadas em dados históricos
   */
  async obterPrevisoes(
    tipo: 'MULTAS' | 'VALOR' | 'ARRECADACAO',
    periodoPrevisao: number = 30 // dias
  ): Promise<{
    previsoes: Array<{
      data: string;
      valorPrevisto: number;
      confianca: number;
    }>;
    tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL';
    precisao: number;
  }> {
    console.log('🔮 [DASHBOARD] Obtendo previsões:', { tipo, periodoPrevisao });

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/analytics/previsoes`,
        { tipo, periodoPrevisao }
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        previsoes: [],
        tendencia: 'ESTAVEL',
        precisao: 0
      };

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao obter previsões:', error);
      return {
        previsoes: [],
        tendencia: 'ESTAVEL',
        precisao: 0
      };
    }
  }

  // =========================================================================
  // MÉTODOS DE CACHE
  // =========================================================================

  /**
   * Limpar cache do dashboard
   */
  limparCache(): void {
    legalCache.deleteByPattern('^dashboard:');
    console.log('🧹 [DASHBOARD] Cache limpo');
  }

  /**
   * Atualizar dashboard forçadamente
   */
  async atualizarForcado(filtros: DashboardFiltros = {}): Promise<DashboardResposta> {
    return this.obterDashboard({
      ...filtros,
      forcarAtualizacao: true
    });
  }

  // =========================================================================
  // MÉTODOS PRIVADOS
  // =========================================================================

  /**
   * Aplica estratégia de cache
   */
  private async applyCacheStrategy(filtros: DashboardFiltros): Promise<DashboardResposta | null> {
    // Se forçar atualização, pular cache
    if (filtros.forcarAtualizacao) {
      return null;
    }

    // Tentar obter do cache
    const cacheKey = createDashboardKey(filtros);
    const cached = legalCache.get<DashboardResposta>(cacheKey);

    return cached?.data || null;
  }

  /**
   * Busca dados da API
   */
  private async fetchFromApi(filtros: DashboardFiltros): Promise<any> {
    const queryParams = this.buildQueryParams(filtros);
    
    console.log('🌐 [DASHBOARD] Buscando da API:', queryParams);
    
    return await apiClient.get<any>(`${this.baseUrl}/dashboard`, queryParams);
  }

  /**
   * Constrói parâmetros de query
   */
  private buildQueryParams(filtros: DashboardFiltros): Record<string, any> {
    const params: Record<string, any> = {};
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    return params;
  }

  /**
   * Processa resposta da API
   */
  private processResponse(response: any, filtros: DashboardFiltros): DashboardResposta {
    // Extrair dados do dashboard
    const dashboardData = response.dashboard || response.data || {};

    // Construir dashboard estruturado
    const dashboard: DashboardJuridico = {
      resumoExecutivo: dashboardData.resumoExecutivo || this.getDefaultResumoExecutivo(),
      kpis: dashboardData.kpis || [],
      alertasCriticos: dashboardData.alertasCriticos || [],
      rankings: dashboardData.rankings || this.getDefaultRankings(),
      evolucaoTemporal: dashboardData.evolucaoTemporal || this.getDefaultEvolucaoTemporal(),
      distribuicoes: dashboardData.distribuicoes || this.getDefaultDistribuicoes(),
      metas: dashboardData.metas || []
    };

    return {
      success: response.success || true,
      message: response.message || 'Dashboard carregado com sucesso',
      data: dashboard,
      metadata: {
        ultimaAtualizacao: response.timestamp || new Date().toISOString(),
        proximaAtualizacao: this.calculateNextUpdate(),
        tempoExecucao: response.executionTime || '0ms',
        fonteDados: 'api'
      },
      cache: {
        fromCache: false,
        fonte: 'api',
        tempoConsulta: 0
      },
      timestamp: response.timestamp || new Date().toISOString()
    };
  }

  /**
   * Cacheia resposta
   */
  private cacheResponse(filtros: DashboardFiltros, response: DashboardResposta): void {
    try {
      const cacheKey = createDashboardKey(filtros);
      legalCache.set(cacheKey, response, CacheTTL.DASHBOARD, 'api');
      
    } catch (error) {
      console.warn('⚠️ [DASHBOARD] Erro ao cachear resposta:', error);
    }
  }

  /**
   * Calcula crescimento percentual
   */
  private calculateGrowth(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  }

  /**
   * Calcula próxima atualização
   */
  private calculateNextUpdate(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15); // Próxima atualização em 15 minutos
    return now.toISOString();
  }

  /**
   * Retorna resumo executivo padrão
   */
  private getDefaultResumoExecutivo(): ResumoExecutivo {
    return {
      totalMultas: 0,
      valorTotal: 0,
      crescimentoMensal: 0,
      taxaArrecadacao: 0,
      eficienciaCobranca: 0,
      alertasAtivos: 0
    };
  }

  /**
   * Retorna rankings padrão
   */
  private getDefaultRankings(): Rankings {
    return {
      agentes: [],
      locais: [],
      veiculos: [],
      infracoes: [],
      setores: []
    };
  }

  /**
   * Retorna evolução temporal padrão
   */
  private getDefaultEvolucaoTemporal(): EvolucaoTemporal {
    return {
      mensal: [],
      semanal: [],
      diaria: []
    };
  }

  /**
   * Retorna distribuições padrão
   */
  private getDefaultDistribuicoes(): Distribuicoes {
    return {
      porTipo: [],
      porGravidade: [],
      porStatus: [],
      porHorario: [],
      porSetor: []
    };
  }

  /**
   * Trata erros de forma consistente
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('Erro inesperado ao processar dashboard');
  }
}

// =========================================================================
// INSTÂNCIA SINGLETON
// =========================================================================

export const dashboardService = new DashboardService();
export default dashboardService;