import { useState, useEffect, useCallback } from 'react';
import { funcionariosCompletosService, FuncionarioCompleto, FuncionariosCompletosFilters } from '../funcionariosCompletosService';

export const useFuncionariosCompletos = (initialFilters?: FuncionariosCompletosFilters) => {
  const [funcionarios, setFuncionarios] = useState<FuncionarioCompleto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState<any>(null);
  
  // ✅ CONFIGURAR FILTROS PADRÃO SEM LIMITE
  const [filters, setFilters] = useState<FuncionariosCompletosFilters>({
    page: 1,
    limit: 50000, // ✅ LIMITE MUITO ALTO PARA PEGAR TODOS
    ...initialFilters
  });

  const fetchFuncionarios = useCallback(async (newFilters?: FuncionariosCompletosFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = {
        page: 1,
        limit: 50000, // ✅ GARANTIR LIMITE ALTO
        ...filters,
        ...newFilters
      };
      
      console.log('🔄 Buscando funcionários com filtros:', filtersToUse);
      
      const response = await funcionariosCompletosService.getFuncionariosCompletos(filtersToUse);
      
      console.log('📊 Resposta do serviço:', response);
      
      if (response.success) {
        setFuncionarios(response.data);
        setTotalRecords(response.pagination?.total || response.data.length);
        setPagination(response.pagination);
      } else {
        setError('Erro ao carregar funcionários');
        setFuncionarios([]);
      }
    } catch (err: any) {
      console.error('❌ Erro no hook:', err);
      setError(err.message || 'Erro desconhecido');
      setFuncionarios([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<FuncionariosCompletosFilters>) => {
    const updatedFilters = { 
      ...filters, 
      ...newFilters,
      // ✅ MANTER LIMITE ALTO MESMO COM NOVOS FILTROS
      limit: newFilters.limit || 50000
    };
    setFilters(updatedFilters);
    fetchFuncionarios(updatedFilters);
  }, [filters, fetchFuncionarios]);

  const exportData = useCallback(async (format: 'excel' | 'pdf' = 'excel') => {
    try {
      setLoading(true);
      await funcionariosCompletosService.exportFuncionarios(filters, format);
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  return {
    funcionarios,
    loading,
    error,
    totalRecords,
    pagination,
    filters,
    updateFilters,
    refetch: fetchFuncionarios,
    exportData
  };
};