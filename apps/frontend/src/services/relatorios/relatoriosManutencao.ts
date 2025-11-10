// services/relatorios/relatoriosManutencao.ts
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { OrdemServico } from '@/services/departments/manutencao/types';
import type { EstatisticasComparativas } from '@/hooks/useManutencao2025';

export class RelatoriosManutencaoService {
  /**
   * Gera relatório em HTML formatado
   */
  static gerarRelatorioHTML(
    ordensServico: OrdemServico[],
    estatisticas: EstatisticasComparativas,
    filtros: any
  ): string {
    const dataRelatorio = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Manutenção - ${dataRelatorio}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #f97316;
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-value {
            font-size: 3em;
            font-weight: bold;
            color: #f97316;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9em;
        }
        
        .growth {
            margin-top: 10px;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .growth.positive {
            background: #dcfce7;
            color: #16a34a;
        }
        
        .growth.negative {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .section {
            padding: 30px;
        }
        
        .section-title {
            font-size: 1.8em;
            color: #f97316;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f97316;
        }
        
        .top-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .top-item-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        
        .top-item-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
        }
        
        .top-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #f3f4f6;
            margin-bottom: 5px;
        }
        
        .top-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .item-name {
            font-weight: 600;
            color: #374151;
        }
        
        .item-count {
            background: #f97316;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .table-container {
            overflow-x: auto;
            margin-top: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        
        th {
            background: #f97316;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.9em;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-aberta {
            background: #dcfce7;
            color: #16a34a;
        }
        
        .status-fechada {
            background: #dbeafe;
            color: #2563eb;
        }
        
        .tipo-corretiva {
            background: #fee2e2;
            color: #dc2626;
        }
        
        .tipo-preventiva {
            background: #e0f2fe;
            color: #0277bd;
        }
        
        .footer {
            background: #374151;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        .filters-info {
            background: #f1f5f9;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .filter-item {
            display: inline-block;
            background: white;
            padding: 5px 12px;
            margin: 5px;
            border-radius: 20px;
            border: 1px solid #d1d5db;
            font-size: 0.9em;
        }
        
        @media print {
            body { margin: 0; background: white; }
            .container { box-shadow: none; }
            .stat-card:hover { transform: none; }
        }
        
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
            .top-items { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Relatório de Manutenção</h1>
            <div class="subtitle">Departamento de Manutenção - ${dataRelatorio}</div>
        </div>
        
        ${this.gerarFiltrosInfo(filtros)}
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${estatisticas.mesAtual.resumo.totalRegistros.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Total de OS</div>
                ${estatisticas.mesAnterior ? `
                    <div class="growth ${estatisticas.crescimento.totalOS >= 0 ? 'positive' : 'negative'}">
                        ${estatisticas.crescimento.totalOS >= 0 ? '↗' : '↘'} ${Math.abs(estatisticas.crescimento.totalOS).toFixed(1)}%
                    </div>
                ` : ''}
            </div>
            
            <div class="stat-card">
                <div class="stat-value">${estatisticas.mesAtual.resumo.osAbertas.toLocaleString('pt-BR')}</div>
                <div class="stat-label">OS Abertas</div>
                ${estatisticas.mesAnterior ? `
                    <div class="growth ${estatisticas.crescimento.osAbertas >= 0 ? 'positive' : 'negative'}">
                        ${estatisticas.crescimento.osAbertas >= 0 ? '↗' : '↘'} ${Math.abs(estatisticas.crescimento.osAbertas).toFixed(1)}%
                    </div>
                ` : ''}
            </div>
            
            <div class="stat-card">
                <div class="stat-value">${estatisticas.mesAtual.resumo.quebras.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Quebras</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-value">R$ ${parseFloat(estatisticas.mesAtual.indicadores.totalValorTerceiros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div class="stat-label">Valor Terceiros</div>
                ${estatisticas.mesAnterior ? `
                    <div class="growth ${estatisticas.crescimento.valorTerceiros >= 0 ? 'negative' : 'positive'}">
                        ${estatisticas.crescimento.valorTerceiros >= 0 ? '↗' : '↘'} ${Math.abs(estatisticas.crescimento.valorTerceiros).toFixed(1)}%
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📊 Top Indicadores</h2>
            
            <div class="top-items">
                <div class="top-item-card">
                    <div class="top-item-title">🏢 Top Garagens</div>
                    ${estatisticas.top.garagens.map(garagem => `
                        <div class="top-item">
                            <span class="item-name">${garagem.nome}</span>
                            <span class="item-count">${garagem.total}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="top-item-card">
                    <div class="top-item-title">⚠️ Top Problemas</div>
                    ${estatisticas.top.problemas.map(problema => `
                        <div class="top-item">
                            <span class="item-name">${problema.tipo}</span>
                            <span class="item-count">${problema.total}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="top-item-card">
                    <div class="top-item-title">🚌 Top Veículos</div>
                    ${estatisticas.top.veiculos.map(veiculo => `
                        <div class="top-item">
                            <span class="item-name">${veiculo.prefixo} - ${veiculo.placa}</span>
                            <span class="item-count">${veiculo.total}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📋 Detalhamento das Ordens de Serviço</h2>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Número OS</th>
                            <th>Prefixo</th>
                            <th>Placa</th>
                            <th>Garagem</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Data Abertura</th>
                            <th>Problema</th>
                            <th>Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordensServico.slice(0, 100).map(os => `
                            <tr>
                                <td>${os.numeroOS || 'N/A'}</td>
                                <td>${os.prefixoVeiculo || 'N/A'}</td>
                                <td>${os.placaVeiculo || 'N/A'}</td>
                                <td>${os.garagem || 'N/A'}</td>
                                <td><span class="status-badge ${os.tipoOS === 'C' ? 'tipo-corretiva' : 'tipo-preventiva'}">${os.tipoOSDescricao || 'N/A'}</span></td>
                                <td><span class="status-badge ${os.condicaoOS === 'A' ? 'status-aberta' : 'status-fechada'}">${os.condicaoOSDescricao || 'N/A'}</span></td>
                                <td>${os.dataAbertura || 'N/A'}</td>
                                <td>${os.tipoProblema || 'N/A'}</td>
                                <td>R$ ${((parseFloat(String(os.valorMaoObraTerceiros || 0)) + parseFloat(String(os.valorPecasTerceiros || 0)))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${ordensServico.length > 100 ? `<p style="text-align: center; margin-top: 20px; color: #666; font-style: italic;">Mostrando as primeiras 100 ordens de serviço de um total de ${ordensServico.length.toLocaleString('pt-BR')} registros.</p>` : ''}
        </div>
        
        <div class="footer">
            Relatório gerado automaticamente pelo Sistema de Manutenção em ${dataRelatorio}
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Gera seção de informações dos filtros
   */
  private static gerarFiltrosInfo(filtros: any): string {
    const filtrosAtivos = [];
    
    if (filtros.startDate && filtros.endDate) {
      filtrosAtivos.push(`Período: ${filtros.startDate} até ${filtros.endDate}`);
    }
    
    if (filtros.garagem) {
      filtrosAtivos.push(`Garagem: ${filtros.garagem}`);
    }
    
    if (filtros.tipoOS) {
      filtrosAtivos.push(`Tipo: ${filtros.tipoOS === 'C' ? 'Corretiva' : 'Preventiva'}`);
    }
    
    if (filtros.condicaoOS) {
      filtrosAtivos.push(`Status: ${filtros.condicaoOS === 'A' ? 'Aberta' : 'Fechada'}`);
    }
    
    if (filtros.tipoProblema) {
      filtrosAtivos.push(`Problema: ${filtros.tipoProblema}`);
    }
    
    if (filtrosAtivos.length === 0) {
      return '';
    }
    
    return `
      <div class="filters-info">
        <strong>Filtros Aplicados:</strong><br>
        ${filtrosAtivos.map(filtro => `<span class="filter-item">${filtro}</span>`).join('')}
      </div>
    `;
  }

  /**
   * Gera e baixa relatório HTML
   */
  static baixarRelatorioHTML(
    ordensServico: OrdemServico[],
    estatisticas: EstatisticasComparativas,
    filtros: any
  ): void {
    const html = this.gerarRelatorioHTML(ordensServico, estatisticas, filtros);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-manutencao-${format(new Date(), 'yyyy-MM-dd-HHmm')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Gera relatório em Excel com múltiplas planilhas
   */
  static gerarRelatorioExcel(
    ordensServico: OrdemServico[],
    estatisticas: EstatisticasComparativas,
    filtros: any
  ): void {
    const workbook = XLSX.utils.book_new();

    // Planilha 1: Resumo Executivo
    const resumoData = [
      ['RELATÓRIO DE MANUTENÇÃO'],
      ['Gerado em:', format(new Date(), "dd/MM/yyyy 'às' HH:mm")],
      [''],
      ['INDICADORES PRINCIPAIS'],
      ['Total de OS:', estatisticas.mesAtual.resumo.totalRegistros],
      ['OS Abertas:', estatisticas.mesAtual.resumo.osAbertas],
      ['OS Fechadas:', estatisticas.mesAtual.resumo.osFechadas],
      ['Quebras:', estatisticas.mesAtual.resumo.quebras],
      ['Defeitos:', estatisticas.mesAtual.resumo.defeitos],
      ['Socorros:', estatisticas.mesAtual.resumo.socorros],
      ['Valor Total Terceiros:', `R$ ${parseFloat(estatisticas.mesAtual.indicadores.totalValorTerceiros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      [''],
      ['CRESCIMENTO (MÊS ANTERIOR)'],
      ...(estatisticas.mesAnterior ? [
        ['Total OS:', `${estatisticas.crescimento.totalOS >= 0 ? '+' : ''}${estatisticas.crescimento.totalOS.toFixed(1)}%`],
        ['OS Abertas:', `${estatisticas.crescimento.osAbertas >= 0 ? '+' : ''}${estatisticas.crescimento.osAbertas.toFixed(1)}%`],
        ['Valor Terceiros:', `${estatisticas.crescimento.valorTerceiros >= 0 ? '+' : ''}${estatisticas.crescimento.valorTerceiros.toFixed(1)}%`]
      ] : [['Dados do mês anterior não disponíveis']]),
      [''],
      ['TOP GARAGENS'],
      ...estatisticas.top.garagens.map(g => [g.nome, g.total, `${g.percentual.toFixed(1)}%`]),
      [''],
      ['TOP PROBLEMAS'],
      ...estatisticas.top.problemas.map(p => [p.tipo, p.total, `${p.percentual.toFixed(1)}%`]),
      [''],
      ['TOP VEÍCULOS'],
      ...estatisticas.top.veiculos.map(v => [`${v.prefixo} - ${v.placa}`, v.total])
    ];

    const resumoWS = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, resumoWS, 'Resumo Executivo');

    // Planilha 2: Ordens de Serviço Detalhadas
    const osHeaders = [
      'Código Interno',
      'Número OS',
      'Prefixo',
      'Placa',
      'Garagem',
      'Data Abertura',
      'Data Fechamento',
      'Tipo OS',
      'Status',
      'Tipo Problema',
      'Usuário Abertura',
      'Descrição',
      'Valor Mão de Obra',
      'Valor Peças',
      'Valor Total',
      'Dias em Andamento',
      'KM Execução',
      'É Socorro'
    ];

    const osData = ordensServico.map(os => [
      os.codigoInternoOS,
      os.numeroOS || 'N/A',
      os.prefixoVeiculo || 'N/A',
      os.placaVeiculo || 'N/A',
      os.garagem || 'N/A',
      os.dataAbertura || 'N/A',
      os.dataFechamento || 'N/A',
      os.tipoOSDescricao || 'N/A',
      os.condicaoOSDescricao || 'N/A',
      os.tipoProblema || 'N/A',
      os.usuarioAbertura || 'N/A',
      os.descricaoServico || 'N/A',
      parseFloat(String(os.valorMaoObraTerceiros || 0)),
      parseFloat(String(os.valorPecasTerceiros || 0)),
      parseFloat(String(os.valorMaoObraTerceiros || 0)) + parseFloat(String(os.valorPecasTerceiros || 0)),
      os.diasEmAndamento || 0,
      os.kmExecucao || 0,
      os.ehSocorro || 'N/A'
    ]);

    const osWS = XLSX.utils.aoa_to_sheet([osHeaders, ...osData]);
    XLSX.utils.book_append_sheet(workbook, osWS, 'Ordens de Serviço');

    // Planilha 3: Distribuições
    const distData = [
      ['DISTRIBUIÇÃO POR TIPO DE OS'],
      ['Tipo', 'Quantidade', 'Percentual'],
      ...Object.entries(estatisticas.mesAtual.distribuicoes.tiposOS).map(([tipo, qtd]) => [
        tipo,
        qtd,
        `${((qtd / estatisticas.mesAtual.resumo.totalRegistros) * 100).toFixed(1)}%`
      ]),
      [''],
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Status', 'Quantidade', 'Percentual'],
      ...Object.entries(estatisticas.mesAtual.distribuicoes.statusOS).map(([status, qtd]) => [
        status,
        qtd,
        `${((qtd / estatisticas.mesAtual.resumo.totalRegistros) * 100).toFixed(1)}%`
      ]),
      [''],
      ['DISTRIBUIÇÃO POR GARAGEM'],
      ['Garagem', 'Quantidade', 'Percentual'],
      ...Object.entries(estatisticas.mesAtual.distribuicoes.garagens).map(([garagem, qtd]) => [
        garagem,
        qtd,
        `${((qtd / estatisticas.mesAtual.resumo.totalRegistros) * 100).toFixed(1)}%`
      ])
    ];

    const distWS = XLSX.utils.aoa_to_sheet(distData);
    XLSX.utils.book_append_sheet(workbook, distWS, 'Distribuições');

    // Aplicar formatação básica
    this.aplicarFormatacaoExcel(workbook);

    // Baixar arquivo
    XLSX.writeFile(workbook, `relatorio-manutencao-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`);
  }

  /**
   * Aplica formatação básica no Excel
   */
  private static aplicarFormatacaoExcel(workbook: XLSX.WorkBook): void {
    // Configurações de estilo básicas
    const sheetNames = workbook.SheetNames;
    
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Definir larguras das colunas
      if (!worksheet['!cols']) worksheet['!cols'] = [];
      
      // Ajustar larguras baseado no conteúdo
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = 0; col <= range.e.c; col++) {
        worksheet['!cols'][col] = { width: 15 };
      }
      
      // Ajustar algumas colunas específicas
      if (sheetName === 'Ordens de Serviço') {
        if (worksheet['!cols'][11]) worksheet['!cols'][11].width = 40; // Descrição
        if (worksheet['!cols'][1]) worksheet['!cols'][1].width = 20;  // Número OS
      }
    });
  }

  /**
   * Abre relatório HTML em nova janela/aba
   */
  static abrirRelatorioHTML(
    ordensServico: OrdemServico[],
    estatisticas: EstatisticasComparativas,
    filtros: any
  ): void {
    const html = this.gerarRelatorioHTML(ordensServico, estatisticas, filtros);
    const novaJanela = window.open('', '_blank');
    
    if (novaJanela) {
      novaJanela.document.write(html);
      novaJanela.document.close();
    } else {
      // Fallback: baixar como arquivo
      this.baixarRelatorioHTML(ordensServico, estatisticas, filtros);
    }
  }
}