// apps/frontend/src/services/departments/legal/core/syncService.ts

import { apiClient } from '../../../api/client';
import { ResultadoSincronizacao, StatusSincronizacao } from '../types';
import { legalCache, CacheTTL } from '../utils/cache';

// =========================================================================
// INTERFACES ESPECÍFICAS PARA SINCRONIZAÇÃO
// =========================================================================

export interface SyncFiltros {
  dataInicio?: string;
  dataFim?: string;
  forcarCompleta?: boolean;
  apenasNovos?: boolean;
  batchSize?: number;
  timeout?: number;
}

export interface SyncConfig {
  estrategia: 'INCREMENTAL' | 'COMPLETA' | 'DIFERENCIAL';
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA';
  notificarConclusao?: boolean;
  limparCacheAntes?: boolean;
  validarDados?: boolean;
}

export interface SyncJob {
  id: string;
  tipo: 'MULTAS' | 'AGENTES' | 'SETORES' | 'COMPLETA';
  status: 'PENDENTE' | 'EXECUTANDO' | 'CONCLUIDA' | 'ERRO' | 'CANCELADA';
  progresso: number;
  dataInicio: string;
  dataFim?: string;
  resultado?: ResultadoSincronizacao;
  erro?: string;
  config: SyncConfig;
}

export interface SyncMetrics {
  totalJobs: number;
  jobsExecutando: number;
  jobsConcluidas: number;
  jobsComErro: number;
  tempoMedioExecucao: number;
  ultimaSincronizacao: string;
  proximaSincronizacao: string;
  eficiencia: number;
}

// =========================================================================
// CLASSE DO SERVIÇO DE SINCRONIZAÇÃO
// =========================================================================

class SyncService {
  private readonly baseUrl = '/juridico';
  private jobs = new Map<string, SyncJob>();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  // =========================================================================
  // MÉTODOS PRINCIPAIS
  // =========================================================================

  /**
   * Sincronizar multas completas
   */
  async sincronizarMultas(
    filtros: SyncFiltros = {},
    config: Partial<SyncConfig> = {}
  ): Promise<ResultadoSincronizacao> {
    console.log('🔄 [SYNC] Iniciando sincronização de multas:', { filtros, config });

    try {
      const syncConfig: SyncConfig = {
        estrategia: 'INCREMENTAL',
        prioridade: 'NORMAL',
        notificarConclusao: false,
        limparCacheAntes: true,
        validarDados: true,
        ...config
      };

      // Criar job de sincronização
      const job = this.createSyncJob('MULTAS', syncConfig);
      
      // Limpar cache se solicitado
      if (syncConfig.limparCacheAntes) {
        this.limparCacheMultas();
      }

      // Executar sincronização
      const resultado = await this.executarSincronizacaoMultas(filtros, job);
      
      // Atualizar job com resultado
      job.status = 'CONCLUIDA';
      job.dataFim = new Date().toISOString();
      job.resultado = resultado;
      job.progresso = 100;

      console.log('✅ [SYNC] Sincronização de multas concluída:', resultado);
      return resultado;

    } catch (error) {
      console.error('❌ [SYNC] Erro na sincronização de multas:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sincronizar agentes
   */
  async sincronizarAgentes(
    config: Partial<SyncConfig> = {}
  ): Promise<ResultadoSincronizacao> {
    console.log('🔄 [SYNC] Iniciando sincronização de agentes:', config);

    try {
      const syncConfig: SyncConfig = {
        estrategia: 'COMPLETA',
        prioridade: 'NORMAL',
        notificarConclusao: false,
        limparCacheAntes: true,
        validarDados: true,
        ...config
      };

      // Criar job de sincronização
      const job = this.createSyncJob('AGENTES', syncConfig);

      // Limpar cache se solicitado
      if (syncConfig.limparCacheAntes) {
        this.limparCacheAgentes();
      }

      // Executar sincronização
      const response = await apiClient.post<any>(
        `${this.baseUrl}/agentes/cache/sincronizar`,
        { config: syncConfig }
      );

      if (response.success) {
        const resultado = response.data as ResultadoSincronizacao;
        
        // Atualizar job
        job.status = 'CONCLUIDA';
        job.dataFim = new Date().toISOString();
        job.resultado = resultado;
        job.progresso = 100;

        console.log('✅ [SYNC] Sincronização de agentes concluída:', resultado);
        return resultado;
      }

      throw new Error(response.message || 'Erro na sincronização de agentes');

    } catch (error) {
      console.error('❌ [SYNC] Erro na sincronização de agentes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sincronizar histórico de setores
   */
  async sincronizarSetores(
    config: Partial<SyncConfig> = {}
  ): Promise<ResultadoSincronizacao> {
    console.log('🔄 [SYNC] Iniciando sincronização de setores:', config);

    try {
      const syncConfig: SyncConfig = {
        estrategia: 'DIFERENCIAL',
        prioridade: 'NORMAL',
        notificarConclusao: false,
        limparCacheAntes: false,
        validarDados: true,
        ...config
      };

      // Criar job de sincronização
      const job = this.createSyncJob('SETORES', syncConfig);

      // Executar sincronização
      const response = await apiClient.post<any>(
        `${this.baseUrl}/historico-setores/sincronizar`,
        { config: syncConfig }
      );

      if (response.success) {
        const resultado = response.data as ResultadoSincronizacao;
        
        // Atualizar job
        job.status = 'CONCLUIDA';
        job.dataFim = new Date().toISOString();
        job.resultado = resultado;
        job.progresso = 100;

        console.log('✅ [SYNC] Sincronização de setores concluída:', resultado);
        return resultado;
      }

      throw new Error(response.message || 'Erro na sincronização de setores');

    } catch (error) {
      console.error('❌ [SYNC] Erro na sincronização de setores:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Sincronização completa (todos os dados)
   */
  async sincronizacaoCompleta(
    filtros: SyncFiltros = {},
    config: Partial<SyncConfig> = {}
  ): Promise<{
    multas: ResultadoSincronizacao;
    agentes: ResultadoSincronizacao;
    setores: ResultadoSincronizacao;
    tempoTotal: string;
  }> {
    console.log('🔄 [SYNC] Iniciando sincronização completa:', { filtros, config });

    const inicioCompleta = Date.now();

    try {
      const syncConfig: SyncConfig = {
        estrategia: 'COMPLETA',
        prioridade: 'ALTA',
        notificarConclusao: true,
        limparCacheAntes: true,
        validarDados: true,
        ...config
      };

      // Criar job principal
      const job = this.createSyncJob('COMPLETA', syncConfig);

      // Limpar todo o cache
      if (syncConfig.limparCacheAntes) {
        this.limparTodoCache();
      }

      // Executar sincronizações em paralelo
      const [multas, agentes, setores] = await Promise.all([
        this.sincronizarMultas(filtros, { ...syncConfig, limparCacheAntes: false }),
        this.sincronizarAgentes({ ...syncConfig, limparCacheAntes: false }),
        this.sincronizarSetores({ ...syncConfig, limparCacheAntes: false })
      ]);

      const tempoTotal = this.formatDuration(Date.now() - inicioCompleta);

      // Atualizar job principal
      job.status = 'CONCLUIDA';
      job.dataFim = new Date().toISOString();
      job.progresso = 100;

      const resultado = {
        multas,
        agentes,
        setores,
        tempoTotal
      };

      console.log('✅ [SYNC] Sincronização completa concluída:', resultado);
      return resultado;

    } catch (error) {
      console.error('❌ [SYNC] Erro na sincronização completa:', error);
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // MÉTODOS DE STATUS E MONITORAMENTO
  // =========================================================================

  /**
   * Obter status da sincronização
   */
  async obterStatus(): Promise<StatusSincronizacao> {
    console.log('📊 [SYNC] Obtendo status da sincronização...');

    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/sync/status`);

      if (response.success && response.data) {
        return response.data as StatusSincronizacao;
      }

      // Retornar status baseado nos jobs locais
      return this.getLocalStatus();

    } catch (error) {
      console.error('❌ [SYNC] Erro ao obter status:', error);
      return this.getLocalStatus();
    }
  }

  /**
   * Obter métricas de sincronização
   */
  async obterMetricas(): Promise<SyncMetrics> {
    console.log('📈 [SYNC] Obtendo métricas de sincronização...');

    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/sync/metrics`);

      if (response.success && response.data) {
        return response.data as SyncMetrics;
      }

      return this.calculateLocalMetrics();

    } catch (error) {
      console.error('❌ [SYNC] Erro ao obter métricas:', error);
      return this.calculateLocalMetrics();
    }
  }

  /**
   * Listar jobs de sincronização
   */
  obterJobs(): SyncJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  }

  /**
   * Obter job específico
   */
  obterJob(id: string): SyncJob | null {
    return this.jobs.get(id) || null;
  }

  /**
   * Cancelar job
   */
  async cancelarJob(id: string): Promise<boolean> {
    console.log('🛑 [SYNC] Cancelando job:', id);

    try {
      const job = this.jobs.get(id);
      if (!job) {
        throw new Error('Job não encontrado');
      }

      if (job.status !== 'EXECUTANDO') {
        throw new Error('Job não está em execução');
      }

      // Tentar cancelar no backend
      const response = await apiClient.post<any>(`${this.baseUrl}/sync/cancel/${id}`);

      if (response.success) {
        job.status = 'CANCELADA';
        job.dataFim = new Date().toISOString();
        console.log('✅ [SYNC] Job cancelado:', id);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ [SYNC] Erro ao cancelar job:', error);
      return false;
    }
  }

  // =========================================================================
  // MÉTODOS DE MONITORAMENTO
  // =========================================================================

  /**
   * Iniciar monitoramento automático
   */
  iniciarMonitoramento(intervalo: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('⚠️ [SYNC] Monitoramento já está ativo');
      return;
    }

    console.log('👀 [SYNC] Iniciando monitoramento automático:', intervalo, 'ms');

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.atualizarStatusJobs();
      } catch (error) {
        console.error('❌ [SYNC] Erro no monitoramento:', error);
      }
    }, intervalo);
  }

  /**
   * Parar monitoramento automático
   */
  pararMonitoramento(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🛑 [SYNC] Parando monitoramento automático');

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Verificar se há sincronização em andamento
   */
  temSincronizacaoEmAndamento(): boolean {
    return Array.from(this.jobs.values()).some(job => job.status === 'EXECUTANDO');
  }

  // =========================================================================
  // MÉTODOS DE CACHE
  // =========================================================================

  /**
   * Limpar cache de multas
   */
  limparCacheMultas(): void {
    legalCache.deleteByPattern('^multas:');
    console.log('🧹 [SYNC] Cache de multas limpo');
  }

  /**
   * Limpar cache de agentes
   */
  limparCacheAgentes(): void {
    legalCache.deleteByPattern('^agentes:');
    console.log('🧹 [SYNC] Cache de agentes limpo');
  }

  /**
   * Limpar todo o cache
   */
  limparTodoCache(): void {
    legalCache.clear();
    console.log('🧹 [SYNC] Todo o cache limpo');
  }

  // =========================================================================
  // MÉTODOS PRIVADOS
  // =========================================================================

  /**
   * Criar job de sincronização
   */
  private createSyncJob(tipo: SyncJob['tipo'], config: SyncConfig): SyncJob {
    const id = this.generateJobId();
    const job: SyncJob = {
      id,
      tipo,
      status: 'EXECUTANDO',
      progresso: 0,
      dataInicio: new Date().toISOString(),
      config
    };

    this.jobs.set(id, job);
    console.log('📝 [SYNC] Job criado:', id, tipo);
    
    return job;
  }

  /**
   * Executar sincronização de multas
   */
  private async executarSincronizacaoMultas(
    filtros: SyncFiltros,
    job: SyncJob
  ): Promise<ResultadoSincronizacao> {
    const endpoints = [
      '/multas-completas/sincronizar',
      '/multas-enhanced/sincronizar'
    ];

    let melhorResultado: ResultadoSincronizacao | null = null;

    for (const endpoint of endpoints) {
      try {
        job.progresso = 25;
        
        const response = await apiClient.post<any>(
          `${this.baseUrl}${endpoint}`,
          {},
          filtros
        );

        if (response.success) {
          melhorResultado = response.data;
          job.progresso = 75;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ [SYNC] Falha no endpoint ${endpoint}:`, error);
        continue;
      }
    }

    if (!melhorResultado) {
      throw new Error('Todos os endpoints de sincronização falharam');
    }

    return melhorResultado;
  }

  /**
   * Atualizar status dos jobs
   */
  private async atualizarStatusJobs(): Promise<void> {
    const jobsExecutando = Array.from(this.jobs.values())
      .filter(job => job.status === 'EXECUTANDO');

    for (const job of jobsExecutando) {
      try {
        const status = await this.verificarStatusJob(job.id);
        if (status) {
          Object.assign(job, status);
        }
      } catch (error) {
        console.error('❌ [SYNC] Erro ao atualizar status do job:', job.id, error);
      }
    }
  }

  /**
   * Verificar status de job específico
   */
  private async verificarStatusJob(jobId: string): Promise<Partial<SyncJob> | null> {
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/sync/job/${jobId}`);
      
      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obter status local
   */
  private getLocalStatus(): StatusSincronizacao {
    const jobs = Array.from(this.jobs.values());
    const emAndamento = jobs.filter(job => job.status === 'EXECUTANDO').length > 0;
    const ultimaCompleta = jobs
      .filter(job => job.status === 'CONCLUIDA')
      .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())[0];

    return {
      emAndamento,
      ultimaSincronizacao: ultimaCompleta?.dataFim,
      proximaSincronizacao: this.calculateNextSync(),
      totalRegistros: 0,
      registrosAtualizados: 0,
      percentualConcluido: emAndamento ? 50 : 100
    };
  }

  /**
   * Calcular métricas locais
   */
  private calculateLocalMetrics(): SyncMetrics {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      jobsExecutando: jobs.filter(job => job.status === 'EXECUTANDO').length,
      jobsConcluidas: jobs.filter(job => job.status === 'CONCLUIDA').length,
      jobsComErro: jobs.filter(job => job.status === 'ERRO').length,
      tempoMedioExecucao: this.calculateAverageExecutionTime(jobs),
      ultimaSincronizacao: this.getLastSyncTime(jobs),
      proximaSincronizacao: this.calculateNextSync(),
      eficiencia: this.calculateEfficiency(jobs)
    };
  }

  /**
   * Calcular tempo médio de execução
   */
  private calculateAverageExecutionTime(jobs: SyncJob[]): number {
    const completedJobs = jobs.filter(job => 
      job.status === 'CONCLUIDA' && job.dataFim
    );

    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, job) => {
      const start = new Date(job.dataInicio).getTime();
      const end = new Date(job.dataFim!).getTime();
      return sum + (end - start);
    }, 0);

    return totalTime / completedJobs.length;
  }

  /**
   * Obter horário da última sincronização
   */
  private getLastSyncTime(jobs: SyncJob[]): string {
    const lastCompleted = jobs
      .filter(job => job.status === 'CONCLUIDA' && job.dataFim)
      .sort((a, b) => new Date(b.dataFim!).getTime() - new Date(a.dataFim!).getTime())[0];

    return lastCompleted?.dataFim || new Date().toISOString();
  }

  /**
   * Calcular próxima sincronização
   */
  private calculateNextSync(): string {
    const now = new Date();
    now.setHours(now.getHours() + 4); // Próxima sincronização em 4 horas
    return now.toISOString();
  }

  /**
   * Calcular eficiência
   */
  private calculateEfficiency(jobs: SyncJob[]): number {
    const totalJobs = jobs.length;
    if (totalJobs === 0) return 100;

    const successfulJobs = jobs.filter(job => job.status === 'CONCLUIDA').length;
    return (successfulJobs / totalJobs) * 100;
  }

  /**
   * Gerar ID único para job
   */
  private generateJobId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formatar duração
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * Tratar erros de forma consistente
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('Erro inesperado na sincronização');
  }
}

// =========================================================================
// INSTÂNCIA SINGLETON
// =========================================================================

export const syncService = new SyncService();
export default syncService;