// Em exportUtils.tsx (renomeie para .tsx)
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Em exportUtils.ts
export interface ViagemData {
  AdiantadoInicio: number;
  AtrasadoInicio: number;
  ForadoHorarioInicio: number;
  AdiantadoFim: number;
  AtrasadoFim: number;
  ForadoHorarioFim: number;
  ParcialmenteCumprida: number;
  NaoCumprida: number;
  NomeMotorista?: string;
  NomeLinha?: string;
  SentidoText?: string;
  InicioRealizadoText?: string;
  FimRealizadoText?: string;
  SetorText?: string;
  PrefixoRealizado?: string;
  NumeroViagem?: number;
  InicioPrevisto?: string;
  InicioRealizado?: string;
  DiferencaInicio?: number;
  FimPrevisto?: string;
  FimRealizado?: string;
  DiferencaFim?: number;
  NomePI?: string;
  NomePF?: string;
}

export interface Filtros {
  dataInicio: string;
  dataFim: string;
  tipoVisualizacao: string;
  [key: string]: string;
}

// Em exportUtils.ts
export interface ExportOptions {
  filtros?: Record<string, any>;
  tipoVisualizacao?: string;
  tipoGrafico?: string;
  totais?: { total: number; analisadas: number; pendentes: number };
  dataReferencia?: string;
  incluirDetalhesStatus?: boolean;
  incluirDetalhesViagens?: boolean; // Nova flag
  viagensDetalhadas?: ViagemData[]; // Dados das viagens detalhadas
  filtrosDetalhes?: {
    tiposStatus: Record<string, boolean>;
    periodoDetalhes: string;
    limitarRegistros: boolean;
    limiteRegistros: number;
  };
  filtrosContext?: {
    filtrosPrincipais?: Record<string, any>;
    filtrosDetalhados?: Record<string, any>;
    descricaoFiltros?: string;
  };
}
// Adicione esta função auxiliar no exportUtils.ts
function formatarData(dataString: string | Date | undefined | null): string {
  if (!dataString) return 'N/A';
  
  try {
    let dataParaProcessar: Date;
    
    // Se já é um objeto Date
    if (dataString instanceof Date) {
      dataParaProcessar = dataString;
    } else {
      // Se é string, tentar converter
      const dataLimpa = String(dataString).trim();
      
      // Verificar se é uma string vazia
      if (!dataLimpa || dataLimpa === 'null' || dataLimpa === 'undefined') {
        return 'N/A';
      }
      
      // Tentar diferentes formatos
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
        dataParaProcessar = new Date(dataLimpa);
      }
      // DD/MM/YYYY
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa)) {
        const [dia, mes, ano] = dataLimpa.split('/');
        dataParaProcessar = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      }
      // MM/DD/YYYY
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa)) {
        dataParaProcessar = new Date(dataLimpa);
      }
      // ISO String ou outros formatos
      else {
        dataParaProcessar = new Date(dataLimpa);
      }
    }
    
    // Verificar se a data é válida
    if (isNaN(dataParaProcessar.getTime())) {
      console.warn('Data inválida recebida:', dataString);
      return String(dataString); // Retorna a string original se não conseguir converter
    }
    
    // Formatar para DD/MM/YYYY
    const dia = String(dataParaProcessar.getDate()).padStart(2, '0');
    const mes = String(dataParaProcessar.getMonth() + 1).padStart(2, '0');
    const ano = dataParaProcessar.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
    
  } catch (error) {
    console.warn('Erro ao formatar data:', error, 'Data original:', dataString);
    return String(dataString); // Retorna a string original em caso de erro
  }
}

// === FUNÇÃO ESPECÍFICA PARA DATAS BRASILEIRAS ===
function formatarDataBrasileira(dataString: string | Date | undefined | null): string {
  if (!dataString) return 'N/A';
  
  try {
    // Se é um objeto Date
    if (dataString instanceof Date) {
      const dia = String(dataString.getDate()).padStart(2, '0');
      const mes = String(dataString.getMonth() + 1).padStart(2, '0');
      const ano = dataString.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se é string
    const dataLimpa = String(dataString).trim();
    
    // Se já está no formato DD/MM/YYYY, apenas validar e retornar
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataLimpa)) {
      const [dia, mes, ano] = dataLimpa.split('/').map(num => parseInt(num, 10));
      
      // Validar se é uma data válida
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900) {
        // Retornar com zero à esquerda se necessário
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
      }
    }
    
    // Se está em formato ISO (YYYY-MM-DD), converter
    if (/^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
      const data = new Date(dataLimpa + 'T12:00:00'); // Adicionar horário para evitar problemas de fuso
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Fallback: tentar conversão direta
    const data = new Date(dataLimpa);
    if (!isNaN(data.getTime())) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se nada funcionou, retornar a string original
    return dataLimpa;
    
  } catch (error) {
    console.warn('❌ Erro ao formatar data brasileira:', error);
    return String(dataString);
  }
}

/**
 * Função para exportar dados para Excel com formatação avançada
 * Inclui todos os filtros aplicados do contexto global
 */
// exportUtils.ts
export async function exportToExcel(
  data: ViagemData[],
  options: ExportOptions
) {
  // === FUNÇÃO ESPECÍFICA PARA DATAS BRASILEIRAS ===
  function formatarDataBrasileira(dataString: string | Date | undefined | null): string {
    if (!dataString) return 'N/A';
    
    try {
      // Se é um objeto Date
      if (dataString instanceof Date) {
        const dia = String(dataString.getDate()).padStart(2, '0');
        const mes = String(dataString.getMonth() + 1).padStart(2, '0');
        const ano = dataString.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se é string
      const dataLimpa = String(dataString).trim();
      
      // Se já está no formato DD/MM/YYYY, apenas validar e retornar
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataLimpa)) {
        const [dia, mes, ano] = dataLimpa.split('/').map(num => parseInt(num, 10));
        
        // Validar se é uma data válida
        if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900) {
          // Retornar com zero à esquerda se necessário
          return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
        }
      }
      
      // Se está em formato ISO (YYYY-MM-DD), converter
      if (/^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
        const data = new Date(dataLimpa + 'T12:00:00'); // Adicionar horário para evitar problemas de fuso
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Fallback: tentar conversão direta
      const data = new Date(dataLimpa);
      if (!isNaN(data.getTime())) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se nada funcionou, retornar a string original
      return dataLimpa;
      
    } catch (error) {
      console.warn('❌ Erro ao formatar data brasileira:', error);
      return String(dataString);
    }
  }

  // === FUNÇÃO MELHORADA PARA FORMATAR DATAS ===
  function formatarDataMelhorada(dataString: string | Date | undefined | null): string {
    if (!dataString) return 'N/A';
    
    try {
      let dataParaProcessar: Date;
      
      // Se já é um objeto Date
      if (dataString instanceof Date) {
        dataParaProcessar = dataString;
      } else {
        // Se é string, tentar converter
        const dataLimpa = String(dataString).trim();
        
        // Verificar se é uma string vazia ou inválida
        if (!dataLimpa || dataLimpa === 'null' || dataLimpa === 'undefined' || dataLimpa === 'N/A') {
          return 'N/A';
        }
        
        // Tentar diferentes formatos
        // YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
        if (/^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
          dataParaProcessar = new Date(dataLimpa);
        }
        // DD/MM/YYYY
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa)) {
          const [dia, mes, ano] = dataLimpa.split('/');
          dataParaProcessar = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
        // MM/DD/YYYY (formato americano)
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa) && dataLimpa.split('/')[0] > '12') {
          // Se o primeiro número é maior que 12, provavelmente é DD/MM/YYYY
          const [dia, mes, ano] = dataLimpa.split('/');
          dataParaProcessar = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
        // ISO String ou outros formatos
        else {
          dataParaProcessar = new Date(dataLimpa);
        }
      }
      
      // Verificar se a data é válida
      if (isNaN(dataParaProcessar.getTime())) {
        console.warn('⚠️ Data inválida recebida:', dataString);
        return 'N/A';
      }
      
      // Formatar para DD/MM/YYYY
      const dia = String(dataParaProcessar.getDate()).padStart(2, '0');
      const mes = String(dataParaProcessar.getMonth() + 1).padStart(2, '0');
      const ano = dataParaProcessar.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
      
    } catch (error) {
      console.warn('❌ Erro ao formatar data:', error, 'Data original:', dataString);
      return 'N/A';
    }
  }

  // === LÓGICA MELHORADA PARA OBTER DATAS ===
  function obterDatasValidas() {
    // Função auxiliar para validar data
    const isValidDate = (date: any): boolean => {
      if (!date) return false;
      if (date instanceof Date) return !isNaN(date.getTime());
      if (typeof date === 'string') {
        const trimmed = date.trim();
        return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'N/A';
      }
      return false;
    };

    let dataInicio: string | Date | null = null;
    let dataFim: string | Date | null = null;

    console.log('🔍 Debug - Verificando datas disponíveis:', {
      'options.filtros': options.filtros,
      'options.filtrosContext?.filtrosPrincipais': options.filtrosContext?.filtrosPrincipais,
      'options.filtrosContext?.filtrosDetalhados': options.filtrosContext?.filtrosDetalhados,
      'options.dataReferencia': options.dataReferencia
    });

    // === BUSCAR DATAS EM TODAS AS FONTES ===
    
    // Prioridade 1: Filtros diretos das options
    if (isValidDate(options.filtros?.dataInicio)) {
      dataInicio = options.filtros!.dataInicio;
    }
    if (isValidDate(options.filtros?.dataFim)) {
      dataFim = options.filtros!.dataFim;
    }

    // Prioridade 2: Filtros principais do contexto
    if (!dataInicio && isValidDate(options.filtrosContext?.filtrosPrincipais?.dataInicio)) {
      dataInicio = options.filtrosContext!.filtrosPrincipais!.dataInicio;
    }
    if (!dataFim && isValidDate(options.filtrosContext?.filtrosPrincipais?.dataFim)) {
      dataFim = options.filtrosContext!.filtrosPrincipais!.dataFim;
    }

    // Prioridade 3: Campo 'dia' dos filtros principais
    if (!dataInicio && !dataFim && isValidDate(options.filtrosContext?.filtrosPrincipais?.dia)) {
      dataInicio = options.filtrosContext!.filtrosPrincipais!.dia;
      dataFim = options.filtrosContext!.filtrosPrincipais!.dia;
    }

    // Prioridade 4: Filtros detalhados do contexto
    if (!dataInicio && isValidDate(options.filtrosContext?.filtrosDetalhados?.dataInicio)) {
      dataInicio = options.filtrosContext!.filtrosDetalhados!.dataInicio;
    }
    if (!dataFim && isValidDate(options.filtrosContext?.filtrosDetalhados?.dataFim)) {
      dataFim = options.filtrosContext!.filtrosDetalhados!.dataFim;
    }

    // Prioridade 5: Campo 'dia' dos filtros detalhados
    if (!dataInicio && !dataFim && isValidDate(options.filtrosContext?.filtrosDetalhados?.dia)) {
      dataInicio = options.filtrosContext!.filtrosDetalhados!.dia;
      dataFim = options.filtrosContext!.filtrosDetalhados!.dia;
    }

    // Prioridade 6: dataReferencia das options
    if (!dataInicio && !dataFim && isValidDate(options.dataReferencia)) {
      dataInicio = options.dataReferencia;
      dataFim = options.dataReferencia;
    }

    // Fallback: Se ainda não temos datas, usar data atual
    if (!dataInicio && !dataFim) {
      const hoje = new Date();
      dataInicio = hoje;
      dataFim = hoje;
      console.warn('⚠️ Nenhuma data encontrada, usando data atual como fallback');
    }

    console.log('✅ Datas finais selecionadas:', {
      dataInicio,
      dataFim,
      'dataInicio formatada': formatarDataMelhorada(dataInicio),
      'dataFim formatada': formatarDataMelhorada(dataFim)
    });

    return {
      dataInicio: formatarDataMelhorada(dataInicio),
      dataFim: formatarDataMelhorada(dataFim)
    };
  }

  // === MAPEAMENTO COMPLETO DE NOMES DE FILTROS ===
  const nomesFiltros: { [k: string]: string } = {
    // Filtros principais
    dataInicio: 'Data Início',
    dataFim: 'Data Fim',
    dia: 'Data',
    linha: 'Linha',
    numerolinha: 'Linha',
    idservico: 'Serviço',
    prefixorealizado: 'Prefixo Realizado',
    prefixoprevisto: 'Prefixo Previsto',
    statusini: 'Status Inicial',
    statusfim: 'Status Final',
    tipoVisualizacao: 'Tipo de Visualização',
    
    // ✅ FILTROS DETALHADOS DO CHARTFILTERS
    motorista: 'Motorista',
    sentido: 'Sentido',
    setor: 'Setor',
    prefixoRealizado: 'Prefixo do Veículo', // Note: diferente de prefixorealizado
    
    // Outros possíveis filtros
    garagem: 'Garagem',
    turno: 'Turno',
    operador: 'Operador'
  };

  // === FUNÇÃO PARA VERIFICAR VALOR VÁLIDO ===
  function valorValido(valor: any): boolean {
    if (valor === undefined || valor === null || valor === '') return false;
    if (typeof valor === 'string') {
      const trimmed = valor.trim();
      if (trimmed === '' || ['null', 'undefined', 'N/A', 'todos'].includes(trimmed)) return false;
    }
    return true;
  }

  // === CAMPOS PARA OCULTAR (ATUALIZADO) ===
  const camposParaOcultar = [
    'tiposStatus', 'periodoDetalhes', 'limitarRegistros', 
    'limiteRegistros', 'mostrarDetalhes',
    'OrigemFiltro',     // ✅ NOVO: Remover origem
    'DataConsulta'      // ✅ NOVO: Remover data consulta
  ];

  // === FUNÇÃO PARA VERIFICAR SE DEVE IGNORAR ===
  function deveIgnorarCampo(chave: string): boolean {
    return camposParaOcultar.includes(chave);
  }
  
  // === FUNÇÃO PARA VERIFICAR DUPLICATAS ===
  function ehDuplicata(chave: string, valor: any, jaExibidos: Set<string>): boolean {
    // Verificar duplicatas de linha
    if ((chave === 'Linha' || chave === 'numerolinha') && typeof valor === 'string') {
      const numeroLinha = valor.includes(' - ') ? valor.split(' - ')[0].trim() : valor.trim();
      
      for (const item of jaExibidos) {
        if (item.includes(`Linha: ${numeroLinha}`)) {
          return true;
        }
      }
    }
    
    // Verificar duplicatas de prefixo
    if ((chave === 'Prefixo Realizado' || chave === 'Prefixo do Veículo' || chave === 'prefixorealizado' || chave === 'prefixoRealizado') && typeof valor === 'string') {
      for (const item of jaExibidos) {
        if (item.includes(`Prefixo`) && item.includes(valor.trim())) {
          return true;
        }
      }
    }
    
    return false;
  }

  // === COLETAR TODOS OS FILTROS DE TODAS AS FONTES ===
  const todosOsFiltros: Record<string, any> = {};

  // 1. ✅ FILTROS PRINCIPAIS DO CONTEXTO
  if (options.filtrosContext?.filtrosPrincipais) {
    Object.entries(options.filtrosContext.filtrosPrincipais).forEach(([chave, valor]) => {
      if (valorValido(valor)) {
        todosOsFiltros[chave] = valor;
        console.log(`📋 Adicionado filtro principal: ${chave} = ${valor}`);
      }
    });
  }

  // 2. ✅ FILTROS DETALHADOS DO CONTEXTO (ChartFilters)
  if (options.filtrosContext?.filtrosDetalhados) {
    Object.entries(options.filtrosContext.filtrosDetalhados).forEach(([chave, valor]) => {
      if (valorValido(valor)) {
        todosOsFiltros[chave] = valor;
        console.log(`📊 Adicionado filtro detalhado: ${chave} = ${valor}`);
      }
    });
  }

  // 3. ✅ FILTROS DIRETOS DAS OPTIONS (sobrescreve anteriores)
  if (options.filtros) {
    Object.entries(options.filtros).forEach(([chave, valor]) => {
      if (valorValido(valor)) {
        todosOsFiltros[chave] = valor;
        console.log(`🎯 Adicionado filtro direto: ${chave} = ${valor}`);
      }
    });
  }

  console.log('🔍 Debug - TODOS os filtros coletados:', todosOsFiltros);
  console.log('🔍 Debug - Total de filtros encontrados:', Object.keys(todosOsFiltros).length);

  // === PROCESSAR FILTROS PARA EXIBIÇÃO ===
  const filtrosParaExibir: Array<{chave: string, valor: any, nomeExibicao: string}> = [];
  const jaExibidos = new Set<string>();

  Object.entries(todosOsFiltros).forEach(([chave, valor]) => {
    // Verificar se deve ignorar este campo
    if (deveIgnorarCampo(chave)) {
      console.log(`⏭️ Ignorando campo: ${chave}`);
      return;
    }

    // Obter nome de exibição
    const nomeExibicao = nomesFiltros[chave] || chave.charAt(0).toUpperCase() + chave.slice(1);
    
    // Verificar duplicatas
    if (ehDuplicata(nomeExibicao, valor, jaExibidos)) {
      console.log(`🔄 Ignorando duplicata: ${nomeExibicao} = ${valor}`);
      return;
    }

    // Formatar valor se for data
    let valorFormatado = valor;
    if (['Data Início', 'Data Fim', 'Data'].includes(nomeExibicao)) {
      valorFormatado = formatarDataBrasileira(valor);
    }

    // Criar texto único para verificar duplicatas
    const textoUnico = `${nomeExibicao}: ${valorFormatado}`;
    
    if (!jaExibidos.has(textoUnico)) {
      filtrosParaExibir.push({
        chave: nomeExibicao,
        valor: valorFormatado,
        nomeExibicao
      });
      jaExibidos.add(textoUnico);
      console.log(`✅ Filtro adicionado para exibição: ${textoUnico}`);
    }
  });

  console.log('🔍 Debug - Filtros finais para exibir:', filtrosParaExibir);
  console.log('🔍 Debug - Total de filtros para exibir:', filtrosParaExibir.length);

  // === FUNÇÃO PARA OBTER DATAS REAIS DOS DADOS ===
  function obterDatasReaisDosDados(): { dataInicio: string, dataFim: string } {
    // Usar as datas já processadas como base
    const { dataInicio: dataInicioBase, dataFim: dataFimBase } = obterDatasValidas();
    let dataInicioReal = dataInicioBase;
    let dataFimReal = dataFimBase;
    
    // Se precisar de mais precisão, buscar nos filtros processados
    const filtrosComDatas = filtrosParaExibir.filter(f => 
      ['Data Início', 'Data Fim', 'Data'].includes(f.nomeExibicao) && 
      f.valor !== 'N/A'
    );
    
    if (filtrosComDatas.length > 0) {
      const datasEncontradas = filtrosComDatas.map(f => f.valor);
      if (datasEncontradas.length === 1) {
        // Se só tem uma data, usar para ambas
        dataInicioReal = datasEncontradas[0];
        dataFimReal = datasEncontradas[0];
      } else if (datasEncontradas.length >= 2) {
        // Se tem múltiplas datas, usar primeira e última
        dataInicioReal = datasEncontradas[0];
        dataFimReal = datasEncontradas[datasEncontradas.length - 1];
      }
    }
    
    return {
      dataInicio: dataInicioReal,
      dataFim: dataFimReal
    };
  }

  // Obter as datas formatadas
  const { dataInicio, dataFim } = obterDatasReaisDosDados();

  // Data e informações
  const dataExportacao = new Date().toLocaleString('pt-BR');
  const tipoVisu = options?.tipoVisualizacao || 'todos';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Monitoramento';
  workbook.lastModifiedBy = 'Usuário do Sistema';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Planilha principal - Resumo
  const worksheetResumo = workbook.addWorksheet('Resumo', {
    properties: { tabColor: { argb: '305496' } }
  });
  
  // Planilha de detalhes
  const worksheetDetalhes = workbook.addWorksheet('Detalhes das Viagens', {
    properties: { tabColor: { argb: '548235' } }
  });

  // Estilos
  const titleStyle = {
    font: { size: 16, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '305496' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };
  
  const headerStyle = {
    font: { size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '305496' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };
  
  const subHeaderStyle = {
    font: { size: 11, bold: true },
    alignment: { horizontal: 'center' as const },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'D9E1F2' } },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };
  
  const infoStyle = {
    font: { size: 10 },
    alignment: { horizontal: 'left' as const },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };
  
  const highlightStyle = {
    font: { size: 10, bold: true, color: { argb: '305496' } },
    alignment: { horizontal: 'left' as const },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'EBF1DE' } },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };

  // Funções auxiliares para cálculos e formatação
  
  // Função para verificar se um horário é válido
  function horarioValido(horario: string | undefined): boolean {
    return !!horario && horario !== '-' && horario !== 'N/A';
  }
  
  // Função para obter o horário válido entre duas opções
  function obterHorarioValido(horarioPrincipal?: string, horarioAlternativo?: string): string {
    if (horarioValido(horarioPrincipal)) return horarioPrincipal!;
    if (horarioValido(horarioAlternativo)) return horarioAlternativo!;
    return 'N/A';
  }
  
  // Função para formatar horários (extrair apenas a hora)
  function formatarHorario(dataHora: string | undefined): string {
    if (!dataHora || dataHora === 'N/A' || dataHora === '-') return 'N/A';
    
    // Se já tem formato de data/hora, extrair apenas o horário
    if (dataHora.includes('/')) {
      const partes = dataHora.split(' ');
      if (partes.length > 1) {
        return partes[1]; // Retorna apenas o horário
      }
    }
    
    return dataHora;
  }
  
  // Função para calcular diferença em minutos entre dois horários
  function calcularDiferencaMinutos(horarioPrevisto: string | undefined, horarioRealizado: string | undefined): number | null {
    if (!horarioValido(horarioPrevisto) || !horarioRealizado || horarioRealizado === 'N/A') {
      return null;
    }
    
    try {
      // Extrair apenas o horário se estiver em formato de data e hora
      const horaPrevista = formatarHorario(horarioPrevisto);
      const horaRealizada = formatarHorario(horarioRealizado);
      
      if (horaPrevista === 'N/A' || horaRealizada === 'N/A') {
        return null;
      }
      
      // Converter para objetos Date para calcular a diferença
      const [horaP, minutoP, segundoP = '0'] = horaPrevista.split(':').map(Number);
      const [horaR, minutoR, segundoR = '0'] = horaRealizada.split(':').map(Number);
      
      if (isNaN(horaP) || isNaN(minutoP) || isNaN(horaR) || isNaN(minutoR)) {
        return null;
      }
      
      // Calcular minutos totais
      const minutosTotaisPrevisto = (horaP * 60) + minutoP + (segundoP / 60);
      const minutosTotaisRealizado = (horaR * 60) + minutoR + (segundoR / 60);
      
      // Calcular diferença (realizado - previsto)
      return Math.round(minutosTotaisRealizado - minutosTotaisPrevisto);
    } catch (error) {
      return null;
    }
  }
  
  // Função para formatar a diferença de tempo
  function formatarDiferenca(diferenca: number | null): string {
    if (diferenca === null) return 'N/A';
    
    const sinal = diferenca < 0 ? '-' : '+';
    const valorAbs = Math.abs(diferenca);
    
    // Formatar como minutos ou como horas e minutos se for maior que 60 minutos
    if (valorAbs >= 60) {
      const horas = Math.floor(valorAbs / 60);
      const minutos = valorAbs % 60;
      return `${sinal}${horas}h${minutos.toString().padStart(2, '0')}m`;
    } else {
      return `${sinal}${valorAbs}min`;
    }
  }
  
  // Função para determinar o status da viagem
  function determinarStatus(viagem: ViagemData): string {
    if (viagem.NaoCumprida > 0) return 'Não Realizada';
    if (viagem.ParcialmenteCumprida > 0) return 'Parcialmente Cumprida';
    
    let status = [];
    
    if (viagem.AdiantadoInicio > 0) status.push('Adiant. Início');
    if (viagem.AtrasadoInicio > 0) status.push('Atras. Início');
    if (viagem.ForadoHorarioInicio > 0) status.push('Fora Início');
    
    if (viagem.AdiantadoFim > 0) status.push('Adiant. Fim');
    if (viagem.AtrasadoFim > 0) status.push('Atras. Fim');
    if (viagem.ForadoHorarioFim > 0) status.push('Fora Fim');
    
    return status.join(', ') || 'Normal';
  }

  // ===== PLANILHA DE RESUMO =====
  
  // Título
  worksheetResumo.mergeCells('A1:G1');
  worksheetResumo.getCell('A1').value = `RELATÓRIO DE MONITORAMENTO DE VIAGENS`;
  Object.assign(worksheetResumo.getCell('A1'), titleStyle);
  worksheetResumo.getRow(1).height = 30;
  
  // Subtítulo com período
  worksheetResumo.mergeCells('A2:G2');
  let textoPeriodo = '';
  if (dataInicio !== 'N/A' && dataFim !== 'N/A') {
    if (dataInicio === dataFim) {
      textoPeriodo = `Período: ${dataInicio} - Exportado em: ${dataExportacao}`;
    } else {
      textoPeriodo = `Período: ${dataInicio} a ${dataFim} - Exportado em: ${dataExportacao}`;
    }
  } else {
    textoPeriodo = `Exportado em: ${dataExportacao}`;
  }
  worksheetResumo.getCell('A2').value = textoPeriodo;
  Object.assign(worksheetResumo.getCell('A2'), subHeaderStyle);
  
  // Seção de Filtros
  worksheetResumo.mergeCells('A3:G3');
  worksheetResumo.getCell('A3').value = 'FILTROS APLICADOS';
  Object.assign(worksheetResumo.getCell('A3'), headerStyle);
  
  let linha = 4;
  
  if (filtrosParaExibir.length > 0) {
    worksheetResumo.mergeCells(`A${linha}:C${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Filtro';
    Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
    
    worksheetResumo.mergeCells(`D${linha}:G${linha}`);
    worksheetResumo.getCell(`D${linha}`).value = 'Valor';
    Object.assign(worksheetResumo.getCell(`D${linha}`), subHeaderStyle);
    
    linha++;
    
    filtrosParaExibir.forEach((filtro, index) => {
      worksheetResumo.mergeCells(`A${linha}:C${linha}`);
      worksheetResumo.getCell(`A${linha}`).value = filtro.chave;
      
      worksheetResumo.mergeCells(`D${linha}:G${linha}`);
      worksheetResumo.getCell(`D${linha}`).value = filtro.valor;
      
      // Estilo zebrado
      const rowStyle = index % 2 === 0 
        ? { ...infoStyle, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'F2F2F2' } } }
        : infoStyle;
      
      Object.assign(worksheetResumo.getCell(`A${linha}`), rowStyle);
      Object.assign(worksheetResumo.getCell(`D${linha}`), rowStyle);
      
      linha++;
    });
  } else {
    worksheetResumo.mergeCells(`A${linha}:G${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Nenhum filtro aplicado';
    Object.assign(worksheetResumo.getCell(`A${linha}`), infoStyle);
    linha++;
  }
  
  // Adicionar filtros de detalhes se existirem
  if (options.filtrosContext?.filtrosDetalhados?.mostrarDetalhes) {
    linha++;
    worksheetResumo.mergeCells(`A${linha}:G${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'FILTROS DE DETALHES DE VIAGENS';
    Object.assign(worksheetResumo.getCell(`A${linha}`), headerStyle);
    linha++;
    
    const filtrosDetalhados = options.filtrosContext.filtrosDetalhados;
    
    // Status selecionados
    worksheetResumo.mergeCells(`A${linha}:C${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Status Selecionados';
    Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
    
    worksheetResumo.mergeCells(`D${linha}:G${linha}`);
    const statusSelecionados = [];
    if (filtrosDetalhados.tiposStatus?.adiantado) statusSelecionados.push('Adiantados');
    if (filtrosDetalhados.tiposStatus?.atrasado) statusSelecionados.push('Atrasados');
    if (filtrosDetalhados.tiposStatus?.fora) statusSelecionados.push('Furos de Horário');
    if (filtrosDetalhados.tiposStatus?.parcial) statusSelecionados.push('Parcialmente Cumpridas');
    if (filtrosDetalhados.tiposStatus?.nao) statusSelecionados.push('Não Realizadas');
    
    worksheetResumo.getCell(`D${linha}`).value = statusSelecionados.join(', ') || 'Nenhum';
    Object.assign(worksheetResumo.getCell(`D${linha}`), infoStyle);
    linha++;
    
    // Período
    worksheetResumo.mergeCells(`A${linha}:C${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Período';
    Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
    
    worksheetResumo.mergeCells(`D${linha}:G${linha}`);
    let periodoTexto = 'Ambos (Início e Fim)';
    if (filtrosDetalhados.periodoDetalhes === 'inicio') periodoTexto = 'Apenas Início';
    if (filtrosDetalhados.periodoDetalhes === 'fim') periodoTexto = 'Apenas Fim';
    
    worksheetResumo.getCell(`D${linha}`).value = periodoTexto;
    Object.assign(worksheetResumo.getCell(`D${linha}`), infoStyle);
    linha++;
    
    // Limite de registros
    if (filtrosDetalhados.limitarRegistros) {
      worksheetResumo.mergeCells(`A${linha}:C${linha}`);
      worksheetResumo.getCell(`A${linha}`).value = 'Limite de Registros';
      Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
      
      worksheetResumo.mergeCells(`D${linha}:G${linha}`);
      worksheetResumo.getCell(`D${linha}`).value = filtrosDetalhados.limiteRegistros || 'Sem limite';
      Object.assign(worksheetResumo.getCell(`D${linha}`), infoStyle);
      linha++;
    }
  }
  
  // Totais
  if (options?.totais) {
    linha++;
    worksheetResumo.mergeCells(`A${linha}:G${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'TOTAIS';
    Object.assign(worksheetResumo.getCell(`A${linha}`), headerStyle);
    linha++;
    
    worksheetResumo.mergeCells(`A${linha}:C${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Total de Viagens';
    Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
    
    worksheetResumo.mergeCells(`D${linha}:G${linha}`);
    worksheetResumo.getCell(`D${linha}`).value = options.totais.total;
    Object.assign(worksheetResumo.getCell(`D${linha}`), highlightStyle);
    linha++;
    
    worksheetResumo.mergeCells(`A${linha}:C${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Viagens Analisadas';
    Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
    
    worksheetResumo.mergeCells(`D${linha}:G${linha}`);
    worksheetResumo.getCell(`D${linha}`).value = options.totais.analisadas;
    Object.assign(worksheetResumo.getCell(`D${linha}`), highlightStyle);
    linha++;
    
    worksheetResumo.mergeCells(`A${linha}:C${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = 'Viagens Pendentes';
    Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
    
    worksheetResumo.mergeCells(`D${linha}:G${linha}`);
    worksheetResumo.getCell(`D${linha}`).value = options.totais.pendentes;
    Object.assign(worksheetResumo.getCell(`D${linha}`), highlightStyle);
    linha++;
  }
  
  // Soma total dos dados
  const totalizador: ViagemData = {
    AdiantadoInicio: 0,
    AtrasadoInicio: 0,
    ForadoHorarioInicio: 0,
    AdiantadoFim: 0,
    AtrasadoFim: 0,
    ForadoHorarioFim: 0,
    ParcialmenteCumprida: 0,
    NaoCumprida: 0,
  };

  data.forEach(item => {
    for (const key in totalizador) {
      totalizador[key as keyof ViagemData] += item[key as keyof ViagemData] as number;
    }
  });
  
  // Tabela de resumo
  linha += 2;
  worksheetResumo.mergeCells(`A${linha}:G${linha}`);
  worksheetResumo.getCell(`A${linha}`).value = 'RESUMO POR CATEGORIA';
  Object.assign(worksheetResumo.getCell(`A${linha}`), headerStyle);
  linha++;
  
  // Cabeçalho da tabela
  worksheetResumo.mergeCells(`A${linha}:E${linha}`);
  worksheetResumo.getCell(`A${linha}`).value = 'Categoria';
  Object.assign(worksheetResumo.getCell(`A${linha}`), subHeaderStyle);
  
  worksheetResumo.mergeCells(`F${linha}:G${linha}`);
  worksheetResumo.getCell(`F${linha}`).value = 'Total';
  Object.assign(worksheetResumo.getCell(`F${linha}`), subHeaderStyle);
  linha++;
  
  // Corpo da tabela
  const categorias: [string, number, string][] = [
    ['Início adiantado', totalizador.AdiantadoInicio, '2563EB'],
    ['Início atrasado', totalizador.AtrasadoInicio, 'DC2626'],
    ['Furo de viagem (não iniciou ou +15min)', totalizador.ForadoHorarioInicio, 'F97316'],
    ['Finalizou adiantado', totalizador.AdiantadoFim, '16A34A'],
    ['Finalizou atrasado', totalizador.AtrasadoFim, 'EF4444'],
    ['Finalizou fora do horário', totalizador.ForadoHorarioFim, 'F97316'],
    ['Cumpriu parcialmente o horário', totalizador.ParcialmenteCumprida, 'A855F7'],
    ['Não cumpriu o horário', totalizador.NaoCumprida, '6B7280'],
  ];

  categorias.forEach(([label, valor, cor], i) => {
    worksheetResumo.mergeCells(`A${linha}:E${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = label;
    
    worksheetResumo.mergeCells(`F${linha}:G${linha}`);
    worksheetResumo.getCell(`F${linha}`).value = valor;
    
    // Estilo zebrado com cor específica para o texto
    const rowStyle = {
      ...infoStyle,
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: i % 2 === 0 ? 'F2F2F2' : 'FFFFFF' } },
      font: { ...infoStyle.font, color: { argb: cor } }
    };
    
    Object.assign(worksheetResumo.getCell(`A${linha}`), rowStyle);
    Object.assign(worksheetResumo.getCell(`F${linha}`), {
      ...rowStyle,
      alignment: { horizontal: 'center' as const }
    });
    
    // Destaque para valores críticos
    if (valor > 10) {
      worksheetResumo.getCell(`F${linha}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCC' }
      };
    }
    
    linha++;
  });
  
  // Adicionar legenda
  linha += 2;
  worksheetResumo.mergeCells(`A${linha}:G${linha}`);
  worksheetResumo.getCell(`A${linha}`).value = 'LEGENDA';
  Object.assign(worksheetResumo.getCell(`A${linha}`), headerStyle);
  linha++;
  
  const legenda = [
    ['Início adiantado/atrasado', 'Diferença superior a 5 minutos no início da viagem.', '2563EB'],
    ['Furo de viagem', 'Não realizada ou com mais de 15 minutos de atraso no início.', 'F97316'],
    ['Finalizou adiantado/atrasado', 'Diferença superior a 5 minutos no término.', '16A34A'],
    ['Finalizou fora do horário', 'Não bate com o horário previsto.', 'F97316'],
    ['Cumpriu parcialmente o horário', 'Parte da viagem feita fora do horário previsto.', 'A855F7'],
    ['Não cumpriu o horário', 'Toda a viagem fora do padrão esperado.', '6B7280']
  ];
  
  legenda.forEach(([termo, descricao, cor], i) => {
    worksheetResumo.mergeCells(`A${linha}:B${linha}`);
    worksheetResumo.getCell(`A${linha}`).value = termo;
    worksheetResumo.getCell(`A${linha}`).font = { 
      bold: true, 
      color: { argb: cor } 
    };
    
    worksheetResumo.mergeCells(`C${linha}:G${linha}`);
    worksheetResumo.getCell(`C${linha}`).value = descricao;
    
    // Estilo zebrado
    const rowStyle = {
      ...infoStyle,
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: i % 2 === 0 ? 'F2F2F2' : 'FFFFFF' } }
    };
    
    Object.assign(worksheetResumo.getCell(`A${linha}`), rowStyle);
    Object.assign(worksheetResumo.getCell(`C${linha}`), rowStyle);
    
    linha++;
  });
  
  // Nota de rodapé
  linha += 2;
  worksheetResumo.mergeCells(`A${linha}:G${linha}`);
  worksheetResumo.getCell(`A${linha}`).value = 'Relatório gerado automaticamente pelo Sistema de Monitoramento de Viagens.';
  worksheetResumo.getCell(`A${linha}`).font = { italic: true, size: 9 };
  worksheetResumo.getCell(`A${linha}`).alignment = { horizontal: 'center' };
  
   // ===== PLANILHA DE DETALHES =====
  
  // Título
  worksheetDetalhes.mergeCells('A1:J1');
  worksheetDetalhes.getCell('A1').value = `DETALHES DAS VIAGENS`;
  Object.assign(worksheetDetalhes.getCell('A1'), titleStyle);
  worksheetDetalhes.getRow(1).height = 30;
  
  // Subtítulo
  worksheetDetalhes.mergeCells('A2:J2');
  worksheetDetalhes.getCell('A2').value = textoPeriodo;
  Object.assign(worksheetDetalhes.getCell('A2'), subHeaderStyle);
  
  // Cabeçalho da tabela
  const cabecalhoDetalhes = [
    'Nº', 'Linha', 'Motorista', 'Prefixo', 
    'Início Prev.', 'Início Real.', 
    'Fim Prev.', 'Fim Real.', 'Status', 'Observações'
  ];
  
  cabecalhoDetalhes.forEach((titulo, index) => {
    const coluna = String.fromCharCode(65 + index); // A, B, C...
    worksheetDetalhes.getCell(`${coluna}3`).value = titulo;
    Object.assign(worksheetDetalhes.getCell(`${coluna}3`), headerStyle);
  });
  
  // Dados detalhados
  let linhaDetalhes = 4;
  
  if (options.viagensDetalhadas && options.viagensDetalhadas.length > 0) {
    options.viagensDetalhadas.forEach((viagem, index) => {
      // Determinar status
      const status = determinarStatus(viagem);
      let observacoes = '';
      
      // Adicionar observações específicas
      if (viagem.ParcialmenteCumprida > 0) {
        observacoes = 'Viagem parcialmente cumprida';
      } else if (viagem.NaoCumprida > 0) {
        observacoes = 'Viagem não cumprida';
      } else if (viagem.AdiantadoInicio > 0 && viagem.AdiantadoFim > 0) {
        observacoes = 'Adiantamento no início e fim';
      } else if (viagem.AtrasadoInicio > 0 && viagem.AtrasadoFim > 0) {
        observacoes = 'Atraso no início e fim';
      }
      
      // Preencher dados
      worksheetDetalhes.getCell(`A${linhaDetalhes}`).value = viagem.NumeroViagem || 'N/A';
      worksheetDetalhes.getCell(`B${linhaDetalhes}`).value = viagem.NomeLinha || 'N/A';
      worksheetDetalhes.getCell(`C${linhaDetalhes}`).value = viagem.NomeMotorista || 'N/A';
      worksheetDetalhes.getCell(`D${linhaDetalhes}`).value = viagem.PrefixoRealizado || 'N/A';
      worksheetDetalhes.getCell(`E${linhaDetalhes}`).value = formatarHorario(viagem.InicioPrevisto);
      worksheetDetalhes.getCell(`F${linhaDetalhes}`).value = formatarHorario(obterHorarioValido(viagem.InicioRealizadoText, viagem.InicioRealizado));
      worksheetDetalhes.getCell(`G${linhaDetalhes}`).value = formatarHorario(viagem.FimPrevisto);
      worksheetDetalhes.getCell(`H${linhaDetalhes}`).value = formatarHorario(obterHorarioValido(viagem.FimRealizadoText, viagem.FimRealizado));
      worksheetDetalhes.getCell(`I${linhaDetalhes}`).value = status;
      worksheetDetalhes.getCell(`J${linhaDetalhes}`).value = observacoes;
      
      // Estilo zebrado
      const rowStyle = index % 2 === 0 
        ? { ...infoStyle, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'F2F2F2' } } }
        : infoStyle;
      
      // Aplicar estilo a todas as células da linha
      for (let i = 0; i < cabecalhoDetalhes.length; i++) {
        const coluna = String.fromCharCode(65 + i);
        Object.assign(worksheetDetalhes.getCell(`${coluna}${linhaDetalhes}`), rowStyle);
      }
      
      // Cores para status de início
      if (viagem.AdiantadoInicio > 0) {
        worksheetDetalhes.getCell(`F${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`F${linhaDetalhes}`).font, 
          color: { argb: '2563EB' },
          bold: true
        };
      } else if (viagem.AtrasadoInicio > 0) {
        worksheetDetalhes.getCell(`F${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`F${linhaDetalhes}`).font, 
          color: { argb: 'DC2626' },
          bold: true
        };
      } else if (viagem.ForadoHorarioInicio > 0) {
        worksheetDetalhes.getCell(`F${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`F${linhaDetalhes}`).font, 
          color: { argb: 'F97316' },
          bold: true
        };
      }
      
      // Cores para status de fim
      if (viagem.AdiantadoFim > 0) {
        worksheetDetalhes.getCell(`H${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`H${linhaDetalhes}`).font, 
          color: { argb: '16A34A' },
          bold: true
        };
      } else if (viagem.AtrasadoFim > 0) {
        worksheetDetalhes.getCell(`H${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`H${linhaDetalhes}`).font, 
          color: { argb: 'EF4444' },
          bold: true
        };
      } else if (viagem.ForadoHorarioFim > 0) {
        worksheetDetalhes.getCell(`H${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`H${linhaDetalhes}`).font, 
          color: { argb: 'F97316' },
          bold: true
        };
      }
      
      // Cores para status geral
      if (status.includes('Não Realizada')) {
        worksheetDetalhes.getCell(`I${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`I${linhaDetalhes}`).font, 
          color: { argb: '6B7280' },
          bold: true
        };
      } else if (status.includes('Parcialmente')) {
        worksheetDetalhes.getCell(`I${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`I${linhaDetalhes}`).font, 
          color: { argb: 'A855F7' },
          bold: true
        };
      } else if (status.includes('Adiant.')) {
        worksheetDetalhes.getCell(`I${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`I${linhaDetalhes}`).font, 
          color: { argb: '2563EB' },
          bold: true
        };
      } else if (status.includes('Atras.')) {
        worksheetDetalhes.getCell(`I${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`I${linhaDetalhes}`).font, 
          color: { argb: 'DC2626' },
          bold: true
        };
      } else if (status.includes('Fora')) {
        worksheetDetalhes.getCell(`I${linhaDetalhes}`).font = { 
          ...worksheetDetalhes.getCell(`I${linhaDetalhes}`).font, 
          color: { argb: 'F97316' },
          bold: true
        };
      }
      
      linhaDetalhes++;
    });
  } else {
    // Se não houver dados detalhados
    worksheetDetalhes.mergeCells(`A${linhaDetalhes}:J${linhaDetalhes}`);
    worksheetDetalhes.getCell(`A${linhaDetalhes}`).value = 'Nenhum detalhe de viagem disponível para os filtros selecionados.';
    worksheetDetalhes.getCell(`A${linhaDetalhes}`).alignment = { horizontal: 'center' };
    worksheetDetalhes.getCell(`A${linhaDetalhes}`).font = { italic: true };
  }
  
  // Adicionar legenda na planilha de detalhes
  linhaDetalhes += 2;
  worksheetDetalhes.mergeCells(`A${linhaDetalhes}:J${linhaDetalhes}`);
  worksheetDetalhes.getCell(`A${linhaDetalhes}`).value = 'LEGENDA DE CORES';
  Object.assign(worksheetDetalhes.getCell(`A${linhaDetalhes}`), headerStyle);
  linhaDetalhes++;
  
  // Legenda em formato de tabela
  worksheetDetalhes.mergeCells(`A${linhaDetalhes}:C${linhaDetalhes}`);
  worksheetDetalhes.getCell(`A${linhaDetalhes}`).value = 'Cor';
  
  worksheetDetalhes.mergeCells(`D${linhaDetalhes}:J${linhaDetalhes}`);
  worksheetDetalhes.getCell(`D${linhaDetalhes}`).value = 'Significado';
  
  Object.assign(worksheetDetalhes.getCell(`A${linhaDetalhes}`), subHeaderStyle);
  Object.assign(worksheetDetalhes.getCell(`D${linhaDetalhes}`), subHeaderStyle);
  linhaDetalhes++;
  
  // Itens da legenda
  const legendaDetalhes = [
    { texto: 'Adiantado Início', cor: '2563EB', descricao: 'Viagem iniciou antes do horário previsto (mais de 5 minutos).' },
    { texto: 'Atrasado Início', cor: 'DC2626', descricao: 'Viagem iniciou após o horário previsto (mais de 5 minutos).' },
    { texto: 'Fora do Horário Início', cor: 'F97316', descricao: 'Viagem iniciou com mais de 15 minutos de diferença.' },
    { texto: 'Adiantado Fim', cor: '16A34A', descricao: 'Viagem terminou antes do horário previsto (mais de 5 minutos).' },
    { texto: 'Atrasado Fim', cor: 'EF4444', descricao: 'Viagem terminou após o horário previsto (mais de 5 minutos).' },
    { texto: 'Fora do Horário Fim', cor: 'F97316', descricao: 'Viagem terminou com mais de 15 minutos de diferença.' },
    { texto: 'Parcialmente Cumprida', cor: 'A855F7', descricao: 'Parte da viagem foi realizada fora do horário previsto.' },
    { texto: 'Não Cumprida', cor: '6B7280', descricao: 'Viagem não foi realizada conforme programação.' }
  ];
  
  legendaDetalhes.forEach((item, i) => {
    worksheetDetalhes.mergeCells(`A${linhaDetalhes}:C${linhaDetalhes}`);
    worksheetDetalhes.getCell(`A${linhaDetalhes}`).value = item.texto;
    worksheetDetalhes.getCell(`A${linhaDetalhes}`).font = { 
      ...infoStyle.font,
      color: { argb: item.cor },
      bold: true
    };
    
    worksheetDetalhes.mergeCells(`D${linhaDetalhes}:J${linhaDetalhes}`);
    worksheetDetalhes.getCell(`D${linhaDetalhes}`).value = item.descricao;
    
    // Estilo zebrado
    const rowStyle = {
      ...infoStyle,
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: i % 2 === 0 ? 'F2F2F2' : 'FFFFFF' } }
    };
    
    Object.assign(worksheetDetalhes.getCell(`A${linhaDetalhes}`), rowStyle);
    Object.assign(worksheetDetalhes.getCell(`D${linhaDetalhes}`), rowStyle);
    
    linhaDetalhes++;
  });
  
  // Nota de rodapé
  linhaDetalhes += 2;
  worksheetDetalhes.mergeCells(`A${linhaDetalhes}:J${linhaDetalhes}`);
  worksheetDetalhes.getCell(`A${linhaDetalhes}`).value = 'Relatório gerado automaticamente pelo Sistema de Monitoramento de Viagens.';
  worksheetDetalhes.getCell(`A${linhaDetalhes}`).font = { italic: true, size: 9 };
  worksheetDetalhes.getCell(`A${linhaDetalhes}`).alignment = { horizontal: 'center' };
  
  // ===== PLANILHA DE ANÁLISE DETALHADA =====
  
  // Adicionar uma terceira planilha para análise mais detalhada
  const worksheetAnalise = workbook.addWorksheet('Análise Detalhada', {
    properties: { tabColor: { argb: 'C55A11' } }
  });
  
  // Título
  worksheetAnalise.mergeCells('A1:J1');
  worksheetAnalise.getCell('A1').value = `ANÁLISE DETALHADA DE VIAGENS`;
  Object.assign(worksheetAnalise.getCell('A1'), titleStyle);
  worksheetAnalise.getRow(1).height = 30;
  
  // Subtítulo
  worksheetAnalise.mergeCells('A2:J2');
  worksheetAnalise.getCell('A2').value = textoPeriodo;
  Object.assign(worksheetAnalise.getCell('A2'), subHeaderStyle);
  
  // Cabeçalho da tabela de análise
  const cabecalhoAnalise = [
    'Nº', 'Linha', 'Motorista', 'Prefixo', 
    'Início Prev.', 'Início Real.', 'Diferença Início',
    'Fim Prev.', 'Fim Real.', 'Diferença Fim'
  ];
  
  cabecalhoAnalise.forEach((titulo, index) => {
    const coluna = String.fromCharCode(65 + index); // A, B, C...
    worksheetAnalise.getCell(`${coluna}3`).value = titulo;
    Object.assign(worksheetAnalise.getCell(`${coluna}3`), headerStyle);
  });
  
  // Dados detalhados com cálculos
  let linhaAnalise = 4;
  
  // Usar os dados disponíveis - primeiro tentar os detalhados, depois os gerais
  const dadosParaAnalise = options.viagensDetalhadas && options.viagensDetalhadas.length > 0 
    ? options.viagensDetalhadas 
    : data;
  
  if (dadosParaAnalise && dadosParaAnalise.length > 0) {
    dadosParaAnalise.forEach((viagem, index) => {
      try {
        // Extrair dados com segurança
        const numeroViagem = viagem.NumeroViagem || `Viagem ${index + 1}`;
        const nomeLinha = viagem.NomeLinha || 'N/A';
        const nomeMotorista = viagem.NomeMotorista || 'N/A';
        const prefixoRealizado = viagem.PrefixoRealizado || 'N/A';
        
        // Horários
        const inicioPrevisto = viagem.InicioPrevisto || 'N/A';
        const inicioRealizado = obterHorarioValido(viagem.InicioRealizadoText, viagem.InicioRealizado);
        const fimPrevisto = viagem.FimPrevisto || 'N/A';
        const fimRealizado = obterHorarioValido(viagem.FimRealizadoText, viagem.FimRealizado);
        
        // Calcular diferenças
        const diferencaInicio = calcularDiferencaMinutos(inicioPrevisto, inicioRealizado);
        const diferencaFim = calcularDiferencaMinutos(fimPrevisto, fimRealizado);
        
        // Preencher dados
        worksheetAnalise.getCell(`A${linhaAnalise}`).value = numeroViagem;
        worksheetAnalise.getCell(`B${linhaAnalise}`).value = nomeLinha;
        worksheetAnalise.getCell(`C${linhaAnalise}`).value = nomeMotorista;
        worksheetAnalise.getCell(`D${linhaAnalise}`).value = prefixoRealizado;
        worksheetAnalise.getCell(`E${linhaAnalise}`).value = formatarHorario(inicioPrevisto);
        worksheetAnalise.getCell(`F${linhaAnalise}`).value = formatarHorario(inicioRealizado);
        worksheetAnalise.getCell(`G${linhaAnalise}`).value = formatarDiferenca(diferencaInicio);
        worksheetAnalise.getCell(`H${linhaAnalise}`).value = formatarHorario(fimPrevisto);
        worksheetAnalise.getCell(`I${linhaAnalise}`).value = formatarHorario(fimRealizado);
        worksheetAnalise.getCell(`J${linhaAnalise}`).value = formatarDiferenca(diferencaFim);
        
        // Estilo zebrado
        const rowStyle = index % 2 === 0 
          ? { ...infoStyle, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'F2F2F2' } } }
          : infoStyle;
        
        // Aplicar estilo a todas as células da linha
        for (let i = 0; i < cabecalhoAnalise.length; i++) {
          const coluna = String.fromCharCode(65 + i);
          Object.assign(worksheetAnalise.getCell(`${coluna}${linhaAnalise}`), rowStyle);
        }
        
        // Cores para diferença de início
        if (diferencaInicio !== null) {
          if (diferencaInicio < -5) {
            worksheetAnalise.getCell(`G${linhaAnalise}`).font = { 
              ...worksheetAnalise.getCell(`G${linhaAnalise}`).font, 
              color: { argb: '2563EB' },
              bold: true
            };
          } else if (diferencaInicio > 5) {
            worksheetAnalise.getCell(`G${linhaAnalise}`).font = { 
              ...worksheetAnalise.getCell(`G${linhaAnalise}`).font, 
              color: { argb: 'DC2626' },
              bold: true
            };
          }
        }
        
        // Cores para diferença de fim
        if (diferencaFim !== null) {
          if (diferencaFim < -5) {
            worksheetAnalise.getCell(`J${linhaAnalise}`).font = { 
              ...worksheetAnalise.getCell(`J${linhaAnalise}`).font, 
              color: { argb: '16A34A' },
              bold: true
            };
          } else if (diferencaFim > 5) {
            worksheetAnalise.getCell(`J${linhaAnalise}`).font = { 
              ...worksheetAnalise.getCell(`J${linhaAnalise}`).font, 
              color: { argb: 'EF4444' },
              bold: true
            };
          }
        }
        
        linhaAnalise++;
      } catch (error) {
        // Continuar com a próxima viagem
      }
    });
    
    // Adicionar estatísticas de análise
    linhaAnalise += 2;
    worksheetAnalise.mergeCells(`A${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'ESTATÍSTICAS DA ANÁLISE';
    Object.assign(worksheetAnalise.getCell(`A${linhaAnalise}`), headerStyle);
    linhaAnalise++;
    
    // Calcular estatísticas
    let totalAdiantadosInicio = 0;
    let totalAtrasadosInicio = 0;
    let totalAdiantadosFim = 0;
    let totalAtrasadosFim = 0;
    let totalNormais = 0;
    
    dadosParaAnalise.forEach(viagem => {
      if (viagem.AdiantadoInicio > 0) totalAdiantadosInicio++;
      if (viagem.AtrasadoInicio > 0) totalAtrasadosInicio++;
      if (viagem.AdiantadoFim > 0) totalAdiantadosFim++;
      if (viagem.AtrasadoFim > 0) totalAtrasadosFim++;
      
      if (viagem.AdiantadoInicio === 0 && 
          viagem.AtrasadoInicio === 0 && 
          viagem.ForadoHorarioInicio === 0 &&
          viagem.AdiantadoFim === 0 && 
          viagem.AtrasadoFim === 0 && 
          viagem.ForadoHorarioFim === 0 &&
          viagem.ParcialmenteCumprida === 0 &&
          viagem.NaoCumprida === 0) {
        totalNormais++;
      }
    });
    
    // Estatísticas de início
    worksheetAnalise.mergeCells(`A${linhaAnalise}:E${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'Estatísticas de Início:';
    worksheetAnalise.getCell(`A${linhaAnalise}`).font = { bold: true };
    worksheetAnalise.getCell(`A${linhaAnalise}`).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'E6F0FF' } 
    };
    
    worksheetAnalise.mergeCells(`F${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`F${linhaAnalise}`).value = `Adiantados: ${totalAdiantadosInicio} | Atrasados: ${totalAtrasadosInicio}`;
    worksheetAnalise.getCell(`F${linhaAnalise}`).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'E6F0FF' } 
    };
    linhaAnalise++;
    
    // Estatísticas de fim
    worksheetAnalise.mergeCells(`A${linhaAnalise}:E${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'Estatísticas de Fim:';
    worksheetAnalise.getCell(`A${linhaAnalise}`).font = { bold: true };
    worksheetAnalise.getCell(`A${linhaAnalise}`).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'E6F7E6' } 
    };
    
    worksheetAnalise.mergeCells(`F${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`F${linhaAnalise}`).value = `Adiantados: ${totalAdiantadosFim} | Atrasados: ${totalAtrasadosFim}`;
    worksheetAnalise.getCell(`F${linhaAnalise}`).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'E6F7E6' } 
    };
    linhaAnalise++;
    
    // Resumo geral
    worksheetAnalise.mergeCells(`A${linhaAnalise}:E${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'Resumo Geral:';
    worksheetAnalise.getCell(`A${linhaAnalise}`).font = { bold: true };
    worksheetAnalise.getCell(`A${linhaAnalise}`).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'D9E1F2' } 
    };
    
    worksheetAnalise.mergeCells(`F${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`F${linhaAnalise}`).value = `Total de ${dadosParaAnalise.length} viagens analisadas | Viagens sem problemas: ${totalNormais}`;
    worksheetAnalise.getCell(`F${linhaAnalise}`).font = { bold: true };
    worksheetAnalise.getCell(`F${linhaAnalise}`).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'D9E1F2' } 
    };
    
    // Adicionar legenda de cores
    linhaAnalise += 2;
    worksheetAnalise.mergeCells(`A${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'LEGENDA DE CORES';
    Object.assign(worksheetAnalise.getCell(`A${linhaAnalise}`), headerStyle);
    linhaAnalise++;
    
    const legendaAnalise = [
      { texto: 'Adiantado (Início)', cor: '2563EB', descricao: 'Diferença negativa maior que 5 minutos (chegou antes do previsto)' },
      { texto: 'Atrasado (Início)', cor: 'DC2626', descricao: 'Diferença positiva maior que 5 minutos (chegou depois do previsto)' },
      { texto: 'Adiantado (Fim)', cor: '16A34A', descricao: 'Diferença negativa maior que 5 minutos (terminou antes do previsto)' },
      { texto: 'Atrasado (Fim)', cor: 'EF4444', descricao: 'Diferença positiva maior que 5 minutos (terminou depois do previsto)' }
    ];
    
    legendaAnalise.forEach((item, i) => {
      worksheetAnalise.mergeCells(`A${linhaAnalise}:C${linhaAnalise}`);
      worksheetAnalise.getCell(`A${linhaAnalise}`).value = item.texto;
      worksheetAnalise.getCell(`A${linhaAnalise}`).font = { 
        ...infoStyle.font,
        color: { argb: item.cor },
        bold: true
      };
      
      worksheetAnalise.mergeCells(`D${linhaAnalise}:J${linhaAnalise}`);
      worksheetAnalise.getCell(`D${linhaAnalise}`).value = item.descricao;
      
      // Estilo zebrado
      const rowStyle = {
        ...infoStyle,
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: i % 2 === 0 ? 'F2F2F2' : 'FFFFFF' } }
      };
      
      Object.assign(worksheetAnalise.getCell(`A${linhaAnalise}`), rowStyle);
      Object.assign(worksheetAnalise.getCell(`D${linhaAnalise}`), rowStyle);
      
      linhaAnalise++;
    });
    
    // Nota explicativa
    linhaAnalise += 1;
    worksheetAnalise.mergeCells(`A${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'Nota: As diferenças são calculadas como "Horário Realizado - Horário Previsto". Valores negativos indicam adiantamento, valores positivos indicam atraso.';
    worksheetAnalise.getCell(`A${linhaAnalise}`).font = { italic: true, size: 9 };
    worksheetAnalise.getCell(`A${linhaAnalise}`).alignment = { horizontal: 'left' };
    
  } else {
    // Se não houver dados detalhados
    worksheetAnalise.mergeCells(`A${linhaAnalise}:J${linhaAnalise}`);
    worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'Nenhum dado disponível para análise detalhada.';
    worksheetAnalise.getCell(`A${linhaAnalise}`).alignment = { horizontal: 'center' };
    worksheetAnalise.getCell(`A${linhaAnalise}`).font = { italic: true };
  }
  
  // Nota de rodapé
  linhaAnalise += 2;
  worksheetAnalise.mergeCells(`A${linhaAnalise}:J${linhaAnalise}`);
  worksheetAnalise.getCell(`A${linhaAnalise}`).value = 'Relatório gerado automaticamente pelo Sistema de Monitoramento de Viagens.';
  worksheetAnalise.getCell(`A${linhaAnalise}`).font = { italic: true, size: 9 };
  worksheetAnalise.getCell(`A${linhaAnalise}`).alignment = { horizontal: 'center' };
  
  // Ajustar largura das colunas em todas as planilhas
  [worksheetResumo, worksheetDetalhes, worksheetAnalise].forEach(sheet => {
    // Ajustar largura das colunas
    sheet.columns.forEach(column => {
      if (!column.width) {
        column.width = 12;
      }
    });
  });
  
  // Ajustes específicos
  worksheetDetalhes.getColumn('B').width = 30; // Linha
  worksheetDetalhes.getColumn('C').width = 25; // Motorista
  worksheetDetalhes.getColumn('I').width = 20; // Status
  worksheetDetalhes.getColumn('J').width = 30; // Observações
  
  worksheetAnalise.getColumn('B').width = 30; // Linha
  worksheetAnalise.getColumn('C').width = 25; // Motorista
  worksheetAnalise.getColumn('G').width = 25; // Diferença Início
  worksheetAnalise.getColumn('J').width = 25; // Diferença Fim
  
  // Exportar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  // === NOME DO ARQUIVO CORRIGIDO ===
  const dataInicioFormatada = dataInicio !== 'N/A' ? 
    dataInicio.replace(/\//g, '-') : 'sem-data';
  const dataFimFormatada = dataFim !== 'N/A' ? 
    dataFim.replace(/\//g, '-') : 'sem-data';

  const nomeArquivo = `relatorio_viagens_${tipoVisu}_${dataInicioFormatada}_a_${dataFimFormatada}.xlsx`;
  
  saveAs(blob, nomeArquivo);
}
  
  

/**
 * Função para exportar dados para PDF com formatação avançada
 * Inclui todos os filtros aplicados do contexto global
 */
export function exportToPDF(
  data: ViagemData[],
  options: ExportOptions
) {
  // === FUNÇÃO ESPECÍFICA PARA DATAS BRASILEIRAS ===
  function formatarDataBrasileira(dataString: string | Date | undefined | null): string {
    if (!dataString) return 'N/A';
    
    try {
      // Se é um objeto Date
      if (dataString instanceof Date) {
        const dia = String(dataString.getDate()).padStart(2, '0');
        const mes = String(dataString.getMonth() + 1).padStart(2, '0');
        const ano = dataString.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se é string
      const dataLimpa = String(dataString).trim();
      
      // Se já está no formato DD/MM/YYYY, apenas validar e retornar
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataLimpa)) {
        const [dia, mes, ano] = dataLimpa.split('/').map(num => parseInt(num, 10));
        
        // Validar se é uma data válida
        if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900) {
          // Retornar com zero à esquerda se necessário
          return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
        }
      }
      
      // Se está em formato ISO (YYYY-MM-DD), converter
      if (/^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
        const data = new Date(dataLimpa + 'T12:00:00'); // Adicionar horário para evitar problemas de fuso
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Fallback: tentar conversão direta
      const data = new Date(dataLimpa);
      if (!isNaN(data.getTime())) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se nada funcionou, retornar a string original
      return dataLimpa;
      
    } catch (error) {
      console.warn('❌ Erro ao formatar data brasileira:', error);
      return String(dataString);
    }
  }

  // === FUNÇÃO MELHORADA PARA FORMATAR DATAS ===
  function formatarDataMelhorada(dataString: string | Date | undefined | null): string {
    if (!dataString) return 'N/A';
    
    try {
      let dataParaProcessar: Date;
      
      // Se já é um objeto Date
      if (dataString instanceof Date) {
        dataParaProcessar = dataString;
      } else {
        // Se é string, tentar converter
        const dataLimpa = String(dataString).trim();
        
        // Verificar se é uma string vazia ou inválida
        if (!dataLimpa || dataLimpa === 'null' || dataLimpa === 'undefined' || dataLimpa === 'N/A') {
          return 'N/A';
        }
        
        // Tentar diferentes formatos
        // YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
        if (/^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
          dataParaProcessar = new Date(dataLimpa);
        }
        // DD/MM/YYYY
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa)) {
          const [dia, mes, ano] = dataLimpa.split('/');
          dataParaProcessar = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
        // MM/DD/YYYY (formato americano)
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa) && dataLimpa.split('/')[0] > '12') {
          // Se o primeiro número é maior que 12, provavelmente é DD/MM/YYYY
          const [dia, mes, ano] = dataLimpa.split('/');
          dataParaProcessar = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
        // ISO String ou outros formatos
        else {
          dataParaProcessar = new Date(dataLimpa);
        }
      }
      
      // Verificar se a data é válida
      if (isNaN(dataParaProcessar.getTime())) {
        console.warn('⚠️ Data inválida recebida:', dataString);
        return 'N/A';
      }
      
      // Formatar para DD/MM/YYYY
      const dia = String(dataParaProcessar.getDate()).padStart(2, '0');
      const mes = String(dataParaProcessar.getMonth() + 1).padStart(2, '0');
      const ano = dataParaProcessar.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
      
    } catch (error) {
      console.warn('❌ Erro ao formatar data:', error, 'Data original:', dataString);
      return 'N/A';
    }
  }

  // === LÓGICA MELHORADA PARA OBTER DATAS ===
  function obterDatasValidas() {
    // Função auxiliar para validar data
    const isValidDate = (date: any): boolean => {
      if (!date) return false;
      if (date instanceof Date) return !isNaN(date.getTime());
      if (typeof date === 'string') {
        const trimmed = date.trim();
        return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'N/A';
      }
      return false;
    };

    let dataInicio: string | Date | null = null;
    let dataFim: string | Date | null = null;

    console.log('🔍 Debug - Verificando datas disponíveis:', {
      'options.filtros': options.filtros,
      'options.filtrosContext?.filtrosPrincipais': options.filtrosContext?.filtrosPrincipais,
      'options.filtrosContext?.filtrosDetalhados': options.filtrosContext?.filtrosDetalhados,
      'options.dataReferencia': options.dataReferencia
    });

    // === BUSCAR DATAS EM TODAS AS FONTES ===
    
    // Prioridade 1: Filtros diretos das options
    if (isValidDate(options.filtros?.dataInicio)) {
      dataInicio = options.filtros!.dataInicio;
    }
    if (isValidDate(options.filtros?.dataFim)) {
      dataFim = options.filtros!.dataFim;
    }

    // Prioridade 2: Filtros principais do contexto
    if (!dataInicio && isValidDate(options.filtrosContext?.filtrosPrincipais?.dataInicio)) {
      dataInicio = options.filtrosContext!.filtrosPrincipais!.dataInicio;
    }
    if (!dataFim && isValidDate(options.filtrosContext?.filtrosPrincipais?.dataFim)) {
      dataFim = options.filtrosContext!.filtrosPrincipais!.dataFim;
    }

    // Prioridade 3: Campo 'dia' dos filtros principais
    if (!dataInicio && !dataFim && isValidDate(options.filtrosContext?.filtrosPrincipais?.dia)) {
      dataInicio = options.filtrosContext!.filtrosPrincipais!.dia;
      dataFim = options.filtrosContext!.filtrosPrincipais!.dia;
    }

    // Prioridade 4: Filtros detalhados do contexto
    if (!dataInicio && isValidDate(options.filtrosContext?.filtrosDetalhados?.dataInicio)) {
      dataInicio = options.filtrosContext!.filtrosDetalhados!.dataInicio;
    }
    if (!dataFim && isValidDate(options.filtrosContext?.filtrosDetalhados?.dataFim)) {
      dataFim = options.filtrosContext!.filtrosDetalhados!.dataFim;
    }

    // Prioridade 5: Campo 'dia' dos filtros detalhados
    if (!dataInicio && !dataFim && isValidDate(options.filtrosContext?.filtrosDetalhados?.dia)) {
      dataInicio = options.filtrosContext!.filtrosDetalhados!.dia;
      dataFim = options.filtrosContext!.filtrosDetalhados!.dia;
    }

    // Prioridade 6: dataReferencia das options
    if (!dataInicio && !dataFim && isValidDate(options.dataReferencia)) {
      dataInicio = options.dataReferencia;
      dataFim = options.dataReferencia;
    }

    // Fallback: Se ainda não temos datas, usar data atual
    if (!dataInicio && !dataFim) {
      const hoje = new Date();
      dataInicio = hoje;
      dataFim = hoje;
      console.warn('⚠️ Nenhuma data encontrada, usando data atual como fallback');
    }

    console.log('✅ Datas finais selecionadas:', {
      dataInicio,
      dataFim,
      'dataInicio formatada': formatarDataMelhorada(dataInicio),
      'dataFim formatada': formatarDataMelhorada(dataFim)
    });

    return {
      dataInicio: formatarDataMelhorada(dataInicio),
      dataFim: formatarDataMelhorada(dataFim)
    };
  }

  // Obter as datas formatadas
  const { dataInicio, dataFim } = obterDatasValidas();

  // === DEBUG COMPLETO DOS FILTROS ===
  console.log('🔍 Debug - TODOS os filtros disponíveis:', {
    'options.filtros': options.filtros,
    'options.filtrosContext?.filtrosPrincipais': options.filtrosContext?.filtrosPrincipais,
    'options.filtrosContext?.filtrosDetalhados': options.filtrosContext?.filtrosDetalhados,
    'options.filtrosContext?.descricaoFiltros': options.filtrosContext?.descricaoFiltros
  });

  // Criar documento PDF em formato paisagem (landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Configurações de página (ajustadas para paisagem)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  
  // Data e informações
  const dataExportacao = new Date().toLocaleString('pt-BR');
  const tipoVisu = options?.tipoVisualizacao || 'todos';
  
  // Cores principais
  const corPrimaria = [37, 99, 235];
  const corSecundaria = [30, 58, 138];
  const corDestaque = [220, 38, 38];
  const corTexto = [31, 41, 55];
  const corSubtitulo = [75, 85, 99];
  
  // Adicionar cabeçalho
  doc.setFillColor(...corPrimaria);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RELATÓRIO DE MONITORAMENTO DE VIAGENS', pageWidth / 2, 10, { align: 'center' });
  
  // === MAPEAMENTO COMPLETO DE NOMES DE FILTROS ===
  const nomesFiltros: { [k: string]: string } = {
    // Filtros principais
    dataInicio: 'Data Início',
    dataFim: 'Data Fim',
    dia: 'Data',
    linha: 'Linha',
    numerolinha: 'Linha',
    idservico: 'Serviço',
    prefixorealizado: 'Prefixo Realizado',
    prefixoprevisto: 'Prefixo Previsto',
    statusini: 'Status Inicial',
    statusfim: 'Status Final',
    tipoVisualizacao: 'Tipo de Visualização',
    
    // ✅ FILTROS DETALHADOS DO CHARTFILTERS
    motorista: 'Motorista',
    sentido: 'Sentido',
    setor: 'Setor',
    prefixoRealizado: 'Prefixo do Veículo', // Note: diferente de prefixorealizado
    
    // Outros possíveis filtros
    garagem: 'Garagem',
    turno: 'Turno',
    operador: 'Operador'
  };
  
  // === CORES PARA OS FILTROS ===
  const coresCampos: { [k: string]: [number, number, number] } = {
    'Linha': [48, 84, 150],
    'Motorista': [60, 150, 60],
    'Setor': [0, 140, 163],
    'Sentido': [120, 80, 200],
    'Serviço': [222, 130, 41],
    'Status Inicial': [150, 60, 90],
    'Status Final': [200, 100, 0],
    'Prefixo Realizado': [130, 60, 150],
    'Prefixo do Veículo': [130, 60, 150],
    'Prefixo Previsto': [100, 60, 180],
    'Data': [80, 120, 200],
    'Data Início': [80, 120, 200],
    'Data Fim': [80, 120, 200],
    'Tipo de Visualização': [180, 100, 50]
  };
  
  // === FUNÇÃO PARA VERIFICAR VALOR VÁLIDO ===
  function valorValido(valor: any): boolean {
    if (valor === undefined || valor === null || valor === '') return false;
    if (typeof valor === 'string') {
      const trimmed = valor.trim();
      if (trimmed === '' || ['null', 'undefined', 'N/A', 'todos'].includes(trimmed)) return false;
    }
    return true;
  }

  // === CAMPOS PARA OCULTAR (ATUALIZADO) ===
  const camposParaOcultar = [
    'tiposStatus', 'periodoDetalhes', 'limitarRegistros', 
    'limiteRegistros', 'mostrarDetalhes',
    'OrigemFiltro',     // ✅ NOVO: Remover origem
    'DataConsulta'      // ✅ NOVO: Remover data consulta
  ];

  // === FUNÇÃO PARA VERIFICAR SE DEVE IGNORAR ===
  function deveIgnorarCampo(chave: string): boolean {
    return camposParaOcultar.includes(chave);
  }
  
  // === FUNÇÃO PARA VERIFICAR DUPLICATAS ===
  function ehDuplicata(chave: string, valor: any, jaExibidos: Set<string>): boolean {
    // Verificar duplicatas de linha
    if ((chave === 'Linha' || chave === 'numerolinha') && typeof valor === 'string') {
      const numeroLinha = valor.includes(' - ') ? valor.split(' - ')[0].trim() : valor.trim();
      
      for (const item of jaExibidos) {
        if (item.includes(`Linha: ${numeroLinha}`)) {
          return true;
        }
      }
    }
    
    // Verificar duplicatas de prefixo
    if ((chave === 'Prefixo Realizado' || chave === 'Prefixo do Veículo' || chave === 'prefixorealizado' || chave === 'prefixoRealizado') && typeof valor === 'string') {
      for (const item of jaExibidos) {
        if (item.includes(`Prefixo`) && item.includes(valor.trim())) {
          return true;
        }
      }
    }
    
    return false;
  }

  // === COLETAR TODOS OS FILTROS DE TODAS AS FONTES ===
  const todosOsFiltros: Record<string, any> = {};

  // 1. ✅ FILTROS PRINCIPAIS DO CONTEXTO
  if (options.filtrosContext?.filtrosPrincipais) {
    Object.entries(options.filtrosContext.filtrosPrincipais).forEach(([chave, valor]) => {
      if (valorValido(valor)) {
        todosOsFiltros[chave] = valor;
        console.log(`📋 Adicionado filtro principal: ${chave} = ${valor}`);
      }
    });
  }

  // 2. ✅ FILTROS DETALHADOS DO CONTEXTO (ChartFilters)
  if (options.filtrosContext?.filtrosDetalhados) {
    Object.entries(options.filtrosContext.filtrosDetalhados).forEach(([chave, valor]) => {
      if (valorValido(valor)) {
        todosOsFiltros[chave] = valor;
        console.log(`📊 Adicionado filtro detalhado: ${chave} = ${valor}`);
      }
    });
  }

  // 3. ✅ FILTROS DIRETOS DAS OPTIONS (sobrescreve anteriores)
  if (options.filtros) {
    Object.entries(options.filtros).forEach(([chave, valor]) => {
      if (valorValido(valor)) {
        todosOsFiltros[chave] = valor;
        console.log(`🎯 Adicionado filtro direto: ${chave} = ${valor}`);
      }
    });
  }

  console.log('🔍 Debug - TODOS os filtros coletados:', todosOsFiltros);
  console.log('🔍 Debug - Total de filtros encontrados:', Object.keys(todosOsFiltros).length);

  // === PROCESSAR FILTROS PARA EXIBIÇÃO ===
  const filtrosParaExibir: Array<{chave: string, valor: any, nomeExibicao: string}> = [];
  const jaExibidos = new Set<string>();

  Object.entries(todosOsFiltros).forEach(([chave, valor]) => {
    // Verificar se deve ignorar este campo
    if (deveIgnorarCampo(chave)) {
      console.log(`⏭️ Ignorando campo: ${chave}`);
      return;
    }

    // Obter nome de exibição
    const nomeExibicao = nomesFiltros[chave] || chave.charAt(0).toUpperCase() + chave.slice(1);
    
    // Verificar duplicatas
    if (ehDuplicata(nomeExibicao, valor, jaExibidos)) {
      console.log(`🔄 Ignorando duplicata: ${nomeExibicao} = ${valor}`);
      return;
    }

    // Formatar valor se for data
    let valorFormatado = valor;
    if (['Data Início', 'Data Fim', 'Data'].includes(nomeExibicao)) {
      valorFormatado = formatarDataBrasileira(valor);
    }

    // Criar texto único para verificar duplicatas
    const textoUnico = `${nomeExibicao}: ${valorFormatado}`;
    
    if (!jaExibidos.has(textoUnico)) {
      filtrosParaExibir.push({
        chave: nomeExibicao,
        valor: valorFormatado,
        nomeExibicao
      });
      jaExibidos.add(textoUnico);
      console.log(`✅ Filtro adicionado para exibição: ${textoUnico}`);
    }
  });

  console.log('🔍 Debug - Filtros finais para exibir:', filtrosParaExibir);
  console.log('🔍 Debug - Total de filtros para exibir:', filtrosParaExibir.length);

  // === FUNÇÃO PARA OBTER DATAS REAIS DOS DADOS ===
  function obterDatasReaisDosDados(): { dataInicio: string, dataFim: string } {
    // Usar as datas já processadas como base
    let dataInicioReal = dataInicio;
    let dataFimReal = dataFim;
    
    // Se precisar de mais precisão, buscar nos filtros processados
    const filtrosComDatas = filtrosParaExibir.filter(f => 
      ['Data Início', 'Data Fim', 'Data'].includes(f.nomeExibicao) && 
      f.valor !== 'N/A'
    );
    
    if (filtrosComDatas.length > 0) {
      const datasEncontradas = filtrosComDatas.map(f => f.valor);
      if (datasEncontradas.length === 1) {
        // Se só tem uma data, usar para ambas
        dataInicioReal = datasEncontradas[0];
        dataFimReal = datasEncontradas[0];
      } else if (datasEncontradas.length >= 2) {
        // Se tem múltiplas datas, usar primeira e última
        dataInicioReal = datasEncontradas[0];
        dataFimReal = datasEncontradas[datasEncontradas.length - 1];
      }
    }
    
    return {
      dataInicio: dataInicioReal,
      dataFim: dataFimReal
    };
  }

  // === LINHA DO PERÍODO CORRIGIDA ===
  doc.setFontSize(11);
  const { dataInicio: periodoInicio, dataFim: periodoFim } = obterDatasReaisDosDados();

  let textoPeriodo = '';
  if (periodoInicio !== 'N/A' && periodoFim !== 'N/A') {
    if (periodoInicio === periodoFim) {
      textoPeriodo = `Período: ${periodoInicio}`;
    } else {
      textoPeriodo = `Período: ${periodoInicio} a ${periodoFim}`;
    }
  }
  doc.text(textoPeriodo, pageWidth / 2, 18, { align: 'center' });
  
  // Data de exportação
  doc.setFontSize(9);
  doc.setTextColor(240, 240, 240);
  doc.text(`Exportado em: ${dataExportacao}`, pageWidth - margin, 18, { align: 'right' });
  
  // Posição vertical atual
  let y = 35;
  
  // === SEÇÃO DE FILTROS COMPLETAMENTE REFORMULADA ===
  const colWidth = contentWidth / 2;
  
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y - 5, contentWidth, 10, 'F');
  
  doc.setTextColor(...corSecundaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FILTROS APLICADOS', margin, y);
  
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...corTexto);

  // === EXIBIR FILTROS NO PDF ===
  let yLeft = y;
  let yRight = y;
  
  if (filtrosParaExibir.length > 0) {
    filtrosParaExibir.forEach((filtro, index) => {
      const textoFiltro = `• ${filtro.chave}: ${filtro.valor}`;
      
      // Usar cor específica para o filtro se disponível
      const corCampo = coresCampos[filtro.nomeExibicao] || corTexto;
      doc.setTextColor(...corCampo);
      
      // Alternar entre colunas esquerda e direita
      if (index % 2 === 0) {
        // Coluna esquerda
        doc.text(textoFiltro, margin + 5, yLeft);
        yLeft += 6;
      } else {
        // Coluna direita
        doc.text(textoFiltro, margin + colWidth + 5, yRight);
        yRight += 6;
      }
    });
  } else {
    doc.setTextColor(...corTexto);
    doc.text('Nenhum filtro aplicado', margin + 5, y);
    yLeft += 6;
    console.warn('⚠️ Nenhum filtro foi encontrado para exibição');
  }
  
  // Atualizar posição Y para a maior das duas colunas
  y = Math.max(yLeft, yRight) + 5;

  // === SEÇÃO DE TOTAIS ===
  if (options?.totais) {
    doc.setFillColor(230, 240, 255);
    doc.rect(margin, y - 5, contentWidth, 10, 'F');
    
    doc.setTextColor(...corSecundaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAIS', margin, y);
    
    y += 10;
    
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, y - 5, contentWidth, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...corTexto);
    
    const totalWidth = contentWidth / 3;
    
    doc.text('Total de Viagens:', margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${options.totais.total}`, margin + 40, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Viagens Analisadas:', margin + 5 + totalWidth, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${options.totais.analisadas}`, margin + 45 + totalWidth, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Viagens Pendentes:', margin + 5 + (2 * totalWidth), y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${options.totais.pendentes}`, margin + 45 + (2 * totalWidth), y);
    
    y += 15;
  }
  
  // === SEÇÃO DE RESUMO POR CATEGORIA ===
  const totalizador: ViagemData = {
    AdiantadoInicio: 0,
    AtrasadoInicio: 0,
    ForadoHorarioInicio: 0,
    AdiantadoFim: 0,
    AtrasadoFim: 0,
    ForadoHorarioFim: 0,
    ParcialmenteCumprida: 0,
    NaoCumprida: 0,
  };

  data.forEach(item => {
    for (const key in totalizador) {
      totalizador[key as keyof ViagemData] += item[key as keyof ViagemData];
    }
  });
  
  doc.setFillColor(...corPrimaria);
  doc.rect(margin, y - 5, contentWidth, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RESUMO POR CATEGORIA', margin, y);
  
  y += 10;
  
  const categorias: [string, number, string][] = [
    ['Início adiantado', totalizador.AdiantadoInicio, '#1869bb'],
    ['Início atrasado', totalizador.AtrasadoInicio, '#f39c12'],
    ['Furo de viagem (não iniciou ou +15min)', totalizador.ForadoHorarioInicio, '#e74c3c'],
    ['Finalizou adiantado', totalizador.AdiantadoFim, '#64c8ff'],
    ['Finalizou atrasado', totalizador.AtrasadoFim, '#f45c1b'],
    ['Finalizou fora do horário', totalizador.ForadoHorarioFim, '#adadad'],
    ['Cumpriu parcialmente o horário', totalizador.ParcialmenteCumprida, '#8dcb6c'],
    ['Não cumpriu o horário', totalizador.NaoCumprida, '#ad3b57'],
  ];
  
  autoTable(doc, {
    startY: y,
    head: [['Categoria', 'Total']],
    body: categorias.map(([categoria, valor]) => [categoria, valor.toString()]),
    styles: { 
      halign: 'left', 
      cellPadding: 3, 
      fontSize: 10,
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    headStyles: { 
      fillColor: [...corSecundaria], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: contentWidth - 30 },
      1: { cellWidth: 30, halign: 'center' }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 0) {
          const corHex = categorias[data.row.index][2];
          if (corHex) {
            const color = parseInt(corHex.substring(1), 16);
            const r = (color >> 16) & 255;
            const g = (color >> 8) & 255;
            const b = color & 255;
            data.cell.styles.textColor = [r, g, b];
          }
        }
        if (data.column.index === 1 && parseInt(data.cell.text[0]) > 10) {
          data.cell.styles.fillColor = [255, 230, 230];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  y = (doc as any).lastAutoTable.finalY + 10;
  
  // === SEÇÃO DE LEGENDA ===
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y - 5, contentWidth, 10, 'F');

  doc.setTextColor(...corSecundaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LEGENDA', margin, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (pageHeight - y < 40) {
    doc.addPage();
    y = 20;
    
    doc.setFillColor(240, 242, 245);
    doc.rect(margin, y - 5, contentWidth, 10, 'F');
    
    doc.setTextColor(...corSecundaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LEGENDA', margin, y);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  }

  const legenda = [
    ['Início adiantado/atrasado', 'Diferença superior a 5 minutos no início da viagem.', '#1869bb'],
    ['Furo de viagem', 'Não realizada ou com mais de 15 minutos de atraso no início.', '#e74c3c'],
    ['Finalizou adiantado/atrasado', 'Diferença superior a 5 minutos no término.', '#f45c1b'],
    ['Finalizou fora do horário', 'Não bate com o horário previsto.', '#adadad'],
    ['Cumpriu parcialmente o horário', 'Parte da viagem feita fora do horário previsto.', '#8dcb6c'],
    ['Não cumpriu o horário', 'Toda a viagem fora do padrão esperado.', '#ad3b57'],
  ];

  const legendaColWidth = contentWidth / 2 - 10;

  legenda.forEach(([titulo, desc, cor], index) => {
    const colX = index < 3 ? margin : margin + contentWidth / 2;
    const itemY = index < 3 ? y + (index * 10) : y + ((index - 3) * 10);
    
    if (cor) {
      const color = parseInt((cor as string).substring(1), 16);
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      doc.setFillColor(r, g, b);
      doc.circle(colX + 3, itemY - 1, 2, 'F');
    }
    
    doc.setTextColor(...corTexto);
    doc.setFont('helvetica', 'bold');
    doc.text(`${titulo}:`, colX + 8, itemY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corSubtitulo);
    
    const descLines = doc.splitTextToSize(desc as string, legendaColWidth - 10);
    doc.text(descLines, colX + 8, itemY + 4);
  });

  y += 35;
  
  // === SEÇÃO DE DETALHES DAS VIAGENS ===
  if (options.incluirDetalhesViagens && options.viagensDetalhadas && options.viagensDetalhadas.length > 0) {
    doc.addPage();
    
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DETALHES DAS VIAGENS SELECIONADAS', pageWidth / 2, 10, { align: 'center' });
    
    function abreviarTexto(texto: string, maxLength: number): string {
      if (!texto || texto.length <= maxLength) return texto || '';
      return texto.substring(0, maxLength - 3) + '...';
    }
    
    function formatarHorario(dataHora: string | undefined): string {
      if (!dataHora || dataHora === 'N/A') return 'N/A';
      
      if (dataHora.includes('/')) {
        const partes = dataHora.split(' ');
        if (partes.length > 1) {
          return partes[1];
        }
      }
      
      return dataHora;
    }
    
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, 16, contentWidth, 15, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('FILTROS:', margin + 3, 22);
    
    const statusConfig = [
      { key: 'adiantado', label: 'Adiantado', color: [37, 99, 235] },
      { key: 'atrasado', label: 'Atrasado', color: [220, 38, 38] },
      { key: 'fora', label: 'Furos', color: [249, 115, 22] },
      { key: 'parcial', label: 'Parcialmente', color: [168, 85, 247] },
      { key: 'nao', label: 'Não Realizada', color: [107, 114, 128] }
    ];
    
    let xPos = margin + 25;
    const yPos = 22;
    
    let statusCount = 0;
    statusConfig.forEach(status => {
      if (options.filtrosDetalhes?.tiposStatus?.[status.key as keyof typeof options.filtrosDetalhes.tiposStatus]) {
        statusCount++;
      }
    });
    
    const spacing = statusCount > 3 ? 40 : 50;
    
    statusConfig.forEach(status => {
      if (options.filtrosDetalhes?.tiposStatus?.[status.key as keyof typeof options.filtrosDetalhes.tiposStatus]) {
        doc.setFillColor(...status.color);
        doc.circle(xPos, yPos - 1, 2.5, 'F');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...status.color);
        doc.text(status.label, xPos + 5, yPos);
        
        xPos += spacing;
      }
    });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(xPos, yPos - 4, xPos, yPos + 4);
    xPos += 10;
    
    let periodoTexto = 'Ambos';
    if (options.filtrosDetalhes?.periodoDetalhes === 'inicio') periodoTexto = 'Início';
    if (options.filtrosDetalhes?.periodoDetalhes === 'fim') periodoTexto = 'Fim';
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('Período:', xPos, yPos);
    xPos += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corTexto);
    doc.text(periodoTexto, xPos, yPos);
    xPos += 30;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(xPos, yPos - 4, xPos, yPos + 4);
    xPos += 10;
    
    let limiteTexto = 'Sem limite';
    if (options.filtrosDetalhes?.limitarRegistros) {
      limiteTexto = `${options.filtrosDetalhes.limiteRegistros} registros`;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('Limite:', xPos, yPos);
    xPos += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corTexto);
    doc.text(limiteTexto, xPos, yPos);
    
    y = 35;
    
    const cabecalhoViagens = [
      'Nº', 'Linha', 'Motorista', 'Prefixo', 
      'Início Prev.', 'Início Real.', 
      'Fim Prev.', 'Fim Real.', 'Status'
    ];
    
    function determinarStatus(viagem: ViagemData): string {
      if (viagem.NaoCumprida > 0) return 'Não Realizada';
      if (viagem.ParcialmenteCumprida > 0) return 'Parcialmente Cumprida';
      
      let status = [];
      
      if (viagem.AdiantadoInicio > 0) status.push('Adiant. Início');
      if (viagem.AtrasadoInicio > 0) status.push('Atras. Início');
      if (viagem.ForadoHorarioInicio > 0) status.push('Fora Início');
      
      if (viagem.AdiantadoFim > 0) status.push('Adiant. Fim');
      if (viagem.AtrasadoFim > 0) status.push('Atras. Fim');
      if (viagem.ForadoHorarioFim > 0) status.push('Fora Fim');
      
      return status.join(', ') || 'Normal';
    }
    
    function horarioValido(horario: string | undefined): boolean {
      return !!horario && horario !== '-' && horario !== 'N/A';
    }
    
    function obterHorarioValido(horarioPrincipal?: string, horarioAlternativo?: string): string {
      if (horarioValido(horarioPrincipal)) return horarioPrincipal!;
      if (horarioValido(horarioAlternativo)) return horarioAlternativo!;
      return 'N/A';
    }
    
    const dadosViagens = options.viagensDetalhadas.map(viagem => [
      viagem.NumeroViagem || 'N/A',
      abreviarTexto(viagem.NomeLinha, 25),
      abreviarTexto(viagem.NomeMotorista?.split(' ')[0] + ' ' + 
        (viagem.NomeMotorista?.split(' ').pop() || ''), 20),
      viagem.PrefixoRealizado || 'N/A',
      formatarHorario(viagem.InicioPrevisto),
      formatarHorario(obterHorarioValido(viagem.InicioRealizadoText, viagem.InicioRealizado)),
      formatarHorario(viagem.FimPrevisto),
      formatarHorario(obterHorarioValido(viagem.FimRealizadoText, viagem.FimRealizado)),
      determinarStatus(viagem)
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [cabecalhoViagens],
      body: dadosViagens,
      styles: { 
        cellPadding: 2, 
        fontSize: 8,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        overflow: 'ellipsize'
      },
      headStyles: { 
        fillColor: [...corSecundaria], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 50, halign: 'left' },
        2: { cellWidth: 35, halign: 'left' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 25, halign: 'center' },
        8: { cellWidth: 40, halign: 'left' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const viagem = options.viagensDetalhadas?.[rowIndex];
          
          if (viagem) {
            if (data.column.index === 5) {
              if (viagem.AdiantadoInicio > 0) {
                data.cell.styles.textColor = [37, 99, 235];
                data.cell.styles.fontStyle = 'bold';
              } else if (viagem.AtrasadoInicio > 0) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (viagem.ForadoHorarioInicio > 0) {
                data.cell.styles.textColor = [249, 115, 22];
                data.cell.styles.fontStyle = 'bold';
              }
            }
            
            if (data.column.index === 7) {
              if (viagem.AdiantadoFim > 0) {
                data.cell.styles.textColor = [22, 163, 74];
                data.cell.styles.fontStyle = 'bold';
              } else if (viagem.AtrasadoFim > 0) {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              } else if (viagem.ForadoHorarioFim > 0) {
                data.cell.styles.textColor = [249, 115, 22];
                data.cell.styles.fontStyle = 'bold';
              }
            }
            
            if (data.column.index === 8) {
              const statusText = data.cell.text[0];
              
              if (statusText.includes('Não Realizada')) {
                data.cell.styles.textColor = [107, 114, 128];
                data.cell.styles.fontStyle = 'bold';
              } else if (statusText.includes('Parcialmente')) {
                data.cell.styles.textColor = [168, 85, 247];
                data.cell.styles.fontStyle = 'bold';
              } else if (statusText.includes('Adiant.')) {
                data.cell.styles.textColor = [37, 99, 235];
                data.cell.styles.fontStyle = 'bold';
              } else if (statusText.includes('Atras.')) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (statusText.includes('Fora')) {
                data.cell.styles.textColor = [249, 115, 22];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }
      }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;

    if (pageHeight - y < 20) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 242, 245);
    doc.rect(margin, y - 5, contentWidth, 10, 'F');

    doc.setTextColor(...corSecundaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('LEGENDA', margin, y);

    y += 10;

    const legendaItens = [
      { cor: [37, 99, 235], texto: 'Adiantado' },
      { cor: [220, 38, 38], texto: 'Atrasado' },
      { cor: [249, 115, 22], texto: 'Fora do horário' },
      { cor: [168, 85, 247], texto: 'Parcial' },
      { cor: [107, 114, 128], texto: 'Não realizada' }
    ];

    let legendaX = margin + 5;

    legendaItens.forEach((item) => {
      doc.setFillColor(...item.cor);
      doc.circle(legendaX, y - 1, 2.5, 'F');
      
      doc.setTextColor(...item.cor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(item.texto, legendaX + 5, y);
      
      legendaX += 55;
    });
  }
  
  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Relatório gerado automaticamente pelo Sistema de Monitoramento de Viagens.', pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }
  
  // === NOME DO ARQUIVO CORRIGIDO ===
  const { dataInicio: dataInicioArquivo, dataFim: dataFimArquivo } = obterDatasReaisDosDados();

  const dataInicioFormatada = dataInicioArquivo !== 'N/A' ? 
    dataInicioArquivo.replace(/\//g, '-') : 'sem-data';
  const dataFimFormatada = dataFimArquivo !== 'N/A' ? 
    dataFimArquivo.replace(/\//g, '-') : 'sem-data';

  const nomeArquivo = `relatorio_viagens_${tipoVisu}_${dataInicioFormatada}_a_${dataFimFormatada}.pdf`;
  
  doc.save(nomeArquivo);
}

  // Funções auxiliares que não dependem do React
function calcularTotais(data: ViagemData[]) {
  const totalizador: Record<string, number> = {
    AdiantadoInicio: 0,
    AtrasadoInicio: 0,
    ForadoHorarioInicio: 0,
    AdiantadoFim: 0,
    AtrasadoFim: 0,
    ForadoHorarioFim: 0,
    ParcialmenteCumprida: 0,
    NaoCumprida: 0,
  };

  data.forEach(item => {
    for (const key in totalizador) {
      totalizador[key] += item[key as keyof ViagemData] as number;
    }
  });
  
  return totalizador;
}

function formatarNomeCategoria(key: string): string {
  const mapeamento: Record<string, string> = {
    'AdiantadoInicio': 'Adiantado Início',
    'AtrasadoInicio': 'Atrasado Início',
    'ForadoHorarioInicio': 'Fora do Horário Início',
    'AdiantadoFim': 'Adiantado Fim',
    'AtrasadoFim': 'Atrasado Fim',
    'ForadoHorarioFim': 'Fora do Horário Fim',
    'ParcialmenteCumprida': 'Parcialmente Cumprida',
    'NaoCumprida': 'Não Cumprida',
  };
  
  return mapeamento[key] || key;
}