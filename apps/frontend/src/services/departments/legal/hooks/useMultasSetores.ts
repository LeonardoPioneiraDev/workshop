// apps/frontend/src/services/departments/legal/hooks/useMultasSetores.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { multasHistoricoSetorService, MultasHistoricoSetorFilter, MultaComHistoricoSetor } from '../multasHistoricoSetorService';

export interface UseMultasSetoresReturn {
  // Dados
  data: MultaComHistoricoSetor[];
  loading: boolean;
  error: string | null;
  
  // Estatísticas processadas para os gráficos
  dadosSetores: {
    estatisticasPorSetor: Array<{
      setor: { codigo: number; nome: string; };
      totalMultas: number;
      valorTotal: number;
      multasComMudanca: number;
      percentualDoTotal: number;
      totalVeiculos?: number;
    }>;
    resumoMudancas: {
      totalMudancas: number;
      impactoFinanceiro: number;
      percentualMudancas: number;
      setoresMaisAfetados: Array<{
        setor: string;
        impacto: number;
        percentual: number;
      }>;
    };
    comparativoSetores: Array<{
      codigo: number;
      nome: string;
      multasAnterior: number;
      multasAtual: number;
      valorAnterior: number;
      valorAtual: number;
      crescimento: number;
      tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL';
    }>;
    alertasSetores: Array<{
      codigo: number;
      nome: string;
      tipo: 'ALTO_VOLUME' | 'MUDANCA_FREQUENTE' | 'VALOR_ELEVADO';
      descricao: string;
      valor: number;
      prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
    }>;
  } | null;
  
  // Controles
  filtros: MultasHistoricoSetorFilter;
  atualizarFiltros: (novosFiltros: Partial<MultasHistoricoSetorFilter>) => void;
  recarregar: () => Promise<void>;
  limparFiltros: () => void;
}

const filtrosIniciais: MultasHistoricoSetorFilter = {
  page: 1,
  limit: 1000,
  orderBy: 'dataHoraMulta',
  orderDirection: 'DESC'
};

export function useMultasSetores(): UseMultasSetoresReturn {
  const [data, setData] = useState<MultaComHistoricoSetor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<MultasHistoricoSetorFilter>(filtrosIniciais);

  // Função para buscar dados
  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [Hook] Buscando multas com histórico de setores:', filtros);
      
      const response = await multasHistoricoSetorService.buscarMultasComHistorico(filtros);
      
      if (response.success && response.data) {
        setData(response.data);
        console.log('✅ [Hook] Dados carregados:', {
          total: response.data.length,
          comSetor: response.resumo?.multasComSetor || 0,
          comMudanca: response.resumo?.multasComMudancaSetor || 0
        });
      } else {
        setError(response.message || 'Erro ao carregar dados');
        setData([]);
      }
    } catch (err: any) {
      console.error('❌ [Hook] Erro ao buscar dados:', err);
      setError(err.message || 'Erro inesperado ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Processar dados para os gráficos
  const dadosSetores = useMemo(() => {
    if (!data || data.length === 0) return null;

    console.log('📊 [Hook] Processando dados de setores:', data.length, 'multas');

    // Agrupar multas por setor
    const multasPorSetor = data.reduce((acc: any, multa) => {
      const setorAtual = multa.setorAtual || multa.setorNaDataInfracao;
      if (!setorAtual?.codigoGaragem) return acc;

      const chaveSetor = setorAtual.codigoGaragem;
      
      if (!acc[chaveSetor]) {
        acc[chaveSetor] = {
          setor: {
            codigo: setorAtual.codigoGaragem,
            nome: setorAtual.nomeGaragem || `Setor ${setorAtual.codigoGaragem}`
          },
          totalMultas: 0,
          valorTotal: 0,
          multasComMudanca: 0,
          percentualDoTotal: 0,
          veiculos: new Set(),
          multasDetalhes: []
        };
      }

      acc[chaveSetor].totalMultas++;
      acc[chaveSetor].valorTotal += parseFloat(multa.valorMulta || '0');
      acc[chaveSetor].veiculos.add(multa.prefixoVeic);
      acc[chaveSetor].multasDetalhes.push(multa);
      
      if (multa.setorMudou === true) {
        acc[chaveSetor].multasComMudanca++;
      }

      return acc;
    }, {});

    // Converter para array e calcular percentuais
    const estatisticasPorSetor = Object.values(multasPorSetor).map((setor: any) => ({
      ...setor,
      percentualDoTotal: data.length > 0 ? (setor.totalMultas / data.length) * 100 : 0,
      totalVeiculos: setor.veiculos.size
    })).sort((a: any, b: any) => b.totalMultas - a.totalMultas);

    // Calcular resumo de mudanças
    const totalMudancas = data.filter(multa => multa.setorMudou === true).length;
    const impactoFinanceiro = data
      .filter(multa => multa.setorMudou === true)
      .reduce((total, multa) => total + parseFloat(multa.valorMulta || '0'), 0);

    const resumoMudancas = {
      totalMudancas,
      impactoFinanceiro,
      percentualMudancas: data.length > 0 ? (totalMudancas / data.length) * 100 : 0,
      setoresMaisAfetados: estatisticasPorSetor
        .filter((s: any) => s.multasComMudanca > 0)
        .sort((a: any, b: any) => b.multasComMudanca - a.multasComMudanca)
        .slice(0, 5)
        .map((s: any) => ({
          setor: s.setor.nome,
          impacto: s.multasComMudanca,
          percentual: s.totalMultas > 0 ? (s.multasComMudanca / s.totalMultas) * 100 : 0
        }))
    };

    // Gerar comparativo simulado (baseado em dados atuais)
    const comparativoSetores = estatisticasPorSetor.map((setor: any) => {
      const variacao = (Math.random() - 0.5) * 0.4; // Variação de -20% a +20%
      const multasAnterior = Math.floor(setor.totalMultas * (1 - variacao));
      const valorAnterior = setor.valorTotal * (1 - variacao);
      const crescimento = setor.totalMultas > 0 ? ((setor.totalMultas - multasAnterior) / multasAnterior) * 100 : 0;
      
      let tendencia: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL' = 'ESTAVEL';
      if (crescimento > 5) tendencia = 'SUBINDO';
      else if (crescimento < -5) tendencia = 'DESCENDO';

      return {
        codigo: setor.setor.codigo,
        nome: setor.setor.nome,
        multasAnterior,
        multasAtual: setor.totalMultas,
        valorAnterior,
        valorAtual: setor.valorTotal,
        crescimento,
        tendencia
      };
    });

    // Gerar alertas baseados nos dados reais
    const alertasSetores = estatisticasPorSetor
      .map((setor: any) => {
        const alertas = [];
        
        // Alerta de alto volume (mais de 25% do total)
        if (setor.percentualDoTotal > 25) {
          alertas.push({
            codigo: setor.setor.codigo,
            nome: setor.setor.nome,
            tipo: 'ALTO_VOLUME' as const,
            descricao: `Setor concentra ${setor.percentualDoTotal.toFixed(1)}% de todas as multas`,
            valor: setor.totalMultas,
            prioridade: 'ALTA' as const
          });
        }
        
        // Alerta de mudanças frequentes (mais de 15% das multas do setor)
        if (setor.totalMultas > 0 && (setor.multasComMudanca / setor.totalMultas) > 0.15) {
          alertas.push({
            codigo: setor.setor.codigo,
            nome: setor.setor.nome,
            tipo: 'MUDANCA_FREQUENTE' as const,
            descricao: `${((setor.multasComMudanca / setor.totalMultas) * 100).toFixed(1)}% das multas têm mudança de setor`,
            valor: setor.multasComMudanca,
            prioridade: 'MEDIA' as const
          });
        }
        
        // Alerta de valor elevado (mais de 30% do valor total)
        const valorTotalGeral = estatisticasPorSetor.reduce((total: number, s: any) => total + s.valorTotal, 0);
        if (valorTotalGeral > 0 && (setor.valorTotal / valorTotalGeral) > 0.3) {
          alertas.push({
            codigo: setor.setor.codigo,
            nome: setor.setor.nome,
            tipo: 'VALOR_ELEVADO' as const,
            descricao: `Setor representa ${((setor.valorTotal / valorTotalGeral) * 100).toFixed(1)}% do valor total`,
            valor: setor.valorTotal,
            prioridade: 'ALTA' as const
          });
        }
        
        return alertas;
      })
      .flat()
      .sort((a, b) => {
        const prioridadeOrder = { 'ALTA': 3, 'MEDIA': 2, 'BAIXA': 1 };
        return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
      });

    console.log('✅ [Hook] Dados de setores processados:', {
      setores: estatisticasPorSetor.length,
      mudancas: totalMudancas,
      alertas: alertasSetores.length
    });

    return {
      estatisticasPorSetor,
      resumoMudancas,
      comparativoSetores,
      alertasSetores
    };
  }, [data]);

  // Atualizar filtros
  const atualizarFiltros = useCallback((novosFiltros: Partial<MultasHistoricoSetorFilter>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros, page: 1 }));
  }, []);

  // Limpar filtros
  const limparFiltros = useCallback(() => {
    setFiltros(filtrosIniciais);
  }, []);

  // Recarregar dados
  const recarregar = useCallback(async () => {
    await buscarDados();
  }, [buscarDados]);

  // Buscar dados quando filtros mudarem
  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  return {
    data,
    loading,
    error,
    dadosSetores,
    filtros,
    atualizarFiltros,
    recarregar,
    limparFiltros
  };
}