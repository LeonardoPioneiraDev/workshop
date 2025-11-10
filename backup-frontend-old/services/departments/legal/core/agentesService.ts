// apps/frontend/src/services/departments/legal/core/agentesService.ts

import { apiClient } from '../../../api/client';
import { Agente, EstrategiaCache } from '../types';
import { mapAgente } from '../utils/mappers';
import { 
  legalCache, 
  createAgentesKey, 
  CacheTTL,
  CacheStrategy 
} from '../utils/cache';

// =========================================================================
// INTERFACES ESPECÍFICAS PARA AGENTES
// =========================================================================

export interface AgenteFiltros {
  codigo?: string;
  descricao?: string;
  matricula?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  estrategia?: EstrategiaCache;
  forcarAtualizacao?: boolean;
}

export interface AgenteEstatisticas {
  totalAgentes: number;
  agentesAtivos: number;
  agentesInativos: number;
  agentesComMultas: number;
  totalMultasEmitidas: number;
  valorTotalMultas: number;
  mediaMultasPorAgente: number;
  eficienciaGeral: number;
  produtividadeMedia: number;
}

export interface AgenteResposta {
  success: boolean;
  message: string;
  data: Agente[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  estatisticas?: AgenteEstatisticas;
  cache: {
    fromCache: boolean;
    fonte: string;
    tempoConsulta: number;
    hitRate?: number;
  };
  timestamp: string;
}

export interface StatusCache {
  totalRegistros: number;
  registrosValidos: number;
  registrosExpirados: number;
  hitRate: number;
  ultimaAtualizacao: string;
  recomendacoes: string[];
}

// =========================================================================
// CLASSE DO SERVIÇO DE AGENTES
// =========================================================================

class AgentesService {
  private readonly baseUrl = '/juridico/agentes';

  // =========================================================================
  // MÉTODOS PRINCIPAIS
  // =========================================================================

  /**
   * Buscar agentes com filtros
   */
  async buscarAgentes(filtros: AgenteFiltros = {}): Promise<AgenteResposta> {
    console.log('🔍 [AGENTES] Buscando agentes:', filtros);

    try {
      // Aplicar estratégia de cache
      const cacheResult = await this.applyCacheStrategy(filtros);
      if (cacheResult) {
        console.log('💾 [AGENTES] Dados obtidos do cache');
        return cacheResult;
      }

      // Buscar dados da API
      const response = await this.fetchFromApi(filtros);
      
      // Processar resposta
      const processedResponse = this.processResponse(response, filtros);
      
      // Cachear resultado
      this.cacheResponse(filtros, processedResponse);
      
      console.log('✅ [AGENTES] Dados obtidos da API:', {
        total: processedResponse.data.length,
        cache: processedResponse.cache.fonte
      });

      return processedResponse;

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao buscar agentes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Buscar agente específico por código
   */
  async buscarPorCodigo(codigo: string, estrategia: EstrategiaCache = 'HYBRID'): Promise<Agente | null> {
    console.log('🔍 [AGENTES] Buscando agente por código:', codigo);

    try {
      // Tentar cache primeiro se estratégia permitir
      if (estrategia !== 'ORACLE_FIRST') {
        const cacheKey = createAgentesKey({ codigo });
        const cached = legalCache.get<Agente>(cacheKey);
        
        if (cached) {
          console.log('💾 [AGENTES] Agente obtido do cache');
          return cached.data;
        }
      }

      // Buscar da API
      const response = await apiClient.get<any>(
        `${this.baseUrl}/codigo/${codigo}`,
        { estrategia }
      );

      if (response.success && response.data) {
        const agente = mapAgente(response.data);
        
        // Cachear resultado
        const cacheKey = createAgentesKey({ codigo });
        legalCache.set(cacheKey, agente, CacheTTL.AGENTES, 'api-single');
        
        return agente;
      }

      return null;

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao buscar agente por código:', error);
      return null;
    }
  }

  /**
   * Buscar agente por matrícula
   */
  async buscarPorMatricula(matricula: string, estrategia: EstrategiaCache = 'HYBRID'): Promise<Agente | null> {
    console.log('🔍 [AGENTES] Buscando agente por matrícula:', matricula);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/matricula/${matricula}`,
        { estrategia }
      );

      if (response.success && response.data) {
        return mapAgente(response.data);
      }

      return null;

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao buscar agente por matrícula:', error);
      return null;
    }
  }

  /**
   * Obter estatísticas gerais dos agentes
   */
  async obterEstatisticas(): Promise<AgenteEstatisticas | null> {
    console.log('📊 [AGENTES] Obtendo estatísticas...');

    try {
      // Tentar cache primeiro
      const cacheKey = createAgentesKey({ tipo: 'estatisticas' });
      const cached = legalCache.get<AgenteEstatisticas>(cacheKey);
      
      if (cached) {
        console.log('�� [AGENTES] Estatísticas obtidas do cache');
        return cached.data;
      }

      // Buscar da API
      const response = await apiClient.get<any>(`${this.baseUrl}/stats/geral`);

      if (response.success && response.data) {
        const estatisticas = response.data as AgenteEstatisticas;
        
        // Cachear por 1 hora
        legalCache.set(cacheKey, estatisticas, 60 * 60 * 1000, 'api-stats');
        
        return estatisticas;
      }

      return null;

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao obter estatísticas:', error);
      return null;
    }
  }

  /**
   * Obter top agentes por produtividade
   */
  async obterTopAgentes(limit: number = 10): Promise<Agente[]> {
    console.log('🏆 [AGENTES] Obtendo top agentes:', limit);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/stats/top-agentes`,
        { limit, estrategia: 'ORACLE_FIRST' }
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data.map(mapAgente);
      }

      return [];

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao obter top agentes:', error);
      return [];
    }
  }

  /**
   * Buscar agentes por texto
   */
  async buscarPorTexto(texto: string, limit: number = 20): Promise<Agente[]> {
    console.log('🔍 [AGENTES] Buscando por texto:', texto);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/busca/${encodeURIComponent(texto)}`,
        { limit }
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data.map(mapAgente);
      }

      return [];

    } catch (error) {
      console.error('❌ [AGENTES] Erro na busca por texto:', error);
      return [];
    }
  }

  /**
   * Obter produtividade de um agente específico
   */
  async obterProdutividade(codigo: string): Promise<{
    agente: Agente;
    produtividade: {
      totalMultas: number;
      valorTotal: number;
      mediaValor: number;
      multasPorMes: Array<{ mes: string; total: number; valor: number }>;
      comparacaoMedia: number;
      ranking: number;
    };
  } | null> {
    console.log('📈 [AGENTES] Obtendo produtividade:', codigo);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/${codigo}/produtividade`
      );

      if (response.success && response.data) {
        return {
          agente: mapAgente(response.data.agente),
          produtividade: response.data.produtividade
        };
      }

      return null;

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao obter produtividade:', error);
      return null;
    }
  }

  /**
   * Obter multas de um agente específico
   */
  async obterMultasAgente(
    codigo: string, 
    filtros: {
      dataInicio?: string;
      dataFim?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    multas: any[];
    total: number;
    resumo: {
      totalMultas: number;
      valorTotal: number;
      valorMedio: number;
    };
  }> {
    console.log('📋 [AGENTES] Obtendo multas do agente:', codigo);

    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/${codigo}/multas`,
        filtros
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        multas: [],
        total: 0,
        resumo: {
          totalMultas: 0,
          valorTotal: 0,
          valorMedio: 0
        }
      };

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao obter multas do agente:', error);
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // MÉTODOS DE CACHE
  // =========================================================================

  /**
   * Obter status do cache
   */
  async obterStatusCache(): Promise<StatusCache | null> {
    console.log('💾 [AGENTES] Obtendo status do cache...');

    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/cache/status`);

      if (response.success && response.data) {
        return response.data as StatusCache;
      }

      return null;

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao obter status do cache:', error);
      return null;
    }
  }

  /**
   * Sincronizar cache
   */
  async sincronizarCache(codigo?: string): Promise<{
    total: number;
    novos: number;
    atualizados: number;
    tempoExecucao: string;
  }> {
    console.log('🔄 [AGENTES] Sincronizando cache:', codigo || 'todos');

    try {
      const url = codigo 
        ? `${this.baseUrl}/cache/sincronizar?cod_agente_autuador=${codigo}`
        : `${this.baseUrl}/cache/sincronizar`;

      const response = await apiClient.post<any>(url);

      if (response.success) {
        // Limpar cache local após sincronização
        this.limparCache();
        
        console.log('✅ [AGENTES] Cache sincronizado:', response.data);
        return response.data;
      }

      throw new Error(response.message || 'Erro na sincronização');

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao sincronizar cache:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Limpar cache
   */
  async limparCacheRemoto(ttlHoras: number = 168): Promise<{
    removidos: number;
    espacoLiberado: string;
  }> {
    console.log('🧹 [AGENTES] Limpando cache remoto:', ttlHoras, 'horas');

    try {
      const response = await apiClient.delete<any>(
        `${this.baseUrl}/cache/limpar?ttlHoras=${ttlHoras}`
      );

      if (response.success) {
        console.log('✅ [AGENTES] Cache remoto limpo:', response.data);
        return response.data;
      }

      throw new Error(response.message || 'Erro ao limpar cache');

    } catch (error) {
      console.error('❌ [AGENTES] Erro ao limpar cache remoto:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Limpar cache local
   */
  limparCache(): void {
    legalCache.deleteByPattern('^agentes:');
    console.log('�� [AGENTES] Cache local limpo');
  }

  // =========================================================================
  // MÉTODOS PRIVADOS
  // =========================================================================

  /**
   * Aplica estratégia de cache
   */
  private async applyCacheStrategy(filtros: AgenteFiltros): Promise<AgenteResposta | null> {
    const estrategia = filtros.estrategia || CacheStrategy.HYBRID;
    
    // Se forçar atualização, pular cache
    if (filtros.forcarAtualizacao) {
      return null;
    }

    // Se estratégia é ORACLE_FIRST, pular cache
    if (estrategia === CacheStrategy.ORACLE_FIRST) {
      return null;
    }

    // Tentar obter do cache
    const cacheKey = createAgentesKey(filtros);
    const cached = legalCache.get<AgenteResposta>(cacheKey);

    if (cached) {
      return cached.data;
    }

    // Se estratégia é CACHE_ONLY e não tem cache, retornar vazio
    if (estrategia === CacheStrategy.CACHE_ONLY) {
      return {
        success: false,
        message: 'Dados não disponíveis no cache',
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        },
        cache: {
          fromCache: true,
          fonte: 'cache-empty',
          tempoConsulta: 0
        },
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Busca dados da API
   */
  private async fetchFromApi(filtros: AgenteFiltros): Promise<any> {
    const queryParams: Record<string, any> = {};
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    console.log('🌐 [AGENTES] Buscando da API:', queryParams);
    
    return await apiClient.get<any>(this.baseUrl, queryParams);
  }

  /**
   * Processa resposta da API
   */
  private processResponse(response: any, filtros: AgenteFiltros): AgenteResposta {
    // Mapear agentes
    const rawData = Array.isArray(response.data) ? response.data : [];
    const agentesProcessados = rawData.map(mapAgente);

    // Construir resposta
    const processedResponse: AgenteResposta = {
      success: response.success || true,
      message: response.message || `${agentesProcessados.length} agentes encontrados`,
      data: agentesProcessados,
      pagination: response.pagination || {
        page: filtros.page || 1,
        limit: filtros.limit || 50,
        total: agentesProcessados.length,
        totalPages: Math.ceil(agentesProcessados.length / (filtros.limit || 50))
      },
      estatisticas: response.estatisticas,
      cache: {
        fromCache: false,
        fonte: 'api',
        tempoConsulta: 0,
        hitRate: legalCache.getHitRate()
      },
      timestamp: response.timestamp || new Date().toISOString()
    };

    return processedResponse;
  }

  /**
   * Cacheia resposta
   */
  private cacheResponse(filtros: AgenteFiltros, response: AgenteResposta): void {
    try {
      const cacheKey = createAgentesKey(filtros);
      legalCache.set(cacheKey, response, CacheTTL.AGENTES, 'api');
      
    } catch (error) {
      console.warn('⚠️ [AGENTES] Erro ao cachear resposta:', error);
    }
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
    
    return new Error('Erro inesperado ao processar solicitação de agentes');
  }

  // =========================================================================
  // MÉTODOS UTILITÁRIOS
  // =========================================================================

  /**
   * Validar código de agente
   */
  validarCodigo(codigo: string): boolean {
    return /^\d+$/.test(codigo) && codigo.length >= 1 && codigo.length <= 10;
  }

  /**
   * Validar matrícula fiscal
   */
  validarMatricula(matricula: string): boolean {
    return /^[A-Z0-9]+$/.test(matricula) && matricula.length >= 3 && matricula.length <= 20;
  }

  /**
   * Formatar código de agente
   */
  formatarCodigo(codigo: string): string {
    return codigo.padStart(6, '0');
  }

  /**
   * Obter estatísticas do cache local
   */
  obterEstatisticasCache() {
    return legalCache.getStats();
  }
}

// =========================================================================
// INSTÂNCIA SINGLETON
// =========================================================================

export const agentesService = new AgentesService();
export default agentesService;