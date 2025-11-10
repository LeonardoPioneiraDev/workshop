// apps/frontend/src/services/departments/legal/hooks/useEstatisticasAgentes.ts

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface EstatisticasAgentes {
  totalAgentes: number;
  agentesAtivos: number;
  agentesInativos: number;
  mediaMultasPorAgente: number;
  valorMedioPorAgente: number;
  topPerformers: Array<{
    codigo: string;
    nome: string;
    totalMultas: number;
    valorTotal: number;
  }>;
  distribuicaoPorSetor: Array<{
    setor: string;
    quantidade: number;
    percentual: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    novosAgentes: number;
    agentesAtivos: number;
  }>;
}

export function useEstatisticasAgentes() {
  const [estatisticas, setEstatisticas] = useState<EstatisticasAgentes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/juridico/agentes/estatisticas');
      
      if (response.data && response.data.success) {
        setEstatisticas(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Erro ao carregar estatísticas');
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas de agentes:', err);
      setError(err.message || 'Erro ao carregar estatísticas');
      setEstatisticas(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  return {
    estatisticas,
    loading,
    error,
    recarregar: carregarEstatisticas
  };
}