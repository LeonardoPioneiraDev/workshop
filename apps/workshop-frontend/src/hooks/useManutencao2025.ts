// src/hooks/useManutencao2025.ts
import { useState, useEffect, useCallback } from 'react';
import { manutencaoApi } from '@/services/departments/manutencao/api/manutencaoApi';
import type { 
  OrdemServico, 
  FiltrosOS, 
  EstatisticasOS,
  RespostaOSData 
} from '@/services/departments/manutencao/types';
import { toast } from 'sonner';
import { format, startOfYear, endOfMonth, startOfMonth } from 'date-fns';

export interface FiltrosManutencao2025 {
  // Campos de data
  ano?: number;
  mesAtual?: boolean;
  startDate?: string;
  endDate?: string;
  compararMesAnterior?: boolean;
  
  // Filtros de localização
  garagens?: number[];
  garagem?: string;
  setor_codigo?: number;
  setor?: string;
  
  // Filtros de OS
  tipoOS?: 'C' | 'P';
  condicaoOS?: 'A' | 'FC';
  statusOS?: 'A' | 'FC';
  tipoProblema?: 'QUEBRA' | 'DEFEITO';
  
  // Filtros de veículo
  prefixo?: string;
  numeroOS?: string;
  numero_os?: string;
  placa?: string;
  
  // Paginação
  page?: number;
  limit?: number;
  
  // Outros
  forcarSincronizacao?: boolean;
}

interface EstatisticasComparativas {
  mesAtual: EstatisticasOS;
  crescimento: {
    totalOS: number;
    osAbertas: number;
    valorTerceiros: number;
  };
  top: {
    garagens: Array<{ nome: string; total: number; percentual: number }>;
    problemas: Array<{ tipo: string; total: number; percentual: number }>;
    veiculos: Array<{ prefixo: string; placa: string; total: number }>;
  };
}

export function useManutencao2025() {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [estatisticasComparativas, setEstatisticasComparativas] = useState<EstatisticasComparativas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ CORREÇÃO: Filtros iniciais com período completo do ano
  const [filtros, setFiltros] = useState<FiltrosManutencao2025>({
    ano: 2025,
    mesAtual: false, // ✅ Começar com todos os dados do ano
    startDate: '2025-01-01', // ✅ Ano inteiro
    endDate: '2025-12-31', // ✅ CORREÇÃO: Ano completo
    limit: 50000, // ✅ Limite muito alto
    page: 1,
    compararMesAnterior: true
  });

  // Converter filtros para formato da API
  const converterFiltrosParaAPI = useCallback((filtrosLocal: FiltrosManutencao2025): FiltrosOS => {
    const filtrosAPI: FiltrosOS = {
      startDate: filtrosLocal.startDate,
      endDate: filtrosLocal.endDate,
      garagens: filtrosLocal.garagens,
      garagem: filtrosLocal.garagem,
      setor_codigo: filtrosLocal.setor_codigo,
      setor: filtrosLocal.setor,
      tipoOS: filtrosLocal.tipoOS,
      condicaoOS: filtrosLocal.condicaoOS,
      statusOS: filtrosLocal.statusOS,
      tipoProblema: filtrosLocal.tipoProblema,
      prefixo: filtrosLocal.prefixo,
      numeroOS: filtrosLocal.numeroOS || filtrosLocal.numero_os,
      placa: filtrosLocal.placa,
      page: filtrosLocal.page,
      limit: filtrosLocal.limit,
      forcarSincronizacao: filtrosLocal.forcarSincronizacao
    };

    // Remover campos undefined
    Object.keys(filtrosAPI).forEach(key => {
      if (filtrosAPI[key as keyof FiltrosOS] === undefined) {
        delete filtrosAPI[key as keyof FiltrosOS];
      }
    });

    return filtrosAPI;
  }, []);

  const carregarDados = useCallback(async (novosFiltros?: Partial<FiltrosManutencao2025>) => {
    try {
      setLoading(true);
      setError(null);

      let filtrosFinais = { ...filtros };

      if (novosFiltros) {
        filtrosFinais = { ...filtrosFinais, ...novosFiltros };
        
        // ✅ CORREÇÃO: Ajustar datas se mesAtual for true
        if (novosFiltros.mesAtual === true) {
          const hoje = new Date();
          filtrosFinais.startDate = format(startOfMonth(hoje), 'yyyy-MM-dd');
          filtrosFinais.endDate = format(endOfMonth(hoje), 'yyyy-MM-dd');
        } else if (novosFiltros.mesAtual === false && !novosFiltros.startDate) {
          // Se desabilitar mês atual e não tiver data específica, usar ano todo
          filtrosFinais.startDate = '2025-01-01';
          filtrosFinais.endDate = '2025-12-31'; // ✅ CORREÇÃO: Ano completo
        }

        setFiltros(filtrosFinais);
      }

      console.log('🔍 Carregando dados com filtros:', filtrosFinais);

      const filtrosAPI = converterFiltrosParaAPI(filtrosFinais);
      
      // ✅ CORREÇÃO: Usar novo método buscarTodasOS
      const response = await manutencaoApi.buscarTodasOS(filtrosAPI);
      
      console.log('📊 Resposta da API:', response);

      if (response.success) {
        setOrdensServico(response.data || []);
        
        // Calcular estatísticas
        const stats = response.statistics || {
          resumo: {
            totalRegistros: response.data?.length || 0,
            osAbertas: 0,
            osFechadas: 0,
            quebras: 0,
            defeitos: 0,
            socorros: 0
          },
          distribuicoes: {
            tiposOS: {},
            statusOS: {},
            garagens: {},
            tiposProblema: {}
          },
          indicadores: {
            totalValorTerceiros: '0.00',
            percentualAbertas: '0%',
            percentualFechadas: '0%'
          }
        };
        
        const estatisticasCompletas: EstatisticasComparativas = {
          mesAtual: stats,
          crescimento: {
            totalOS: 0,
            osAbertas: 0,
            valorTerceiros: 0
          },
          top: calcularTops(response.data || [])
        };

        setEstatisticasComparativas(estatisticasCompletas);

        if (response.data && response.data.length > 0) {
          toast.success(`${response.data.length} OS carregadas!`);
        } else {
          toast.info('Nenhuma OS encontrada no período');
        }
      } else {
        throw new Error(response.message || 'Erro na resposta da API');
      }

    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      const message = err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(message);
      toast.error('Erro ao carregar dados', { description: message });
    } finally {
      setLoading(false);
    }
  }, [filtros, converterFiltrosParaAPI]);

  const calcularTops = (dados: OrdemServico[]) => {
    if (!dados || dados.length === 0) {
      return {
        garagens: [],
        problemas: [],
        veiculos: []
      };
    }

    // Top garagens
    const garagensCount = dados.reduce((acc, os) => {
      const garagem = os.garagem || 'Não informado';
      acc[garagem] = (acc[garagem] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topGaragens = Object.entries(garagensCount)
      .map(([nome, total]) => ({
        nome,
        total,
        percentual: (total / dados.length) * 100
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top problemas
    const problemasCount = dados.reduce((acc, os) => {
      const problema = os.tipoProblema || 'Não informado';
      acc[problema] = (acc[problema] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProblemas = Object.entries(problemasCount)
      .map(([tipo, total]) => ({
        tipo,
        total,
        percentual: (total / dados.length) * 100
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top veículos
    const veiculosCount = dados.reduce((acc, os) => {
      const chave = `${os.prefixoVeiculo}-${os.placaVeiculo}`;
      if (!acc[chave]) {
        acc[chave] = {
          prefixo: os.prefixoVeiculo || 'N/A',
          placa: os.placaVeiculo || 'N/A',
          total: 0
        };
      }
      acc[chave].total++;
      return acc;
    }, {} as Record<string, any>);

    const topVeiculos = Object.values(veiculosCount)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 5);

    return {
      garagens: topGaragens,
      problemas: topProblemas,
      veiculos: topVeiculos
    };
  };

  const sincronizar = useCallback(async () => {
    try {
      setLoading(true);
      
      const filtrosAPI = converterFiltrosParaAPI(filtros);
      
      // ✅ CORREÇÃO: Usar novo método sincronizarDoGlobus
      await manutencaoApi.sincronizarDoGlobus({
        startDate: filtrosAPI.startDate,
        endDate: filtrosAPI.endDate,
        garagens: filtrosAPI.garagens,
        setor_codigo: filtrosAPI.setor_codigo,
        limit: 50000 // ✅ Limite alto para sincronização
      });

      toast.success('Sincronização concluída!');
      await carregarDados(); // Recarregar após sincronizar
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao sincronizar';
      setError(message);
      toast.error('Erro na sincronização', { description: message });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filtros, carregarDados, converterFiltrosParaAPI]);

  const resetarFiltros = useCallback(() => {
    const filtrosLimpos: FiltrosManutencao2025 = {
      ano: 2025,
      mesAtual: false, // ✅ Não usar mês atual por padrão
      startDate: '2025-01-01', // ✅ Ano inteiro
      endDate: '2025-12-31', // ✅ CORREÇÃO: Ano completo
      limit: 50000, // ✅ Limite alto
      page: 1,
      compararMesAnterior: true
    };
    
    setFiltros(filtrosLimpos);
    carregarDados(filtrosLimpos);
  }, [carregarDados]);

  // ✅ Carregar dados automaticamente na inicialização
  useEffect(() => {
    carregarDados();
  }, []);

  return {
    ordensServico,
    estatisticasComparativas,
    loading,
    error,
    filtros,
    carregarDados,
    sincronizar,
    resetarFiltros
  };
}