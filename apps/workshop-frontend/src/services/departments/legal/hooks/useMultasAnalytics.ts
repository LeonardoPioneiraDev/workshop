// apps/frontend/src/services/departments/legal/hooks/useMultasAnalytics.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { multasCompletasService } from '../multasCompletasService';
import { multasHistoricoSetorService } from '../multasHistoricoSetorService';
import { multasEnhancedService } from '../multasEnhancedService';
import { MultaCompletaFilter, MultaCompletaResponse, MultaCompleta, TopCausaMulta } from '../types';

export function useMultasAnalytics(filtrosIniciais: MultaCompletaFilter = {}) {
  // ✅ REF PARA CONTROLAR REQUISIÇÕES
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  const [data, setData] = useState<MultaCompletaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<MultaCompletaFilter>({
    limit: 10000,
    orderBy: 'dataEmissaoMulta',
    orderDirection: 'DESC',
    ...filtrosIniciais
  });

  // Estados para dados de setores
  const [dadosSetores, setDadosSetores] = useState<any>(null);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [errorSetores, setErrorSetores] = useState<string | null>(null);

  // ✅ CLEANUP NO UNMOUNT
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ CARREGAR DADOS PRINCIPAIS - COM CONTROLE DE DUPLICAÇÃO
  const carregarDados = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) {
      console.log('⚠️ [MULTAS_ANALYTICS] Carregamento já em andamento, ignorando...');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const filtrosLimpos: MultaCompletaFilter = {
        limit: 10000,
        orderBy: 'dataEmissaoMulta',
        orderDirection: 'DESC',
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      };

      console.log('🔍 Carregando dados com filtros:', filtrosLimpos);
      
      const response = await multasCompletasService.buscarMultasCompletas(filtrosLimpos);
      
      if (mountedRef.current) {
        setData(response);
        console.log('✅ Dados carregados para Analytics:', response);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar dados para Analytics:', err);
      if (mountedRef.current) {
        setError('Falha ao carregar dados das multas completas');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [filtros.dataInicio, filtros.dataFim]);

  // ✅ CARREGAR DADOS DE SETORES - COM CONTROLE DE DUPLICAÇÃO
  const carregarDadosSetores = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoadingSetores(true);
    setErrorSetores(null);
    
    try {
      console.log('🔍 Carregando dados de setores...');
      
      const filtrosSetores = {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        limit: 1000,
        orderBy: 'dataHoraMulta',
        orderDirection: 'DESC' as const
      };
      
      const response = await multasHistoricoSetorService.buscarMultasComHistorico(filtrosSetores);
      
      if (mountedRef.current) {
        if (response.success && response.data) {
          const dadosProcessados = processarDadosSetores(response.data);
          setDadosSetores(dadosProcessados);
          console.log('✅ Dados de setores carregados:', dadosProcessados);
        } else {
          console.warn('⚠️ Resposta de setores sem dados:', response);
          setDadosSetores(null);
        }
      }
    } catch (err) {
      console.error('❌ Erro ao carregar dados de setores:', err);
      if (mountedRef.current) {
        setErrorSetores('Falha ao carregar dados de setores');
        setDadosSetores(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingSetores(false);
      }
    }
  }, [filtros.dataInicio, filtros.dataFim]);

  // ✅ PROCESSAR DADOS DE SETORES - MEMOIZADO
  const processarDadosSetores = useCallback((multasComSetor: any[]) => {
    if (!Array.isArray(multasComSetor) || multasComSetor.length === 0) {
      return null;
    }

    console.log('📊 Processando dados de setores:', multasComSetor.length, 'multas');

    // Agrupar multas por setor
    const multasPorSetor = multasComSetor.reduce((acc: any, multa) => {
      const setor = multa.setorAtual || multa.setorNaDataInfracao;
      if (!setor?.codigoGaragem) return acc;

      const chaveSetor = setor.codigoGaragem;
      
      if (!acc[chaveSetor]) {
        acc[chaveSetor] = {
          setor: {
            codigo: setor.codigoGaragem,
            nome: setor.nomeGaragem || `Setor ${setor.codigoGaragem}`
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
      percentualDoTotal: multasComSetor.length > 0 ? (setor.totalMultas / multasComSetor.length) * 100 : 0,
      totalVeiculos: setor.veiculos.size
    })).sort((a: any, b: any) => b.totalMultas - a.totalMultas);

    // Calcular resumo de mudanças
    const totalMudancas = multasComSetor.filter(multa => multa.setorMudou === true).length;
    const impactoFinanceiro = multasComSetor
      .filter(multa => multa.setorMudou === true)
      .reduce((total, multa) => total + parseFloat(multa.valorMulta || '0'), 0);

    const resumoMudancas = {
      totalMudancas,
      impactoFinanceiro,
      percentualMudancas: multasComSetor.length > 0 ? (totalMudancas / multasComSetor.length) * 100 : 0,
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

  // Gerar comparativo simulado
  const comparativoSetores = estatisticasPorSetor.map((setor: any) => {
    const variacao = (Math.random() - 0.5) * 0.4;
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

  // Gerar alertas
  const alertasSetores = estatisticasPorSetor
    .map((setor: any) => {
      const alertas = [];
      
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

  return {
    estatisticasPorSetor,
    resumoMudancas,
    evolucaoSetores: [],
    comparativoSetores,
    alertasSetores
  };
}, []);

// ✅ ANALYTICS MEMOIZADO PARA EVITAR RECÁLCULOS DESNECESSÁRIOS
const analytics = useMemo(() => {
  if (!data?.data) return null;

  const multas = data.data;

  // Funções auxiliares
  const getValor = (m: MultaCompleta) => {
    const valor = Number(m.valorMulta);
    return isNaN(valor) ? 0 : valor;
  };
  
  const getPontos = (m: MultaCompleta) => {
    const pontos = Number(m.pontuacaoInfracao);
    return isNaN(pontos) ? 0 : pontos;
  };

  const getHora = (m: MultaCompleta) => {
    if (!m.dataEmissaoMulta) return null;
    try {
      const date = new Date(m.dataEmissaoMulta);
      return isNaN(date.getTime()) ? null : date.getHours();
    } catch {
      return null;
    }
  };

  // Separar multas por tipo
  const multasTransito = multas.filter(m => {
    const temPontos = getPontos(m) > 0;
    const naoTemAgente = !m.agenteCodigo || !m.agenteDescricao;
    const codigoTransito = m.codigoInfra && (
      m.codigoInfra.startsWith('6') || 
      m.codigoInfra.startsWith('7') || 
      m.codigoInfra.startsWith('5')
    );
    
    return temPontos || (naoTemAgente && codigoTransito);
  });
  
  const multasSemob = multas.filter(m => {
    const temAgente = m.agenteCodigo && m.agenteDescricao;
    const poucosPontos = getPontos(m) <= 0;
    
    return temAgente && poucosPontos;
  });

  // Cálculos seguros
  const valorTotal = multas.reduce((sum, m) => sum + getValor(m), 0);
  const valorTransito = multasTransito.reduce((sum, m) => sum + getValor(m), 0);
  const valorSemob = multasSemob.reduce((sum, m) => sum + getValor(m), 0);
  const pontosTotal = multas.reduce((sum, m) => sum + getPontos(m), 0);

  // Agentes únicos
  const agentesUnicos = [...new Set(
    multasSemob
      .filter(m => m.agenteCodigo)
      .map(m => m.agenteCodigo)
  )].length;

  // Veículos únicos
  const veiculosUnicos = [...new Set(
    multas
      .filter(m => m.prefixoVeic)
      .map(m => m.prefixoVeic)
  )].length;

  // Distribuição por gravidade/tipo
  const distribuicaoGravidadeMap = multas.reduce((acc, multa) => {
    let tipo = 'NÃO CLASSIFICADO';

    if (multa.agenteCodigo && multa.agenteDescricao) {
      tipo = 'SEMOB';
    } else {
      const pontos = getPontos(multa);
      if (pontos >= 7) tipo = 'GRAVÍSSIMA';
      else if (pontos >= 5) tipo = 'GRAVE';
      else if (pontos >= 3) tipo = 'MÉDIA';
      else if (pontos > 0) tipo = 'LEVE';
      else if (multa.gravidadeInfracao) tipo = multa.gravidadeInfracao.toUpperCase();
    }
    
    if (!acc[tipo]) {
      acc[tipo] = { total: 0, valor: 0, pontos: 0 };
    }
    acc[tipo].total += 1;
    acc[tipo].valor += getValor(multa);
    acc[tipo].pontos += getPontos(multa);
    return acc;
  }, {} as Record<string, { total: number; valor: number; pontos: number }>);

  const distribuicaoGravidade = Object.entries(distribuicaoGravidadeMap).map(([gravidade, dados]) => ({
    gravidade,
    total: dados.total,
    valor: dados.valor,
    pontos: dados.pontos
  }));

  // Top agentes
  const agentesPorQuantidade = multasSemob
    .filter(m => m.agenteCodigo && m.agenteDescricao)
    .reduce((acc, multa) => {
      const codigo = multa.agenteCodigo!;
      const nome = multa.agenteDescricao || `Agente ${codigo}`;
      if (!acc[codigo]) {
        acc[codigo] = { codigo, nome, total: 0, valor: 0 };
      }
      acc[codigo].total += 1;
      acc[codigo].valor += getValor(multa);
      return acc;
    }, {} as Record<string, { codigo: string; nome: string; total: number; valor: number }>);

  const topAgentes = Object.values(agentesPorQuantidade)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Top locais
  const locaisPorQuantidade = multas
    .filter(m => m.localMulta && m.localMulta.trim() !== '')
    .reduce((acc, multa) => {
      const local = multa.localMulta!.trim();
      if (!acc[local]) {
        acc[local] = { total: 0, valor: 0 };
      }
      acc[local].total += 1;
      acc[local].valor += getValor(multa);
      return acc;
    }, {} as Record<string, { total: number; valor: number }>);

  const topLocais = Object.entries(locaisPorQuantidade)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 10)
    .map(([local, dados]) => ({ local, ...dados }));

  // Top causas reais
  const causasReaisMap = multasSemob
    .filter(m => m.observacaoRealMotivo && m.observacaoRealMotivo.trim() !== '')
    .reduce((acc, multa) => {
      const motivo = multa.observacaoRealMotivo!.toUpperCase().trim();
      if (motivo === 'N/A' || motivo === 'NÃO INFORMADO') return acc;
      
      if (!acc[motivo]) {
        acc[motivo] = { motivo, total: 0, valor: 0 };
      }
      acc[motivo].total += 1;
      acc[motivo].valor += getValor(multa);
      return acc;
    }, {} as Record<string, TopCausaMulta>);

  const topCausasMulta: TopCausaMulta[] = Object.values(causasReaisMap)
    .filter(c => c.total > 1)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Evolução mensal
  const evolucaoMensalPorTipoMap = multas.reduce((acc, multa) => {
    const dataEmissao = multa.dataEmissaoMulta;
    if (!dataEmissao) return acc;

    try {
      const date = new Date(dataEmissao);
      if (isNaN(date.getTime())) return acc;
      
      const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[mesAno]) {
        acc[mesAno] = { 
          mes: mesAno, 
          totalTransito: 0, 
          totalSemob: 0, 
          valorTransito: 0, 
          valorSemob: 0 
        };
      }

      const valor = getValor(multa);
      
      if (multasTransito.includes(multa)) {
        acc[mesAno].totalTransito += 1;
        acc[mesAno].valorTransito += valor;
      } else if (multasSemob.includes(multa)) {
        acc[mesAno].totalSemob += 1;
        acc[mesAno].valorSemob += valor;
      }
    } catch (error) {
      console.warn('Erro ao processar data:', dataEmissao, error);
    }
    
    return acc;
  }, {} as Record<string, { mes: string; totalTransito: number; totalSemob: number; valorTransito: number; valorSemob: number }>);

  const evolucaoMensalPorTipo = Object.values(evolucaoMensalPorTipoMap)
    .sort((a, b) => a.mes.localeCompare(b.mes));

  // Análise de horários
  const multasComHora = multas.filter(m => getHora(m) !== null);
  
  const distribuicaoHoraria = multasComHora.reduce((acc, multa) => {
    const hora = getHora(multa)!;
    if (!acc[hora]) {
      acc[hora] = { hora, total: 0, valor: 0 };
    }
    acc[hora].total += 1;
    acc[hora].valor += getValor(multa);
    return acc;
  }, {} as Record<number, { hora: number; total: number; valor: number }>);

  const topHorarios = Object.values(distribuicaoHoraria)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(item => ({
      hora: item.hora,
      total: item.total,
      periodo: item.hora < 6 ? 'Madrugada' : 
              item.hora < 12 ? 'Manhã' : 
              item.hora < 18 ? 'Tarde' : 'Noite'
    }));

  const horariosOrdenados = Object.values(distribuicaoHoraria).sort((a, b) => b.total - a.total);
  const horarioPico = horariosOrdenados[0] ? {
    hora: horariosOrdenados[0].hora,
    total: horariosOrdenados[0].total,
    periodo: horariosOrdenados[0].hora < 6 ? 'Madrugada' : 
            horariosOrdenados[0].hora < 12 ? 'Manhã' : 
            horariosOrdenados[0].hora < 18 ? 'Tarde' : 'Noite'
  } : { hora: 0, total: 0, periodo: 'Não disponível' };

  const horarioMenor = horariosOrdenados[horariosOrdenados.length - 1] ? {
    hora: horariosOrdenados[horariosOrdenados.length - 1].hora,
    total: horariosOrdenados[horariosOrdenados.length - 1].total,
    periodo: horariosOrdenados[horariosOrdenados.length - 1].hora < 6 ? 'Madrugada' : 
            horariosOrdenados[horariosOrdenados.length - 1].hora < 12 ? 'Manhã' : 
            horariosOrdenados[horariosOrdenados.length - 1].hora < 18 ? 'Tarde' : 'Noite'
  } : { hora: 0, total: 0, periodo: 'Não disponível' };

  // Distribuição por períodos
  const multasMadrugada = multasComHora.filter(m => {
    const hora = getHora(m)!;
    return hora >= 0 && hora < 6;
  }).length;

  const multasManha = multasComHora.filter(m => {
    const hora = getHora(m)!;
    return hora >= 6 && hora < 12;
  }).length;

  const multasTarde = multasComHora.filter(m => {
    const hora = getHora(m)!;
    return hora >= 12 && hora < 18;
  }).length;

  const multasNoite = multasComHora.filter(m => {
    const hora = getHora(m)!;
    return hora >= 18 && hora < 24;
  }).length;

  return {
    totalGeral: multas.length,
    valorTotal,
    pontosTotal,
    totalTransito: multasTransito.length,
    totalSemob: multasSemob.length,
    valorTransito,
    valorSemob,
    valorMedioTransito: multasTransito.length > 0 ? valorTransito / multasTransito.length : 0,
    valorMedioSemob: multasSemob.length > 0 ? valorSemob / multasSemob.length : 0,
    totalAgentesUnicos: agentesUnicos,
    totalVeiculosUnicos: veiculosUnicos,
    distribuicaoGravidade,
    topAgentes,
    topLocais,
    topCausasMulta,
    evolucaoMensalPorTipo,
    horarioPico,
    horarioMenor,
    multasMadrugada,
    multasManha,
    multasTarde,
    multasNoite,
    topHorarios
  };
}, [data]);

// ✅ FUNÇÕES DE CONTROLE - MEMOIZADAS
const atualizarFiltros = useCallback((novosFiltros: Partial<MultaCompletaFilter>) => {
  setFiltros(prev => ({ ...prev, ...novosFiltros }));
}, []);

const limparFiltros = useCallback(() => {
  setFiltros({
    limit: 10000,
    orderBy: 'dataEmissaoMulta',
    orderDirection: 'DESC'
  });
}, []);

const exportarDados = useCallback(async (formato: 'xlsx' | 'csv' | 'pdf' | 'html' = 'html') => {
  try {
    const filtrosExportacao: MultaCompletaFilter = {
      limit: 10000,
      orderBy: 'dataEmissaoMulta',
      orderDirection: 'DESC',
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim
    };
    
    await multasCompletasService.exportarRelatorio(filtrosExportacao, formato);
  } catch (err) {
    console.error('❌ Erro ao exportar:', err);
    setError('Erro ao exportar dados');
  }
}, [filtros.dataInicio, filtros.dataFim]);

const recarregar = useCallback(async () => {
  if (!mountedRef.current) return;
  
  await Promise.all([
    carregarDados(),
    carregarDadosSetores()
  ]);
}, [carregarDados, carregarDadosSetores]);

// ✅ EFEITOS CONTROLADOS - EVITAR LOOPS
useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  // Debounce para evitar múltiplas chamadas
  timeoutId = setTimeout(() => {
    if (mountedRef.current) {
      carregarDados();
    }
  }, 300);

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [carregarDados]);

useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  timeoutId = setTimeout(() => {
    if (mountedRef.current) {
      carregarDadosSetores();
    }
  }, 500); // Delay maior para dados de setores

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [carregarDadosSetores]);

return {
  data,
  analytics,
  loading: loading || loadingSetores,
  error: error || errorSetores,
  filtros,
  atualizarFiltros,
  limparFiltros,
  recarregar,
  exportarDados,
  dadosSetores,
  loadingSetores,
  errorSetores
};
}