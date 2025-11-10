// apps/frontend/src/services/departments/legal/hooks/useMultasInteligentes.ts - CORRIGIDO
import { useState, useEffect, useCallback, useMemo } from 'react';
import { multasCompletasService, BuscarMultasParams } from '../services/departments/legal/multasCompletasService';
import { MultaCompleta } from '../types/multa-completa';

export interface FiltrosMultasInteligentes {
  dataInicio?: string;
  dataFim?: string;
  tipoMulta?: 'TRANSITO' | 'SEMOB' | 'TODAS';
  agenteCodigo?: string;
  placaVeiculo?: string;
  localMulta?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}

export interface UseMultasInteligentesOptions {
  autoLoad?: boolean;
  pageSize?: number;
  filtrosIniciais?: FiltrosMultasInteligentes;
}

export function useMultasInteligentes(options: UseMultasInteligentesOptions = {}) {
  const {
    autoLoad = true,
    pageSize = 20, // ✅ REDUZIDO PARA EVITAR ERRO 400
    filtrosIniciais = {}
  } = options;

  // Estados principais
  const [multas, setMultas] = useState<MultaCompleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // ✅ FILTROS PADRÃO SEGUROS
  const [filtros, setFiltros] = useState<FiltrosMultasInteligentes>(() => {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    return {
      dataInicio: trintaDiasAtras.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
      tipoMulta: 'TODAS',
      ...filtrosIniciais
    };
  });

  // ✅ FUNÇÃO DE CARREGAMENTO SEGURA SEM includeAnalytics
  const carregarMultas = useCallback(async (novaPagina: number = 1, novosFiltros?: FiltrosMultasInteligentes) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🧠 [HOOK] Carregando multas inteligentes...');

      const filtrosAtivos = novosFiltros || filtros;
      
      // ✅ PARÂMETROS SEGUROS SEM includeAnalytics
      const params: BuscarMultasParams = {
        page: Math.max(1, novaPagina),
        limit: Math.min(pageSize, 50), // ✅ MÁXIMO 50
        orderBy: 'dataEmissaoMulta',
        orderDirection: 'DESC'
        // ✅ REMOVIDO includeAnalytics
      };

      // ✅ ADICIONAR FILTROS VALIDADOS
      if (filtrosAtivos.dataInicio) {
        params.dataInicio = filtrosAtivos.dataInicio;
      }
      
      if (filtrosAtivos.dataFim) {
        params.dataFim = filtrosAtivos.dataFim;
      }
      
      if (filtrosAtivos.tipoMulta && filtrosAtivos.tipoMulta !== 'TODAS') {
        params.tipoMulta = filtrosAtivos.tipoMulta;
      }
      
      if (filtrosAtivos.agenteCodigo?.trim()) {
        params.agenteCodigo = filtrosAtivos.agenteCodigo.trim();
      }
      
      if (filtrosAtivos.placaVeiculo?.trim()) {
        params.placaVeiculo = filtrosAtivos.placaVeiculo.trim();
      }
      
      if (filtrosAtivos.localMulta?.trim()) {
        params.localMulta = filtrosAtivos.localMulta.trim();
      }
      
      if (filtrosAtivos.valorMinimo !== undefined && filtrosAtivos.valorMinimo >= 0) {
        params.valorMinimo = filtrosAtivos.valorMinimo;
      }
      
      if (filtrosAtivos.valorMaximo !== undefined && filtrosAtivos.valorMaximo >= 0) {
        params.valorMaximo = filtrosAtivos.valorMaximo;
      }

      console.log('📋 Parâmetros seguros da requisição:', params);

      const response = await multasCompletasService.buscarMultasCompletas(params);

      console.log('✅ [HOOK] Dados carregados:', {
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        multasCount: response.data?.length || 0
      });

      // ✅ ATUALIZAR ESTADOS
      if (novaPagina === 1) {
        setMultas(response.data || []);
      } else {
        setMultas(prev => [...prev, ...(response.data || [])]);
      }

      setPage(response.pagination?.page || 1);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalRegistros(response.pagination?.total || 0);

    } catch (error: any) {
      console.error('❌ [HOOK] Erro ao carregar multas:', error);
      setError(error.message || 'Erro ao carregar dados das multas');
      
      if (novaPagina === 1) {
        setMultas([]);
        setTotalRegistros(0);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  }, [filtros, pageSize]);

  // ✅ FUNÇÃO PARA ATUALIZAR FILTROS
  const atualizarFiltros = useCallback((novosFiltros: Partial<FiltrosMultasInteligentes>) => {
    console.log('🔄 [HOOK] Atualizando filtros:', novosFiltros);
    
    setFiltros(prev => {
      const filtrosAtualizados = { ...prev, ...novosFiltros };
      
      // Validar datas
      if (filtrosAtualizados.dataInicio && filtrosAtualizados.dataFim) {
        const inicio = new Date(filtrosAtualizados.dataInicio);
        const fim = new Date(filtrosAtualizados.dataFim);
        
        if (inicio > fim) {
          console.warn('⚠️ Data início maior que data fim, ajustando...');
          filtrosAtualizados.dataFim = filtrosAtualizados.dataInicio;
        }
      }
      
      return filtrosAtualizados;
    });
    
    setPage(1);
  }, []);

  // ✅ FUNÇÃO PARA LIMPAR FILTROS
  const limparFiltros = useCallback(() => {
    console.log('🧹 [HOOK] Limpando filtros...');
    
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    const filtrosLimpos: FiltrosMultasInteligentes = {
      dataInicio: trintaDiasAtras.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
      tipoMulta: 'TODAS'
    };
    
    setFiltros(filtrosLimpos);
    setPage(1);
  }, []);

  // ✅ FUNÇÃO PARA RECARREGAR
  const recarregar = useCallback(() => {
    console.log('🔄 [HOOK] Recarregando dados...');
    carregarMultas(1, filtros);
  }, [carregarMultas, filtros]);

  // ✅ FUNÇÃO PARA CARREGAR MAIS DADOS
  const carregarMais = useCallback(() => {
    if (!loading && page < totalPages) {
      console.log('📄 [HOOK] Carregando próxima página:', page + 1);
      carregarMultas(page + 1);
    }
  }, [loading, page, totalPages, carregarMultas]);

  // ✅ EFEITO PARA CARREGAMENTO INICIAL
  useEffect(() => {
    if (autoLoad) {
      console.log('🚀 [HOOK] Carregamento inicial...');
      const timer = setTimeout(() => {
        carregarMultas(1);
      }, 100); // Pequeno delay para evitar múltiplas chamadas

      return () => clearTimeout(timer);
    }
  }, [autoLoad]);

  // ✅ EFEITO PARA RECARREGAR QUANDO FILTROS MUDAREM
  useEffect(() => {
    if (autoLoad) {
      console.log('🔄 [HOOK] Filtros alterados, recarregando...');
      const timer = setTimeout(() => {
        carregarMultas(1, filtros);
      }, 500); // Debounce maior

      return () => clearTimeout(timer);
    }
  }, [filtros, autoLoad]);

  // ✅ DADOS PROCESSADOS
  const dadosProcessados = useMemo(() => {
    const multasTransito = multas.filter(m => !m.agenteCodigo);
    const multasSemob = multas.filter(m => m.agenteCodigo);
    
    return {
      total: multas.length,
      transito: multasTransito.length,
      semob: multasSemob.length,
      valorTotal: multas.reduce((sum, m) => sum + (m.valorMulta || 0), 0),
      valorTransito: multasTransito.reduce((sum, m) => sum + (m.valorMulta || 0), 0),
      valorSemob: multasSemob.reduce((sum, m) => sum + (m.valorMulta || 0), 0)
    };
  }, [multas]);

  return {
    // Dados
    multas,
    dadosProcessados,
    
    // Paginação
    page,
    totalPages,
    totalRegistros,
    hasMore: page < totalPages,
    
    // Estados
    loading,
    error,
    
    // Filtros
    filtros,
    atualizarFiltros,
    limparFiltros,
    
    // Ações
    recarregar,
    carregarMais,
    carregarMultas: (novaPagina?: number) => carregarMultas(novaPagina || 1)
  };
}