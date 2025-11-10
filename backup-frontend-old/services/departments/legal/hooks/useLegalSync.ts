// apps/frontend/src/services/departments/legal/hooks/useLegalSync.ts
import { useState } from 'react';
import { apiClient } from '../../../api/client';

interface SyncStatus {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  lastSync: string | null;
  totalRecords: number;
}

export function useLegalSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    isSuccess: false,
    error: null,
    lastSync: null,
    totalRecords: 0
  });

  // ✅ Executar sincronização do Oracle para PostgreSQL
  const executarSincronizacao = async () => {
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🔄 Iniciando sincronização Oracle → PostgreSQL...');
      
      // Endpoint para sincronizar dados
      const response = await apiClient.post('/departamentos/juridico/gestao/sync/executar');
      
      console.log('✅ Sincronização concluída:', response);
      
      setSyncStatus({
        isLoading: false,
        isSuccess: true,
        error: null,
        lastSync: new Date().toISOString(),
        totalRecords: response.totalRecords || 0
      });
      
      return response;
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      
      setSyncStatus({
        isLoading: false,
        isSuccess: false,
        error: error.message || 'Erro na sincronização',
        lastSync: null,
        totalRecords: 0
      });
      
      throw error;
    }
  };

  // ✅ Verificar status da sincronização
  const verificarStatus = async () => {
    try {
      const response = await apiClient.get('/departamentos/juridico/gestao/monitoramento');
      console.log('�� Status do sistema:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  };

  // ✅ Obter informações do cache
  const obterInfoCache = async () => {
    try {
      const response = await apiClient.get('/departamentos/juridico/cache/info');
      console.log('💾 Informações do cache:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter info do cache:', error);
      throw error;
    }
  };

  return {
    syncStatus,
    executarSincronizacao,
    verificarStatus,
    obterInfoCache
  };
}