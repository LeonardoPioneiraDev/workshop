// apps/frontend/src/services/departments/legal/hooks/useMultasCompletas.ts - AJUSTADO E COMPLETO

import { useState, useEffect, useCallback } from 'react';
import { multasCompletasService, MultaCompletaFilter, MultaCompletaResponse, SyncResult, CacheStats } from '../multasCompletasService';

// =========================================================================
// INTERFACE DE FILTROS DO FRONTEND E FUNÇÃO DE MAPEAMENTO
// =========================================================================

/**
 * Interface que representa os filtros como são usados no frontend.
 * Contém nomes de campos que podem precisar ser mapeados para o backend
 * e permite valores vazios que serão limpos.
 */
export interface FrontendMultaFilters {
  dataInicio?: string;
  dataFim?: string;
  prefixoVeic?: string;
  numeroAiMulta?: string;
  codigoVeic?: string;
  codigoInfra?: string;
  agenteCodigo?: string; // Campo já compatível com backend, mantido por consistência
  agenteSemob?: string; // Nome do filtro no frontend que mapeia para agenteCodigo
  grupoInfracao?: string; // Campo já compatível com backend, mantido por consistência
  tipoInfracao?: string; // Nome do filtro no frontend que mapeia para grupoInfracao
  localMulta?: string;
  busca?: string;
  situacao?: string;
  page?: number;
  limit?: number; // Nome do campo esperado pelo backend
  limite?: number; // Nome do campo usado no frontend que mapeia para 'limit'
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  groupBy?: 'agente' | 'veiculo' | 'infracao' | 'mes' | 'dia';
}

/**
 * Função utilitária para limpar filtros (remover strings vazias, null, undefined)
 * e mapear nomes de campos do frontend para os nomes esperados pelo backend.
 * Garante que apenas parâmetros válidos e corretamente nomeados sejam enviados.
 * @param frontendFilters Objeto de filtros do frontend.
 * @returns Objeto de filtros limpo e mapeado para o backend.
 */
export const cleanAndMapMultasFilters = (frontendFilters: FrontendMultaFilters): MultaCompletaFilter => {
  const cleanedBackendFilters: MultaCompletaFilter = {};

  for (const key in frontendFilters) {
    if (Object.prototype.hasOwnProperty.call(frontendFilters, key)) {
      const value = (frontendFilters as any)[key];

      // Remove valores vazios, nulos ou indefinidos
      if (value === '' || value === null || value === undefined) {
        continue;
      }

      // Mapeia nomes de campos específicos do frontend para o backend
      switch (key) {
        case 'agenteSemob':
          cleanedBackendFilters.agenteCodigo = value;
          break;
        case 'tipoInfracao':
          cleanedBackendFilters.grupoInfracao = value;
          break;
        case 'limite': // 'limite' (frontend) -> 'limit' (backend)
          cleanedBackendFilters.limit = value;
          break;
        // Campos que já são compatíveis ou que devem ser passados diretamente
        case 'dataInicio':
        case 'dataFim':
        case 'prefixoVeic':
        case 'numeroAiMulta':
        case 'codigoVeic':
        case 'codigoInfra':
        case 'agenteCodigo': // Já compatível
        case 'grupoInfracao': // Já compatível
        case 'localMulta':
        case 'busca':
        case 'situacao':
        case 'page':
        case 'limit': // Se o frontend já passa 'limit' diretamente (sem o 'e')
        case 'orderBy':
        case 'orderDirection':
        case 'groupBy':
          (cleanedBackendFilters as any)[key] = value;
          break;
        default:
          // Ignora qualquer outro campo não mapeado/conhecido para evitar erros no backend
          // ou, se desejar, pode passar diretamente: (cleanedBackendFilters as any)[key] = value;
          break;
      }
    }
  }
  return cleanedBackendFilters;
};

// =========================================================================
// HOOK PRINCIPAL: useMultasCompletas
// =========================================================================

export function useMultasCompletas(initialFilters: FrontendMultaFilters = {}) {
  // Define filtros padrão para o ano atual, 50 itens por página
  const getDefaultFilters = useCallback(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // 1º de janeiro do ano atual
    const endOfYear = new Date(now.getFullYear(), 11, 31); // 31 de dezembro do ano atual

    return {
      dataInicio: startOfYear.toISOString().split('T')[0], // YYYY-MM-DD
      dataFim: endOfYear.toISOString().split('T')[0],     // YYYY-MM-DD
      limite: 50, // Usando 'limite' (frontend) aqui
      page: 1,
      orderBy: 'dataEmissaoMulta',
      orderDirection: 'DESC' as const,
      ...initialFilters // Sobrescreve com filtros iniciais passados
    };
  }, [initialFilters]); // Depende dos filtros iniciais passados

  const [filters, setFilters] = useState<FrontendMultaFilters>(getDefaultFilters);
  const [data, setData] = useState<MultaCompletaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os dados, recebendo os filtros atuais
  const fetchData = useCallback(async (currentFilters: FrontendMultaFilters) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Usa a função de limpeza e mapeamento antes de chamar o serviço
      const backendFilters = cleanAndMapMultasFilters(currentFilters);
      
      console.log('🔍 Buscando multas completas com filtros (Backend):', backendFilters);
      const response = await multasCompletasService.buscarMultasCompletas(backendFilters);
      
      console.log('✅ Resposta recebida:', response);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar multas completas';
      setError(errorMessage);
      console.error('❌ Erro ao buscar multas completas:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, []); // Sem dependências internas, pois 'filters' é passado como argumento quando necessário

  // Função para atualizar os filtros e disparar uma nova busca
  const updateFilters = useCallback((newFilters: Partial<FrontendMultaFilters>) => {
    setFilters(prevFilters => {
      const updated = { ...prevFilters, ...newFilters };
      // Dispara a busca imediatamente com os filtros atualizados
      fetchData(updated); 
      return updated;
    });
  }, [fetchData]);

  // Função para refetch manual dos dados
  const refetch = useCallback(() => {
    fetchData(filters); // Refetch com os filtros atualmente no estado
  }, [fetchData, filters]);

  // Efeito para a busca inicial quando o componente monta ou filtros padrão mudam
  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]); // Garante que a busca inicial aconteça ou quando os filtros mudam

  return {
    data,
    loading,
    error,
    filters, // Expõe os filtros atuais (do frontend)
    updateFilters,
    refetch,
    // setFilters não é exposto diretamente para forçar o uso de updateFilters e garantir a re-busca
  };
}

// =========================================================================
// HOOKS COMPLEMENTARES (ajustados para usar a função de mapeamento se necessário)
// =========================================================================

export function useMultaCompletaSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const sincronizar = useCallback(async (dataInicio?: string, dataFim?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Ajuste para permitir que dataInicio e dataFim sejam undefined para o backend se não informados
      const inicio = dataInicio || undefined; 
      const fim = dataFim || undefined;
      
      console.log('�� Sincronizando período:', { inicio, fim });
      const response = await multasCompletasService.sincronizarManual(inicio, fim);
      setResult(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro na sincronização';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-lança o erro para ser capturado no componente chamador
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sincronizar,
    loading,
    error,
    result
  };
}

export function useMultaCompletaCache() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await multasCompletasService.obterEstatisticasCache();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao obter estatísticas');
      console.error('❌ Erro ao obter estatísticas do cache:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const limparCache = useCallback(async (diasAntigos: number = 90) => {
    setLoading(true);
    setError(null);

    try {
      const response = await multasCompletasService.limparCacheAntigo(diasAntigos);
      await fetchStats(); // Atualiza as estatísticas após a limpeza
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao limpar cache';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-lança o erro para ser capturado no componente chamador
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats(); // Busca estatísticas ao montar o componente
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    limparCache
  };
}

export function useMultaCompletaDashboard(initialFilters: FrontendMultaFilters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FrontendMultaFilters>(initialFilters);

  const fetchDashboard = useCallback(async (currentFilters: FrontendMultaFilters) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Usa a função de limpeza e mapeamento antes de chamar o serviço
      const backendFilters = cleanAndMapMultasFilters(currentFilters);
      
      const response = await multasCompletasService.obterDashboardResumo(backendFilters);
      setData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao obter dashboard';
      setError(errorMessage);
      console.error('❌ Erro ao obter dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar os filtros do dashboard e disparar uma nova busca
  const updateFilters = useCallback((newFilters: Partial<FrontendMultaFilters>) => {
    setFilters(prevFilters => {
      const updated = { ...prevFilters, ...newFilters };
      fetchDashboard(updated); // Dispara a busca imediatamente
      return updated;
    });
  }, [fetchDashboard]);

  // Efeito para a busca inicial do dashboard
  useEffect(() => {
    fetchDashboard(filters);
  }, [fetchDashboard, filters]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refetch: () => fetchDashboard(filters) // Expõe refetch para uso externo
  };
}