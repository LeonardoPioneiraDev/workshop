// apps/frontend/src/services/departments/legal/hooks/useAgentes.ts

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Agente } from '../types';

interface UseAgentesReturn {
  agentes: Agente[];
  loading: boolean;
  error: string | null;
  recarregar: () => void;
  filtrarAgentes: (filtros: any) => void;
  totalAgentes: number;
  agentesAtivos: number;
  agentesInativos: number;
}

interface FiltrosAgentes {
  ativo?: boolean;
  busca?: string;
  setor?: number;
  matricula?: string;
}

export function useAgentes(filtrosIniciais?: FiltrosAgentes): UseAgentesReturn {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosAgentes>(filtrosIniciais || {});

  const carregarAgentes = async (filtrosAtivos?: FiltrosAgentes) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosParaEnviar = filtrosAtivos || filtros;
      
      // Construir query string para a API
      const queryParams = new URLSearchParams();
      
      if (filtrosParaEnviar.ativo !== undefined) {
        queryParams.append('ativo', filtrosParaEnviar.ativo.toString());
      }
      
      if (filtrosParaEnviar.busca) {
        queryParams.append('busca', filtrosParaEnviar.busca);
      }
      
      if (filtrosParaEnviar.setor) {
        queryParams.append('setor', filtrosParaEnviar.setor.toString());
      }
      
      if (filtrosParaEnviar.matricula) {
        queryParams.append('matricula', filtrosParaEnviar.matricula);
      }

      // Fazer chamada para a API
      const response = await api.get(`/juridico/agentes?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        setAgentes(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Erro ao carregar agentes');
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar agentes:', err);
      
      if (err.response?.status === 404) {
        setError('Endpoint de agentes não encontrado. Verifique se a API está configurada.');
      } else if (err.response?.status === 500) {
        setError('Erro interno do servidor ao carregar agentes.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError(err.message || 'Erro desconhecido ao carregar agentes');
      }
      
      // Em caso de erro, definir array vazio
      setAgentes([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarAgentes = (novosFiltros: FiltrosAgentes) => {
    setFiltros(novosFiltros);
    carregarAgentes(novosFiltros);
  };

  const recarregar = () => {
    carregarAgentes();
  };

  useEffect(() => {
    carregarAgentes();
  }, []);

  // Calcular estatísticas
  const totalAgentes = agentes.length;
  const agentesAtivos = agentes.filter(a => a.ativo).length;
  const agentesInativos = agentes.filter(a => !a.ativo).length;

  return {
    agentes,
    loading,
    error,
    recarregar,
    filtrarAgentes,
    totalAgentes,
    agentesAtivos,
    agentesInativos
  };
}

export default useAgentes;