// apps/frontend/src/services/departments/pessoal/hooks/usePessoalData.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  pessoalService, 
  type DashboardComparativo, 
  type EstatisticasComparativasResponse,
  type SincronizacaoMultiplaResponse,
  type StatusSincronizacaoResponse,
  type StatusCacheResponse,
  type DashboardAcumuladoResponse
} from '../pessoalService';
import type {
  DashboardPessoal,
  EstatisticasBasicas,
  FuncionarioFilters,
  PaginatedFuncionarios,
  Funcionario,
  ResultadoSincronizacao
} from '../../../types/departments/pessoal';

interface UsePessoalDataOptions {
  mesReferencia?: string;
  autoLoad?: boolean;
  filters?: FuncionarioFilters;
  enableCache?: boolean;
  enableRetry?: boolean;
  retryAttempts?: number;
  refreshInterval?: number; // em ms
}

// ✅ TIPOS LOCAIS PARA O HOOK - AJUSTADOS
interface DashboardComparativoData {
  meses: {
    mesAtual: string;
    mesAnterior1: string;
    mesAnterior2: string;
    mesAnoAnterior: string;
  };
  mesesInfo: {
    mesAtual: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnterior1: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnterior2: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnoAnterior: { referencia: string; nome: string; tipo: string; fonte: string };
  };
  dashboards: {
    mesAtual: DashboardPessoal;
    mesAnterior1: DashboardPessoal;
    mesAnterior2: DashboardPessoal;
    mesAnoAnterior: DashboardPessoal;
  };
  metadados?: {
    dataReferencia: string;
    totalMeses: number;
    tipoComparacao: string;
    totalConsultasOracle: number;
    totalConsultasCache: number;
    tempoTotalExecucao: string;
  };
}

interface EstatisticasComparativas {
  [mesReferencia: string]: {
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosAfastados: number;
    funcionariosDemitidos: number;
    percentualAtivos: number;
    percentualAfastados: number;
  };
}

interface UsePessoalDataReturn {
  // Dashboard
  dashboard: DashboardPessoal | null;
  estatisticas: EstatisticasBasicas | null;
  
  // Dashboard Comparativo
  dashboardComparativo: DashboardComparativoData | null;
  estatisticasComparativas: EstatisticasComparativas | null;
  
  // Dashboard Acumulado
  dashboardAcumulado: DashboardAcumuladoResponse['data'] | null;
  
  // Funcionários
  funcionarios: PaginatedFuncionarios | null;
  funcionarioSelecionado: Funcionario | null;
  
  // Status de sincronização e cache
  statusSincronizacao: StatusSincronizacaoResponse['data'] | null;
  statusCache: StatusCacheResponse['data'] | null;
  
  // Estados
  loading: boolean;
  loadingDashboard: boolean;
  loadingFuncionarios: boolean;
  loadingSincronizacao: boolean;
  loadingComparativo: boolean;
  loadingEstatisticasComparativas: boolean;
  loadingSincronizacaoMultipla: boolean;
  loadingAcumulado: boolean;
  loadingStatusSincronizacao: boolean;
  loadingStatusCache: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  retryCount: number;
  
  // Ações
  loadDashboard: (mes?: string, forcar?: boolean) => Promise<void>;
  loadEstatisticas: (mes?: string) => Promise<void>;
  loadFuncionarios: (filters?: FuncionarioFilters) => Promise<void>;
  buscarFuncionarioPorCodigo: (codigo: number, mes?: string) => Promise<void>;
  buscarFuncionarioPorCpf: (cpf: string, mes?: string) => Promise<void>;
  buscarFuncionariosPorNome: (nome: string, limit?: number, mes?: string) => Promise<Funcionario[]>;
  sincronizar: (mes?: string, forcar?: boolean) => Promise<ResultadoSincronizacao | null>;
  sincronizarMultiplos: (dataReferencia?: string, forcar?: boolean) => Promise<SincronizacaoMultiplaResponse | null>;
  sincronizarAcumulado: (mes?: string, forcar?: boolean) => Promise<ResultadoSincronizacao | null>;
  loadStatusSincronizacao: () => Promise<void>;
  loadStatusCache: () => Promise<void>;
  clearError: () => void;
  testConnection: () => Promise<boolean>;
  refreshAll: () => Promise<void>;
  
  // Dashboard Comparativo
  loadDashboardComparativo: (dataReferencia?: string, forcar?: boolean) => Promise<DashboardComparativoData | null>;
  loadEstatisticasComparativas: () => Promise<EstatisticasComparativas | null>;
  
  // Dashboard Acumulado
  loadDashboardAcumulado: (mes?: string, forcar?: boolean) => Promise<void>;
  
  // Dados calculados
  hasData: boolean;
  totalFuncionarios: number;
  percentualAtivos: number;
  percentualAfastados: number;
  cacheEficiencia: number;
  sistemaOtimizado: boolean;
  
  // Métricas de performance
  performanceMetrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    successRate: number;
  };
}

export const usePessoalData = (options: UsePessoalDataOptions = {}): UsePessoalDataReturn => {
  const { 
    mesReferencia, 
    autoLoad = true, 
    filters = {}, 
    enableCache = true,
    enableRetry = true,
    retryAttempts = 3,
    refreshInterval = 300000 // 5 minutos
  } = options;

  // Continuação do usePessoalData.ts

  // Estados
  const [dashboard, setDashboard] = useState<DashboardPessoal | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasBasicas | null>(null);
  const [funcionarios, setFuncionarios] = useState<PaginatedFuncionarios | null>(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  
  // Dashboard Comparativo
  const [dashboardComparativo, setDashboardComparativo] = useState<DashboardComparativoData | null>(null);
  const [estatisticasComparativas, setEstatisticasComparativas] = useState<EstatisticasComparativas | null>(null);
  
  // Dashboard Acumulado
  const [dashboardAcumulado, setDashboardAcumulado] = useState<DashboardAcumuladoResponse['data'] | null>(null);
  
  // Status de sincronização e cache
  const [statusSincronizacao, setStatusSincronizacao] = useState<StatusSincronizacaoResponse['data'] | null>(null);
  const [statusCache, setStatusCache] = useState<StatusCacheResponse['data'] | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [loadingSincronizacao, setLoadingSincronizacao] = useState(false);
  const [loadingComparativo, setLoadingComparativo] = useState(false);
  const [loadingEstatisticasComparativas, setLoadingEstatisticasComparativas] = useState(false);
  const [loadingSincronizacaoMultipla, setLoadingSincronizacaoMultipla] = useState(false);
  const [loadingAcumulado, setLoadingAcumulado] = useState(false);
  const [loadingStatusSincronizacao, setLoadingStatusSincronizacao] = useState(false);
  const [loadingStatusCache, setLoadingStatusCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ FUNÇÃO HELPER PARA RETRY
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = retryAttempts
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [PESSOAL_HOOK] ${operationName} - Tentativa ${attempt}/${maxAttempts}`);
        
        const result = await operation();
        
        setRetryCount(0);
        setIsConnected(true);
        setLastUpdate(new Date());
        
        console.log(`✅ [PESSOAL_HOOK] ${operationName} - Sucesso`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ [PESSOAL_HOOK] ${operationName} - Tentativa ${attempt} falhou:`, lastError.message);
        
        setRetryCount(attempt);
        
        if (attempt === maxAttempts) {
          setIsConnected(false);
          throw lastError;
        }
        
        // Aguardar antes da próxima tentativa (backoff exponencial)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ [PESSOAL_HOOK] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }, [retryAttempts]);

  // ✅ TESTE DE CONEXÃO
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔧 [PESSOAL_HOOK] Testando conexão...');
      const connected = await pessoalService.testConnection();
      setIsConnected(connected);
      console.log(`${connected ? '✅' : '❌'} [PESSOAL_HOOK] Conexão: ${connected ? 'OK' : 'FALHOU'}`);
      return connected;
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro no teste de conexão:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // ✅ CARREGAR DASHBOARD COM CACHE OTIMIZADO
  const loadDashboard = useCallback(async (mes?: string, forcar?: boolean) => {
    try {
      console.log('🔄 [PESSOAL_HOOK] Carregando dashboard...', { mes, forcar, enableCache });
      setLoadingDashboard(true);
      setError(null);
      
      const operation = () => pessoalService.getDashboard(mes || mesReferencia, enableCache ? forcar : true);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Dashboard')
        : await operation();
        
      setDashboard(data);
      
      console.log('✅ [PESSOAL_HOOK] Dashboard carregado:', data);
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar dashboard:', error);
      setError(`Erro ao carregar dashboard: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingDashboard(false);
    }
  }, [mesReferencia, enableCache, enableRetry, withRetry]);

  // ✅ CARREGAR DASHBOARD COMPARATIVO - CORRIGIDO E MELHORADO
  const loadDashboardComparativo = useCallback(async (dataReferencia?: string, forcar?: boolean): Promise<DashboardComparativoData | null> => {
    try {
      console.log('📊 [PESSOAL_HOOK] Carregando dashboard comparativo...', { dataReferencia, forcar, enableCache });
      setLoadingComparativo(true);
      setError(null);
      
      const operation = () => pessoalService.getDashboardComparativo(dataReferencia, enableCache ? forcar : true);
      
      const response: DashboardComparativo = enableRetry 
        ? await withRetry(operation, 'Dashboard Comparativo')
        : await operation();
      
      if (response.success && response.data) {
        const dashboardData: DashboardComparativoData = {
          meses: response.data.meses,
          mesesInfo: response.data.mesesInfo,
          dashboards: response.data.dashboards,
          metadados: {
            ...response.metadados,
            ...response.data.metadados
          }
        };
        
        setDashboardComparativo(dashboardData);
        console.log('✅ [PESSOAL_HOOK] Dashboard comparativo carregado:', dashboardData);
        return dashboardData;
      } else {
        throw new Error(response.message || 'Dados inválidos retornados');
      }
      
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar dashboard comparativo:', error);
      setError(`Erro no dashboard comparativo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoadingComparativo(false);
    }
  }, [enableCache, enableRetry, withRetry]);

  // ✅ CARREGAR DASHBOARD ACUMULADO
  const loadDashboardAcumulado = useCallback(async (mes?: string, forcar?: boolean) => {
    try {
      console.log('📊 [PESSOAL_HOOK] Carregando dashboard acumulado...', { mes, forcar, enableCache });
      setLoadingAcumulado(true);
      setError(null);
      
      const operation = () => pessoalService.getDashboardAcumulado(mes || mesReferencia, enableCache ? forcar : true);
      
      const response = enableRetry 
        ? await withRetry(operation, 'Dashboard Acumulado')
        : await operation();
      
      if (response.success && response.data) {
        setDashboardAcumulado(response.data);
        console.log('✅ [PESSOAL_HOOK] Dashboard acumulado carregado:', response.data);
      } else {
        throw new Error(response.message || 'Dados inválidos retornados');
      }
      
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar dashboard acumulado:', error);
      setError(`Erro no dashboard acumulado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingAcumulado(false);
    }
  }, [mesReferencia, enableCache, enableRetry, withRetry]);

  // ✅ CARREGAR ESTATÍSTICAS COMPARATIVAS - CORRIGIDO
  const loadEstatisticasComparativas = useCallback(async (): Promise<EstatisticasComparativas | null> => {
    try {
      console.log('📈 [PESSOAL_HOOK] Carregando estatísticas comparativas...');
      setLoadingEstatisticasComparativas(true);
      setError(null);
      
      const operation = () => pessoalService.getEstatisticasComparativas();
      
      const response: EstatisticasComparativasResponse = enableRetry 
        ? await withRetry(operation, 'Estatísticas Comparativas')
        : await operation();
      
      if (response.success && response.data) {
        setEstatisticasComparativas(response.data);
        console.log('✅ [PESSOAL_HOOK] Estatísticas comparativas carregadas:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Dados inválidos retornados');
      }
      
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar estatísticas comparativas:', error);
      setError(`Erro nas estatísticas comparativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoadingEstatisticasComparativas(false);
    }
  }, [enableRetry, withRetry]);

  // ✅ CARREGAR STATUS DE SINCRONIZAÇÃO
  const loadStatusSincronizacao = useCallback(async () => {
    try {
      console.log('📊 [PESSOAL_HOOK] Carregando status de sincronização...');
      setLoadingStatusSincronizacao(true);
      setError(null);
      
      const operation = () => pessoalService.getStatusSincronizacao();
      
      const response = enableRetry 
        ? await withRetry(operation, 'Status Sincronização')
        : await operation();
      
      if (response.success && response.data) {
        setStatusSincronizacao(response.data);
        console.log('✅ [PESSOAL_HOOK] Status de sincronização carregado:', response.data);
      } else {
        throw new Error(response.message || 'Erro ao obter status');
      }
      
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar status de sincronização:', error);
      setError(`Erro no status de sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingStatusSincronizacao(false);
    }
  }, [enableRetry, withRetry]);

  // ✅ CARREGAR STATUS DO CACHE
  const loadStatusCache = useCallback(async () => {
    try {
      console.log('💾 [PESSOAL_HOOK] Carregando status do cache...');
      setLoadingStatusCache(true);
      setError(null);
      
      const operation = () => pessoalService.getStatusCache();
      
      const response = enableRetry 
        ? await withRetry(operation, 'Status Cache')
        : await operation();
      
      if (response.success && response.data) {
        setStatusCache(response.data);
        console.log('✅ [PESSOAL_HOOK] Status do cache carregado:', response.data);
      } else {
        throw new Error(response.message || 'Erro ao obter status do cache');
      }
      
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar status do cache:', error);
      setError(`Erro no status do cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingStatusCache(false);
    }
  }, [enableRetry, withRetry]);

  // ✅ CARREGAR ESTATÍSTICAS
  const loadEstatisticas = useCallback(async (mes?: string) => {
    try {
      console.log('📊 [PESSOAL_HOOK] Carregando estatísticas...', { mes });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getEstatisticas(mes || mesReferencia);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Estatísticas')
        : await operation();
        
      setEstatisticas(data);
      
      console.log('✅ [PESSOAL_HOOK] Estatísticas carregadas:', data);
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar estatísticas:', error);
      setError(`Erro ao carregar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  // ✅ CARREGAR FUNCIONÁRIOS
  const loadFuncionarios = useCallback(async (newFilters?: FuncionarioFilters) => {
    try {
      console.log('👥 [PESSOAL_HOOK] Carregando funcionários...', { filters: newFilters || filters });
      setLoadingFuncionarios(true);
      setError(null);
      
      const finalFilters = { ...filters, ...newFilters };
      if (mesReferencia && !finalFilters.mesReferencia) {
        finalFilters.mesReferencia = mesReferencia;
      }
      
      const operation = () => pessoalService.getFuncionarios(finalFilters);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Funcionários')
        : await operation();
        
      setFuncionarios(data);
      
      console.log('✅ [PESSOAL_HOOK] Funcionários carregados:', data);
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao carregar funcionários:', error);
      setError(`Erro ao carregar funcionários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingFuncionarios(false);
    }
  }, [filters, mesReferencia, enableRetry, withRetry]);

  // ✅ BUSCAR FUNCIONÁRIO POR CÓDIGO
  const buscarFuncionarioPorCodigo = useCallback(async (codigo: number, mes?: string) => {
    try {
      console.log('🔍 [PESSOAL_HOOK] Buscando funcionário por código:', { codigo, mes });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getFuncionarioPorCodigo(codigo, mes || mesReferencia);
      
      const funcionario = enableRetry 
        ? await withRetry(operation, 'Busca por Código')
        : await operation();
        
      setFuncionarioSelecionado(funcionario);
      
      console.log('✅ [PESSOAL_HOOK] Funcionário encontrado:', funcionario);
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao buscar funcionário por código:', error);
      setError(`Funcionário não encontrado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setFuncionarioSelecionado(null);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  // ✅ BUSCAR FUNCIONÁRIO POR CPF
  const buscarFuncionarioPorCpf = useCallback(async (cpf: string, mes?: string) => {
    try {
      console.log('🔍 [PESSOAL_HOOK] Buscando funcionário por CPF:', { cpf, mes });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getFuncionarioPorCpf(cpf, mes || mesReferencia);
      
      const funcionario = enableRetry 
        ? await withRetry(operation, 'Busca por CPF')
        : await operation();
        
      setFuncionarioSelecionado(funcionario);
      
      console.log('✅ [PESSOAL_HOOK] Funcionário encontrado:', funcionario);
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao buscar funcionário por CPF:', error);
      setError(`Funcionário não encontrado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setFuncionarioSelecionado(null);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  // ✅ BUSCAR FUNCIONÁRIOS POR NOME
  const buscarFuncionariosPorNome = useCallback(async (nome: string, limit = 20, mes?: string): Promise<Funcionario[]> => {
    try {
      console.log('🔍 [PESSOAL_HOOK] Buscando funcionários por nome:', { nome, limit, mes });
      setError(null);
      
      const operation = () => pessoalService.buscarFuncionariosPorNome(nome, limit, mes || mesReferencia);
      
      const funcionarios = enableRetry 
        ? await withRetry(operation, 'Busca por Nome')
        : await operation();
      
      console.log('✅ [PESSOAL_HOOK] Funcionários encontrados:', funcionarios);
      return funcionarios;
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao buscar funcionários por nome:', error);
      setError(`Erro na busca: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return [];
    }
  }, [mesReferencia, enableRetry, withRetry]);

  // ✅ SINCRONIZAR - MELHORADO COM CACHE
  const sincronizar = useCallback(async (mes?: string, forcar?: boolean): Promise<ResultadoSincronizacao | null> => {
    try {
      console.log('🔄 [PESSOAL_HOOK] Iniciando sincronização...', { mes, forcar, enableCache });
      setLoadingSincronizacao(true);
      setError(null);
      
      const operation = () => pessoalService.sincronizar(mes, enableCache ? forcar : true);
      
      const resultado = enableRetry 
        ? await withRetry(operation, 'Sincronização')
        : await operation();
      
      console.log('✅ [PESSOAL_HOOK] Sincronização concluída:', resultado);
      
      // Recarregar dados após sincronização
      await Promise.allSettled([
        loadDashboard(),
        loadEstatisticas(),
        loadFuncionarios(),
        loadDashboardComparativo(),
        loadEstatisticasComparativas(),
        loadStatusSincronizacao(),
        loadStatusCache()
      ]);
      
      return resultado;
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro na sincronização:', error);
      setError(`Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoadingSincronizacao(false);
    }
  }, [loadDashboard, loadEstatisticas, loadFuncionarios, loadDashboardComparativo, loadEstatisticasComparativas, loadStatusSincronizacao, loadStatusCache, enableCache, enableRetry, withRetry]);

  // ✅ SINCRONIZAÇÃO MÚLTIPLA COM CACHE
  const sincronizarMultiplos = useCallback(async (dataReferencia?: string, forcar?: boolean): Promise<SincronizacaoMultiplaResponse | null> => {
    try {
      console.log('🔄 [PESSOAL_HOOK] Iniciando sincronização múltipla...', { dataReferencia, forcar, enableCache });
      setLoadingSincronizacaoMultipla(true);
      setError(null);
      
      const operation = () => pessoalService.sincronizarMultiplos(dataReferencia, enableCache ? forcar : true);
      
      const resultado = enableRetry 
        ? await withRetry(operation, 'Sincronização Múltipla')
        : await operation();
      
      console.log('✅ [PESSOAL_HOOK] Sincronização múltipla concluída:', resultado);
      
      // Recarregar dados após sincronização
      await Promise.allSettled([
        loadDashboard(),
        loadEstatisticas(),
        loadFuncionarios(),
        loadDashboardComparativo(),
        loadEstatisticasComparativas(),
        loadStatusSincronizacao(),
        loadStatusCache()
      ]);
      
      return resultado;
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro na sincronização múltipla:', error);
      setError(`Erro na sincronização múltipla: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoadingSincronizacaoMultipla(false);
    }
  }, [loadDashboard, loadEstatisticas, loadFuncionarios, loadDashboardComparativo, loadEstatisticasComparativas, loadStatusSincronizacao, loadStatusCache, enableCache, enableRetry, withRetry]);

  // ✅ SINCRONIZAÇÃO ACUMULADA
  const sincronizarAcumulado = useCallback(async (mes?: string, forcar?: boolean): Promise<ResultadoSincronizacao | null> => {
    try {
      console.log('🔄 [PESSOAL_HOOK] Iniciando sincronização acumulada...', { mes, forcar, enableCache });
      setLoadingSincronizacao(true);
      setError(null);
      
      const operation = () => pessoalService.sincronizarAcumulado(mes, enableCache ? forcar : true);
      
      const resultado = enableRetry 
        ? await withRetry(operation, 'Sincronização Acumulada')
        : await operation();
      
      console.log('✅ [PESSOAL_HOOK] Sincronização acumulada concluída:', resultado);
      
      // Recarregar dados após sincronização
      await Promise.allSettled([
        loadDashboardAcumulado(),
        loadStatusSincronizacao(),
        loadStatusCache()
      ]);
      
      return resultado;
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro na sincronização acumulada:', error);
      setError(`Erro na sincronização acumulada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoadingSincronizacao(false);
    }
  }, [loadDashboardAcumulado, loadStatusSincronizacao, loadStatusCache, enableCache, enableRetry, withRetry]);

  // ✅ FUNÇÃO PARA ATUALIZAR TODOS OS DADOS
  const refreshAll = useCallback(async () => {
    try {
      console.log('🔄 [PESSOAL_HOOK] Atualizando todos os dados...');
      setError(null);
      
      // Primeiro testar conexão
      const connected = await testConnection();
      
      if (connected) {
        await Promise.allSettled([
          loadDashboard(),
          loadEstatisticas(),
          loadFuncionarios(),
          loadStatusSincronizacao(),
          enableCache ? loadStatusCache() : Promise.resolve()
        ]);
        
        console.log('✅ [PESSOAL_HOOK] Todos os dados atualizados');
      } else {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      
    } catch (error) {
      console.error('❌ [PESSOAL_HOOK] Erro ao atualizar dados:', error);
      setError(`Erro ao atualizar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [loadDashboard, loadEstatisticas, loadFuncionarios, loadStatusSincronizacao, loadStatusCache, testConnection, enableCache]);

  // ✅ LIMPAR ERRO
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // ✅ CARREGAR DADOS INICIAIS COM TESTE DE CONEXÃO
  useEffect(() => {
    if (autoLoad) {
      console.log('🚀 [PESSOAL_HOOK] Carregamento automático iniciado');
      refreshAll();
    }
  }, [autoLoad, refreshAll]);

  // ✅ REFRESH AUTOMÁTICO PERIÓDICO
  useEffect(() => {
    if (refreshInterval > 0 && autoLoad) {
      console.log(`⏰ [PESSOAL_HOOK] Configurando refresh automático a cada ${refreshInterval}ms`);
      
      const interval = setInterval(() => {
        console.log('🔄 [PESSOAL_HOOK] Refresh automático executado');
        Promise.allSettled([
          loadStatusSincronizacao(),
          enableCache ? loadStatusCache() : Promise.resolve()
        ]);
      }, refreshInterval);
      
      return () => {
        console.log('⏹️ [PESSOAL_HOOK] Parando refresh automático');
        clearInterval(interval);
      };
    }
  }, [refreshInterval, autoLoad, loadStatusSincronizacao, loadStatusCache, enableCache]);

  // ✅ DADOS CALCULADOS
  const hasData = dashboard?.resumo?.totalFuncionarios > 0;
  const totalFuncionarios = dashboard?.resumo?.totalFuncionarios || 0;
  const percentualAtivos = dashboard?.resumo?.percentualAtivos || 0;
  const percentualAfastados = dashboard?.resumo?.percentualAfastados || 0;
  
  // ✅ CÁLCULOS DE CACHE E OTIMIZAÇÃO
  const cacheEficiencia = statusCache?.resumo ? 
    Math.round((statusCache.resumo.comDados / statusCache.resumo.totalMeses) * 100) : 0;
  
  const sistemaOtimizado = enableCache && cacheEficiencia > 50;

  // ✅ MÉTRICAS DE PERFORMANCE
  const performanceMetrics = pessoalService.getMetrics();

  return {
    // Dashboard
    dashboard,
    estatisticas,
    
    // Dashboard Comparativo
    dashboardComparativo,
    estatisticasComparativas,
    
    // Dashboard Acumulado
    dashboardAcumulado,
    
    // Funcionários
    funcionarios,
    funcionarioSelecionado,
    
    // Status de sincronização e cache
    statusSincronizacao,
    statusCache,
    
    // Estados
    loading,
    loadingDashboard,
    loadingFuncionarios,
    loadingSincronizacao,
    loadingComparativo,
    loadingEstatisticasComparativas,
    loadingSincronizacaoMultipla,
    loadingAcumulado,
    loadingStatusSincronizacao,
    loadingStatusCache,
    error,
    isConnected,
    lastUpdate,
    retryCount,
    
    // Ações
    loadDashboard,
    loadEstatisticas,
    loadFuncionarios,
    buscarFuncionarioPorCodigo,
    buscarFuncionarioPorCpf,
    buscarFuncionariosPorNome,
    sincronizar,
    sincronizarMultiplos,
    sincronizarAcumulado,
    loadStatusSincronizacao,
    loadStatusCache,
    clearError,
    testConnection,
    refreshAll,
    
    // Dashboard Comparativo
    loadDashboardComparativo,
    loadEstatisticasComparativas,
    
    // Dashboard Acumulado
    loadDashboardAcumulado,
    
    // Dados calculados
    hasData: !!hasData,
    totalFuncionarios,
    percentualAtivos,
    percentualAfastados,
    cacheEficiencia,
    sistemaOtimizado,
    
    // Métricas de performance
    performanceMetrics
  };
};