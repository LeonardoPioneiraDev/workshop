// apps/frontend/src/services/departments/legal/hooks/useSync.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ResultadoSincronizacao, StatusSincronizacao } from '../types';
import { 
  syncService, 
  SyncFiltros, 
  SyncConfig, 
  SyncJob, 
  SyncMetrics 
} from '../core/syncService';

// =========================================================================
// INTERFACES DO HOOK
// =========================================================================

export interface UseSyncConfig {
  // Configurações de monitoramento
  monitorarAutomaticamente?: boolean;
  intervaloMonitoramento?: number; // em ms
  
  // Configurações de notificação
  notificarConclusao?: boolean;
  notificarErros?: boolean;
  
  // Configurações padrão
  configPadrao?: Partial<SyncConfig>;
}

export interface UseSyncReturn {
  // Status geral
  status: StatusSincronizacao | null;
  metrics: SyncMetrics | null;
  loading: boolean;
  error: string | null;
  
  // Jobs
  jobs: SyncJob[];
  jobAtivo: SyncJob | null;
  
  // Ações de sincronização
  sincronizarMultas: (filtros?: SyncFiltros, config?: Partial<SyncConfig>) => Promise<ResultadoSincronizacao | null>;
  sincronizarAgentes: (config?: Partial<SyncConfig>) => Promise<ResultadoSincronizacao | null>;
  sincronizarSetores: (config?: Partial<SyncConfig>) => Promise<ResultadoSincronizacao | null>;
  sincronizacaoCompleta: (filtros?: SyncFiltros, config?: Partial<SyncConfig>) => Promise<any>;
  
  // Controle de jobs
  cancelarJob: (jobId: string) => Promise<boolean>;
  obterJob: (jobId: string) => SyncJob | null;
  
  // Monitoramento
  iniciarMonitoramento: () => void;
  pararMonitoramento: () => void;
  atualizarStatus: () => Promise<void>;
  
  // Cache
  limparCacheMultas: () => void;
  limparCacheAgentes: () => void;
  limparTodoCache: () => void;
  
  // Estados auxiliares
  sincronizando: boolean;
  temJobAtivo: boolean;
  ultimaSincronizacao: string | null;
  proximaSincronizacao: string | null;
}

// =========================================================================
// HOOK PRINCIPAL DE SINCRONIZAÇÃO
// =========================================================================

export function useSync(config: UseSyncConfig = {}): UseSyncReturn {
  // ✅ Configuração padrão
  const {
    monitorarAutomaticamente = true,
    intervaloMonitoramento = 30000, // 30 segundos
    notificarConclusao = false,
    notificarErros = true,
    configPadrao = {}
  } = config;

  // ✅ Estados principais
  const [status, setStatus] = useState<StatusSincronizacao | null>(null);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  // =========================================================================
  // AÇÕES DE SINCRONIZAÇÃO
  // =========================================================================

  const sincronizarMultas = useCallback(async (
    filtros: SyncFiltros = {},
    config: Partial<SyncConfig> = {}
  ): Promise<ResultadoSincronizacao | null> => {
    console.log('🔄 [useSync] Sincronizando multas:', { filtros, config });
    
    try {
      setSincronizando(true);
      setError(null);
      
      const configFinal: Partial<SyncConfig> = {
        ...configPadrao,
        notificarConclusao,
        ...config
      };
      
      const resultado = await syncService.sincronizarMultas(filtros, configFinal);
      
      if (notificarConclusao) {
        console.log('✅ [useSync] Sincronização de multas concluída:', resultado);
        // Aqui você pode adicionar notificação toast/alert
      }
      
      // Atualizar jobs e status
      await atualizarDados();
      
      return resultado;
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro na sincronização de multas:', err);
      setError(err.message || 'Erro na sincronização de multas');
      
      if (notificarErros) {
        // Aqui você pode adicionar notificação de erro
      }
      
      return null;
    } finally {
      setSincronizando(false);
    }
  }, [configPadrao, notificarConclusao, notificarErros]);

  const sincronizarAgentes = useCallback(async (
    config: Partial<SyncConfig> = {}
  ): Promise<ResultadoSincronizacao | null> => {
    console.log('🔄 [useSync] Sincronizando agentes:', config);
    
    try {
      setSincronizando(true);
      setError(null);
      
      const configFinal: Partial<SyncConfig> = {
        ...configPadrao,
        notificarConclusao,
        ...config
      };
      
      const resultado = await syncService.sincronizarAgentes(configFinal);
      
      if (notificarConclusao) {
        console.log('✅ [useSync] Sincronização de agentes concluída:', resultado);
      }
      
      await atualizarDados();
      return resultado;
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro na sincronização de agentes:', err);
      setError(err.message || 'Erro na sincronização de agentes');
      
      if (notificarErros) {
        // Notificação de erro
      }
      
      return null;
    } finally {
      setSincronizando(false);
    }
  }, [configPadrao, notificarConclusao, notificarErros]);

  const sincronizarSetores = useCallback(async (
    config: Partial<SyncConfig> = {}
  ): Promise<ResultadoSincronizacao | null> => {
    console.log('🔄 [useSync] Sincronizando setores:', config);
    
    try {
      setSincronizando(true);
      setError(null);
      
      const configFinal: Partial<SyncConfig> = {
        ...configPadrao,
        notificarConclusao,
        ...config
      };
      
      const resultado = await syncService.sincronizarSetores(configFinal);
      
      if (notificarConclusao) {
        console.log('✅ [useSync] Sincronização de setores concluída:', resultado);
      }
      
      await atualizarDados();
      return resultado;
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro na sincronização de setores:', err);
      setError(err.message || 'Erro na sincronização de setores');
      
      if (notificarErros) {
        // Notificação de erro
      }
      
      return null;
    } finally {
      setSincronizando(false);
    }
  }, [configPadrao, notificarConclusao, notificarErros]);

  const sincronizacaoCompleta = useCallback(async (
    filtros: SyncFiltros = {},
    config: Partial<SyncConfig> = {}
  ) => {
    console.log('🔄 [useSync] Sincronização completa:', { filtros, config });
    
    try {
      setSincronizando(true);
      setError(null);
      
      const configFinal: Partial<SyncConfig> = {
        ...configPadrao,
        prioridade: 'ALTA',
        notificarConclusao: true,
        ...config
      };
      
      const resultado = await syncService.sincronizacaoCompleta(filtros, configFinal);
      
      console.log('✅ [useSync] Sincronização completa concluída:', resultado);
      
      if (notificarConclusao) {
        // Notificação de sucesso
      }
      
      await atualizarDados();
      return resultado;
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro na sincronização completa:', err);
      setError(err.message || 'Erro na sincronização completa');
      
      if (notificarErros) {
        // Notificação de erro
      }
      
      return null;
    } finally {
      setSincronizando(false);
    }
  }, [configPadrao, notificarConclusao, notificarErros]);

  // =========================================================================
  // CONTROLE DE JOBS
  // =========================================================================

  const cancelarJob = useCallback(async (jobId: string): Promise<boolean> => {
    console.log('🛑 [useSync] Cancelando job:', jobId);
    
    try {
      const sucesso = await syncService.cancelarJob(jobId);
      
      if (sucesso) {
        console.log('✅ [useSync] Job cancelado:', jobId);
        await atualizarDados();
      }
      
      return sucesso;
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro ao cancelar job:', err);
      setError(err.message || 'Erro ao cancelar job');
      return false;
    }
  }, []);

  const obterJob = useCallback((jobId: string): SyncJob | null => {
    return syncService.obterJob(jobId);
  }, []);

  // =========================================================================
  // MONITORAMENTO
  // =========================================================================

  const iniciarMonitoramento = useCallback(() => {
    console.log('👀 [useSync] Iniciando monitoramento...');
    syncService.iniciarMonitoramento(intervaloMonitoramento);
  }, [intervaloMonitoramento]);

  const pararMonitoramento = useCallback(() => {
    console.log('🛑 [useSync] Parando monitoramento...');
    syncService.pararMonitoramento();
  }, []);

  const atualizarStatus = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statusAtual, metricas] = await Promise.all([
        syncService.obterStatus(),
        syncService.obterMetricas()
      ]);
      
      setStatus(statusAtual);
      setMetrics(metricas);
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro ao atualizar status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarDados = useCallback(async () => {
    try {
      await atualizarStatus();
      
      const jobsAtuais = syncService.obterJobs();
      setJobs(jobsAtuais);
      
    } catch (err: any) {
      console.error('❌ [useSync] Erro ao atualizar dados:', err);
    }
  }, [atualizarStatus]);

  // =========================================================================
  // CACHE
  // =========================================================================

  const limparCacheMultas = useCallback(() => {
    console.log('🧹 [useSync] Limpando cache de multas...');
    syncService.limparCacheMultas();
  }, []);

  const limparCacheAgentes = useCallback(() => {
    console.log('🧹 [useSync] Limpando cache de agentes...');
    syncService.limparCacheAgentes();
  }, []);

  const limparTodoCache = useCallback(() => {
    console.log('🧹 [useSync] Limpando todo o cache...');
    syncService.limparTodoCache();
  }, []);

  // =========================================================================
  // EFEITOS
  // =========================================================================

  // Carregamento inicial
  useEffect(() => {
    console.log('🚀 [useSync] Carregamento inicial...');
    atualizarDados();
  }, [atualizarDados]);

  // Monitoramento automático
  useEffect(() => {
    if (monitorarAutomaticamente) {
      iniciarMonitoramento();
      
      return () => {
        pararMonitoramento();
      };
    }
  }, [monitorarAutomaticamente, iniciarMonitoramento, pararMonitoramento]);

  // Atualização periódica dos jobs
  useEffect(() => {
    const interval = setInterval(() => {
      const jobsAtuais = syncService.obterJobs();
      setJobs(jobsAtuais);
    }, 5000); // Atualizar jobs a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // VALORES COMPUTADOS
  // =========================================================================

  const dadosComputados = useMemo(() => {
    const jobAtivo = jobs.find(job => job.status === 'EXECUTANDO') || null;
    const temJobAtivo = !!jobAtivo;
    
    const ultimaSincronizacao = metrics?.ultimaSincronizacao || 
      jobs
        .filter(job => job.status === 'CONCLUIDA')
        .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())[0]?.dataFim || 
      null;
    
    const proximaSincronizacao = metrics?.proximaSincronizacao || null;
    
    const jobsPorStatus = {
      executando: jobs.filter(job => job.status === 'EXECUTANDO').length,
      concluidas: jobs.filter(job => job.status === 'CONCLUIDA').length,
      erro: jobs.filter(job => job.status === 'ERRO').length,
      canceladas: jobs.filter(job => job.status === 'CANCELADA').length
    };
    
    const eficiencia = jobs.length > 0 ? 
      (jobsPorStatus.concluidas / jobs.length) * 100 : 100;
    
    return {
      jobAtivo,
      temJobAtivo,
      ultimaSincronizacao,
      proximaSincronizacao,
      jobsPorStatus,
      eficiencia,
      totalJobs: jobs.length,
      temErros: jobsPorStatus.erro > 0
    };
  }, [jobs, metrics]);

  // =========================================================================
  // RETORNO DO HOOK
  // =========================================================================

  return {
    // Status geral
    status,
    metrics,
    loading,
    error,
    
    // Jobs
    jobs,
    jobAtivo: dadosComputados.jobAtivo,
    
    // Ações de sincronização
    sincronizarMultas,
    sincronizarAgentes,
    sincronizarSetores,
    sincronizacaoCompleta,
    
    // Controle de jobs
    cancelarJob,
    obterJob,
    
    // Monitoramento
    iniciarMonitoramento,
    pararMonitoramento,
    atualizarStatus,
    
    // Cache
    limparCacheMultas,
    limparCacheAgentes,
    limparTodoCache,
    
    // Estados auxiliares
    sincronizando: sincronizando || dadosComputados.temJobAtivo,
    temJobAtivo: dadosComputados.temJobAtivo,
    ultimaSincronizacao: dadosComputados.ultimaSincronizacao,
    proximaSincronizacao: dadosComputados.proximaSincronizacao
  };
}

// =========================================================================
// HOOKS SIMPLIFICADOS
// =========================================================================

/**
 * Hook para sincronização simples
 */
export function useSyncSimples() {
  const {
    sincronizarMultas,
    sincronizarAgentes,
    sincronizacaoCompleta,
    sincronizando,
    error
  } = useSync({
    monitorarAutomaticamente: false,
    notificarConclusao: true,
    notificarErros: true
  });

  return {
    sincronizarMultas,
    sincronizarAgentes,
    sincronizacaoCompleta,
    sincronizando,
    error
  };
}

/**
 * Hook para monitoramento de jobs
 */
export function useSyncMonitoramento() {
  const {
    jobs,
    jobAtivo,
    status,
    metrics,
    cancelarJob,
    atualizarStatus,
    temJobAtivo
  } = useSync({
    monitorarAutomaticamente: true,
    intervaloMonitoramento: 15000 // 15 segundos
  });

  const jobsRecentes = useMemo(() => {
    return jobs
      .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
      .slice(0, 10);
  }, [jobs]);

  return {
    jobs: jobsRecentes,
    jobAtivo,
    status,
    metrics,
    cancelarJob,
    atualizarStatus,
    temJobAtivo
  };
}

/**
 * Hook para status de sincronização
 */
export function useSyncStatus() {
  const {
    status,
    metrics,
    ultimaSincronizacao,
    proximaSincronizacao,
    temJobAtivo,
    atualizarStatus
  } = useSync({
    monitorarAutomaticamente: true
  });

  const statusFormatado = useMemo(() => {
    if (!status) return null;
    
    return {
      emAndamento: status.emAndamento,
      ultimaSincronizacao: ultimaSincronizacao ? 
        new Date(ultimaSincronizacao).toLocaleString('pt-BR') : 'Nunca',
      proximaSincronizacao: proximaSincronizacao ? 
        new Date(proximaSincronizacao).toLocaleString('pt-BR') : 'Não agendada',
      progresso: status.percentualConcluido || 0,
      registrosAtualizados: status.registrosAtualizados || 0,
      totalRegistros: status.totalRegistros || 0
    };
  }, [status, ultimaSincronizacao, proximaSincronizacao]);

  return {
    status: statusFormatado,
    metrics,
    temJobAtivo,
    atualizarStatus
  };
}