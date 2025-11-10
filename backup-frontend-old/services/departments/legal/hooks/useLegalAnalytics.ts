// apps/frontend/src/services/departments/legal/hooks/useLegalAnalytics.ts - COMPLETO OTIMIZADO & LOOP FIX
import { useState, useEffect, useMemo, useCallback } from 'react';
import { legalService } from '../legalService';
import { Fine, FineFilters } from '../types';

interface AnalyticsData {
  // Dados para gráficos
  multasPorMes: Array<{ month: string; total: number; valor: number }>;
  multasPorGravidade: Array<{ gravidade: string; total: number; valor: number; color: string }>;
  multasPorGaragem: Array<{ garagem: string; total: number; valor: number }>;
  multasPorStatus: Array<{ status: string; total: number; valor: number; color: string }>;
  multasPorAgente: Array<{ agente: string; total: number; valor: number }>;
  
  // Estatísticas
  totalMultas: number;
  valorTotal: number;
  mediaValor: number;
  multasVencidas: number;
  multasVencendo: number;
  multasPagas: number;
  
  // Dados brutos (para a tabela e filtros locais)
  todasMultas: Fine[];
  multasFiltradas: Fine[];
}

interface AnalyticsFilters extends FineFilters {
  // campos adicionais para filtros locais, se houver
  busca?: string;
  // agruparPor?: 'mes' | 'garagem' | 'gravidade' | 'status' | 'agente'; // Removido, pois o agrupamento é feito no frontend
}

export function useLegalAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todasMultas, setTodasMultas] = useState<Fine[]>([]);
  const [totalRegistrosBackend, setTotalRegistrosBackend] = useState(0); // Total de registros no backend

  // ✅ NOVO: Obter filtros padrão para mês atual
  const getFiltrosPadrao = useCallback(() => {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    return {
      dataInicio: primeiroDiaDoMes.toISOString().split('T')[0],
      dataFim: ultimoDiaDoMes.toISOString().split('T')[0],
      limite: 50, // Limite padrão
      offset: 0,
    };
  }, []);

  // ✅ NOVO: Estado para os filtros, inicializado com a função para evitar re-render em loop
  const [filtros, setFiltros] = useState<AnalyticsFilters>(getFiltrosPadrao);

  // ✅ OTIMIZADO: Carregar dados com filtros inteligentes e sem loop
  const carregarDados = useCallback(async (currentFilters: AnalyticsFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando dados para analytics com filtros:', currentFilters);
      
      const response = await legalService.getAnalyticsData(currentFilters);
      
      console.log('📊 Response (legalService):', response);
      
      if (response.success && Array.isArray(response.data)) {
        setTodasMultas(response.data);
        setTotalRegistrosBackend(response.count || response.data.length); // ✅ Armazena o total do backend
        console.log(`✅ Analytics: ${response.data.length} multas carregadas para o período (${response.count || response.data.length} total no backend)`);
        
        if (response.data.length > 0) {
          console.log('�� Primeira multa:', response.data[0]);
          console.log('📋 Última multa:', response.data[response.data.length - 1]);
        }
      } else {
        console.warn('⚠️ Response sem dados:', response);
        setTodasMultas([]);
        setTotalRegistrosBackend(0);
        setError(response.message || 'Nenhuma multa encontrada para o período selecionado.');
      }
      
    } catch (err: any) {
      console.error('❌ Erro completo no carregarDados:', err);
      setTodasMultas([]);
      setTotalRegistrosBackend(0);
      setError(err.message || 'Erro ao carregar dados para análise');
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Sem dependências no estado 'filtros' para evitar loop

  // ✅ NOVO: Função para aplicar filtros
  const aplicarFiltros = useCallback(async (newFilters: Partial<AnalyticsFilters>) => {
    const filtrosAtualizados = { 
      ...filtros, 
      ...newFilters,
      offset: 0, // ✅ Resetar offset ao aplicar novos filtros
    };
    setFiltros(filtrosAtualizados); // Atualiza o estado dos filtros
    await carregarDados(filtrosAtualizados); // Inicia o carregamento com os novos filtros
  }, [filtros, carregarDados]);

  // ✅ NOVO: Função para carregar mais dados (paginação)
  const carregarMaisDados = useCallback(async () => {
    if (todasMultas.length >= totalRegistrosBackend && totalRegistrosBackend > 0) {
      console.log('Fim dos registros, não há mais dados para carregar.');
      return; // Não há mais dados no backend
    }

    const novoOffset = filtros.offset! + filtros.limite!;
    const novosFiltros = { ...filtros, offset: novoOffset };
    setFiltros(novosFiltros); // Atualiza o estado dos filtros
    
    try {
      setLoading(true);
      setError(null);
      const response = await legalService.getAnalyticsData(novosFiltros);
      if (response.success && Array.isArray(response.data)) {
        setTodasMultas(prev => [...prev, ...response.data]); // Adiciona os novos dados aos existentes
        setTotalRegistrosBackend(response.count || response.data.length);
      } else {
        setError(response.message || 'Falha ao carregar mais dados.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mais dados.');
      console.error('❌ Erro ao carregar mais dados:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, todasMultas, totalRegistrosBackend]);

  // ✅ NOVO: Limpar filtros e voltar ao padrão
  const limparFiltros = useCallback(async () => {
    const filtrosPadrao = getFiltrosPadrao();
    setFiltros(filtrosPadrao); // Atualiza o estado para os filtros padrão
    await carregarDados(filtrosPadrao); // Inicia o carregamento com os filtros padrão
  }, [getFiltrosPadrao, carregarDados]);

  // ✅ CORREÇÃO CRÍTICA: UseEffect para carregamento inicial (roda apenas uma vez)
  useEffect(() => {
    carregarDados(filtros); // Chama carregarDados com os filtros iniciais
  }, []); // ✅ Array de dependência vazio: roda APENAS na montagem do componente

  // Aplicar filtros locais (mantido igual)
  const multasFiltradas = useMemo(() => {
    let resultado = [...todasMultas];

    // Aqui você pode adicionar filtros de busca local para a tabela detalhada
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(m => 
        (m.numero_ait || '').toLowerCase().includes(termo) ||
        (m.prefixo_veiculo || '').toLowerCase().includes(termo) ||
        (m.placa_veiculo || '').toLowerCase().includes(termo) ||
        (m.nome_agente || '').toLowerCase().includes(termo) ||
        (m.nome_garagem || '').toLowerCase().includes(termo) ||
        (m.descricao_infracao || '').toLowerCase().includes(termo)
      );
    }

    // Filtros de gravidade, status, etc. aplicados aqui se não forem enviados ao backend
    // Se eles forem enviados ao backend, `todasMultas` já virá filtrado.
    if (filtros.gravidadeInfracao) {
      resultado = resultado.filter(m => {
        const gravidade = m.gravidadeInfracao || m.gravidade_infracao;
        return gravidade === filtros.gravidadeInfracao;
      });
    }

    if (filtros.statusMulta) {
      resultado = resultado.filter(m => {
        const status = m.statusMulta || m.status_multa;
        return status === filtros.statusMulta;
      });
    }

    if (filtros.prefixoVeiculo) { // Se este filtro é só local
      resultado = resultado.filter(m => {
        const prefixo = m.prefixoVeiculo || m.prefixo_veiculo;
        return prefixo?.toLowerCase().includes(filtros.prefixoVeiculo!.toLowerCase());
      });
    }

    if (filtros.nomeAgente) { // Se este filtro é só local
      resultado = resultado.filter(m => {
        const agente = m.nomeAgente || m.nome_agente;
        return agente?.toLowerCase().includes(filtros.nomeAgente!.toLowerCase());
      });
    }

    return resultado;
  }, [todasMultas, filtros]);

  // Processar dados para gráficos (mantido, otimizado para os campos do adapter)
  const analyticsData: AnalyticsData = useMemo(() => {
    console.log('📊 Processando analytics para', multasFiltradas.length, 'multas');

    // Funções auxiliares para extrair valores com fallback
    const getValorMulta = (multa: Fine) => parseFloat(multa.valorMulta?.toString() || multa.valor_multa || '0') || 0;
    const getGravidade = (multa: Fine) => (multa.gravidadeInfracao || multa.gravidade_infracao || 'NÃO INFORMADO');
    const getGaragem = (multa: Fine) => (multa.nomeGaragem || multa.nome_garagem || 'NÃO INFORMADO');
    const getStatus = (multa: Fine) => (multa.statusMulta || multa.status_multa || 'NÃO INFORMADO');
    const getAgente = (multa: Fine) => (multa.nomeAgente || multa.nome_agente || 'NÃO INFORMADO');
    const getDataEmissao = (multa: Fine) => (multa.dataEmissao || multa.data_emissao);

    // Multas por mês (últimos 12 meses apenas)
    const multasPorMes = multasFiltradas.reduce((acc, multa) => {
      const dataEmissao = getDataEmissao(multa);
      if (!dataEmissao) return acc;
      
      const date = new Date(dataEmissao);
      const mes = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!acc[mes]) {
        acc[mes] = { total: 0, valor: 0 };
      }
      
      acc[mes].total += 1;
      acc[mes].valor += getValorMulta(multa);
      
      return acc;
    }, {} as Record<string, { total: number; valor: number }>);

    // Multas por gravidade
    const coresGravidade = {
      'LEVE': '#22c55e', 'MEDIA': '#f59e0b', 'GRAVE': '#ef4444', 'GRAVISSIMA': '#dc2626', 'NÃO INFORMADO': '#6b7280'
    };
    const multasPorGravidade = multasFiltradas.reduce((acc, multa) => {
      const gravidade = getGravidade(multa);
      if (!acc[gravidade]) acc[gravidade] = { total: 0, valor: 0 };
      acc[gravidade].total += 1;
      acc[gravidade].valor += getValorMulta(multa);
      return acc;
    }, {} as Record<string, { total: number; valor: number }>);

    // Multas por garagem (top 10)
    const multasPorGaragem = multasFiltradas.reduce((acc, multa) => {
      const garagem = getGaragem(multa);
      if (!acc[garagem]) acc[garagem] = { total: 0, valor: 0 };
      acc[garagem].total += 1;
      acc[garagem].valor += getValorMulta(multa);
      return acc;
    }, {} as Record<string, { total: number; valor: number }>);

    // Multas por status
    const coresStatus = {
      'VENCIDA': '#dc2626', 'VENCENDO_30_DIAS': '#f59e0b', 'PAGA': '#22c55e', 'PENDENTE': '#6b7280', 'NÃO INFORMADO': '#6b7280'
    };
    const multasPorStatus = multasFiltradas.reduce((acc, multa) => {
      const status = getStatus(multa);
      if (!acc[status]) acc[status] = { total: 0, valor: 0 };
      acc[status].total += 1;
      acc[status].valor += getValorMulta(multa);
      return acc;
    }, {} as Record<string, { total: number; valor: number }>);

    // Multas por agente (top 10)
    const multasPorAgente = multasFiltradas.reduce((acc, multa) => {
      const agente = getAgente(multa);
      if (!acc[agente]) acc[agente] = { total: 0, valor: 0 };
      acc[agente].total += 1;
      acc[agente].valor += getValorMulta(multa);
      return acc;
    }, {} as Record<string, { total: number; valor: number }>);

    // Estatísticas
    const totalMultas = multasFiltradas.length;
    const valorTotal = multasFiltradas.reduce((sum, m) => sum + getValorMulta(m), 0);
    const mediaValor = totalMultas > 0 ? valorTotal / totalMultas : 0;
    
    const multasVencidas = multasFiltradas.filter(m => getStatus(m) === 'VENCIDA').length;
    const multasVencendo = multasFiltradas.filter(m => getStatus(m) === 'VENCENDO_30_DIAS').length;
    const multasPagas = multasFiltradas.filter(m => getStatus(m) === 'PAGA').length;

    return {
      multasPorMes: Object.entries(multasPorMes)
        .map(([month, data]) => ({ month, total: data.total, valor: data.valor }))
        .sort((a, b) => { // Ordenar cronologicamente
          const [monthA, yearA] = a.month.split(' ');
          const [monthB, yearB] = b.month.split(' ');
          const dateA = new Date(`${monthA} 1, ${yearA}`);
          const dateB = new Date(`${monthB} 1, ${yearB}`);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(-12), // ✅ Últimos 12 meses apenas

      multasPorGravidade: Object.entries(multasPorGravidade)
        .map(([gravidade, data]) => ({ gravidade, total: data.total, valor: data.valor, color: coresGravidade[gravidade as keyof typeof coresGravidade] || '#6b7280' }))
        .sort((a,b) => b.total - a.total),

      multasPorGaragem: Object.entries(multasPorGaragem)
        .map(([garagem, data]) => ({ garagem, total: data.total, valor: data.valor }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10), // ✅ Top 10 apenas

      multasPorStatus: Object.entries(multasPorStatus)
        .map(([status, data]) => ({ status, total: data.total, valor: data.valor, color: coresStatus[status as keyof typeof coresStatus] || '#6b7280' }))
        .sort((a,b) => b.total - a.total),

      multasPorAgente: Object.entries(multasPorAgente)
        .map(([agente, data]) => ({ agente, total: data.total, valor: data.valor }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10), // ✅ Top 10 apenas

      totalMultas,
      valorTotal,
      mediaValor,
      multasVencidas,
      multasVencendo,
      multasPagas,
      todasMultas,
      multasFiltradas
    };
  }, [multasFiltradas]);

  return {
    data: analyticsData,
    loading,
    error,
    filtros,
    
    aplicarFiltros,
    limparFiltros,
    carregarMaisDados,
    refetch: () => carregarDados(filtros),
    
    temMaisDados: todasMultas.length < totalRegistrosBackend, // ✅ Verifica se há mais dados no backend
    limiteAtual: filtros.limite,
    totalRegistrosBackend,
  };
}