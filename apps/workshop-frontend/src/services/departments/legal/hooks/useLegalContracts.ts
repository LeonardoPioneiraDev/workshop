// apps/frontend/src/services/departments/legal/hooks/useLegalContracts.ts

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/client';

interface ContractFilters {
  limite?: number;
}

export function useLegalContracts(filters: ContractFilters = {}) {
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Carregando contratos com filtros:', filters);
      // Chamada API para /departamentos/juridico/contratos
      const response = await apiClient.get<any>('/departamentos/juridico/contratos', filters);
      
      console.log('📊 Contratos response (legalService):', response);
      
      // ✅ REVISÃO DA EXTRAÇÃO: A resposta é { success: true, data: { ... } }
      // O 'data' interno pode ser um único objeto ou um array (se o backend mudar)
      const contractsData = response.data.data; // Acesse a propriedade 'data' dentro do 'data' da resposta
      
      // Adapta para sempre ser um array no frontend
      setData(Array.isArray(contractsData) ? contractsData : (contractsData ? [contractsData] : []));
      // Se o backend não fornece 'count' ou 'total', use o tamanho do array
      setCount(response.count || (Array.isArray(contractsData) ? contractsData.length : (contractsData ? 1 : 0)) || 0); 
      
      console.log('✅ Contratos carregados:', data.length, `(${count} total)`); // Use as variáveis de estado aqui
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar contratos';
      console.error('❌ Erro ao carregar contratos:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  const refetch = useCallback(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return {
    data,
    count,
    loading,
    error,
    refetch
  };
}