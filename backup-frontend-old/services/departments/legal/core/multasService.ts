// apps/frontend/src/services/departments/legal/core/multasService.ts

import { apiClient } from '../../../api/client';
import { 
  Multa,
  MultaFiltros, 
  MultaResposta,
  AnalyticsMultas,
  ResultadoSincronizacao,
  EstrategiaCache
} from '../types';
import { 
  mapToMultaArray, 
  mapFiltrosToBackend,
  normalizeApiResponse,
  extractResponseMetadata 
} from '../utils/mappers';
import { 
  legalCache, 
  createMultasKey, 
  CacheTTL,
  CacheStrategy 
} from '../utils/cache';

// =========================================================================
// CLASSE PRINCIPAL DO SERVIÇO DE MULTAS
// =========================================================================

class MultasService {
  private readonly baseUrl = '/juridico';
  private readonly endpoints = {
    multasCompletas: '/multas-completas',
    multasEnhanced: '/multas-enhanced',
    multasSetor: '/multas-setor',
    historicoSetor: '/historico-setores',
    analytics: '/analytics',
    sync: '/sync'
  };

  // =========================================================================
  // MÉTODO PRINCIPAL UNIFICADO
  // =========================================================================

  /**
   * Método principal para buscar multas
   * Substitui todos os métodos dos serviços antigos
   */
  async buscarMultas(filtros: MultaFiltros = {}): Promise<MultaResposta> {
    console.log('🔍 [MULTAS] Buscando multas com configuração:', filtros);

    try {
      // Determinar endpoint baseado nos filtros
      const endpoint = this.determineEndpoint(filtros);
      
      // Aplicar estratégia de cache
      const cacheResult = await this.applyCacheStrategy(filtros, endpoint);
      if (cacheResult) {
        console.log('💾 [MULTAS] Dados obtidos do cache');
        return cacheResult;
      }

      // Buscar dados da API
      const response = await this.fetchFromApi(endpoint, filtros);
      
      // Processar e cachear resposta
      const processedResponse = this.processResponse(response, filtros);
      
      // Cachear resultado
      this.cacheResponse(filtros, endpoint, processedResponse);
      
      console.log('✅ [MULTAS] Dados obtidos da API:', {
        total: processedResponse.data.length,
        endpoint,
        cache: processedResponse.cache?.fonte
      });

      return processedResponse;

    } catch (error) {
      console.error('❌ [MULTAS] Erro ao buscar multas:', error);
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // MÉTODOS ESPECÍFICOS
  // =========================================================================

  /**
   * Buscar multas com dados de setor
   */
  async buscarComSetor(filtros: MultaFiltros = {}): Promise<MultaResposta> {
    return this.buscarMultas({
      ...filtros,
      incluirHistoricoSetor: true
    });
  }

  /**
   * Buscar multas com analytics
   */
  async buscarComAnalytics(filtros: MultaFiltros = {}): Promise<MultaResposta> {
    return this.buscarMultas({
      ...filtros,
      incluirAnalytics: true,
      limit: 10000 // Mais dados para análise
    });
  }

  /**
   * Buscar multas enhanced (com todos os dados)
   */
  async buscarEnhanced(filtros: MultaFiltros = {}): Promise<MultaResposta> {
    return this.buscarMultas({
      ...filtros,
      incluirHistoricoSetor: true,
      incluirAnalytics: true,
      incluirEstatisticas: true
    });
  }

  /**
   * Buscar multa específica por número
   */
  async buscarPorNumero(numeroAiMulta: string): Promise<Multa | null> {
    console.log('🔍 [MULTAS] Buscando multa por número:', numeroAiMulta);

    try {
      // Tentar cache primeiro
      const cacheKey = createMultasKey({ numeroAiMulta });
      const cached = legalCache.get<Multa>(cacheKey);
      
      if (cached) {
        console.log('💾 [MULTAS] Multa obtida do cache');
        return cached.data;
      }

      // Buscar da API
      const response = await apiClient.get<any>(
        `${this.baseUrl}/multas-enhanced/numero/${numeroAiMulta}`
      );

      if (response.success && response.data) {
        const multa = mapToMultaArray([response.data])[0];
        
        // Cachear resultado
        legalCache.set(cacheKey, multa, CacheTTL.MULTAS, 'api-single');
        
        return multa;
      }

      return null;

    } catch (error) {
      console.error('❌ [MULTAS] Erro ao buscar multa por número:', error);
      return null;
    }
  }

  /**
   * Obter analytics de multas
   */
  async obterAnalytics(filtros: MultaFiltros = {}): Promise<AnalyticsMultas | null> {
    console.log('📊 [MULTAS] Obtendo analytics:', filtros);

    try {
      const response = await this.buscarComAnalytics(filtros);
      return response.analytics || null;

    } catch (error) {
      console.error('❌ [MULTAS] Erro ao obter analytics:', error);
      return null;
    }
  }

  /**
   * Sincronizar dados com Oracle
   */
  async sincronizar(
    dataInicio?: string, 
    dataFim?: string
  ): Promise<ResultadoSincronizacao> {
    console.log('🔄 [MULTAS] Iniciando sincronização:', { dataInicio, dataFim });

    try {
      const params: any = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;

      const response = await apiClient.post<any>(
        `${this.baseUrl}/multas-enhanced/sincronizar`,
        {},
        params
      );

      if (response.success) {
        // Limpar cache após sincronização
        this.limparCache();
        
        console.log('✅ [MULTAS] Sincronização concluída:', response.data);
        return response.data;
      }

      throw new Error(response.message || 'Erro na sincronização');

    } catch (error) {
      console.error('❌ [MULTAS] Erro na sincronização:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Exportar multas
   */
  async exportar(
    filtros: MultaFiltros = {},
    formato: 'xlsx' | 'csv' | 'pdf' = 'xlsx'
  ): Promise<void> {
    console.log('📤 [MULTAS] Exportando:', { filtros, formato });

    try {
      const backendFilters = mapFiltrosToBackend(filtros);
      
      const params = new URLSearchParams();
      Object.entries(backendFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      params.append('formato', formato);

      const response = await apiClient.get(
        `${this.baseUrl}/multas-completas/export?${params}`,
        { responseType: 'blob' }
      );

      // Download automático
      const blob = new Blob([response], {
        type: this.getMimeType(formato)
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `multas_${timestamp}.${formato}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ [MULTAS] Exportação concluída:', filename);

    } catch (error) {
      console.error('❌ [MULTAS] Erro na exportação:', error);
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // MÉTODOS PRIVADOS
  // =========================================================================

  /**
   * Determina qual endpoint usar baseado nos filtros
   */
  private determineEndpoint(filtros: MultaFiltros): string {
    // Se incluir histórico de setor, usar endpoint específico
    if (filtros.incluirHistoricoSetor) {
      return `${this.baseUrl}/historico-setores/multas-historico`;
    }

    // Se incluir analytics ou estatísticas, usar enhanced
    if (filtros.incluirAnalytics || filtros.incluirEstatisticas) {
      return `${this.baseUrl}/multas-enhanced`;
    }

    // Se tem filtros de setor, usar endpoint de setor
    if (filtros.setorCodigo || filtros.setorNome || filtros.setorMudou) {
      return `${this.baseUrl}/multas-setor`;
    }

    // Default para multas completas
    return `${this.baseUrl}/multas-completas`;
  }

  /**
   * Aplica estratégia de cache
   */
  private async applyCacheStrategy(
    filtros: MultaFiltros,
    endpoint: string
  ): Promise<MultaResposta | null> {
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
    const cacheKey = createMultasKey({ ...filtros, endpoint });
    const cached = legalCache.get<MultaResposta>(cacheKey);

    if (cached) {
      return cached.data;
    }

    // Se estratégia é CACHE_ONLY e não tem cache, retornar vazio
    if (estrategia === CacheStrategy.CACHE_ONLY) {
      return {
        success: false,
        message: 'Dados não disponíveis no cache',
        data: [],
        timestamp: new Date().toISOString(),
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        }
      };
    }

    return null;
  }

  /**
   * Busca dados da API
   */
  private async fetchFromApi(endpoint: string, filtros: MultaFiltros): Promise<any> {
    const backendFilters = mapFiltrosToBackend(filtros);
    
    console.log('🌐 [MULTAS] Buscando da API:', { endpoint, filtros: backendFilters });
    
    const response = await apiClient.get<any>(endpoint, backendFilters);
    return normalizeApiResponse(response);
  }

  /**
   * Processa resposta da API
   */
  private processResponse(response: any, filtros: MultaFiltros): MultaResposta {
    // Extrair dados principais
    const rawData = Array.isArray(response.data) ? response.data : [];
    const multasProcessadas = mapToMultaArray(rawData);

    // Extrair metadados
    const metadata = extractResponseMetadata(response);

    // Construir resposta unificada
    const processedResponse: MultaResposta = {
      success: response.success || true,
      message: response.message || `${multasProcessadas.length} multas encontradas`,
      data: multasProcessadas,
      timestamp: response.timestamp || new Date().toISOString(),
      pagination: metadata.pagination || {
        page: filtros.page || 1,
        limit: filtros.limit || 50,
        total: multasProcessadas.length,
        totalPages: Math.ceil(multasProcessadas.length / (filtros.limit || 50))
      },
      resumo: metadata.resumo,
      analytics: metadata.analytics,
      cache: {
        fromCache: false,
        fonte: 'api',
        tempoConsulta: 0,
        hitRate: legalCache.getHitRate()
      }
    };

    return processedResponse;
  }

  /**
   * Cacheia resposta
   */
  private cacheResponse(
    filtros: MultaFiltros,
    endpoint: string,
    response: MultaResposta
  ): void {
    try {
      const cacheKey = createMultasKey({ ...filtros, endpoint });
      const ttl = this.calculateCacheTTL(filtros);
      
      legalCache.set(cacheKey, response, ttl, endpoint);
      
    } catch (error) {
      console.warn('⚠️ [MULTAS] Erro ao cachear resposta:', error);
    }
  }

  /**
   * Calcula TTL do cache baseado no tipo de dados
   */
  private calculateCacheTTL(filtros: MultaFiltros): number {
    if (filtros.incluirAnalytics) return CacheTTL.ANALYTICS;
    if (filtros.incluirHistoricoSetor) return CacheTTL.SETORES;
    return CacheTTL.MULTAS;
  }

  /**
   * Obtém MIME type por formato
   */
  private getMimeType(formato: string): string {
    const mimeTypes: Record<string, string> = {
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'pdf': 'application/pdf'
    };
    
    return mimeTypes[formato] || 'application/octet-stream';
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
    
    return new Error('Erro inesperado ao processar solicitação');
  }

  // =========================================================================
  // MÉTODOS DE CACHE
  // =========================================================================

  /**
   * Limpa cache de multas
   */
  limparCache(): void {
    legalCache.deleteByPattern('^multas:');
    console.log('🧹 [MULTAS] Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  obterEstatisticasCache() {
    return legalCache.getStats();
  }
}

// =========================================================================
// INSTÂNCIA SINGLETON
// =========================================================================

export const multasService = new MultasService();
export default multasService;