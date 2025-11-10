// apps/frontend/src/hooks/useInativosReports.ts
import { useCallback } from 'react';
import { useReports } from './useReports';
import { ReportData } from '../services/reports/reportService';

export const useInativosReports = () => {
  const { isGenerating, generateReport } = useReports();

  const generateInativosReport = useCallback(async (
    funcionarios: any[],
    tipoInativo: 'afastados' | 'demitidos',
    filtros: any = {},
    format: 'html' | 'excel' | 'both' = 'both'
  ) => {
    const estatisticas = {
      total: funcionarios.length,
      ativos: 0,
      afastados: tipoInativo === 'afastados' ? funcionarios.length : 0,
      demitidos: tipoInativo === 'demitidos' ? funcionarios.length : 0,
      tipoAtual: tipoInativo === 'afastados' ? 'Funcionários Afastados' : 'Funcionários Demitidos'
    };

    const data: ReportData = {
      titulo: `Relatório de Funcionários ${tipoInativo === 'afastados' ? 'Afastados' : 'Demitidos'}`,
      subtitulo: `${funcionarios.length} funcionários ${tipoInativo} encontrados`,
      dados: funcionarios,
      filtros: {
        ...filtros,
        tipoInativo: tipoInativo === 'afastados' ? 'Afastados' : 'Demitidos'
      },
      estatisticas,
      tipo: 'funcionarios'
    };

    await generateReport(data, format);
  }, [generateReport]);

  return {
    isGenerating,
    generateInativosReport
  };
};