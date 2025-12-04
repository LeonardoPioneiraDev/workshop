// useExportHook.ts
import { useCallback } from 'react';
import { useFiltros } from './FiltrosContext';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export function useExport(
  dadosFiltrados: any[],
  filtrosSelecionados: any,
  view: string,
  chartType: string,
  totaisViagens: any,
  formattedDate: string,
  // ✅ NOVOS PARÂMETROS OPCIONAIS
  incluirDetalhesViagens?: boolean,
  viagensDetalhadas?: any[],
  filtrosDetalhes?: {
    tiposStatus: Record<string, boolean>;
    periodoDetalhes: string;
    limitarRegistros: boolean;
    limiteRegistros: number;
  }
) {
  const { 
    filtrosPrincipais, 
    filtrosDetalhados, 
    obterDescricaoFiltros 
  } = useFiltros();

  const prepararDadosParaExportacao = useCallback(() => {
    console.log('🔍 Debug useExport - Dados de entrada:', {
      filtrosPrincipaisContext: filtrosPrincipais,
      filtrosDetalhadosContext: filtrosDetalhados,
      filtrosSelecionadosComponente: filtrosSelecionados,
      formattedDateParam: formattedDate,
      incluirDetalhesViagens,
      totalViagensDetalhadas: viagensDetalhadas?.length,
    });

    const isValidDate = (date: any): boolean => {
      if (!date) return false;
      if (date instanceof Date) return !isNaN(date.getTime());
      if (typeof date === 'string') {
        const trimmed = date.trim();
        return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'N/A';
      }
      return false;
    };

    let dtInicio: string | Date | null = null;
    let dtFim: string | Date | null = null;

    // Lógica de datas (mantida igual)
    if (isValidDate(filtrosSelecionados?.dataInicio)) {
      dtInicio = filtrosSelecionados.dataInicio;
    }
    if (isValidDate(filtrosSelecionados?.dataFim)) {
      dtFim = filtrosSelecionados.dataFim;
    }

    if (!dtInicio && isValidDate(filtrosPrincipais.dataInicio)) {
      dtInicio = filtrosPrincipais.dataInicio;
    }
    if (!dtFim && isValidDate(filtrosPrincipais.dataFim)) {
      dtFim = filtrosPrincipais.dataFim;
    }

    if (!dtInicio && !dtFim && isValidDate(filtrosPrincipais.dia)) {
      dtInicio = filtrosPrincipais.dia;
      dtFim = filtrosPrincipais.dia;
    }

    if (!dtInicio && !dtFim && isValidDate(formattedDate)) {
      dtInicio = formattedDate;
      dtFim = formattedDate;
    }

    if (!dtInicio && !dtFim) {
      const hoje = new Date();
      dtInicio = hoje;
      dtFim = hoje;
      console.warn('⚠️ Nenhuma data encontrada, usando data atual como fallback');
    }

    // Combinar todos os filtros disponíveis
    const todosFiltrosDisponiveis: Record<string, any> = {};

    if (filtrosPrincipais && typeof filtrosPrincipais === 'object') {
      Object.entries(filtrosPrincipais).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
          todosFiltrosDisponiveis[chave] = valor;
        }
      });
    }

    if (filtrosDetalhados && typeof filtrosDetalhados === 'object') {
      Object.entries(filtrosDetalhados).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
          todosFiltrosDisponiveis[chave] = valor;
        }
      });
    }

    if (filtrosSelecionados && typeof filtrosSelecionados === 'object') {
      Object.entries(filtrosSelecionados).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
          todosFiltrosDisponiveis[chave] = valor;
        }
      });
    }

    if (dtInicio) {
      todosFiltrosDisponiveis.dataInicio = dtInicio;
    }
    if (dtFim) {
      todosFiltrosDisponiveis.dataFim = dtFim;
    }

    console.log('🔍 Debug - Todos os filtros combinados:', todosFiltrosDisponiveis);

    // ✅ PREPARAR OPÇÕES COM PARÂMETROS EXTRAS
    const opcoes = {
      filtros: todosFiltrosDisponiveis,
      tipoVisualizacao: view,
      tipoGrafico: chartType,
      totais: totaisViagens,
      dataReferencia: formattedDate,
      // ✅ NOVOS CAMPOS PARA DETALHES DAS VIAGENS
      incluirDetalhesViagens: incluirDetalhesViagens || false,
      viagensDetalhadas: viagensDetalhadas || [],
      filtrosDetalhes: filtrosDetalhes,
      filtrosContext: {
        filtrosPrincipais: filtrosPrincipais || {},
        filtrosDetalhados: filtrosDetalhados || {},
        descricaoFiltros: obterDescricaoFiltros()
      }
    };

    console.log('🔍 Debug useExport - Opções finais para exportação:', {
      filtros: opcoes.filtros,
      filtrosContext: opcoes.filtrosContext,
      totalFiltros: Object.keys(opcoes.filtros).length,
      incluirDetalhesViagens: opcoes.incluirDetalhesViagens,
      totalViagensDetalhadas: opcoes.viagensDetalhadas.length,
    });

    return {
      dados: dadosFiltrados,
      opcoes
    };
  }, [
    dadosFiltrados, 
    filtrosSelecionados, 
    view, 
    chartType, 
    totaisViagens, 
    formattedDate,
    filtrosPrincipais,
    filtrosDetalhados,
    obterDescricaoFiltros,
    // ✅ NOVAS DEPENDÊNCIAS
    incluirDetalhesViagens,
    viagensDetalhadas,
    filtrosDetalhes
  ]);

  const handleExportPDF = useCallback(() => {
    try {
      const { dados, opcoes } = prepararDadosParaExportacao();
      console.log('📄 Iniciando exportação PDF com:', {
        totalDados: dados.length,
        totalFiltros: Object.keys(opcoes.filtros).length,
        incluirDetalhes: opcoes.incluirDetalhesViagens,
        totalDetalhadas: opcoes.viagensDetalhadas.length,
      });
      exportToPDF(dados, opcoes);
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
    }
  }, [prepararDadosParaExportacao]);

  const handleExportExcel = useCallback(() => {
    try {
      const { dados, opcoes } = prepararDadosParaExportacao();
      console.log('📊 Iniciando exportação Excel com:', {
        totalDados: dados.length,
        totalFiltros: Object.keys(opcoes.filtros).length,
        incluirDetalhes: opcoes.incluirDetalhesViagens,
        totalDetalhadas: opcoes.viagensDetalhadas.length,
      });
      exportToExcel(dados, opcoes);
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error);
    }
  }, [prepararDadosParaExportacao]);

  return {
    handleExportPDF,
    handleExportExcel
  };
}