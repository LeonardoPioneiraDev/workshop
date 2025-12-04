// src/services/departments/operacoes/hooks/useFrotaData.ts
import { useState, useEffect, useCallback } from 'react';
import { frotaApi } from '../api/frotaApi';
import type { FiltrosFrota, VeiculoOperacional, EstatisticasFrota } from '@/types/departments/operacoes';
import type { HistoricoVeiculo } from '../api/frotaApi';

export function useFrotaData() {
  const [veiculos, setVeiculos] = useState<VeiculoOperacional[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasFrota | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const buscarFrota = useCallback(async (filtros: FiltrosFrota) => {
    setLoading(true);
    setError(null);
    try {
      const response = await frotaApi.buscarFrota(filtros);
      setVeiculos(response.data);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);

      // Também buscar estatísticas junto com a frota
      const statsResponse = await frotaApi.obterEstatisticas();
      setEstatisticas(statsResponse);

    } catch (err: any) {
      console.error('❌ Erro ao buscar frota:', err);
      setError(err.message || 'Erro ao buscar frota');
      setVeiculos([]); // Limpa os veículos em caso de erro
      setTotal(0);
      setTotalPages(1);
      setEstatisticas(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const sincronizarFrota = useCallback(async (data?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await frotaApi.sincronizarFrota(data);
      console.log('✅ Sincronização da frota concluída:', result);
      // Após sincronizar, recarregar a frota
      // Considerar usar um `toast` aqui para feedback ao usuário
      return result;
    } catch (err: any) {
      console.error('❌ Erro ao sincronizar frota:', err);
      setError(err.message || 'Erro ao sincronizar frota');
      throw err; // Propaga o erro para quem chamou
    } finally {
      setLoading(false);
    }
  }, []);

  const obterHistoricoVeiculo = useCallback(async (prefixo: string, limite?: number): Promise<HistoricoVeiculo[]> => {
    setLoading(true); // Pode ser um loading local para o modal
    setError(null);
    try {
      const historico = await frotaApi.obterHistoricoVeiculo(prefixo, limite);
      return historico;
    } catch (err: any) {
      console.error(`❌ Erro ao obter histórico do veículo ${prefixo}:`, err);
      setError(err.message || 'Erro ao obter histórico do veículo');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    veiculos,
    estatisticas,
    loading,
    error,
    totalPages,
    total,
    buscarFrota,
    sincronizarFrota,
    obterHistoricoVeiculo
  };
}