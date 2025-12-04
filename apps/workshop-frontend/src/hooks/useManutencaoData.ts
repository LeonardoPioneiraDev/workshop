// src/hooks/useManutencaoData.ts
import { useState, useEffect, useCallback } from 'react';
import { manutencaoApi } from '@/services/departments/manutencao/api/manutencaoApi';
import type { 
  OrdemServico, 
  FiltrosOS, 
  EstatisticasOS,
  RespostaOSData 
} from '@/services/departments/manutencao/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UseManutencaoDataProps {
  filtrosIniciais?: FiltrosOS;
  autoCarregar?: boolean;
}

interface UseManutencaoDataReturn {
  ordensServico: OrdemServico[];
  estatisticas: EstatisticasOS | null;
  filtros: FiltrosOS;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  totalPages: number;
  totalRegistros: number;
  setFiltros: (filtros: FiltrosOS | ((prev: FiltrosOS) => FiltrosOS)) => void;
  carregar: () => Promise<void>;
  sincronizar: () => Promise<void>;
  buscarPorNumero: (numeroOS: string) => Promise<void>;
  buscarPorPrefixo: (prefixo: string) => Promise<void>;
  buscarPorPlaca: (placa: string) => Promise<void>;
  limparFiltros: () => void;
}

export function useManutencaoData({
  filtrosIniciais = {},
  autoCarregar = false
}: UseManutencaoDataProps = {}): UseManutencaoDataReturn {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasOS | null>(null);
  
  // ✅ CORREÇÃO: Filtros padrão para carregar mais dados
  const [filtros, setFiltros] = useState<FiltrosOS>({
    startDate: '2025-01-01', // ✅ Ano inteiro
    endDate: '2025-12-31', // ✅ CORREÇÃO: Ano completo
    page: 1,
    limit: 50000, // ✅ Limite muito alto
    ...filtrosIniciais
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const carregar = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Carregando dados com filtros:', filtros);

      // ✅ CORREÇÃO: Usar novo método buscarTodasOS
      const response: RespostaOSData = await manutencaoApi.buscarTodasOS(filtros);
      
      console.log('📊 Resposta da API:', response);
      
      if (response.success) {
        // Garantir que sempre temos um array
        const dados = Array.isArray(response.data) ? response.data : [];
        
        setOrdensServico(dados);
        setEstatisticas(response.statistics || null);
        setTotalRegistros(response.totalRegistros || response.totalCount || dados.length);
        setTotalPages(response.totalPages || Math.ceil(dados.length / (filtros.limit || 50000)));

        if (dados.length > 0) {
          toast.success(`${dados.length} ordens de serviço carregadas!`);
          console.log('✅ Dados carregados:', dados.length, 'registros');
        } else {
          toast.info('Nenhuma ordem de serviço encontrada no período');
          console.log('⚠️ Nenhum dado encontrado');
        }
      } else {
        throw new Error(response.message || 'Erro na resposta da API');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(message);
      toast.error('Erro ao carregar dados', { description: message });
      console.error('❌ Erro ao carregar ordens de serviço:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  const sincronizar = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      console.log('🔄 Iniciando sincronização...');
      
      // ✅ CORREÇÃO: Usar novo método sincronizarDoGlobus
      await manutencaoApi.sincronizarDoGlobus({
        startDate: filtros.startDate,
        endDate: filtros.endDate,
        garagens: filtros.garagens,
        origens: filtros.origens,
        setor_codigo: filtros.setor_codigo,
        limit: 50000 // ✅ Limite alto para sincronização
      });

      toast.success('Sincronização concluída!');
      console.log('✅ Sincronização concluída');
      await carregar();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro na sincronização';
      toast.error('Erro na sincronização', { description: message });
      console.error('❌ Erro ao sincronizar:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [filtros, carregar]);

  const buscarPorNumero = useCallback(async (numeroOS: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ CORREÇÃO: Usar buscarTodasOS com filtro de número
      const response = await manutencaoApi.buscarTodasOS({ 
        numeroOS,
        limit: 50000
      });
      
      if (response.success) {
        setOrdensServico(response.data || []);
        
        if (!response.data || response.data.length === 0) {
          toast.info('Nenhuma OS encontrada com esse número');
        } else {
          toast.success(`${response.data.length} OS encontrada(s)`);
        }
      } else {
        throw new Error(response.message || 'Erro ao buscar OS');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao buscar OS';
      setError(message);
      toast.error('Erro ao buscar OS', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const buscarPorPrefixo = useCallback(async (prefixo: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ CORREÇÃO: Usar buscarTodasOS com filtro de prefixo
      const response = await manutencaoApi.buscarTodasOS({
        prefixo,
        startDate: filtros.startDate,
        endDate: filtros.endDate,
        limit: 50000
      });
      
      if (response.success) {
        setOrdensServico(response.data || []);
        
        if (!response.data || response.data.length === 0) {
          toast.info('Nenhuma OS encontrada para esse prefixo');
        } else {
          toast.success(`${response.data.length} OS encontrada(s)`);
        }
      } else {
        throw new Error(response.message || 'Erro ao buscar OS');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao buscar OS';
      setError(message);
      toast.error('Erro ao buscar OS', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [filtros.startDate, filtros.endDate]);

  const buscarPorPlaca = useCallback(async (placa: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ CORREÇÃO: Usar buscarTodasOS com filtro de placa
      const response = await manutencaoApi.buscarTodasOS({
        placa,
        startDate: filtros.startDate,
        endDate: filtros.endDate,
        limit: 50000
      });
      
      if (response.success) {
        setOrdensServico(response.data || []);
        
        if (!response.data || response.data.length === 0) {
          toast.info('Nenhuma OS encontrada para essa placa');
        } else {
          toast.success(`${response.data.length} OS encontrada(s)`);
        }
      } else {
        throw new Error(response.message || 'Erro ao buscar OS');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao buscar OS';
      setError(message);
      toast.error('Erro ao buscar OS', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [filtros.startDate, filtros.endDate]);

  const limparFiltros = useCallback(() => {
    const filtrosLimpos = {
      startDate: '2025-01-01', // ✅ Ano inteiro
      endDate: '2025-12-31', // ✅ CORREÇÃO: Ano completo
      page: 1,
      limit: 50000, // ✅ Limite alto
      ...filtrosIniciais
    };
    
    console.log('🧹 Limpando filtros:', filtrosLimpos);
    setFiltros(filtrosLimpos);
  }, [filtrosIniciais]);

  // ✅ CORREÇÃO: Auto carregar dados sempre que os filtros mudarem
  useEffect(() => {
    if (autoCarregar) {
      console.log('🚀 Auto carregando dados...');
      carregar();
    }
  }, [autoCarregar, carregar]);

  // ✅ ADICIONADO: Carregar dados quando filtros importantes mudarem
  useEffect(() => {
    if (autoCarregar) {
      carregar();
    }
  }, [
    filtros.startDate,
    filtros.endDate,
    filtros.garagens,
    filtros.garagem,
    filtros.tipoOS,
    filtros.statusOS,
    filtros.condicaoOS,
    filtros.tipoProblema,
    filtros.prefixo,
    filtros.numeroOS,
    filtros.placa,
    filtros.limit
  ]);

  return {
    ordensServico,
    estatisticas,
    filtros,
    isLoading,
    isSyncing,
    error,
    totalPages,
    totalRegistros,
    setFiltros,
    carregar,
    sincronizar,
    buscarPorNumero,
    buscarPorPrefixo,
    buscarPorPlaca,
    limparFiltros
  };
}