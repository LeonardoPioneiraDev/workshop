// src/hooks/useSufisaData.ts
import { useState, useEffect, useCallback } from 'react';
import { multasSufisaService, MultasSufisaFilters, SufisaStats } from '@/services/departments/legal/multasSufisaService';

export const useSufisaData = () => {
  const [multas, setMultas] = useState([]);
  const [stats, setStats] = useState<SufisaStats | null>(null);
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MultasSufisaFilters>({});

  const fetchData = useCallback(async (newFilters: MultasSufisaFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const [multasResponse, statsResponse, agentesResponse] = await Promise.all([
        multasSufisaService.buscarMultasSufisa(newFilters),
        multasSufisaService.obterEstatisticasSufisa(newFilters),
        multasSufisaService.buscarAgentesSufisa()
      ]);

      setMultas(multasResponse.data);
      setStats(statsResponse);
      setAgentes(agentesResponse);
      setFilters(newFilters);
    } catch (err) {
      console.error('Erro ao buscar dados SUFISA:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = useCallback((newFilters: MultasSufisaFilters) => {
    fetchData(newFilters);
  }, [fetchData]);

  const exportData = useCallback(async (formato: 'excel' | 'csv' | 'pdf' = 'excel') => {
    try {
      const blob = await multasSufisaService.exportarDadosSufisa(filters, formato);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sufisa-${new Date().toISOString().split('T')[0]}.${formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      throw err;
    }
  }, [filters]);

  return {
    multas,
    stats,
    agentes,
    loading,
    error,
    filters,
    applyFilters,
    refetch: () => fetchData(filters),
    exportData
  };
};