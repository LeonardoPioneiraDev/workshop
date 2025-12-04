// src/services/departments/hooks/useDepartamentosData.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  departamentosService,
  type DepartamentosResponse,
  type StatusDepartamentosResponse,
  type DashboardGeralResponse,
  type DashboardExecutivoResponse
} from '../departamentosService';

interface UseDepartamentosDataOptions {
  autoLoad?: boolean;
  refreshInterval?: number; // em milissegundos
}

interface UseDepartamentosDataReturn {
  // Dados
  departamentos: DepartamentosResponse['data'] | null;
  statusDepartamentos: StatusDepartamentosResponse['data'] | null;
  dashboardGeral: DashboardGeralResponse['data'] | null;
  dashboardExecutivo: DashboardExecutivoResponse['data'] | null;
  
  // Estados de loading
  loadingDepartamentos: boolean;
  loadingStatus: boolean;
  loadingDashboardGeral: boolean;
  loadingDashboardExecutivo: boolean;
  
  // Erro
  error: string | null;
  
  // Ações
  loadDepartamentos: () => Promise<void>;
  loadStatusDepartamentos: () => Promise<void>;
  loadDashboardGeral: (incluirDetalhes?: boolean) => Promise<void>;
  loadDashboardExecutivo: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  
  // Dados calculados
  totalDepartamentos: number;
  departamentosAtivos: number;
  sistemaOperacional: boolean;
  ultimaAtualizacao: string | null;
}

export const useDepartamentosData = (options: UseDepartamentosDataOptions = {}): UseDepartamentosDataReturn => {
  const { autoLoad = true, refreshInterval } = options;

  // Estados
  const [departamentos, setDepartamentos] = useState<DepartamentosResponse['data'] | null>(null);
  const [statusDepartamentos, setStatusDepartamentos] = useState<StatusDepartamentosResponse['data'] | null>(null);
  const [dashboardGeral, setDashboardGeral] = useState<DashboardGeralResponse['data'] | null>(null);
  const [dashboardExecutivo, setDashboardExecutivo] = useState<DashboardExecutivoResponse['data'] | null>(null);
  
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDashboardGeral, setLoadingDashboardGeral] = useState(false);
  const [loadingDashboardExecutivo, setLoadingDashboardExecutivo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CARREGAR DEPARTAMENTOS
  const loadDepartamentos = useCallback(async () => {
    try {
      console.log('🏢 [DEPARTAMENTOS_HOOK] Carregando departamentos...');
      setLoadingDepartamentos(true);
      setError(null);
      
      const response = await departamentosService.getDepartamentos();
      setDepartamentos(response.data);
      
      console.log('✅ [DEPARTAMENTOS_HOOK] Departamentos carregados:', response.data);
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_HOOK] Erro ao carregar departamentos:', error);
      setError(`Erro ao carregar departamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingDepartamentos(false);
    }
  }, []);

  // ✅ CARREGAR STATUS DOS DEPARTAMENTOS
  const loadStatusDepartamentos = useCallback(async () => {
    try {
      console.log('📊 [DEPARTAMENTOS_HOOK] Carregando status dos departamentos...');
      setLoadingStatus(true);
      setError(null);
      
      const response = await departamentosService.getStatusDepartamentos();
      setStatusDepartamentos(response.data);
      
      console.log('✅ [DEPARTAMENTOS_HOOK] Status carregado:', response.data);
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_HOOK] Erro ao carregar status:', error);
      setError(`Erro ao carregar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // ✅ CARREGAR DASHBOARD GERAL
  const loadDashboardGeral = useCallback(async (incluirDetalhes: boolean = false) => {
    try {
      console.log('📊 [DEPARTAMENTOS_HOOK] Carregando dashboard geral...', { incluirDetalhes });
      setLoadingDashboardGeral(true);
      setError(null);
      
      const response = await departamentosService.getDashboardGeral(incluirDetalhes);
      setDashboardGeral(response.data);
      
      console.log('✅ [DEPARTAMENTOS_HOOK] Dashboard geral carregado:', response.data);
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_HOOK] Erro ao carregar dashboard geral:', error);
      setError(`Erro no dashboard geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingDashboardGeral(false);
    }
  }, []);

  // ✅ CARREGAR DASHBOARD EXECUTIVO
  const loadDashboardExecutivo = useCallback(async () => {
    try {
      console.log('📊 [DEPARTAMENTOS_HOOK] Carregando dashboard executivo...');
      setLoadingDashboardExecutivo(true);
      setError(null);
      
      const response = await departamentosService.getDashboardExecutivo();
      setDashboardExecutivo(response.data);
      
      console.log('✅ [DEPARTAMENTOS_HOOK] Dashboard executivo carregado:', response.data);
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_HOOK] Erro ao carregar dashboard executivo:', error);
      setError(`Erro no dashboard executivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingDashboardExecutivo(false);
    }
  }, []);

  // ✅ ATUALIZAR TODOS OS DADOS
  const refreshAll = useCallback(async () => {
    try {
      console.log('🔄 [DEPARTAMENTOS_HOOK] Atualizando todos os dados...');
      
      await Promise.allSettled([
        loadDepartamentos(),
        loadStatusDepartamentos(),
        loadDashboardGeral(false),
        loadDashboardExecutivo()
      ]);
      
      console.log('✅ [DEPARTAMENTOS_HOOK] Todos os dados atualizados');
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_HOOK] Erro ao atualizar dados:', error);
    }
  }, [loadDepartamentos, loadStatusDepartamentos, loadDashboardGeral, loadDashboardExecutivo]);

  // ✅ LIMPAR ERRO
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ CARREGAR DADOS INICIAIS
  useEffect(() => {
    if (autoLoad) {
      console.log('🚀 [DEPARTAMENTOS_HOOK] Carregamento automático iniciado');
      refreshAll();
    }
  }, [autoLoad, refreshAll]);

  // ✅ CONFIGURAR REFRESH AUTOMÁTICO
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      console.log(`⏰ [DEPARTAMENTOS_HOOK] Configurando refresh automático: ${refreshInterval}ms`);
      
      const intervalId = setInterval(() => {
        console.log('🔄 [DEPARTAMENTOS_HOOK] Refresh automático executado');
        refreshAll();
      }, refreshInterval);

      return () => {
        console.log('🛑 [DEPARTAMENTOS_HOOK] Limpando refresh automático');
        clearInterval(intervalId);
      };
    }
  }, [refreshInterval, refreshAll]);

  // ✅ DADOS CALCULADOS
  const totalDepartamentos = statusDepartamentos?.resumo?.totalDepartamentos || 0;
  const departamentosAtivos = statusDepartamentos?.resumo?.departamentosAtivos || 0;
  const sistemaOperacional = departamentosAtivos > 0;
  const ultimaAtualizacao = dashboardExecutivo?.metadados?.ultimaAtualizacao || null;

  return {
    // Dados
    departamentos,
    statusDepartamentos,
    dashboardGeral,
    dashboardExecutivo,
    
    // Estados de loading
    loadingDepartamentos,
    loadingStatus,
    loadingDashboardGeral,
    loadingDashboardExecutivo,
    
    // Erro
    error,
    
    // Ações
    loadDepartamentos,
    loadStatusDepartamentos,
    loadDashboardGeral,
    loadDashboardExecutivo,
    refreshAll,
    clearError,
    
    // Dados calculados
    totalDepartamentos,
    departamentosAtivos,
    sistemaOperacional,
    ultimaAtualizacao
  };
};