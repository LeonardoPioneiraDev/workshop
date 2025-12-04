// apps/frontend/src/services/departments/legal/hooks/useLegalProcesses.ts

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/client';

interface ProcessFilters {
  limite?: number;
}

export function useLegalProcesses(filters: ProcessFilters = {}) {
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('⚖️ Carregando processos com filtros:', filters);
      // Chamada API para /departamentos/juridico/processos
      const response = await apiClient.get<any>('/departamentos/juridico/processos', filters);
      
      console.log('📊 Processos response (legalService):', response);
      
      // ✅ REVISÃO DA EXTRAÇÃO: A resposta é { success: true, data: { ... } }
      // O 'data' interno pode ser um único objeto ou um array (se o backend mudar)
      const processesData = response.data.data; // Acesse a propriedade 'data' dentro do 'data' da resposta
      
      // Adapta para sempre ser um array no frontend
      setData(Array.isArray(processesData) ? processesData : (processesData ? [processesData] : []));
      // Se o backend não fornece 'count' ou 'total', use o tamanho do array
      setCount(response.count || (Array.isArray(processesData) ? processesData.length : (processesData ? 1 : 0)) || 0); 
      
      console.log('✅ Processos carregados:', data.length, `(${count} total)`); // Use as variáveis de estado aqui
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar processos';
      console.error('❌ Erro ao carregar processos:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  const refetch = useCallback(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  return {
    data,
    count,
    loading,
    error,
    refetch
  };
}