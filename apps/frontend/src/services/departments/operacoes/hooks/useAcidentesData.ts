// src/services/departments/operacoes/hooks/useAcidentesData.ts
import { useState, useCallback } from 'react';
import { acidentesApi } from '../api/acidentesApi';
import type { FiltrosAcidentes, Acidente, EstatisticasAcidentes } from '@/types/departments/operacoes';
import type { ValoresDistintos } from '../api/acidentesApi';

export function useAcidentesData() {
  const [acidentes, setAcidentes] = useState<Acidente[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAcidentes | null>(null);
  const [valoresFiltros, setValoresFiltros] = useState<ValoresDistintos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const buscarAcidentes = useCallback(async (filtros: FiltrosAcidentes) => {
    setLoading(true);
    setError(null);
    try {
      const response = await acidentesApi.buscarAcidentes(filtros);
      setAcidentes(response.data);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('❌ Erro ao buscar acidentes:', err);
      setError(err.message || 'Erro ao buscar acidentes');
      setAcidentes([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarEstatisticas = useCallback(async (filtros: FiltrosAcidentes) => {
    setError(null);
    try {
      const response = await acidentesApi.obterEstatisticas(filtros);
      setEstatisticas(response);
    } catch (err: any) {
      console.error('❌ Erro ao carregar estatísticas de acidentes:', err);
      setError(err.message || 'Erro ao carregar estatísticas');
      setEstatisticas(null);
    }
  }, []);

  const carregarValoresFiltros = useCallback(async () => {
    setError(null);
    try {
      const response = await acidentesApi.obterValoresFiltros();
      setValoresFiltros(response);
    } catch (err: any) {
      console.error('❌ Erro ao carregar valores de filtros:', err);
      setError(err.message || 'Erro ao carregar opções de filtro');
      setValoresFiltros(null);
    }
  }, []);

  const sincronizarAcidentes = useCallback(async (dataInicio?: string, dataFim?: string) => {
    setLoading(true); // Pode usar um loading separado para a sincronização
    setError(null);
    try {
      const result = await acidentesApi.sincronizarAcidentes(dataInicio, dataFim);
      console.log('✅ Sincronização de acidentes concluída:', result);
      return result;
    } catch (err: any) {
      console.error('❌ Erro ao sincronizar acidentes:', err);
      setError(err.message || 'Erro ao sincronizar acidentes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    acidentes,
    estatisticas,
    valoresFiltros,
    loading,
    error,
    totalPages,
    total,
    buscarAcidentes,
    carregarEstatisticas,
    carregarValoresFiltros,
    sincronizarAcidentes
  };
}