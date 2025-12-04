import { useState, useCallback, useRef } from 'react';
import { reportService, RelatorioGeralData } from '@/services/departments/legal/reportService';
import { reportPersistenceService, RelatorioSalvo } from '@/services/departments/legal/reportPersistenceService';
import { toast } from 'sonner';

export const useRelatorios = () => {
  const [loading, setLoading] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState<RelatorioGeralData | null>(null);
  const [relatoriosSalvos, setRelatoriosSalvos] = useState<RelatorioSalvo[]>([]);
  
  // Usar useRef para controle de estado
  const isProcessingRef = useRef(false);

  // Carregar relatórios salvos
  const carregarRelatoriosSalvos = useCallback(() => {
    try {
      const relatorios = reportPersistenceService.carregarRelatorios();
      setRelatoriosSalvos(relatorios);
      return relatorios;
    } catch (error) {
      console.error('Erro ao carregar relatórios salvos:', error);
      return [];
    }
  }, []);

  // Gerar relatório geral (sem salvar)
  const gerarRelatorioGeral = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log('Já está processando um relatório...');
      return null;
    }
    
    isProcessingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔄 Iniciando geração de relatório...');
      
      const dados = await reportService.gerarRelatorioGeral();
      setDadosRelatorio(dados);

      console.log('✅ Relatório gerado com sucesso:', dados);
      return dados;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório', {
        description: 'Verifique a conexão com o servidor'
      });
      throw error;
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, []);

  // Gerar e salvar relatório completo
  const gerarESalvarRelatorioCompleto = useCallback(async () => {
    if (isProcessingRef.current) {
      toast.info('Aguarde, já existe um relatório sendo processado...');
      return null;
    }
    
    isProcessingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔄 Gerando relatório completo...');
      
      toast.info('Gerando relatório completo...', {
        description: 'Coletando dados e formatando'
      });

      // Gerar dados primeiro
      const dados = await reportService.gerarRelatorioGeral();
      
      // Salvar no sistema de persistência
      const relatorioSalvo = reportPersistenceService.adicionarRelatorio({
        nome: `Relatório Completo - ${dados.periodo.mes}/${dados.periodo.ano}`,
        descricao: `Relatório completo do departamento jurídico - ${dados.periodo.dataInicio} a ${dados.periodo.dataFim}`,
        tipo: 'multas_geral',
        formato: 'html',
        status: 'processando',
        ultimaExecucao: new Date().toISOString(),
        agendamento: 'manual',
        registros: dados.resumo.totalMultas,
        criadoPor: 'Leonardo',
        dadosRelatorio: dados
      });

      // Gerar HTML
      await reportService.salvarRelatorioHTML(dados);
      
      // Gerar Excel
      await reportService.exportarParaExcelFormatado(dados);

      // Atualizar status para concluído
      reportPersistenceService.atualizarRelatorio(relatorioSalvo.id, {
        status: 'concluido',
        tamanho: '2.8 MB'
      });

      // Atualizar lista
      setTimeout(() => {
        carregarRelatoriosSalvos();
      }, 500);

      toast.success('Relatório completo gerado!', {
        description: 'HTML e Excel baixados automaticamente'
      });

      return relatorioSalvo;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório completo:', error);
      toast.error('Erro ao gerar relatório completo', {
        description: error.message || 'Erro desconhecido'
      });
      throw error;
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [carregarRelatoriosSalvos]);

  // Gerar e salvar apenas Excel
  const gerarESalvarExcel = useCallback(async () => {
    if (isProcessingRef.current) {
      toast.info('Aguarde, já existe um relatório sendo processado...');
      return null;
    }
    
    isProcessingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔄 Gerando Excel...');
      
      toast.info('Gerando planilha Excel...', {
        description: 'Formatando dados profissionalmente'
      });

      const dados = await reportService.gerarRelatorioGeral();
      
      const relatorioSalvo = reportPersistenceService.adicionarRelatorio({
        nome: `Excel Profissional - ${dados.periodo.mes}/${dados.periodo.ano}`,
        descricao: `Planilha Excel formatada - ${dados.periodo.dataInicio} a ${dados.periodo.dataFim}`,
        tipo: 'multas_geral',
        formato: 'excel',
        status: 'processando',
        ultimaExecucao: new Date().toISOString(),
        agendamento: 'manual',
        registros: dados.resumo.totalMultas,
        criadoPor: 'Leonardo',
        dadosRelatorio: dados
      });

      await reportService.exportarParaExcelFormatado(dados);

      reportPersistenceService.atualizarRelatorio(relatorioSalvo.id, {
        status: 'concluido',
        tamanho: '1.8 MB'
      });

      setTimeout(() => {
        carregarRelatoriosSalvos();
      }, 500);

      toast.success('Excel profissional gerado!', {
        description: 'Planilha formatada baixada automaticamente'
      });

      return relatorioSalvo;
    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      toast.error('Erro ao gerar Excel', {
        description: error.message || 'Erro desconhecido'
      });
      throw error;
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [carregarRelatoriosSalvos]);

  // Gerar e salvar apenas HTML
  const gerarESalvarHTML = useCallback(async () => {
    if (isProcessingRef.current) {
      toast.info('Aguarde, já existe um relatório sendo processado...');
      return null;
    }
    
    isProcessingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔄 Gerando HTML...');
      
      toast.info('Gerando relatório HTML...', {
        description: 'Criando visualização profissional'
      });

      const dados = await reportService.gerarRelatorioGeral();
      
      const relatorioSalvo = reportPersistenceService.adicionarRelatorio({
        nome: `Relatório Visual - ${dados.periodo.mes}/${dados.periodo.ano}`,
        descricao: `Relatório HTML estilizado - ${dados.periodo.dataInicio} a ${dados.periodo.dataFim}`,
        tipo: 'multas_geral',
        formato: 'html',
        status: 'processando',
        ultimaExecucao: new Date().toISOString(),
        agendamento: 'manual',
        registros: dados.resumo.totalMultas,
        criadoPor: 'Leonardo',
        dadosRelatorio: dados
      });

      await reportService.salvarRelatorioHTML(dados);

      reportPersistenceService.atualizarRelatorio(relatorioSalvo.id, {
        status: 'concluido',
        tamanho: '1.2 MB'
      });

      setTimeout(() => {
        carregarRelatoriosSalvos();
      }, 500);

      toast.success('Relatório HTML gerado!', {
        description: 'Arquivo visual baixado automaticamente'
      });

      return relatorioSalvo;
    } catch (error) {
      console.error('❌ Erro ao gerar HTML:', error);
      toast.error('Erro ao gerar HTML', {
        description: error.message || 'Erro desconhecido'
      });
      throw error;
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [carregarRelatoriosSalvos]);

  // Funções de exportação simples (sem salvar)
  const exportarParaExcel = useCallback(async (dados?: RelatorioGeralData) => {
    try {
      const dadosParaExportar = dados || dadosRelatorio;
      if (!dadosParaExportar) {
        const novosDados = await gerarRelatorioGeral();
        if (novosDados) {
          await reportService.exportarParaExcelFormatado(novosDados);
        }
        return;
      }

      await reportService.exportarParaExcelFormatado(dadosParaExportar);
      toast.success('Excel baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  }, [dadosRelatorio, gerarRelatorioGeral]);

  const exportarParaHTML = useCallback(async (dados?: RelatorioGeralData) => {
    try {
      const dadosParaExportar = dados || dadosRelatorio;
      if (!dadosParaExportar) {
        const novosDados = await gerarRelatorioGeral();
        if (novosDados) {
          await reportService.salvarRelatorioHTML(novosDados);
        }
        return;
      }

      await reportService.salvarRelatorioHTML(dadosParaExportar);
      toast.success('HTML baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar HTML:', error);
      toast.error('Erro ao exportar HTML');
    }
  }, [dadosRelatorio, gerarRelatorioGeral]);

  // Outras funções...
  const regenerarRelatorio = useCallback(async (relatorioId: string) => {
    const relatorio = reportPersistenceService.buscarRelatorio(relatorioId);
    if (!relatorio || !relatorio.dadosRelatorio) {
      toast.error('Relatório não encontrado ou sem dados');
      return;
    }

    try {
      if (relatorio.formato === 'excel') {
        await reportService.exportarParaExcelFormatado(relatorio.dadosRelatorio);
      } else if (relatorio.formato === 'html') {
        await reportService.salvarRelatorioHTML(relatorio.dadosRelatorio);
      }

      reportPersistenceService.incrementarDownload(relatorioId);
      carregarRelatoriosSalvos();

      toast.success('Relatório baixado novamente!');
    } catch (error) {
      console.error('Erro ao regenerar relatório:', error);
      toast.error('Erro ao regenerar relatório');
    }
  }, [carregarRelatoriosSalvos]);

  const excluirRelatorio = useCallback((relatorioId: string) => {
    const sucesso = reportPersistenceService.removerRelatorio(relatorioId);
    
    if (sucesso) {
      carregarRelatoriosSalvos();
      toast.success('Relatório excluído!');
    } else {
      toast.error('Erro ao excluir relatório');
    }
  }, [carregarRelatoriosSalvos]);

  // Função legacy
  const gerarEExportarTodos = useCallback(async () => {
    return await gerarESalvarRelatorioCompleto();
  }, [gerarESalvarRelatorioCompleto]);

  return {
    loading,
    dadosRelatorio,
    relatoriosSalvos,
    
    // Funções principais
    gerarRelatorioGeral,
    gerarESalvarRelatorioCompleto,
    gerarESalvarExcel,
    gerarESalvarHTML,
    
    // Funções de exportação
    exportarParaExcel,
    exportarParaHTML,
    
    // Funções de gerenciamento
    carregarRelatoriosSalvos,
    regenerarRelatorio,
    excluirRelatorio,
    
    // Compatibilidade
    gerarEExportarTodos
  };
};