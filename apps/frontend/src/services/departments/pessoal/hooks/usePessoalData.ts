// src/services/departments/pessoal/hooks/usePessoalData.ts
import { useState, useEffect, useCallback } from 'react';
import { PessoalService } from '../pessoalService';
import type { FiltrosPessoal, DashboardPessoal } from '../../../../types/departments/pessoal';

interface UsePessoalDataReturn {
  dashboard: DashboardPessoal | null;
  funcionarios: any[];
  agrupamentos: any[];
  statusCache: any[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  sincronizar: (params?: { mesReferencia?: string; forcar?: boolean }) => Promise<void>;
}

export const usePessoalData = (): {
  useDashboard: (mesReferencia?: string, forcar?: boolean) => {
    data: DashboardPessoal | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  useFuncionariosCompletos: (filtros: FiltrosPessoal) => {
    data: any;
    isLoading: boolean;
    error: string | null;
  };
  useAgrupamentos: (tipo: string, mesReferencia?: string) => {
    data: any[];
    isLoading: boolean;
  };
  useStatusCache: () => {
    data: any[];
    isLoading: boolean;
  };
  useSincronizar: () => {
    mutate: (params: any) => Promise<void>;
    isPending: boolean;
  };
  useBuscaAvancada: () => {
    mutate: (filtros: FiltrosPessoal) => Promise<any>;
  };
} => {

  // Dashboard hook
  const useDashboard = (mesReferencia?: string, forcar?: boolean) => {
    const [data, setData] = useState<DashboardPessoal | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await PessoalService.getDashboard(mesReferencia, forcar);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dashboard');
        console.error('Erro no dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }, [mesReferencia, forcar]);

    useEffect(() => {
      fetchDashboard();
    }, [fetchDashboard]);

    return {
      data,
      isLoading,
      error,
      refetch: fetchDashboard
    };
  };

  // Funcionários hook
  const useFuncionariosCompletos = (filtros: FiltrosPessoal = {}) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchFuncionarios = async () => {
        if (Object.keys(filtros).length === 0) return;
        
        try {
          setIsLoading(true);
          setError(null);
          const result = await PessoalService.getFuncionariosCompletos(filtros);
          setData(result);
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar funcionários');
          console.error('Erro nos funcionários:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFuncionarios();
    }, [JSON.stringify(filtros)]);

    return { data, isLoading, error };
  };

  // Agrupamentos hook
  const useAgrupamentos = (tipo: string, mesReferencia?: string) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      const fetchAgrupamentos = async () => {
        try {
          setIsLoading(true);
          const result = await PessoalService.getAgrupamentos(tipo as any, mesReferencia);
          setData(result);
        } catch (err) {
          console.error('Erro nos agrupamentos:', err);
          setData([]);
        } finally {
          setIsLoading(false);
        }
      };

      if (tipo) {
        fetchAgrupamentos();
      }
    }, [tipo, mesReferencia]);

    return { data, isLoading };
  };

  // Status cache hook
  const useStatusCache = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      const fetchStatus = async () => {
        try {
          setIsLoading(true);
          const result = await PessoalService.getStatusCache();
          setData(result);
        } catch (err) {
          console.error('Erro no status cache:', err);
          setData([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStatus();
    }, []);

    return { data, isLoading };
  };

  // Sincronizar hook
  const useSincronizar = () => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async (params: { mesReferencia?: string; forcar?: boolean }) => {
      try {
        setIsPending(true);
        await PessoalService.sincronizar(params.mesReferencia, params.forcar);
        // Aqui você pode adicionar uma notificação de sucesso
        console.log('Sincronização concluída com sucesso');
      } catch (error: any) {
        console.error('Erro na sincronização:', error);
        throw error;
      } finally {
        setIsPending(false);
      }
    };

    return { mutate, isPending };
  };

  // Busca avançada hook
  const useBuscaAvancada = () => {
    const mutate = async (filtros: FiltrosPessoal) => {
      try {
        const result = await PessoalService.buscaAvancada(filtros);
        return result;
      } catch (error: any) {
        console.error('Erro na busca avançada:', error);
        throw error;
      }
    };

    return { mutate };
  };

  return {
    useDashboard,
    useFuncionariosCompletos,
    useAgrupamentos,
    useStatusCache,
    useSincronizar,
    useBuscaAvancada,
  };
};