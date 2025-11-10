// apps/frontend/src/services/departments/legal/hooks/useDashboard.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  dashboardService, 
  DashboardFiltros, 
  DashboardResposta 
} from '../core/dashboardService';

// =========================================================================
// INTERFACES DO HOOK
// =========================================================================

export interface UseDashboardConfig {
  // Configurações de carregamento
  carregarAutomaticamente?: boolean;
  incluirComparacao?: boolean;
  incluirPrevisoes?: boolean;
  
  // Configurações de atualização
  intervaloAtualizacao?: number; // em ms
  atualizacaoTempoReal?: boolean;
  
  // Filtros iniciais
  filtrosIniciais?: Partial<DashboardFiltros>;
}

export interface UseDashboardReturn {
  // Dados principais
  dashboard: DashboardJuridico | null;
  loading: boolean;
  error: string | null;
  
  // Dados específicos
  resumoExecutivo: ResumoExecutivo | null;
  kpis: KPI[];
  alertas: Alerta[];
  rankings: Rankings | null;
  evolucaoTemporal: EvolucaoTemporal | null;
  distribuicoes: Distribuicoes | null;
  metas: Meta[];
  
  // Metadados
  ultimaAtualizacao: string | null;
  proximaAtualizacao: string | null;
  fonteDados: string;
  
  // Filtros
  filtros: DashboardFiltros;
  
  // Ações
  recarregar: () => Promise<void>;
  atualizarFiltros: (novosFiltros: Partial<DashboardFiltros>) => Promise<void>;
  obterComparacao: (periodoAnterior: { inicio: string; fim: string }) => Promise<any>;
  obterPrevisoes: (tipo: 'MULTAS' | 'VALOR' | 'ARRECADACAO', dias?: number) => Promise<any>;
  
  // Cache
  limparCache: () => void;
  atualizarForcado: () => Promise<void>;
  
  // Estados auxiliares
  carregandoComparacao: boolean;
  carregandoPrevisoes: boolean;
}

// =========================================================================
// HOOK PRINCIPAL DE DASHBOARD
// =========================================================================

export function useDashboard(config: UseDashboardConfig = {}): UseDashboardReturn {
  // ✅ Configuração padrão
  const {
    carregarAutomaticamente = true,
    incluirComparacao = false,
    incluirPrevisoes = false,
    intervaloAtualizacao = 5 * 60 * 1000, // 5 minutos
    atualizacaoTempoReal = false,
    filtrosIniciais = {}
  } = config;

  // ✅ Estados principais
  const [dashboard, setDashboard] = useState<DashboardJuridico | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Estados específicos
  const [resumoExecutivo, setResumoExecutivo] = useState<ResumoExecutivo | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [rankings, setRankings] = useState<Rankings | null>(null);
  const [evolucaoTemporal, setEvolucaoTemporal] = useState<EvolucaoTemporal | null>(null);
  const [distribuicoes, setDistribuicoes] = useState<Distribuicoes | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  
  // ✅ Metadados
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [proximaAtualizacao, setProximaAtualizacao] = useState<string | null>(null);
  const [fonteDados, setFonteDados] = useState<string>('cache');
  
  // ✅ Estados auxiliares
  const [carregandoComparacao, setCarregandoComparacao] = useState(false);
  const [carregandoPrevisoes, setCarregandoPrevisoes] = useState(false);

  // ✅ Filtros
  const [filtros, setFiltros] = useState<DashboardFiltros>(() => ({
    periodo: 'MES',
    incluirComparacao: incluirComparacao,
    incluirPrevisoes: incluirPrevisoes,
    ...filtrosIniciais
  }));

  // =========================================================================
  // FUNÇÃO PRINCIPAL DE CARREGAMENTO
  // =========================================================================

  const carregarDashboard = useCallback(async (novosFiltros?: Partial<DashboardFiltros>) => {
    try {
      setLoading(true);
      setError(null);

      // Mesclar filtros
      const filtrosFinais = novosFiltros ? { ...filtros, ...novosFiltros } : filtros;
      
      console.log('📊 [useDashboard] Carregando dashboard:', filtrosFinais);

      // Buscar dados
      const response = await dashboardService.obterDashboard(filtrosFinais);

      if (response.success) {
        // Atualizar dados principais
        setDashboard(response.data);
        setResumoExecutivo(response.data.resumoExecutivo);
        setKpis(response.data.kpis);
        setAlertas(response.data.alertasCriticos);
        setRankings(response.data.rankings);
        setEvolucaoTemporal(response.data.evolucaoTemporal);
        setDistribuicoes(response.data.distribuicoes);
        setMetas(response.data.metas);
        
        // Atualizar metadados
        setUltimaAtualizacao(response.metadata.ultimaAtualizacao);
        setProximaAtualizacao(response.metadata.proximaAtualizacao);
        setFonteDados(response.metadata.fonteDados);

        // Atualizar filtros se foram alterados
        if (novosFiltros) {
          setFiltros(filtrosFinais);
        }

        console.log('✅ [useDashboard] Dashboard carregado:', {
          kpis: response.data.kpis.length,
          alertas: response.data.alertasCriticos.length,
          cache: response.cache.fonte
        });
      } else {
        throw new Error(response.message || 'Erro ao carregar dashboard');
      }

    } catch (err: any) {
      console.error('❌ [useDashboard] Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro inesperado ao carregar dashboard');
      
      // Limpar dados em caso de erro
      setDashboard(null);
      setResumoExecutivo(null);
      setKpis([]);
      setAlertas([]);
      setRankings(null);
      setEvolucaoTemporal(null);
      setDistribuicoes(null);
      setMetas([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // =========================================================================
  // AÇÕES PRINCIPAIS
  // =========================================================================

  const recarregar = useCallback(async () => {
    console.log('🔄 [useDashboard] Recarregando dashboard...');
    await carregarDashboard({ forcarAtualizacao: true });
  }, [carregarDashboard]);

  const atualizarFiltros = useCallback(async (novosFiltros: Partial<DashboardFiltros>) => {
    console.log('🎯 [useDashboard] Atualizando filtros:', novosFiltros);
    await carregarDashboard(novosFiltros);
  }, [carregarDashboard]);

  const atualizarForcado = useCallback(async () => {
    console.log('⚡ [useDashboard] Atualização forçada...');
    await dashboardService.atualizarForcado(filtros);
    await carregarDashboard();
  }, [filtros, carregarDashboard]);

  // =========================================================================
  // COMPARAÇÃO E PREVISÕES
  // =========================================================================

  const obterComparacao = useCallback(async (periodoAnterior: { inicio: string; fim: string }) => {
    console.log('📊 [useDashboard] Obtendo comparação:', periodoAnterior);
    
    try {
      setCarregandoComparacao(true);
      
      const periodoAtual = {
        inicio: filtros.dataInicio || new Date().toISOString().split('T')[0],
        fim: filtros.dataFim || new Date().toISOString().split('T')[0]
      };
      
      const comparacao = await dashboardService.obterComparacaoPeriodos(
        periodoAtual,
        periodoAnterior
      );
      
      console.log('✅ [useDashboard] Comparação obtida:', comparacao);
      return comparacao;
      
    } catch (err: any) {
      console.error('❌ [useDashboard] Erro ao obter comparação:', err);
      setError(err.message || 'Erro ao obter comparação');
      return null;
    } finally {
      setCarregandoComparacao(false);
    }
  }, [filtros.dataInicio, filtros.dataFim]);

  const obterPrevisoes = useCallback(async (
    tipo: 'MULTAS' | 'VALOR' | 'ARRECADACAO', 
    dias: number = 30
  ) => {
    console.log('🔮 [useDashboard] Obtendo previsões:', { tipo, dias });
    
    try {
      setCarregandoPrevisoes(true);
      
      const previsoes = await dashboardService.obterPrevisoes(tipo, dias);
      
      console.log('✅ [useDashboard] Previsões obtidas:', previsoes);
      return previsoes;
      
    } catch (err: any) {
      console.error('❌ [useDashboard] Erro ao obter previsões:', err);
      setError(err.message || 'Erro ao obter previsões');
      return null;
    } finally {
      setCarregandoPrevisoes(false);
    }
  }, []);

  // =========================================================================
  // CACHE
  // =========================================================================

  const limparCache = useCallback(() => {
    console.log('🧹 [useDashboard] Limpando cache...');
    dashboardService.limparCache();
  }, []);

  // =========================================================================
  // EFEITOS
  // =========================================================================

  // Carregamento inicial
  useEffect(() => {
    if (carregarAutomaticamente) {
      console.log('🚀 [useDashboard] Carregamento inicial...');
      carregarDashboard();
    }
  }, []); // Apenas na montagem

  // Atualização automática
  useEffect(() => {
    if (!atualizacaoTempoReal && !intervaloAtualizacao) return;

    const intervalo = atualizacaoTempoReal ? 30000 : intervaloAtualizacao; // 30s para tempo real
    
    console.log('⏰ [useDashboard] Configurando atualização automática:', intervalo, 'ms');
    
    const interval = setInterval(() => {
      console.log('🔄 [useDashboard] Atualização automática...');
      carregarDashboard({ forcarAtualizacao: atualizacaoTempoReal });
    }, intervalo);

    return () => {
      console.log('🛑 [useDashboard] Parando atualização automática');
      clearInterval(interval);
    };
  }, [atualizacaoTempoReal, intervaloAtualizacao, carregarDashboard]);

  // =========================================================================
  // VALORES COMPUTADOS
  // =========================================================================

  const dadosComputados = useMemo(() => {
    const agora = new Date();
    const ultimaAtualizacaoDate = ultimaAtualizacao ? new Date(ultimaAtualizacao) : null;
    const proximaAtualizacaoDate = proximaAtualizacao ? new Date(proximaAtualizacao) : null;
    
    return {
      temDados: !!dashboard,
      totalKpis: kpis.length,
      alertasCriticos: alertas.filter(a => a.prioridade === 'CRITICA').length,
      alertasAltos: alertas.filter(a => a.prioridade === 'ALTA').length,
      metasAtingidas: metas.filter(m => m.status === 'ATINGIDA').length,
      metasAtrasadas: metas.filter(m => m.status === 'ATRASADA').length,
      tempoUltimaAtualizacao: ultimaAtualizacaoDate ? 
        Math.floor((agora.getTime() - ultimaAtualizacaoDate.getTime()) / 1000 / 60) : null, // em minutos
      tempoProximaAtualizacao: proximaAtualizacaoDate ? 
        Math.floor((proximaAtualizacaoDate.getTime() - agora.getTime()) / 1000 / 60) : null, // em minutos
      dadosAtualizados: ultimaAtualizacaoDate ? 
        (agora.getTime() - ultimaAtualizacaoDate.getTime()) < 10 * 60 * 1000 : false // menos de 10 min
    };
  }, [dashboard, kpis, alertas, metas, ultimaAtualizacao, proximaAtualizacao]);

  // =========================================================================
  // RETORNO DO HOOK
  // =========================================================================

  return {
    // Dados principais
    dashboard,
    loading,
    error,
    
    // Dados específicos
    resumoExecutivo,
    kpis,
    alertas,
    rankings,
    evolucaoTemporal,
    distribuicoes,
    metas,
    
    // Metadados
    ultimaAtualizacao,
    proximaAtualizacao,
    fonteDados,
    
    // Filtros
    filtros,
    
    // Ações
    recarregar,
    atualizarFiltros,
    obterComparacao,
    obterPrevisoes,
    
    // Cache
    limparCache,
    atualizarForcado,
    
    // Estados auxiliares
    carregandoComparacao,
    carregandoPrevisoes
  };
}

// =========================================================================
// HOOKS SIMPLIFICADOS
// =========================================================================

/**
 * Hook para dashboard em tempo real
 */
export function useDashboardTempoReal(filtrosIniciais?: Partial<DashboardFiltros>) {
  return useDashboard({
    carregarAutomaticamente: true,
    atualizacaoTempoReal: true,
    filtrosIniciais
  });
}

/**
 * Hook para dashboard com comparação
 */
export function useDashboardComComparacao(filtrosIniciais?: Partial<DashboardFiltros>) {
  return useDashboard({
    carregarAutomaticamente: true,
    incluirComparacao: true,
    filtrosIniciais
  });
}

/**
 * Hook para dashboard completo
 */
export function useDashboardCompleto(filtrosIniciais?: Partial<DashboardFiltros>) {
  return useDashboard({
    carregarAutomaticamente: true,
    incluirComparacao: true,
    incluirPrevisoes: true,
    atualizacaoTempoReal: false,
    intervaloAtualizacao: 2 * 60 * 1000, // 2 minutos
    filtrosIniciais
  });
}

/**
 * Hook específico para KPIs
 */
export function useKPIs(filtrosIniciais?: Partial<DashboardFiltros>) {
  const { kpis, loading, error, recarregar } = useDashboard({
    carregarAutomaticamente: true,
    filtrosIniciais
  });

  return {
    kpis,
    loading,
    error,
    recarregar
  };
}

/**
 * Hook específico para alertas
 */
export function useAlertas(filtrosIniciais?: Partial<DashboardFiltros>) {
  const { alertas, loading, error, recarregar } = useDashboard({
    carregarAutomaticamente: true,
    filtrosIniciais
  });

  const alertasPorPrioridade = useMemo(() => {
    return {
      criticos: alertas.filter(a => a.prioridade === 'CRITICA'),
      altos: alertas.filter(a => a.prioridade === 'ALTA'),
      medios: alertas.filter(a => a.prioridade === 'MEDIA'),
      baixos: alertas.filter(a => a.prioridade === 'BAIXA')
    };
  }, [alertas]);

  return {
    alertas,
    alertasPorPrioridade,
    loading,
    error,
    recarregar
  };
}