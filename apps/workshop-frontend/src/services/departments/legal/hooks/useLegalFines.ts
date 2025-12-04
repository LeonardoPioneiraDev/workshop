// apps/frontend/src/services/departments/legal/hooks/useLegalFines.ts - AJUSTADO PARA MULTACOMPLETA

import { useState, useEffect, useCallback } from 'react';
import { multasCompletasService, MultaCompletaFilter, MultaCompleta } from '../multasCompletasService';

interface FineFilters {
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  dataInicio?: string;
  dataFim?: string;
  situacao?: string;
}

export function useLegalFines(filters: FineFilters = {}) {
  // O tipo do 'data' agora é um array de MultaCompleta
  const [data, setData] = useState<MultaCompleta[]>([]); 
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Definindo filtros padrão com um período mais amplo
      const multaFilters: MultaCompletaFilter = {
        dataInicio: filters.dataInicio || '2025-01-01', // Começo do ano
        dataFim: filters.dataFim || '2025-12-31',     // Fim do ano
        limit: filters.limit || 5,
        page: filters.page || 1,
        orderBy: filters.orderBy || 'dataEmissaoMulta', 
        orderDirection: filters.orderDirection || 'DESC',
        situacao: filters.situacao
      };
      
      console.log('🔄 Carregando multas com filtros:', multaFilters);
      
      // Chamando o serviço de multas completas
      const response = await multasCompletasService.buscarMultasCompletas(multaFilters);
      console.log('📊 Multas response (multasCompletas):', response);
      
      // A API já retorna um array de MultaCompleta em response.data
      const finesData = response.data || [];
      setData(Array.isArray(finesData) ? finesData : []);
      setCount(response.pagination?.total || finesData.length || 0); // Usando a contagem total da paginação
      
      console.log(`✅ Multas carregadas: ${finesData.length} (${response.pagination?.total || 0} total)`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar multas';
      console.error('❌ Erro ao carregar multas:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // Serializar filtros para useCallback

  const refetch = useCallback(() => {
    fetchFines();
  }, [fetchFines]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  return {
    data,
    count,
    loading,
    error,
    refetch
  };
}