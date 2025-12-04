// src/hooks/useOperacoesData.ts
import { useState, useEffect } from 'react';
import { operacoesApi } from '../services/departments/operacoes/api/operacoesApi';

interface OperacoesData {
  veiculos: {
    total: number;
    ativos: number;
    inativos: number;
  };
  acidentes: {
    total: number;
    comVitimas: number;
    semVitimas: number;
    valorTotalDanos: number;
  };
  linhas: {
    total: number;
    ativas: number;
  };
  estatisticas: {
    eficienciaOperacional: number;
    indiceSinistralidade: number;
    custoMedioAcidente: number;
    percentualDisponibilidade: number;
  };
}

export const useOperacoesData = () => {
  const [data, setData] = useState<OperacoesData>({
    veiculos: { total: 0, ativos: 0, inativos: 0 },
    acidentes: { total: 0, comVitimas: 0, semVitimas: 0, valorTotalDanos: 0 },
    linhas: { total: 0, ativas: 0 },
    estatisticas: { 
      eficienciaOperacional: 85.0, // ✅ VALOR PADRÃO
      indiceSinistralidade: 0,
      custoMedioAcidente: 0,
      percentualDisponibilidade: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🚗 [OPERACOES] Carregando dados de operações...');

        // ✅ CORREÇÃO: Tentar dashboard primeiro, com fallback robusto
        try {
          const dashboardData = await operacoesApi.getDashboard();
          console.log('✅ [OPERACOES] Dashboard carregado:', dashboardData);

          // ✅ VERIFICAR SE DADOS SÃO VÁLIDOS
          if (dashboardData && dashboardData.resumo && dashboardData.resumo.kpis) {
            setData({
              veiculos: dashboardData.resumo.frota || { total: 0, ativos: 0, inativos: 0 },
              acidentes: dashboardData.resumo.acidentes || { total: 0, comVitimas: 0, semVitimas: 0, valorTotalDanos: 0 },
              linhas: { total: 0, ativas: 0 }, // Dados não disponíveis ainda
              estatisticas: {
                eficienciaOperacional: dashboardData.resumo.kpis.eficienciaOperacional || 85.0,
                indiceSinistralidade: dashboardData.resumo.kpis.indiceSinistralidade || 0,
                custoMedioAcidente: dashboardData.resumo.kpis.custoMedioAcidente || 0,
                percentualDisponibilidade: dashboardData.resumo.kpis.percentualDisponibilidade || 0,
              }
            });
            return;
          } else {
            console.warn('⚠️ [OPERACOES] Dashboard retornou estrutura inválida, usando endpoints individuais');
          }
        } catch (dashboardError) {
          console.warn('⚠️ [OPERACOES] Dashboard não disponível, usando endpoints individuais');
        }

        // ✅ FALLBACK: Usar endpoints individuais
        console.log('🔄 [OPERACOES] Tentando endpoints individuais...');
        
        const [veiculosResult, acidentesResult] = await Promise.allSettled([
          operacoesApi.getVeiculos().catch(() => ({ data: [], total: 0 })),
          operacoesApi.getAcidentes().catch(() => ({ data: [], total: 0 }))
        ]);

        // ✅ PROCESSAR RESULTADOS COM SEGURANÇA
        const veiculosData = veiculosResult.status === 'fulfilled' ? veiculosResult.value : { data: [], total: 0 };
        const acidentesData = acidentesResult.status === 'fulfilled' ? acidentesResult.value : { data: [], total: 0 };

        // ✅ CALCULAR ESTATÍSTICAS BÁSICAS
        const veiculosAtivos = Array.isArray(veiculosData.data) ? 
          veiculosData.data.filter(v => v.status === 'ATIVO').length : 0;
        const veiculosTotal = veiculosData.total || 0;
        const acidentesTotal = acidentesData.total || 0;
        const acidentesComVitimas = Array.isArray(acidentesData.data) ? 
          acidentesData.data.filter(a => a.grauAcidente === 'COM VÍTIMAS').length : 0;

        const indiceSinistralidade = veiculosAtivos > 0 ? (acidentesTotal / veiculosAtivos) * 100 : 0;
        const percentualDisponibilidade = veiculosTotal > 0 ? (veiculosAtivos / veiculosTotal) * 100 : 0;

        setData({
          veiculos: {
            total: veiculosTotal,
            ativos: veiculosAtivos,
            inativos: veiculosTotal - veiculosAtivos
          },
          acidentes: {
            total: acidentesTotal,
            comVitimas: acidentesComVitimas,
            semVitimas: acidentesTotal - acidentesComVitimas,
            valorTotalDanos: 0 // Não disponível nos endpoints individuais
          },
          linhas: { total: 0, ativas: 0 },
          estatisticas: {
            eficienciaOperacional: Math.max(0, 100 - indiceSinistralidade),
            indiceSinistralidade: Number(indiceSinistralidade.toFixed(2)),
            custoMedioAcidente: 0,
            percentualDisponibilidade: Number(percentualDisponibilidade.toFixed(2))
          }
        });

        console.log('✅ [OPERACOES] Dados carregados:', data);

      } catch (err) {
        console.error('❌ [OPERACOES] Erro ao carregar dados:', err);
        setError('Erro ao carregar dados de operações');
        
        // ✅ MANTER DADOS PADRÃO EM CASO DE ERRO
        setData({
          veiculos: { total: 0, ativos: 0, inativos: 0 },
          acidentes: { total: 0, comVitimas: 0, semVitimas: 0, valorTotalDanos: 0 },
          linhas: { total: 0, ativas: 0 },
          estatisticas: { 
            eficienciaOperacional: 85.0,
            indiceSinistralidade: 0,
            custoMedioAcidente: 0,
            percentualDisponibilidade: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};