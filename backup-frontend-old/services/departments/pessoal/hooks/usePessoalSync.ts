// apps/frontend/src/services/departments/pessoal/hooks/usePessoalSync.ts
import { useState, useCallback, useRef } from 'react';
import { pessoalService } from '../pessoalService';

interface SyncStatus {
  status: 'success' | 'error' | 'running' | 'idle';
  message: string;
  lastSync?: string;
  recordsProcessed?: number;
  errors?: string[];
  duration?: number;
}

export function usePessoalSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  
  // ✅ REF PARA EVITAR MÚLTIPLAS SINCRONIZAÇÕES SIMULTÂNEAS
  const isSyncingRef = useRef(false);

  const syncData = useCallback(async (tipo?: 'basico' | 'completo' | 'multiplos' | 'acumulado', params?: any): Promise<SyncStatus> => {
    // ✅ PREVENIR MÚLTIPLAS SINCRONIZAÇÕES
    if (isSyncingRef.current) {
      console.log('⚠️ [PESSOAL_SYNC] Sincronização já em andamento, ignorando...');
      return {
        status: 'error',
        message: 'Sincronização já em andamento'
      };
    }

    try {
      isSyncingRef.current = true;
      setIsLoading(true);
      
      console.log(`🔄 [PESSOAL_SYNC] Iniciando sincronização tipo: ${tipo || 'basico'}`);
      
      let result: any;
      const startTime = Date.now();

      switch (tipo) {
        case 'completo':
          result = await pessoalService.sincronizarFuncionariosCompletos();
          break;
        case 'multiplos':
          result = await pessoalService.sincronizarMultiplos(params?.dataReferencia, params?.forcar);
          break;
        case 'acumulado':
          result = await pessoalService.sincronizarAcumulado(params?.mesReferencia, params?.forcar);
          break;
        default:
          result = await pessoalService.sincronizar(params?.mesReferencia, params?.forcar);
      }

      const duration = Date.now() - startTime;
      const now = new Date().toISOString();
      
      setLastSync(now);
      
      const syncStatus: SyncStatus = {
        status: 'success',
        message: `Sincronização ${tipo || 'básica'} concluída com sucesso`,
        lastSync: now,
        recordsProcessed: result?.totalProcessados || result?.novos || 0,
        duration
      };
      
      setSyncHistory(prev => [syncStatus, ...prev.slice(0, 9)]); // Manter últimas 10 sincronizações
      
      console.log(`✅ [PESSOAL_SYNC] Sincronização concluída em ${duration}ms:`, syncStatus);
      
      return syncStatus;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [PESSOAL_SYNC] Erro na sincronização:', errorMessage);
      
      const syncStatus: SyncStatus = {
        status: 'error',
        message: `Erro na sincronização ${tipo || 'básica'}: ${errorMessage}`,
        errors: [errorMessage]
      };
      
      setSyncHistory(prev => [syncStatus, ...prev.slice(0, 9)]);
      
      throw error;
    } finally {
      setIsLoading(false);
      isSyncingRef.current = false;
    }
  }, []);

  // ✅ FUNÇÕES ESPECÍFICAS DE SINCRONIZAÇÃO
  const syncBasico = useCallback((mesReferencia?: string, forcar?: boolean) => 
    syncData('basico', { mesReferencia, forcar }), [syncData]);
  
  const syncCompleto = useCallback((mesReferencia?: string) => 
    syncData('completo', { mesReferencia }), [syncData]);
  
  const syncMultiplos = useCallback((dataReferencia?: string, forcar?: boolean) => 
    syncData('multiplos', { dataReferencia, forcar }), [syncData]);
  
  const syncAcumulado = useCallback((mesReferencia?: string, forcar?: boolean) => 
    syncData('acumulado', { mesReferencia, forcar }), [syncData]);

  // ✅ FUNÇÃO PARA LIMPAR HISTÓRICO
  const clearHistory = useCallback(() => {
    setSyncHistory([]);
  }, []);

  // ✅ FUNÇÃO PARA OBTER STATUS ATUAL
  const getCurrentStatus = useCallback((): SyncStatus => {
    if (isLoading) {
      return {
        status: 'running',
        message: 'Sincronização em andamento...'
      };
    }
    
    if (syncHistory.length > 0) {
      return syncHistory[0];
    }
    
    return {
      status: 'idle',
      message: 'Nenhuma sincronização executada'
    };
  }, [isLoading, syncHistory]);

  return {
    isLoading,
    lastSync,
    syncHistory,
    syncData,
    syncBasico,
    syncCompleto,
    syncMultiplos,
    syncAcumulado,
    clearHistory,
    getCurrentStatus
  };
}