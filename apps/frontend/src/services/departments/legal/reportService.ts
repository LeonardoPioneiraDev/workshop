import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { reportPersistenceService, RelatorioSalvo } from './reportPersistenceService';

export interface RelatorioGeralData {
  periodo: {
    dataInicio: string;
    dataFim: string;
    mes: string;
    ano: string;
  };
  resumo: {
    totalMultas: number;
    valorTotal: number;
    pontosTotal: number;
    veiculosUnicos: number;
    agentesAtivos: number;
    valorMedio: number;
    pontosMedio: number;
  };
  distribuicao: {
    multasTransito: {
      quantidade: number;
      valor: number;
      percentual: number;
    };
    multasSemob: {
      quantidade: number;
      valor: number;
      percentual: number;
    };
  };
  topAgentes: Array<{
    codigo: string;
    descricao: string;
    total: number;
    valorTotal: number;
    percentual: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    quantidade: number;
    valor: number;
  }>;
  infracoesFrequentes: Array<{
    codigo: string;
    descricao: string;
    quantidade: number;
    valor: number;
  }>;
  multasDetalhadas: Array<{
    numeroMulta: string;
    prefixoVeiculo: string;
    dataHora: string;
    localMulta: string;
    valorMulta: number;
    pontuacao: number;
    agenteCodigo?: string;
    grupoInfracao: string;
    descricaoInfracao: string;
  }>;
  metadados: {
    dataGeracao: string;
    horaGeracao: string;
    usuario: string;
    versaoSistema: string;
  };
}

class ReportService {
  private baseUrl = 'http://localhost:3333';

  async gerarRelatorioGeral(): Promise<RelatorioGeralData> {
    try {
      console.log('🔄 Iniciando geração de relatório geral...');
      
      // Buscar dados de múltiplas fontes
      const [multasResponse, agentesResponse] = await Promise.all([
        fetch(`${this.baseUrl}/juridico/multas-completas?limit=50000`),
        fetch(`${this.baseUrl}/juridico/multas-enhanced/agrupamentos/agente`)
      ]);

      const multasData = await multasResponse.json();
      const agentesData = await agentesResponse.json();

      console.log('📊 Dados recebidos:', {
        multas: multasData.success ? multasData.data.length : 'erro',
        agentes: agentesData.success ? agentesData.data.length : 'erro'
      });

      if (!multasData.success || !agentesData.success) {
        throw new Error('Erro ao buscar dados para o relatório');
      }

      const multas = multasData.data || [];
      const agentes = agentesData.data || [];

      console.log('📈 Processando dados:', { totalMultas: multas.length, totalAgentes: agentes.length });

      // Calcular período (últimos 12 meses para ter dados)
      const agora = new Date();
      const umAnoAtras = new Date(agora.getFullYear() - 1, agora.getMonth(), 1);
      const fimPeriodo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

      // Filtrar multas do último ano (para ter dados)
      const multasPeriodo = multas.filter((multa: any) => {
        if (!multa.dataHoraMulta) return false;
        const dataMulta = new Date(multa.dataHoraMulta);
        return dataMulta >= umAnoAtras && dataMulta <= fimPeriodo;
      });

      console.log('📅 Multas no período:', multasPeriodo.length);

      // Separar por tipo
      const multasTransito = multasPeriodo.filter((m: any) => !m.agenteCodigo);
      const multasSemob = multasPeriodo.filter((m: any) => m.agenteCodigo);

      // Calcular estatísticas
      const totalMultas = multasPeriodo.length;
      const valorTotal = multasPeriodo.reduce((sum: number, m: any) => {
        const valor = parseFloat(m.valorMulta || 0);
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);
      
      const pontosTotal = multasPeriodo.reduce((sum: number, m: any) => {
        const pontos = parseInt(m.pontuacaoInfracao || 0);
        return sum + (isNaN(pontos) ? 0 : pontos);
      }, 0);
      
      const veiculosUnicos = new Set(multasPeriodo.map((m: any) => m.prefixoVeic).filter(Boolean)).size;

      // Processar agentes com dados reais
      const agentesComMultas = agentes
        .map((agente: any) => ({
          codigo: agente.codigo || 'N/A',
          descricao: agente.descricao || 'Agente sem nome',
          total: parseInt(agente.total || 0),
          valorTotal: parseFloat(agente.valorTotal || 0),
          percentual: totalMultas > 0 ? (parseInt(agente.total || 0) / totalMultas) * 100 : 0
        }))
        .filter((agente: any) => agente.total > 0)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      // Calcular evolução mensal (últimos 6 meses)
      const evolucaoMensal = this.calcularEvolucaoMensal(multasPeriodo);

      // Calcular infrações mais frequentes
      const infracoesFrequentes = this.calcularInfracoesFrequentes(multasPeriodo);

      // Preparar multas detalhadas
      const multasDetalhadas = multasPeriodo.slice(0, 1000).map((multa: any) => ({
        numeroMulta: multa.numeroMulta || 'N/A',
        prefixoVeiculo: multa.prefixoVeic || 'N/A',
        dataHora: multa.dataHoraMulta ? format(new Date(multa.dataHoraMulta), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A',
        localMulta: multa.localMulta || 'N/A',
        valorMulta: parseFloat(multa.valorMulta || 0),
        pontuacao: parseInt(multa.pontuacaoInfracao || 0),
        agenteCodigo: multa.agenteCodigo || 'TRÂNSITO',
        grupoInfracao: multa.grupoInfracao || 'N/A',
        descricaoInfracao: multa.descricaoInfracao || 'N/A'
      }));

      const relatorio: RelatorioGeralData = {
        periodo: {
          dataInicio: format(umAnoAtras, 'dd/MM/yyyy', { locale: ptBR }),
          dataFim: format(fimPeriodo, 'dd/MM/yyyy', { locale: ptBR }),
          mes: format(agora, 'MMMM', { locale: ptBR }),
          ano: agora.getFullYear().toString()
        },
        resumo: {
          totalMultas,
          valorTotal,
          pontosTotal,
          veiculosUnicos,
          agentesAtivos: agentesComMultas.length,
          valorMedio: totalMultas > 0 ? valorTotal / totalMultas : 0,
          pontosMedio: totalMultas > 0 ? pontosTotal / totalMultas : 0
        },
        distribuicao: {
          multasTransito: {
            quantidade: multasTransito.length,
            valor: multasTransito.reduce((sum: number, m: any) => sum + parseFloat(m.valorMulta || 0), 0),
            percentual: totalMultas > 0 ? (multasTransito.length / totalMultas) * 100 : 0
          },
          multasSemob: {
            quantidade: multasSemob.length,
            valor: multasSemob.reduce((sum: number, m: any) => sum + parseFloat(m.valorMulta || 0), 0),
            percentual: totalMultas > 0 ? (multasSemob.length / totalMultas) * 100 : 0
          }
        },
        topAgentes: agentesComMultas,
        evolucaoMensal,
        infracoesFrequentes,
        multasDetalhadas,
        metadados: {
          dataGeracao: format(agora, 'dd/MM/yyyy', { locale: ptBR }),
          horaGeracao: format(agora, 'HH:mm:ss', { locale: ptBR }),
          usuario: 'Leonardo',
          versaoSistema: '1.0.0'
        }
      };

      console.log('✅ Relatório gerado com sucesso:', {
        totalMultas: relatorio.resumo.totalMultas,
        valorTotal: relatorio.resumo.valorTotal,
        agentes: relatorio.topAgentes.length
      });

      return relatorio;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório geral:', error);
      throw error;
    }
  }

  private calcularEvolucaoMensal(multas: any[]): Array<{mes: string, quantidade: number, valor: number}> {
    const agora = new Date();
    const evolucao = [];

    for (let i = 5; i >= 0; i--) {
      const mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const proximoMes = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 1);
      
      const multasDoMes = multas.filter((multa: any) => {
        if (!multa.dataHoraMulta) return false;
        const dataMulta = new Date(multa.dataHoraMulta);
        return dataMulta >= mes && dataMulta < proximoMes;
      });

      evolucao.push({
        mes: format(mes, 'MMM/yyyy', { locale: ptBR }),
        quantidade: multasDoMes.length,
        valor: multasDoMes.reduce((sum: number, m: any) => sum + parseFloat(m.valorMulta || 0), 0)
      });
    }

    return evolucao;
  }

  private calcularInfracoesFrequentes(multas: any[]): Array<{codigo: string, descricao: string, quantidade: number, valor: number}> {
    const infracoesMap = new Map();

    multas.forEach((multa: any) => {
      const codigo = multa.codigoInfracao || multa.grupoInfracao || 'N/A';
      const descricao = multa.descricaoInfracao || 'Infração não especificada';
      
      if (!infracoesMap.has(codigo)) {
        infracoesMap.set(codigo, {
          codigo,
          descricao,
          quantidade: 0,
          valor: 0
        });
      }

      const infracao = infracoesMap.get(codigo);
      infracao.quantidade += 1;
      infracao.valor += parseFloat(multa.valorMulta || 0);
    });

    return Array.from(infracoesMap.values())
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }

  // Função para criar estilos do Excel
  private criarEstilosExcel() {
    return {
      headerPrincipal: {
        font: { bold: true, size: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thick', color: { rgb: '000000' } },
          bottom: { style: 'thick', color: { rgb: '000000' } },
          left: { style: 'thick', color: { rgb: '000000' } },
          right: { style: 'thick', color: { rgb: '000000' } }
        }
      },
      headerSecundario: {
        font: { bold: true, size: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2E75B6' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '1F4E79' } },
          bottom: { style: 'medium', color: { rgb: '1F4E79' } },
          left: { style: 'medium', color: { rgb: '1F4E79' } },
          right: { style: 'medium', color: { rgb: '1F4E79' } }
        }
      },
      headerTabela: {
        font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '2E75B6' } },
          bottom: { style: 'thin', color: { rgb: '2E75B6' } },
          left: { style: 'thin', color: { rgb: '2E75B6' } },
          right: { style: 'thin', color: { rgb: '2E75B6' } }
        }
      },
      dadosNormal: {
        font: { size: 11 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      },
      dadosNumerico: {
        font: { size: 11 },
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: '#,##0',
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      },
      dadosMonetario: {
        font: { size: 11 },
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: 'R$ #,##0.00',
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      },
      dadosCentro: {
        font: { size: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      },
      linhaAlternada: {
        font: { size: 11 },
        fill: { fgColor: { rgb: 'F2F2F2' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
          left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          right: { style: 'thin', color: { rgb: 'D0D0D0' } }
        }
      },
      destaque: {
        font: { bold: true, size: 11, color: { rgb: 'C55A11' } },
        fill: { fgColor: { rgb: 'FCE4D6' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: 'C55A11' } },
          bottom: { style: 'medium', color: { rgb: 'C55A11' } },
          left: { style: 'medium', color: { rgb: 'C55A11' } },
          right: { style: 'medium', color: { rgb: 'C55A11' } }
        }
      }
    };
  }

  // Função para aplicar estilo a uma célula
  private aplicarEstilo(sheet: any, cellAddress: string, estilo: any) {
    if (!sheet[cellAddress]) {
      sheet[cellAddress] = { t: 's', v: '' };
    }
    sheet[cellAddress].s = estilo;
  }

  // Função para aplicar estilo a um range de células
  private aplicarEstiloRange(sheet: any, startCol: string, startRow: number, endCol: string, endRow: number, estilo: any) {
    const startColNum = XLSX.utils.decode_col(startCol);
    const endColNum = XLSX.utils.decode_col(endCol);
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startColNum; col <= endColNum; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        this.aplicarEstilo(sheet, cellAddress, estilo);
      }
    }
  }

  // Função para mesclar células
  private mesclarCelulas(sheet: any, startCol: string, startRow: number, endCol: string, endRow: number) {
    if (!sheet['!merges']) sheet['!merges'] = [];
    
    const merge = {
      s: { r: startRow - 1, c: XLSX.utils.decode_col(startCol) },
      e: { r: endRow - 1, c: XLSX.utils.decode_col(endCol) }
    };
    
    sheet['!merges'].push(merge);
  }

  async exportarParaExcelFormatado(dados: RelatorioGeralData): Promise<string> {
    try {
      console.log('📊 Iniciando geração do Excel formatado...');
      
      const workbook = XLSX.utils.book_new();
      const estilos = this.criarEstilosExcel();

      // 1. ABA RESUMO EXECUTIVO
      const resumoData = [
        ['RELATÓRIO GERAL - DEPARTAMENTO JURÍDICO'],
        [''],
        ['INFORMAÇÕES DO PERÍODO'],
        ['Período Analisado:', `${dados.periodo.mes}/${dados.periodo.ano}`],
        ['Data Início:', dados.periodo.dataInicio],
        ['Data Fim:', dados.periodo.dataFim],
        ['Data de Geração:', dados.metadados.dataGeracao],
        ['Hora de Geração:', dados.metadados.horaGeracao],
        ['Gerado por:', dados.metadados.usuario],
        [''],
        ['RESUMO EXECUTIVO'],
        ['Métrica', 'Valor', 'Observações'],
        ['Total de Multas', dados.resumo.totalMultas, 'Multas registradas no sistema'],
        ['Valor Total Arrecadado', dados.resumo.valorTotal, 'Valor total das multas aplicadas'],
        ['Pontos CNH Aplicados', dados.resumo.pontosTotal, 'Total de pontos na carteira'],
        ['Veículos Únicos Multados', dados.resumo.veiculosUnicos, 'Quantidade de veículos diferentes'],
        ['Agentes SEMOB Ativos', dados.resumo.agentesAtivos, 'Agentes que aplicaram multas'],
        ['Valor Médio por Multa', dados.resumo.valorMedio, 'Média de valor por multa'],
        ['Pontos Médios por Multa', dados.resumo.pontosMedio, 'Média de pontos por multa'],
        [''],
        ['DISTRIBUIÇÃO POR TIPO DE MULTA'],
        ['Tipo', 'Quantidade', 'Valor (R$)', 'Percentual (%)'],
        ['Multas de Trânsito', dados.distribuicao.multasTransito.quantidade, dados.distribuicao.multasTransito.valor, dados.distribuicao.multasTransito.percentual],
        ['Multas SEMOB', dados.distribuicao.multasSemob.quantidade, dados.distribuicao.multasSemob.valor, dados.distribuicao.multasSemob.percentual]
      ];

      const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
      
      // Aplicar formatação
      this.aplicarEstilo(resumoSheet, 'A1', estilos.headerPrincipal);
      this.mesclarCelulas(resumoSheet, 'A', 1, 'C', 1);
      
      this.aplicarEstilo(resumoSheet, 'A3', estilos.headerSecundario);
      this.mesclarCelulas(resumoSheet, 'A', 3, 'C', 3);
      
      this.aplicarEstilo(resumoSheet, 'A11', estilos.headerSecundario);
      this.mesclarCelulas(resumoSheet, 'A', 11, 'C', 11);
      
      this.aplicarEstilo(resumoSheet, 'A21', estilos.headerSecundario);
      this.mesclarCelulas(resumoSheet, 'A', 21, 'D', 21);
      
      // Headers das tabelas
      this.aplicarEstiloRange(resumoSheet, 'A', 12, 'C', 12, estilos.headerTabela);
      this.aplicarEstiloRange(resumoSheet, 'A', 22, 'D', 22, estilos.headerTabela);
      
      // Larguras das colunas
      resumoSheet['!cols'] = [
        { wch: 30 },
        { wch: 25 },
        { wch: 35 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo Executivo');

      // 2. ABA TOP AGENTES
      if (dados.topAgentes.length > 0) {
        const agentesData = [
          ['RANKING DE AGENTES SEMOB'],
          [''],
          ['Posição', 'Código', 'Descrição', 'Total Multas', 'Valor Total (R$)', 'Percentual (%)'],
          ...dados.topAgentes.map((agente, index) => [
            `${index + 1}º`,
            agente.codigo,
            agente.descricao,
            agente.total,
            agente.valorTotal,
            agente.percentual.toFixed(2)
          ])
        ];

        const agentesSheet = XLSX.utils.aoa_to_sheet(agentesData);
        
        this.aplicarEstilo(agentesSheet, 'A1', estilos.headerPrincipal);
        this.mesclarCelulas(agentesSheet, 'A', 1, 'F', 1);
        
        this.aplicarEstiloRange(agentesSheet, 'A', 3, 'F', 3, estilos.headerTabela);

        agentesSheet['!cols'] = [
          { wch: 10 },
          { wch: 12 },
          { wch: 30 },
          { wch: 15 },
          { wch: 18 },
          { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, agentesSheet, 'Top Agentes');
      }

      // 3. ABA EVOLUÇÃO MENSAL
      const evolucaoData = [
        ['EVOLUÇÃO MENSAL (ÚLTIMOS 6 MESES)'],
        [''],
        ['Mês', 'Quantidade', 'Valor Total (R$)'],
        ...dados.evolucaoMensal.map(mes => [
          mes.mes,
          mes.quantidade,
          mes.valor
        ])
      ];

      const evolucaoSheet = XLSX.utils.aoa_to_sheet(evolucaoData);
      
      this.aplicarEstilo(evolucaoSheet, 'A1', estilos.headerPrincipal);
      this.mesclarCelulas(evolucaoSheet, 'A', 1, 'C', 1);
      
      this.aplicarEstiloRange(evolucaoSheet, 'A', 3, 'C', 3, estilos.headerTabela);

      evolucaoSheet['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(workbook, evolucaoSheet, 'Evolução Mensal');

      // 4. ABA INFRAÇÕES
      if (dados.infracoesFrequentes.length > 0) {
        const infracoesData = [
          ['INFRAÇÕES MAIS FREQUENTES'],
          [''],
          ['Código', 'Descrição', 'Quantidade', 'Valor Total (R$)'],
          ...dados.infracoesFrequentes.map(infracao => [
            infracao.codigo,
            infracao.descricao,
            infracao.quantidade,
            infracao.valor
          ])
        ];

        const infracoesSheet = XLSX.utils.aoa_to_sheet(infracoesData);
        
        this.aplicarEstilo(infracoesSheet, 'A1', estilos.headerPrincipal);
        this.mesclarCelulas(infracoesSheet, 'A', 1, 'D', 1);
        
        this.aplicarEstiloRange(infracoesSheet, 'A', 3, 'D', 3, estilos.headerTabela);

        infracoesSheet['!cols'] = [
          { wch: 12 },
          { wch: 40 },
          { wch: 15 },
          { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(workbook, infracoesSheet, 'Infrações Frequentes');
      }

      // Gerar arquivo
      const nomeArquivo = `relatorio-juridico-${dados.periodo.mes}-${dados.periodo.ano}-${format(new Date(), 'ddMM-HHmm')}.xlsx`;
      
      XLSX.writeFile(workbook, nomeArquivo);
      
      console.log('✅ Excel gerado com sucesso:', nomeArquivo);
      return nomeArquivo;
    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw new Error(`Erro ao gerar arquivo Excel: ${error.message}`);
    }
  }

  gerarHTML(dados: RelatorioGeralData): string {
    const htmlContent = `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório Geral - Departamento Jurídico</title>
      <style>
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              color: #333;
          }
          .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              overflow: hidden;
          }
          .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
          }
          .header h1 {
              font-size: 2.5em;
              margin: 0 0 10px 0;
              font-weight: 300;
          }
          .header p {
              font-size: 1.2em;
              margin: 10px 0;
              opacity: 0.9;
          }
          .content {
              padding: 40px 30px;
          }
          .section {
              margin-bottom: 40px;
          }
          .section h2 {
              color: #4a5568;
              font-size: 1.8em;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 3px solid #667eea;
          }
          .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
          }
          .stat-card {
              background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 25px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .stat-icon {
              font-size: 2.5em;
              margin-bottom: 10px;
          }
          .stat-value {
              font-size: 2em;
              font-weight: bold;
              color: #2d3748;
              margin-bottom: 5px;
          }
          .stat-label {
              color: #718096;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-size: 0.9em;
          }
          .distribution {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              margin: 25px 0;
          }
          .distribution-card {
              background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 25px;
              text-align: center;
          }
          .distribution-card h3 {
              font-size: 1.3em;
              margin-bottom: 15px;
              color: #2d3748;
          }
          .distribution-value {
              font-size: 1.5em;
              font-weight: bold;
              margin: 8px 0;
          }
          .percentage {
              color: #38a169;
              font-weight: bold;
              font-size: 1.1em;
          }
          .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .table th {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: 600;
          }
          .table td {
              padding: 12px 15px;
              border-bottom: 1px solid #e2e8f0;
          }
          .table tr:hover td {
              background-color: #f7fafc;
          }
          .table tr:nth-child(even) td {
              background-color: #f8f9ff;
          }
          .footer {
              background: #f7fafc;
              padding: 30px;
              text-align: center;
              color: #718096;
              border-top: 1px solid #e2e8f0;
          }
          .no-data {
              text-align: center;
              padding: 40px;
              color: #718096;
              font-style: italic;
          }
          .insights-box {
              background: #e6fffa;
              border-left: 4px solid #38a169;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
          }
          .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 25px;
              cursor: pointer;
              font-weight: 600;
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
              z-index: 1000;
              transition: all 0.2s ease;
          }
          .print-button:hover {
              transform: scale(1.05);
          }
          @media print {
              body { background: white; }
              .container { box-shadow: none; }
              .print-button { display: none; }
          }
          @media (max-width: 768px) {
              .distribution { grid-template-columns: 1fr; }
              .stats-grid { grid-template-columns: 1fr; }
              .content { padding: 20px 15px; }
          }
      </style>
  </head>
  <body>
      <button class="print-button" onclick="window.print()">🖨️ Imprimir Relatório</button>
      
      <div class="container">
          <div class="header">
              <h1>📊 Relatório Geral</h1>
              <p>Departamento Jurídico - Sistema de Gestão de Multas</p>
              <p>📅 Período: ${dados.periodo.dataInicio} a ${dados.periodo.dataFim} (${dados.periodo.mes}/${dados.periodo.ano})</p>
          </div>
  
          <div class="content">
              <!-- Resumo Executivo -->
              <div class="section">
                  <h2>📈 Resumo Executivo</h2>
                  <div class="stats-grid">
                      <div class="stat-card">
                          <div class="stat-icon">🚨</div>
                          <div class="stat-value">${dados.resumo.totalMultas.toLocaleString('pt-BR')}</div>
                          <div class="stat-label">Total de Multas</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-icon">💰</div>
                          <div class="stat-value">${dados.resumo.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</div>
                          <div class="stat-label">Valor Total Arrecadado</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-icon">🎯</div>
                          <div class="stat-value">${dados.resumo.pontosTotal.toLocaleString('pt-BR')}</div>
                          <div class="stat-label">Pontos CNH Aplicados</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-icon">🚗</div>
                          <div class="stat-value">${dados.resumo.veiculosUnicos}</div>
                          <div class="stat-label">Veículos Únicos</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-icon">👮</div>
                          <div class="stat-value">${dados.resumo.agentesAtivos}</div>
                          <div class="stat-label">Agentes SEMOB Ativos</div>
                      </div>
                      <div class="stat-card">
                          <div class="stat-icon">📊</div>
                          <div class="stat-value">${dados.resumo.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                          <div class="stat-label">Valor Médio por Multa</div>
                      </div>
                  </div>
                  
                  ${this.gerarInsightsSection(dados)}
              </div>
  
              <!-- Distribuição por Tipo -->
              <div class="section">
                  <h2>📊 Distribuição por Tipo de Multa</h2>
                  <div class="distribution">
                      <div class="distribution-card">
                          <h3>🚌 Multas de Trânsito</h3>
                          <div class="distribution-value" style="color: #3182ce;">
                              ${dados.distribuicao.multasTransito.quantidade.toLocaleString('pt-BR')} multas
                          </div>
                          <div class="distribution-value" style="color: #2d3748;">
                              ${dados.distribuicao.multasTransito.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div class="percentage">
                              ${dados.distribuicao.multasTransito.percentual.toFixed(1)}% do total
                          </div>
                      </div>
                      <div class="distribution-card">
                          <h3>🚨 Multas SEMOB</h3>
                          <div class="distribution-value" style="color: #e53e3e;">
                              ${dados.distribuicao.multasSemob.quantidade.toLocaleString('pt-BR')} multas
                          </div>
                          <div class="distribution-value" style="color: #2d3748;">
                              ${dados.distribuicao.multasSemob.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div class="percentage">
                              ${dados.distribuicao.multasSemob.percentual.toFixed(1)}% do total
                          </div>
                      </div>
                  </div>
              </div>
  
              ${this.gerarTopAgentesSection(dados)}
              ${this.gerarEvolucaoSection(dados)}
              ${this.gerarInfracoesSection(dados)}
          </div>
  
          <div class="footer">
              <p><strong>📅 Data de Geração:</strong> ${dados.metadados.dataGeracao} às ${dados.metadados.horaGeracao}</p>
              <p><strong>👤 Gerado por:</strong> ${dados.metadados.usuario}</p>
              <p><strong>�� Sistema:</strong> Versão ${dados.metadados.versaoSistema}</p>
              <p><strong>�� Registros Processados:</strong> ${dados.resumo.totalMultas.toLocaleString('pt-BR')} multas</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
              <p><strong>Departamento Jurídico</strong> - Sistema de Gestão de Multas</p>
              <p style="font-size: 0.9em; margin-top: 5px;">Relatório gerado automaticamente pelo sistema integrado de gestão</p>
          </div>
      </div>
  
      <script>
          document.addEventListener('DOMContentLoaded', function() {
              console.log('📊 Relatório HTML carregado com sucesso');
          });
      </script>
  </body>
  </html>`;
  
    return htmlContent;
  }
  
  // Função auxiliar para gerar seção de insights
  private gerarInsightsSection(dados: RelatorioGeralData): string {
    if (dados.resumo.totalMultas > 0) {
      const produtividadePorAgente = (dados.resumo.totalMultas / Math.max(dados.resumo.agentesAtivos, 1)).toFixed(1);
      const concentracaoVeiculos = (dados.resumo.totalMultas / Math.max(dados.resumo.veiculosUnicos, 1)).toFixed(1);
      
      return `
      <div class="insights-box">
          <h4>💡 Insights Principais</h4>
          <ul style="margin-top: 10px; padding-left: 20px;">
              <li>Média de <strong>${dados.resumo.pontosMedio.toFixed(1)} pontos</strong> por multa aplicada</li>
              <li>Taxa de produtividade: <strong>${produtividadePorAgente} multas por agente</strong></li>
              <li>Concentração de veículos: <strong>${concentracaoVeiculos} multas por veículo único</strong></li>
          </ul>
      </div>`;
    }
    return '<div class="no-data">Nenhuma multa encontrada no período analisado</div>';
  }
  
  // Função auxiliar para gerar seção de top agentes
  private gerarTopAgentesSection(dados: RelatorioGeralData): string {
    if (dados.topAgentes.length === 0) return '';
    
    const agentesRows = dados.topAgentes.map((agente, index) => `
      <tr>
          <td><strong>${index + 1}º</strong></td>
          <td>${agente.codigo}</td>
          <td>${agente.descricao}</td>
          <td><strong>${agente.total.toLocaleString('pt-BR')}</strong></td>
          <td><strong>${agente.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
          <td><strong>${agente.percentual.toFixed(2)}%</strong></td>
      </tr>
    `).join('');
  
    return `
    <div class="section">
        <h2>🏆 Top ${dados.topAgentes.length} Agentes SEMOB</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Posição</th>
                    <th>Código</th>
                    <th>Nome/Descrição</th>
                    <th>Total de Multas</th>
                    <th>Valor Arrecadado</th>
                    <th>Participação</th>
                </tr>
            </thead>
            <tbody>
                ${agentesRows}
            </tbody>
        </table>
    </div>`;
  }
  
  // Função auxiliar para gerar seção de evolução
  private gerarEvolucaoSection(dados: RelatorioGeralData): string {
    const evolucaoRows = dados.evolucaoMensal.map(mes => `
      <tr>
          <td><strong>${mes.mes}</strong></td>
          <td>${mes.quantidade.toLocaleString('pt-BR')}</td>
          <td>${mes.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>
    `).join('');
  
    return `
    <div class="section">
        <h2>📈 Evolução Mensal (Últimos 6 Meses)</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Mês</th>
                    <th>Quantidade de Multas</th>
                    <th>Valor Arrecadado</th>
                </tr>
            </thead>
            <tbody>
                ${evolucaoRows}
            </tbody>
        </table>
    </div>`;
  }
  
  // Função auxiliar para gerar seção de infrações
  private gerarInfracoesSection(dados: RelatorioGeralData): string {
    if (dados.infracoesFrequentes.length === 0) return '';
    
    const infracoesRows = dados.infracoesFrequentes.map((infracao, index) => `
      <tr>
          <td><strong>${index + 1}º</strong></td>
          <td>${infracao.codigo}</td>
          <td>${infracao.descricao}</td>
          <td><strong>${infracao.quantidade.toLocaleString('pt-BR')}</strong></td>
          <td><strong>${infracao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
      </tr>
    `).join('');
  
    return `
    <div class="section">
        <h2>⚠️ Top ${dados.infracoesFrequentes.length} Infrações Mais Frequentes</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Ranking</th>
                    <th>Código</th>
                    <th>Descrição da Infração</th>
                    <th>Quantidade</th>
                    <th>Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${infracoesRows}
            </tbody>
        </table>
    </div>`;
  }

  async salvarRelatorioHTML(dados: RelatorioGeralData): Promise<void> {
    try {
      const html = this.gerarHTML(dados);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-juridico-${dados.periodo.mes}-${dados.periodo.ano}-${format(new Date(), 'ddMM-HHmm')}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar o URL após um pequeno delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      console.log('✅ HTML salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar HTML:', error);
      throw error;
    }
  }

  async salvarEGerarRelatorio(tipo: 'completo' | 'excel' | 'html' = 'completo'): Promise<RelatorioSalvo> {
    try {
      console.log(`🔄 Iniciando geração de relatório tipo: ${tipo}`);
      
      // Gerar dados do relatório
      const dados = await this.gerarRelatorioGeral();
      
      // Criar entrada no sistema de persistência
      const relatorioSalvo = reportPersistenceService.adicionarRelatorio({
        nome: `Relatório ${tipo === 'completo' ? 'Completo' : tipo === 'excel' ? 'Excel' : 'HTML'} - ${dados.periodo.mes}/${dados.periodo.ano}`,
        descricao: `Relatório ${tipo} das multas do período de ${dados.periodo.dataInicio} a ${dados.periodo.dataFim}`,
        tipo: 'multas_geral',
        formato: tipo === 'html' ? 'html' : tipo === 'excel' ? 'excel' : 'completo',
        status: 'processando',
        ultimaExecucao: new Date().toISOString(),
        agendamento: 'manual',
        registros: dados.resumo.totalMultas,
        criadoPor: 'Leonardo',
        dadosRelatorio: dados
      });

      // Processar relatório
      try {
        let tamanho = '';
        let caminhoArquivo = '';

        if (tipo === 'excel' || tipo === 'completo') {
          console.log('📊 Gerando Excel...');
          caminhoArquivo = await this.exportarParaExcelFormatado(dados);
          tamanho = '2.5 MB';
        }

        if (tipo === 'html' || tipo === 'completo') {
          console.log('🌐 Gerando HTML...');
          await this.salvarRelatorioHTML(dados);
          if (!tamanho) tamanho = '1.8 MB';
        }

        // Atualizar status para concluído
        reportPersistenceService.atualizarRelatorio(relatorioSalvo.id, {
          status: 'concluido',
          tamanho,
          caminhoArquivo
        });

        console.log('✅ Relatório processado com sucesso');
      } catch (error) {
        console.error('❌ Erro no processamento:', error);
        
        // Atualizar status para erro
        reportPersistenceService.atualizarRelatorio(relatorioSalvo.id, {
          status: 'erro'
        });
        
        throw error;
      }

      return relatorioSalvo;
    } catch (error) {
      console.error('❌ Erro ao salvar e gerar relatório:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();