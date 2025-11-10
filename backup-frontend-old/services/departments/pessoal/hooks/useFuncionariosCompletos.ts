// apps/frontend/src/services/departments/pessoal/hooks/useFuncionariosCompletos.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  pessoalService,
  type FuncionarioCompleto,
  type FuncionarioCompletoFilters,
  type PaginatedFuncionariosCompletos,
  type DashboardFuncionariosCompletos,
  type BuscaAvancadaResponse,
  type AgrupamentoResponse,
  type ResultadoSincronizacao
} from '../pessoalService';

interface UseFuncionariosCompletosOptions {
  mesReferencia?: string;
  autoLoad?: boolean;
  filters?: FuncionarioCompletoFilters;
  enableRetry?: boolean;
  retryAttempts?: number;
  refreshInterval?: number;
}

interface UseFuncionariosCompletosReturn {
  funcionarios: PaginatedFuncionariosCompletos | null;
  dashboard: DashboardFuncionariosCompletos | null;
  funcionarioSelecionado: FuncionarioCompleto | null;
  agrupamentos: AgrupamentoResponse | null;
  resultadoBuscaAvancada: BuscaAvancadaResponse | null;
  loading: boolean;
  loadingDashboard: boolean;
  loadingSincronizacao: boolean;
  loadingBuscaAvancada: boolean;
  loadingAgrupamentos: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  retryCount: number;
  loadFuncionarios: (filters?: FuncionarioCompletoFilters) => Promise<void>;
  loadDashboard: (mes?: string) => Promise<void>;
  buscarPorCracha: (cracha: number, mes?: string) => Promise<void>;
  buscarPorCpf: (cpf: string, mes?: string) => Promise<void>;
  buscarPorDepartamento: (departamento: string, filters?: Partial<FuncionarioCompletoFilters>) => Promise<void>;
  buscarPorSituacao: (situacao: 'A' | 'F' | 'D', filters?: Partial<FuncionarioCompletoFilters>) => Promise<void>;
  sincronizar: (mes?: string) => Promise<ResultadoSincronizacao | null>;
  buscaAvancada: (filtros: FuncionarioCompletoFilters) => Promise<void>;
  loadAgrupamentos: (tipo: 'departamento' | 'area' | 'cidade' | 'situacao' | 'faixaSalarial', mes?: string) => Promise<void>;
  clearError: () => void;
  clearFuncionarioSelecionado: () => void;
  clearResultadoBusca: () => void;
  clearAgrupamentos: () => void;
  refreshAll: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  changePage: (page: number) => Promise<void>;
  changePageSize: (limit: number) => Promise<void>;
  hasData: boolean;
  totalFuncionarios: number;
  salarioMedio: number;
  funcionariosAtivos: number;
  currentPage: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  performanceMetrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    successRate: number;
  };
}

export const useFuncionariosCompletos = (options: UseFuncionariosCompletosOptions = {}): UseFuncionariosCompletosReturn => {
  const { 
    mesReferencia, 
    autoLoad = true, 
    filters = {},
    enableRetry = true,
    retryAttempts = 3,
    refreshInterval = 0 // ✅ DESABILITAR REFRESH AUTOMÁTICO
  } = options;

  // ✅ REFS PARA CONTROLAR LOOPS
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estados principais
  const [funcionarios, setFuncionarios] = useState<PaginatedFuncionariosCompletos | null>(null);
  const [dashboard, setDashboard] = useState<DashboardFuncionariosCompletos | null>(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<FuncionarioCompleto | null>(null);
  const [agrupamentos, setAgrupamentos] = useState<AgrupamentoResponse | null>(null);
  const [resultadoBuscaAvancada, setResultadoBuscaAvancada] = useState<BuscaAvancadaResponse | null>(null);
  
  // Estados de loading
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingSincronizacao, setLoadingSincronizacao] = useState(false);
  const [loadingBuscaAvancada, setLoadingBuscaAvancada] = useState(false);
  const [loadingAgrupamentos, setLoadingAgrupamentos] = useState(false);
  
  // Estados de erro e conexão
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<FuncionarioCompletoFilters>(filters);

  // ✅ FUNÇÃO HELPER PARA RETRY - SEM DEPENDÊNCIAS PROBLEMÁTICAS
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = retryAttempts
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [FUNC_COMP_HOOK] ${operationName} - Tentativa ${attempt}/${maxAttempts}`);
        
        const result = await operation();
        
        setRetryCount(0);
        setIsConnected(true);
        setLastUpdate(new Date());
        
        console.log(`✅ [FUNC_COMP_HOOK] ${operationName} - Sucesso`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ [FUNC_COMP_HOOK] ${operationName} - Tentativa ${attempt} falhou:`, lastError.message);
        
        setRetryCount(attempt);
        
        if (attempt === maxAttempts) {
          setIsConnected(false);
          throw lastError;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ [FUNC_COMP_HOOK] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }, [retryAttempts]);

  // ✅ TESTE DE CONEXÃO - SEM DEPENDÊNCIAS
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔧 [FUNC_COMP_HOOK] Testando conexão...');
      const connected = await pessoalService.testConnection();
      setIsConnected(connected);
      console.log(`${connected ? '✅' : '❌'} [FUNC_COMP_HOOK] Conexão: ${connected ? 'OK' : 'FALHOU'}`);
      return connected;
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro no teste de conexão:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // ✅ CARREGAR FUNCIONÁRIOS COMPLETOS - FUNÇÃO ESTÁVEL
  const loadFuncionarios = useCallback(async (newFilters?: FuncionarioCompletoFilters) => {
    try {
      console.log('👥 [FUNC_COMP_HOOK] Carregando funcionários completos...', { newFilters });
      setLoading(true);
      setError(null);
      
      const finalFilters = { ...currentFilters, ...newFilters };
      if (mesReferencia && !finalFilters.mesReferencia) {
        finalFilters.mesReferencia = mesReferencia;
      }
      
      setCurrentFilters(finalFilters);
      
      const operation = () => pessoalService.getFuncionariosCompletos(finalFilters);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Funcionários Completos')
        : await operation();
      
      setFuncionarios(data);
      console.log('✅ [FUNC_COMP_HOOK] Funcionários completos carregados:', data);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao carregar funcionários completos:', error);
      setError(`Erro ao carregar funcionários completos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, mesReferencia, enableRetry, withRetry]);

  // ✅ CARREGAR DASHBOARD - FUNÇÃO ESTÁVEL
  const loadDashboard = useCallback(async (mes?: string) => {
    try {
      console.log('📊 [FUNC_COMP_HOOK] Carregando dashboard...', { mes });
      setLoadingDashboard(true);
      setError(null);
      
      const operation = () => pessoalService.getDashboardFuncionariosCompletos(mes || mesReferencia);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Dashboard Funcionários Completos')
        : await operation();
      
      if (data && data.resumo && typeof data.resumo.totalFuncionarios === 'number') {
        setDashboard(data);
        console.log('✅ [FUNC_COMP_HOOK] Dashboard válido definido');
      } else {
        console.warn('⚠️ [FUNC_COMP_HOOK] Dashboard retornou estrutura inválida ou vazia:', data);
        setDashboard(null);
      }
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao carregar dashboard:', error);
      setError(`Erro ao carregar dashboard: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setDashboard(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  // ✅ OUTRAS FUNÇÕES PRINCIPAIS - IMPLEMENTAÇÕES ESTÁVEIS
  const buscarPorCracha = useCallback(async (cracha: number, mes?: string) => {
    try {
      console.log('🔍 [FUNC_COMP_HOOK] Buscando por crachá:', { cracha, mes });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getFuncionarioCompletoPorCracha(cracha, mes || mesReferencia);
      
      const funcionario = enableRetry 
        ? await withRetry(operation, 'Busca por Crachá')
        : await operation();
      
      setFuncionarioSelecionado(funcionario);
      console.log('✅ [FUNC_COMP_HOOK] Funcionário encontrado:', funcionario);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao buscar por crachá:', error);
      setError(`Funcionário não encontrado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setFuncionarioSelecionado(null);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  const buscarPorCpf = useCallback(async (cpf: string, mes?: string) => {
    try {
      console.log('🔍 [FUNC_COMP_HOOK] Buscando por CPF:', { cpf, mes });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getFuncionarioCompletoPorCpf(cpf, mes || mesReferencia);
      
      const funcionario = enableRetry 
        ? await withRetry(operation, 'Busca por CPF')
        : await operation();
      
      setFuncionarioSelecionado(funcionario);
      console.log('✅ [FUNC_COMP_HOOK] Funcionário encontrado:', funcionario);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao buscar por CPF:', error);
      setError(`Funcionário não encontrado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setFuncionarioSelecionado(null);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  const buscarPorDepartamento = useCallback(async (departamento: string, newFilters?: Partial<FuncionarioCompletoFilters>) => {
    try {
      console.log('🏢 [FUNC_COMP_HOOK] Buscando por departamento:', { departamento, newFilters });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getFuncionariosPorDepartamento(departamento, newFilters);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Busca por Departamento')
        : await operation();
      
      setFuncionarios(data);
      console.log('✅ [FUNC_COMP_HOOK] Funcionários por departamento carregados:', data);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao buscar por departamento:', error);
      setError(`Erro ao buscar por departamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [enableRetry, withRetry]);

  const buscarPorSituacao = useCallback(async (situacao: 'A' | 'F' | 'D', newFilters?: Partial<FuncionarioCompletoFilters>) => {
    try {
      console.log('📊 [FUNC_COMP_HOOK] Buscando por situação:', { situacao, newFilters });
      setLoading(true);
      setError(null);
      
      const operation = () => pessoalService.getFuncionariosPorSituacaoCompleto(situacao, newFilters);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Busca por Situação')
        : await operation();
      
      setFuncionarios(data);
      console.log('✅ [FUNC_COMP_HOOK] Funcionários por situação carregados:', data);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao buscar por situação:', error);
      setError(`Erro ao buscar por situação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, [enableRetry, withRetry]);

  const sincronizar = useCallback(async (mes?: string): Promise<ResultadoSincronizacao | null> => {
    try {
      console.log('🔄 [FUNC_COMP_HOOK] Iniciando sincronização...', { mes });
      setLoadingSincronizacao(true);
      setError(null);
      
      const operation = () => pessoalService.sincronizarFuncionariosCompletos(mes || mesReferencia);
      
      const resultado = enableRetry 
        ? await withRetry(operation, 'Sincronização Funcionários Completos')
        : await operation();
      
      console.log('✅ [FUNC_COMP_HOOK] Sincronização concluída:', resultado);
      
      // Recarregar dados após sincronização sem dependências circulares
      await Promise.allSettled([
        loadFuncionarios(),
        loadDashboard()
      ]);
      
      return resultado;
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro na sincronização:', error);
      setError(`Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setLoadingSincronizacao(false);
    }
  }, [mesReferencia, enableRetry, withRetry, loadFuncionarios, loadDashboard]);

  const buscaAvancada = useCallback(async (filtros: FuncionarioCompletoFilters) => {
    try {
      console.log('🔍 [FUNC_COMP_HOOK] Realizando busca avançada...', { filtros });
      setLoadingBuscaAvancada(true);
      setError(null);
      
      const operation = () => pessoalService.buscaAvancadaFuncionariosCompletos(filtros);
      
      const resultado = enableRetry 
        ? await withRetry(operation, 'Busca Avançada')
        : await operation();
      
      setResultadoBuscaAvancada(resultado);
      
      setFuncionarios({
        data: resultado.data,
        pagination: resultado.pagination
      });
      
      console.log('✅ [FUNC_COMP_HOOK] Busca avançada concluída:', resultado);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro na busca avançada:', error);
      setError(`Erro na busca avançada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingBuscaAvancada(false);
    }
  }, [enableRetry, withRetry]);

  const loadAgrupamentos = useCallback(async (tipo: 'departamento' | 'area' | 'cidade' | 'situacao' | 'faixaSalarial', mes?: string) => {
    try {
      console.log('📊 [FUNC_COMP_HOOK] Carregando agrupamentos...', { tipo, mes });
      setLoadingAgrupamentos(true);
      setError(null);
      
      const operation = () => pessoalService.getAgrupamentos(tipo, mes || mesReferencia);
      
      const data = enableRetry 
        ? await withRetry(operation, 'Agrupamentos')
        : await operation();
      
      setAgrupamentos(data);
      console.log('✅ [FUNC_COMP_HOOK] Agrupamentos carregados:', data);
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao carregar agrupamentos:', error);
      setError(`Erro ao carregar agrupamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingAgrupamentos(false);
    }
  }, [mesReferencia, enableRetry, withRetry]);

  // ✅ PAGINAÇÃO
  const changePage = useCallback(async (page: number) => {
    const newFilters = { ...currentFilters, page };
    await loadFuncionarios(newFilters);
  }, [currentFilters, loadFuncionarios]);

  const changePageSize = useCallback(async (limit: number) => {
    const newFilters = { ...currentFilters, limit, page: 1 };
    await loadFuncionarios(newFilters);
  }, [currentFilters, loadFuncionarios]);

  // ✅ REFRESH ALL - SEM DEPENDÊNCIAS CIRCULARES
  const refreshAll = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('⚠️ [FUNC_COMP_HOOK] RefreshAll já em andamento, ignorando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      console.log('🔄 [FUNC_COMP_HOOK] Atualizando todos os dados...');
      setError(null);
      
      const connected = await testConnection();
      
      if (connected) {
        await Promise.allSettled([
          loadFuncionarios(),
          loadDashboard()
        ]);
        
        console.log('✅ [FUNC_COMP_HOOK] Todos os dados atualizados');
      } else {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      
    } catch (error) {
      console.error('❌ [FUNC_COMP_HOOK] Erro ao atualizar dados:', error);
      setError(`Erro ao atualizar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      isLoadingRef.current = false;
    }
  }, [testConnection, loadFuncionarios, loadDashboard]);

  // ✅ FUNÇÕES DE LIMPEZA
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const clearFuncionarioSelecionado = useCallback(() => {
    setFuncionarioSelecionado(null);
  }, []);

  const clearResultadoBusca = useCallback(() => {
    setResultadoBuscaAvancada(null);
  }, []);

  const clearAgrupamentos = useCallback(() => {
    setAgrupamentos(null);
  }, []);

  // ✅ CARREGAMENTO INICIAL - SEM DEPENDÊNCIAS PROBLEMÁTICAS
  useEffect(() => {
    if (autoLoad && !hasLoadedRef.current && !isLoadingRef.current) {
      console.log('🚀 [FUNC_COMP_HOOK] Carregamento automático iniciado');
      hasLoadedRef.current = true;
      refreshAll();
    }
  }, [autoLoad]); // ✅ APENAS autoLoad como dependência

  // ✅ REFRESH AUTOMÁTICO CONTROLADO
  useEffect(() => {
    if (refreshInterval > 0 && autoLoad) {
      console.log(`⏰ [FUNC_COMP_HOOK] Configurando refresh automático a cada ${refreshInterval}ms`);
      
      intervalRef.current = setInterval(() => {
        console.log('🔄 [FUNC_COMP_HOOK] Refresh automático executado');
        if (isConnected && !isLoadingRef.current) {
          loadDashboard();
        }
      }, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          console.log('⏹️ [FUNC_COMP_HOOK] Parando refresh automático');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, autoLoad, isConnected]); // ✅ DEPENDÊNCIAS ESTÁVEIS

  // ✅ DADOS CALCULADOS
  const hasData = dashboard && dashboard.resumo && typeof dashboard.resumo.totalFuncionarios === 'number' && dashboard.resumo.totalFuncionarios > 0;
  const totalFuncionarios = dashboard?.resumo?.totalFuncionarios || funcionarios?.pagination?.total || 0;
  const salarioMedio = dashboard?.resumo?.salarioMedio || 0;
  const funcionariosAtivos = dashboard?.resumo?.ativos || 0;
  const currentPage = funcionarios?.pagination?.page || 1;
  const totalPages = funcionarios?.pagination?.totalPages || 1;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  const performanceMetrics = pessoalService.getMetrics();

  return {
    funcionarios,
    dashboard,
    funcionarioSelecionado,
    agrupamentos,
    resultadoBuscaAvancada,
    loading,
    loadingDashboard,
    loadingSincronizacao,
    loadingBuscaAvancada,
    loadingAgrupamentos,
    error,
    isConnected,
    lastUpdate,
    retryCount,
    loadFuncionarios,
    loadDashboard,
    buscarPorCracha,
    buscarPorCpf,
    buscarPorDepartamento,
    buscarPorSituacao,
    sincronizar,
    buscaAvancada,
    loadAgrupamentos,
    clearError,
    clearFuncionarioSelecionado,
    clearResultadoBusca,
    clearAgrupamentos,
    refreshAll,
    testConnection,
    changePage,
    changePageSize,
    hasData: !!hasData,
    totalFuncionarios,
    salarioMedio,
    funcionariosAtivos,
    currentPage,
    totalPages,
    isFirstPage,
    isLastPage,
    performanceMetrics
  };
};