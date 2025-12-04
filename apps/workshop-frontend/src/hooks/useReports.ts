// apps/frontend/src/hooks/useReports.ts
import { useState, useCallback } from 'react';
import { reportService, ReportData } from '../services/reports/reportService';

export const useReports = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (
    data: ReportData,
    format: 'html' | 'excel' | 'both' = 'both'
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('📊 [REPORTS] Gerando relatório:', { format, tipo: data.tipo, registros: data.dados.length });

      if (format === 'html' || format === 'both') {
        reportService.downloadHTMLReport(data);
      }

      if (format === 'excel' || format === 'both') {
        reportService.generateExcelReport(data);
      }

      console.log('✅ [REPORTS] Relatório gerado com sucesso');
    } catch (err) {
      console.error('❌ [REPORTS] Erro ao gerar relatório:', err);
      setError('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateFuncionariosReport = useCallback(async (
    funcionarios: any[],
    filtros: any = {},
    format: 'html' | 'excel' | 'both' = 'both'
  ) => {
    const estatisticas = {
      total: funcionarios.length,
      ativos: funcionarios.filter(f => f.situacao === 'A').length,
      afastados: funcionarios.filter(f => f.situacao === 'F').length,
      demitidos: funcionarios.filter(f => f.situacao === 'D').length
    };

    const data: ReportData = {
      titulo: 'Relatório de Funcionários',
      subtitulo: `${funcionarios.length} funcionários encontrados`,
      dados: funcionarios,
      filtros,
      estatisticas,
      tipo: 'funcionarios'
    };

    await generateReport(data, format);
  }, [generateReport]);

  const generateGraficosReport = useCallback(async (
    dadosGraficos: any[],
    estatisticas: any = {},
    format: 'html' | 'excel' | 'both' = 'both'
  ) => {
    const data: ReportData = {
      titulo: 'Relatório de Análises e Gráficos',
      subtitulo: 'Análises detalhadas dos dados de pessoal',
      dados: dadosGraficos,
      estatisticas,
      tipo: 'graficos'
    };

    await generateReport(data, format);
  }, [generateReport]);

  return {
    isGenerating,
    error,
    generateReport,
    generateFuncionariosReport,
    generateGraficosReport
  };
};