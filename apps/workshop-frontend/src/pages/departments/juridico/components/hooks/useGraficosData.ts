// src/pages/departments/juridico/components/hooks/useGraficosData.ts
import { useState, useEffect } from 'react';
import { multasEnhancedService } from '@/services/departments/legal/multasEnhancedService';
import { processAllData } from '../utils/dataProcessors';

export const useGraficosData = () => {
  const [data, setData] = useState({
    resumoGeral: {
      totalMultas: 0,
      totalValor: 0,
      totalPontos: 0,
      agentesAtivos: 0,
      veiculosUnicos: 0
    },
    analytics: null,
    multasPorHorario: [],
    multasPorDiaSemana: [],
    multasPorLocal: [],
    multasPorSetor: [],
    evolucaoMensal: [],
    agentesRanking: [],
    tiposInfracao: [],
    multasPorGravidade: [],
    statusMultas: [],
    realMotivos: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando busca de dados para gráficos...');
      
      const response = await multasEnhancedService.buscarMultasEnhanced({
        includeHistoricoSetor: true,
        includeAnalytics: true,
        limit: 50000
      });

      if (!response.success || !response.data) {
        throw new Error('Erro ao carregar dados das multas');
      }

      console.log('📊 Dados recebidos:', {
        totalMultas: response.data.length,
        temAnalytics: !!response.analytics,
        temSetores: response.estatisticasPorSetor?.length || 0
      });

      const processedData = processAllData(response.data, response.analytics, response.estatisticasPorSetor);
      setData(processedData);
      console.log('✅ Dados processados com sucesso:', processedData.resumoGeral);
    } catch (err) {
      console.error('❌ Erro ao buscar dados dos gráficos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};