// apps/frontend/src/services/departments/legal/hooks/useMultas.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Multa,
  MultaFiltros,
  MultaResposta,
  AnalyticsMultas,
  ResumoMultas,
  EstrategiaCache
} from '../types';
import { multasService } from '../core/multasService';
import { agentesService } from '../core/agentesService';
import { syncService } from '../core/syncService';

// =========================================================================
// INTERFACES DO HOOK
// =========================================================================

export interface UseMultasConfig {
  // Configurações de dados
  incluirSetores?: boolean;
  incluirAnalytics?: boolean;
  incluirEstatisticas?: boolean;
  
  // Configurações de cache
  estrategiaCache?: EstrategiaCache;
  forcarAtualizacao?: boolean;
  
  // Configurações de carregamento
  carregarAutomaticamente?: boolean;
  intervaloAtualizacao?: number; // em ms
  
  // Filtros iniciais
  filtrosIniciais?: Partial<MultaFiltros>;
}

export interface UseMultasReturn {
  // Dados principais
  multas: Multa[];
  loading: boolean;
  error: string | null;
  
  // Dados processados
  analytics: AnalyticsMultas | null;
  resumo: ResumoMultas | null;
  
  // Paginação
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  
  // Filtros
  filtros: MultaFiltros;
  
  // Ações
  buscar: (novosFiltros?: Partial<MultaFiltros>) => Promise<void>;
  recarregar: () => Promise<void>;
  limparFiltros: () => void;
  aplicarFiltros: (novosFiltros: Partial<MultaFiltros>) => void;
  
  // Paginação
  proximaPagina: () => Promise<void>;
  paginaAnterior: () => Promise<void>;
  irParaPagina: (pagina: number) => Promise<void>;
  
  // Busca específica
  buscarPorNumero: (numero: string) => Promise<Multa | null>;
  
  // Exportação
  exportar: (formato?: 'xlsx' | 'csv' | 'pdf') => Promise<void>;
  
  // Sincronização
  sincronizar: (dataInicio?: string, dataFim?: string) => Promise<void>;
  
  // Cache
  limparCache: () => void;
  obterEstatisticasCache: () => any;
  
  // Estados auxiliares
  sincronizando: boolean;
  exportando: boolean;
}

// =========================================================================
// HOOK PRINCIPAL
// =========================================================================

export function useMultas(config: UseMultasConfig = {}): UseMultasReturn {
  // ✅ Configuração padrão
  const {
    incluirSetores = false,
    incluirAnalytics = false,
    incluirEstatisticas = false,
    estrategiaCache = 'HYBRID',
    forcarAtualizacao = false,
    carregarAutomaticamente = true,
    intervaloAtualizacao,
    filtrosIniciais = {}
  } = config;

  // ✅ Estados principais
  const [multas, setMultas] = useState<Multa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsMultas | null>(null);
  const [resumo, setResumo] = useState<ResumoMultas | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  // ✅ Estados auxiliares
  const [sincronizando, setSincronizando] = useState(false);
  const [exportando, setExportando] = useState(false);

  // ✅ Filtros com valores padrão
  const [filtros, setFiltros] = useState<MultaFiltros>(() => ({
    page: 1,
    limit: 50,
    orderBy: 'dataEmissaoMulta',
    orderDirection: 'DESC',
    estrategia: estrategiaCache,
    incluirHistoricoSetor: incluirSetores,
    incluirAnalytics: incluirAnalytics,
    incluirEstatisticas: incluirEstatisticas,
    forcarAtualizacao: forcarAtualizacao,
    ...filtrosIniciais
  }));

  // =========================================================================
  // FUNÇÃO PRINCIPAL DE BUSCA
  // =========================================================================

  const buscar = useCallback(async (novosFiltros?: Partial<MultaFiltros>) => {
    try {
      setLoading(true);
      setError(null);

      // Mesclar filtros
      const filtrosFinais = novosFiltros ? { ...filtros, ...novosFiltros } : filtros;
      
      console.log('🔍 [useMultas] Buscando multas:', filtrosFinais);

      // Buscar dados
      const response = await multasService.buscarMultas(filtrosFinais);

      if (response.success) {
        setMultas(response.data);
        setAnalytics(response.analytics || null);
        setResumo(response.resumo || null);
        
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          hasMore: response.pagination.page < response.pagination.totalPages
        });

        // Atualizar filtros se foram alterados
        if (novosFiltros) {
          setFiltros(filtrosFinais);
        }

        console.log('✅ [useMultas] Dados carregados:', {
          multas: response.data.length,
          total: response.pagination.total,
          analytics: !!response.analytics,
          cache: response.cache?.fonte
        });
      } else {
        throw new Error(response.message || 'Erro ao buscar multas');
      }

    } catch (err: any) {
      console.error('❌ [useMultas] Erro ao buscar multas:', err);
      setError(err.message || 'Erro inesperado ao carregar multas');
      setMultas([]);
      setAnalytics(null);
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // =========================================================================
  // AÇÕES DE CONTROLE
  // =========================================================================

  const recarregar = useCallback(async () => {
    console.log('🔄 [useMultas] Recarregando dados...');
    await buscar({ forcarAtualizacao: true });
  }, [buscar]);

  const limparFiltros = useCallback(() => {
    console.log('🧹 [useMultas] Limpando filtros...');
    const filtrosLimpos: MultaFiltros = {
      page: 1,
      limit: 50,
      orderBy: 'dataEmissaoMulta',
      orderDirection: 'DESC',
      estrategia: estrategiaCache,
      incluirHistoricoSetor: incluirSetores,
      incluirAnalytics: incluirAnalytics,
      incluirEstatisticas: incluirEstatisticas
    };
    setFiltros(filtrosLimpos);
  }, [estrategiaCache, incluirSetores, incluirAnalytics, incluirEstatisticas]);

  const aplicarFiltros = useCallback((novosFiltros: Partial<MultaFiltros>) => {
    console.log('🎯 [useMultas] Aplicando filtros:', novosFiltros);
    buscar({ ...novosFiltros, page: 1 }); // Reset para primeira página
  }, [buscar]);

  // =========================================================================
  // AÇÕES DE PAGINAÇÃO
  // =========================================================================

  const proximaPagina = useCallback(async () => {
    if (!pagination.hasMore) return;
    
    console.log('➡️ [useMultas] Próxima página:', pagination.page + 1);
    await buscar({ page: pagination.page + 1 });
  }, [buscar, pagination.hasMore, pagination.page]);

  const paginaAnterior = useCallback(async () => {
    if (pagination.page <= 1) return;
    
    console.log('⬅️ [useMultas] Página anterior:', pagination.page - 1);
    await buscar({ page: pagination.page - 1 });
  }, [buscar, pagination.page]);

  const irParaPagina = useCallback(async (pagina: number) => {
    if (pagina < 1 || pagina > pagination.totalPages) return;
    
    console.log('🎯 [useMultas] Indo para página:', pagina);
    await buscar({ page: pagina });
  }, [buscar, pagination.totalPages]);

  // =========================================================================
  // AÇÕES ESPECÍFICAS
  // =========================================================================

  const buscarPorNumero = useCallback(async (numero: string): Promise<Multa | null> => {
    console.log('🔍 [useMultas] Buscando multa por número:', numero);
    
    try {
      return await multasService.buscarPorNumero(numero);
    } catch (err: any) {
      console.error('❌ [useMultas] Erro ao buscar multa por número:', err);
      setError(err.message || 'Erro ao buscar multa específica');
      return null;
    }
  }, []);

  const exportar = useCallback(async (formato: 'xlsx' | 'csv' | 'pdf' = 'xlsx') => {
    console.log('📤 [useMultas] Exportando:', formato);
    
    try {
      setExportando(true);
      await multasService.exportar(filtros, formato);
      console.log('✅ [useMultas] Exportação concluída');
    } catch (err: any) {
      console.error('❌ [useMultas] Erro na exportação:', err);
      setError(err.message || 'Erro ao exportar dados');
    } finally {
      setExportando(false);
    }
  }, [filtros]);

  const sincronizar = useCallback(async (dataInicio?: string, dataFim?: string) => {
    console.log('🔄 [useMultas] Sincronizando:', { dataInicio, dataFim });
    
    try {
      setSincronizando(true);
      await syncService.sincronizarMultas({ dataInicio, dataFim });
      
      // Recarregar dados após sincronização
      await recarregar();
      
      console.log('✅ [useMultas] Sincronização concluída');
    } catch (err: any) {
      console.error('❌ [useMultas] Erro na sincronização:', err);
      setError(err.message || 'Erro na sincronização');
    } finally {
      setSincronizando(false);
    }
  }, [recarregar]);

  // =========================================================================
  // AÇÕES DE CACHE
  // =========================================================================

  const limparCache = useCallback(() => {
    console.log('🧹 [useMultas] Limpando cache...');
    multasService.limparCache();
  }, []);

  const obterEstatisticasCache = useCallback(() => {
    return multasService.obterEstatisticasCache();
  }, []);

  // =========================================================================
  // EFEITOS
  // =========================================================================

  // Carregamento inicial
  useEffect(() => {
    if (carregarAutomaticamente) {
      console.log('🚀 [useMultas] Carregamento inicial...');
      buscar();
    }
  }, []); // Apenas na montagem

  // Atualização automática
  useEffect(() => {
    if (!intervaloAtualizacao) return;

    console.log('⏰ [useMultas] Configurando atualização automática:', intervaloAtualizacao, 'ms');
    
    const interval = setInterval(() => {
      console.log('🔄 [useMultas] Atualização automática...');
      buscar({ forcarAtualizacao: true });
    }, intervaloAtualizacao);

    return () => {
      console.log('🛑 [useMultas] Parando atualização automática');
      clearInterval(interval);
    };
  }, [intervaloAtualizacao, buscar]);

  // =========================================================================
  // VALORES COMPUTADOS
  // =========================================================================

  const dadosComputados = useMemo(() => {
    return {
      temDados: multas.length > 0,
      totalCarregado: multas.length,
      percentualCarregado: pagination.total > 0 ? (multas.length / pagination.total) * 100 : 0,
      temMaisPaginas: pagination.hasMore,
      paginaAtual: pagination.page,
      totalPaginas: pagination.totalPages
    };
  }, [multas.length, pagination]);

  // =========================================================================
  // RETORNO DO HOOK
  // =========================================================================

  return {
    // Dados principais
    multas,
    loading,
    error,
    
    // Dados processados
    analytics,
    resumo,
    
    // Paginação
    pagination: {
      ...pagination,
      hasMore: dadosComputados.temMaisPaginas
    },
    
    // Filtros
    filtros,
    
    // Ações principais
    buscar,
    recarregar,
    limparFiltros,
    aplicarFiltros,
    
    // Paginação
    proximaPagina,
    paginaAnterior,
    irParaPagina,
    
    // Busca específica
    buscarPorNumero,
    
    // Exportação
    exportar,
    
    // Sincronização
    sincronizar,
    
    // Cache
    limparCache,
    obterEstatisticasCache,
    
    // Estados auxiliares
    sincronizando,
    exportando
  };
}

// =========================================================================
// HOOK SIMPLIFICADO PARA CASOS COMUNS
// =========================================================================

/**
 * Hook simplificado para busca básica de multas
 */
export function useMultasSimples(filtrosIniciais?: Partial<MultaFiltros>) {
  return useMultas({
    carregarAutomaticamente: true,
    filtrosIniciais
  });
}

/**
 * Hook para multas com analytics
 */
export function useMultasComAnalytics(filtrosIniciais?: Partial<MultaFiltros>) {
  return useMultas({
    incluirAnalytics: true,
    incluirEstatisticas: true,
    carregarAutomaticamente: true,
    filtrosIniciais
  });
}

/**
 * Hook para multas com dados de setor
 */
export function useMultasComSetor(filtrosIniciais?: Partial<MultaFiltros>) {
  return useMultas({
    incluirSetores: true,
    carregarAutomaticamente: true,
    filtrosIniciais
  });
}

/**
 * Hook completo com todos os dados
 */
export function useMultasCompleto(filtrosIniciais?: Partial<MultaFiltros>) {
  return useMultas({
    incluirSetores: true,
    incluirAnalytics: true,
    incluirEstatisticas: true,
    carregarAutomaticamente: true,
    filtrosIniciais
  });
}