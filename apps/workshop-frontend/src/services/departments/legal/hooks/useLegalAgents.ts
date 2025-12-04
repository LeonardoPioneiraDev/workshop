// apps/frontend/src/services/departments/legal/hooks/useLegalAgents.ts
import { api } from '@/services/api';
import { useState, useEffect, useCallback } from 'react';

interface Agent {
  cod_agente_autuador: number;
  desc_agente_autuador: string;
  matriculafiscal: string;
  totalMultas?: number;
  valorTotalMultas?: number;
  valorMedioMultas?: number;
  ultimaMulta?: string;
  origem_dados?: string;
}

interface AgentFilters {
  cod_agente_autuador?: number;
  desc_agente_autuador?: string;
  matriculafiscal?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID' | 'CACHE_ONLY';
  forcarOracle?: boolean;
  ttlHoras?: number;
}

interface AgentStats {
  totalAgentes: number;
  agentesAtivos: number;
  agentesInativos: number;
  agentesComMultas: number;
  totalMultasEmitidas: number;
  valorTotalMultas: number;
  mediaMultasPorAgente: number;
  eficienciaGeral?: number;
  crescimentoPeriodo?: number;
  produtividadeMedia?: number;
}

interface CacheStatus {
  totalRegistros: number;
  registrosValidos: number;
  registrosExpirados: number;
  hitRate: number;
  ultimaAtualizacao: string;
  recomendacoes: string[];
}

interface AgentsData {
  agents: Agent[];
  stats: AgentStats | null;
  cacheStatus: CacheStatus | null;
  topAgents: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  cache: {
    fromCache: boolean;
    fonte: string;
    tempoConsulta: number;
    ttlRestante?: number;
  };
}

export function useLegalAgents() {
  const [data, setData] = useState<AgentsData>({
    agents: [],
    stats: null,
    cacheStatus: null,
    topAgents: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0
    },
    cache: {
      fromCache: false,
      fonte: 'UNKNOWN',
      tempoConsulta: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AgentFilters>({
    page: 1,
    limit: 50,
    orderBy: 'desc_agente_autuador',
    orderDirection: 'ASC',
    estrategia: 'HYBRID'
  });

  // ✅ FUNÇÃO PARA FAZER REQUISIÇÕES COM TOKEN
  const makeRequest = useCallback(async (path: string) => {\n    return api.get<any>(path);\n  }, []);;

  // ✅ BUSCAR AGENTES
  const fetchAgents = useCallback(async (newFilters?: Partial<AgentFilters>) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = { ...filters, ...newFilters };
      
      // Construir query string
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      console.log('🔍 [AGENTS] Buscando agentes com filtros:', currentFilters);

      const response = await makeRequest(`/juridico/agentes?${queryParams.toString()}`);
      
      console.log('✅ [AGENTS] Dados recebidos:', response);

      if (response.success && response.data) {
        setData(prev => ({
          ...prev,
          agents: response.data,
          pagination: response.pagination || prev.pagination,
          cache: response.cache || prev.cache
        }));
      }

      setFilters(currentFilters);

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao buscar agentes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, makeRequest]);

  // ✅ BUSCAR ESTATÍSTICAS
  const fetchStats = useCallback(async () => {
    try {
      console.log('📊 [AGENTS] Buscando estatísticas...');
      
      const response = await makeRequest('/juridico/agentes/stats/geral?estrategia=HYBRID');
      
      if (response.success && response.data) {
        setData(prev => ({
          ...prev,
          stats: response.data
        }));
      }

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao buscar estatísticas:', err);
    }
  }, [makeRequest]);

  // ✅ BUSCAR TOP AGENTES
  const fetchTopAgents = useCallback(async (limit: number = 10) => {
    try {
      console.log('🏆 [AGENTS] Buscando top agentes...');
      
      const response = await makeRequest(`/juridico/agentes/stats/top-agentes?limit=${limit}&estrategia=ORACLE_FIRST`);
      
      if (response.success && response.data) {
        setData(prev => ({
          ...prev,
          topAgents: response.data
        }));
      }

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao buscar top agentes:', err);
    }
  }, [makeRequest]);

  // ✅ BUSCAR STATUS DO CACHE
  const fetchCacheStatus = useCallback(async () => {
    try {
      console.log('💾 [AGENTS] Buscando status do cache...');
      
      const response = await makeRequest('/juridico/agentes/cache/status');
      
      if (response.success && response.data) {
        setData(prev => ({
          ...prev,
          cacheStatus: response.data
        }));
      }

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao buscar status do cache:', err);
    }
  }, [makeRequest]);

  // ✅ SINCRONIZAR CACHE
  const syncCache = useCallback(async (cod_agente_autuador?: number) => {
    try {
      setLoading(true);
      console.log('🔄 [AGENTS] Sincronizando cache...');
      
      const url = cod_agente_autuador 
        ? `/juridico/agentes/cache/sincronizar?cod_agente_autuador=${cod_agente_autuador}`
        : '/juridico/agentes/cache/sincronizar';
      
      const response = await makeRequest(url, { method: 'POST' });
      
      if (response.success) {
        console.log('✅ [AGENTS] Cache sincronizado:', response.data);
        // Recarregar dados após sincronização
        await Promise.all([
          fetchAgents(),
          fetchCacheStatus(),
          fetchStats()
        ]);
        return response.data;
      }

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao sincronizar cache:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchAgents, fetchCacheStatus, fetchStats]);

  // ✅ LIMPAR CACHE
  const clearCache = useCallback(async (ttlHoras: number = 168) => {
    try {
      setLoading(true);
      console.log('🧹 [AGENTS] Limpando cache...');
      
      const response = await makeRequest(`/juridico/agentes/cache/limpar?ttlHoras=${ttlHoras}`, { 
        method: 'DELETE' 
      });
      
      if (response.success) {
        console.log('✅ [AGENTS] Cache limpo:', response.data);
        await fetchCacheStatus();
        return response.data;
      }

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao limpar cache:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, fetchCacheStatus]);

  // ✅ BUSCAR AGENTE POR CÓDIGO
  const fetchAgentById = useCallback(async (cod_agente_autuador: number, estrategia: string = 'HYBRID') => {
    try {
      setLoading(true);
      console.log(`🔍 [AGENTS] Buscando agente ${cod_agente_autuador}...`);
      
      const response = await makeRequest(`/juridico/agentes/codigo/${cod_agente_autuador}?estrategia=${estrategia}`);
      
      if (response.success && response.data) {
        console.log('✅ [AGENTS] Agente encontrado:', response.data);
        return response.data;
      }

    } catch (err: any) {
      console.error('❌ [AGENTS] Erro ao buscar agente:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // ✅ APLICAR FILTROS
  const applyFilters = useCallback((newFilters: Partial<AgentFilters>) => {
    fetchAgents(newFilters);
  }, [fetchAgents]);

  // ✅ LIMPAR FILTROS
  const clearFilters = useCallback(() => {
    const defaultFilters: AgentFilters = {
      page: 1,
      limit: 50,
      orderBy: 'desc_agente_autuador',
      orderDirection: 'ASC',
      estrategia: 'HYBRID'
    };
    fetchAgents(defaultFilters);
  }, [fetchAgents]);

  // ✅ RECARREGAR TUDO
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchAgents(),
      fetchStats(),
      fetchTopAgents(),
      fetchCacheStatus()
    ]);
  }, [fetchAgents, fetchStats, fetchTopAgents, fetchCacheStatus]);

  // ✅ CARREGAR DADOS INICIAIS
  useEffect(() => {
    refetch();
  }, []);

  return {
    data,
    loading,
    error,
    filters,
    
    // Ações
    fetchAgents,
    fetchStats,
    fetchTopAgents,
    fetchCacheStatus,
    fetchAgentById,
    syncCache,
    clearCache,
    applyFilters,
    clearFilters,
    refetch,
    
    // Helpers
    hasMore: data.pagination.page < data.pagination.totalPages,
    currentPage: data.pagination.page,
    totalPages: data.pagination.totalPages,
    totalAgents: data.pagination.total
  };
}

