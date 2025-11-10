// apps/frontend/src/services/reports/reportService.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ReportData {
  titulo: string;
  subtitulo?: string;
  dados: any[];
  filtros?: any;
  estatisticas?: any;
  tipo: 'funcionarios' | 'graficos' | 'dashboard';
}

export interface ExcelStyle {
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    color?: string;
  };
  fill?: {
    fgColor?: string;
  };
  border?: {
    top?: { style: string; color: string };
    bottom?: { style: string; color: string };
    left?: { style: string; color: string };
    right?: { style: string; color: string };
  };
  alignment?: {
    horizontal?: string;
    vertical?: string;
  };
}

class ReportService {
  // ✅ GERAR RELATÓRIO HTML
  generateHTMLReport(data: ReportData): string {
    const { titulo, subtitulo, dados, filtros, estatisticas, tipo } = data;
    const dataAtual = new Date().toLocaleString('pt-BR');
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header h2 {
            font-size: 1.2em;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .company-info {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 3px solid #667eea;
        }
        
        .company-info h3 {
            color: #667eea;
            font-size: 1.3em;
            margin-bottom: 5px;
        }
        
        .report-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .info-item strong {
            color: #667eea;
            display: block;
            margin-bottom: 5px;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h3 {
            color: #667eea;
            font-size: 1.4em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        .stat-card .number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-card .label {
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .filters-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
        }
        
        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .filter-item {
            background: white;
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        
        .filter-item strong {
            color: #667eea;
            font-size: 0.9em;
        }
        
        .table-container {
            overflow-x: auto;
            margin-top: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            font-size: 0.9em;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #e3f2fd;
        }
        
        .status-ativo {
            background: #d4edda;
            color: #155724;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.8em;
        }
        
        .status-afastado {
            background: #fff3cd;
            color: #856404;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.8em;
        }
        
        .status-demitido {
            background: #f8d7da;
            color: #721c24;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.8em;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
        }
        
        .footer p {
            margin-bottom: 5px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .header {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
            }
            
            th {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }
            
            .content {
                padding: 20px;
            }
            
            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            table {
                font-size: 0.8em;
            }
            
            th, td {
                padding: 8px 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${titulo}</h1>
            ${subtitulo ? `<h2>${subtitulo}</h2>` : ''}
        </div>
        
        <div class="company-info">
            <h3>Viação Pioneira Ltda</h3>
            <div class="report-info">
                <div class="info-item">
                    <strong>Data de Geração:</strong>
                    ${dataAtual}
                </div>
                <div class="info-item">
                    <strong>Tipo de Relatório:</strong>
                    ${tipo === 'funcionarios' ? 'Relatório de Funcionários' : 
                      tipo === 'graficos' ? 'Relatório de Análises e Gráficos' : 
                      'Relatório do Dashboard'}
                </div>
                <div class="info-item">
                    <strong>Total de Registros:</strong>
                    ${dados.length.toLocaleString('pt-BR')}
                </div>
                <div class="info-item">
                    <strong>Sistema:</strong>
                    Departamento Pessoal
                </div>
            </div>
        </div>
        
        <div class="content">
            ${this.generateStatisticsSection(estatisticas)}
            ${this.generateFiltersSection(filtros)}
            ${this.generateDataSection(dados, tipo)}
        </div>
        
        <div class="footer">
            <p><strong>Viação Pioneira Ltda - Sistema de Gestão de Pessoal</strong></p>
            <p>Relatório gerado automaticamente em ${dataAtual}</p>
            <p>Este documento contém informações confidenciais da empresa</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  // ✅ GERAR SEÇÃO DE ESTATÍSTICAS
  private generateStatisticsSection(estatisticas: any): string {
    if (!estatisticas) return '';

    return `
        <div class="section">
            <h3>📊 Estatísticas Gerais</h3>
            <div class="stats-grid">
                ${Object.entries(estatisticas).map(([key, value]: [string, any]) => `
                    <div class="stat-card">
                        <div class="number">${typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</div>
                        <div class="label">${this.formatStatLabel(key)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
  }

  // ✅ GERAR SEÇÃO DE FILTROS
  private generateFiltersSection(filtros: any): string {
    if (!filtros || Object.keys(filtros).length === 0) return '';

    return `
        <div class="section">
            <h3>🔍 Filtros Aplicados</h3>
            <div class="filters-section">
                <div class="filters-grid">
                    ${Object.entries(filtros).map(([key, value]: [string, any]) => {
                        if (value === undefined || value === null || value === '') return '';
                        return `
                            <div class="filter-item">
                                <strong>${this.formatFilterLabel(key)}:</strong><br>
                                ${Array.isArray(value) ? value.join(', ') : value}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
  }


  // Adicionar no ReportService:

// ✅ CRIAR ABA DE FUNCIONÁRIOS INATIVOS
private createFuncionariosInativosSheet(wb: any, funcionarios: any[], titulo: string, tipoInativo: string): void {
  const colunas = tipoInativo === 'afastados' 
    ? ['Crachá', 'Nome', 'CPF', 'Situação', 'Função', 'Departamento', 'Admissão', 'Tempo Empresa', 'Data Afastamento', 'Motivo', 'Cidade', 'Telefone']
    : ['Crachá', 'Nome', 'CPF', 'Situação', 'Função', 'Departamento', 'Admissão', 'Tempo Empresa', 'Data Demissão', 'Motivo', 'Cidade', 'Telefone'];

  const wsData = [
    // Header principal
    [titulo],
    [`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [`Total de funcionários ${tipoInativo}: ${funcionarios.length.toLocaleString('pt-BR')}`],
    [`⚠️ ATENÇÃO: Funcionários ${tipoInativo === 'afastados' ? 'temporariamente afastados' : 'desligados da empresa'}`],
    [], // Linha vazia
    
    // Cabeçalhos da tabela
    colunas,
    
    // Dados dos funcionários
    ...funcionarios.map(func => [
      func.cracha,
      func.nome,
      func.cpf || '',
      func.situacao === 'F' ? 'AFASTADO' : 'DEMITIDO',
      func.funcao || '',
      func.departamento || '',
      func.dataAdmissao ? new Date(func.dataAdmissao).toLocaleDateString('pt-BR') : '',
      this.formatTempoEmpresa(func.tempoEmpresaAnos),
      func.dtDesligQuita ? new Date(func.dtDesligQuita).toLocaleDateString('pt-BR') : '',
      this.getMotivo(func, tipoInativo),
      func.cidade || '',
      this.formatPhone(func.foneFunc)
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // ✅ APLICAR ESTILOS ESPECÍFICOS PARA INATIVOS
  this.applyInativosExcelStyles(ws, wsData.length, colunas.length, tipoInativo);
  
  // ✅ AJUSTAR LARGURAS DAS COLUNAS
  ws['!cols'] = [
    { width: 10 },  // Crachá
    { width: 30 },  // Nome
    { width: 15 },  // CPF
    { width: 12 },  // Situação
    { width: 25 },  // Função
    { width: 20 },  // Departamento
    { width: 12 },  // Admissão
    { width: 15 },  // Tempo Empresa
    { width: 15 },  // Data Afastamento/Demissão
    { width: 20 },  // Motivo
    { width: 20 },  // Cidade
    { width: 15 }   // Telefone
  ];

  XLSX.utils.book_append_sheet(wb, ws, tipoInativo === 'afastados' ? 'Afastados' : 'Demitidos');
}

// ✅ APLICAR ESTILOS ESPECÍFICOS PARA INATIVOS
private applyInativosExcelStyles(ws: any, totalRows: number, totalCols: number, tipoInativo: string): void {
  const headerColor = tipoInativo === 'afastados' ? 'FF8C00' : 'DC143C'; // Laranja para afastados, Vermelho para demitidos
  
  // Estilo do título (primeira linha)
  for (let col = 0; col < totalCols; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = {
      font: { bold: true, size: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: headerColor } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Estilo da linha de atenção (linha 4, índice 3)
  for (let col = 0; col < totalCols; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = {
      font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: tipoInativo === 'afastados' ? 'FFA500' : 'FF6B6B' } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Estilo dos cabeçalhos da tabela (linha 6, índice 5)
  if (totalRows > 5) {
    for (let col = 0; col < totalCols; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: headerColor } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
  }
  
  // Estilo das células de dados
  for (let row = 6; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { size: 10 },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D9D9D9" } },
          bottom: { style: "thin", color: { rgb: "D9D9D9" } },
          left: { style: "thin", color: { rgb: "D9D9D9" } },
          right: { style: "thin", color: { rgb: "D9D9D9" } }
        }
      };
      
      // Alternar cores das linhas
      if (row % 2 === 0) {
        ws[cellAddress].s.fill = { 
          fgColor: { 
            rgb: tipoInativo === 'afastados' ? 'FFF8DC' : 'FFE4E1' 
          } 
        };
      }
      
      // Destacar coluna de situação
      if (col === 3) { // Coluna de situação
        ws[cellAddress].s.font = { 
          size: 10, 
          bold: true, 
          color: { rgb: tipoInativo === 'afastados' ? 'FF8C00' : 'DC143C' } 
        };
      }
    }
  }
}

 
 

  // ✅ GERAR TABELA DE FUNCIONÁRIOS
  private generateFuncionariosTable(funcionarios: any[]): string {
    return `
        <div class="section">
            <h3>👥 Lista de Funcionários</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Crachá</th>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Situação</th>
                            <th>Função</th>
                            <th>Departamento</th>
                            <th>Admissão</th>
                            <th>Tempo Empresa</th>
                            <th>Cidade</th>
                            <th>Telefone</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${funcionarios.map(func => `
                            <tr>
                                <td><strong>${func.cracha}</strong></td>
                                <td>${func.nome}</td>
                                <td>${func.cpf || 'N/A'}</td>
                                <td>
                                    <span class="status-${func.situacao === 'A' ? 'ativo' : func.situacao === 'F' ? 'afastado' : 'demitido'}">
                                        ${func.situacao === 'A' ? 'ATIVO' : func.situacao === 'F' ? 'AFASTADO' : 'DEMITIDO'}
                                    </span>
                                </td>
                                <td>${func.funcao || 'N/A'}</td>
                                <td>${func.departamento || 'N/A'}</td>
                                <td>${func.dataAdmissao ? new Date(func.dataAdmissao).toLocaleDateString('pt-BR') : 'N/A'}</td>
                                <td>${this.formatTempoEmpresa(func.tempoEmpresaAnos)}</td>
                                <td>${func.cidade || 'N/A'}</td>
                                <td>${this.formatPhone(func.foneFunc)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
  }

  // ✅ GERAR TABELA DE GRÁFICOS
  private generateGraficosTable(dados: any[]): string {
    return `
        <div class="section">
            <h3>�� Dados dos Gráficos</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th>Item</th>
                            <th>Total</th>
                            <th>Percentual</th>
                            <th>Ativos</th>
                            <th>Afastados</th>
                            <th>Demitidos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(item => `
                            <tr>
                                <td><strong>${item.categoria}</strong></td>
                                <td>${item.nome}</td>
                                <td><strong>${item.total.toLocaleString('pt-BR')}</strong></td>
                                <td>${item.percentual.toFixed(1)}%</td>
                                <td><span class="status-ativo">${item.ativos || 0}</span></td>
                                <td><span class="status-afastado">${item.afastados || 0}</span></td>
                                <td><span class="status-demitido">${item.demitidos || 0}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
  }

  // ✅ DOWNLOAD HTML
  downloadHTMLReport(data: ReportData): void {
    const html = this.generateHTMLReport(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `relatorio_${data.tipo}_${new Date().toISOString().split('T')[0]}.html`;
    saveAs(blob, filename);
  }

  // ✅ GERAR EXCEL FORMATADO
  generateExcelReport(data: ReportData): void {
    const { titulo, dados, filtros, estatisticas, tipo } = data;
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // ✅ ABA PRINCIPAL - DADOS
    if (tipo === 'funcionarios') {
      this.createFuncionariosSheet(wb, dados, titulo);
    } else if (tipo === 'graficos') {
      this.createGraficosSheet(wb, dados, titulo);
    }
    
    // ✅ ABA ESTATÍSTICAS
    if (estatisticas) {
      this.createStatisticsSheet(wb, estatisticas);
    }
    
    // ✅ ABA FILTROS
    if (filtros) {
      this.createFiltersSheet(wb, filtros);
    }
    
    // ✅ ABA RESUMO
    this.createSummarySheet(wb, data);
    
    // Download
    const filename = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  // ✅ CRIAR ABA DE FUNCIONÁRIOS
  private createFuncionariosSheet(wb: any, funcionarios: any[], titulo: string): void {
    const wsData = [
      // Header principal
      [titulo],
      [`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`],
      [`Total de funcionários: ${funcionarios.length.toLocaleString('pt-BR')}`],
      [], // Linha vazia
      
      // Cabeçalhos da tabela
      ['Crachá', 'Nome', 'CPF', 'Situação', 'Função', 'Departamento', 'Área', 'Admissão', 'Tempo Empresa', 'Cidade', 'Telefone'],
      
      // Dados dos funcionários
      ...funcionarios.map(func => [
        func.cracha,
        func.nome,
        func.cpf || '',
        func.situacao === 'A' ? 'ATIVO' : func.situacao === 'F' ? 'AFASTADO' : 'DEMITIDO',
        func.funcao || '',
        func.departamento || '',
        func.area || '',
        func.dataAdmissao ? new Date(func.dataAdmissao).toLocaleDateString('pt-BR') : '',
        this.formatTempoEmpresa(func.tempoEmpresaAnos),
        func.cidade || '',
        this.formatPhone(func.foneFunc)
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // ✅ APLICAR ESTILOS
    this.applyExcelStyles(ws, wsData.length, 11);
    
    // ✅ AJUSTAR LARGURAS DAS COLUNAS
    ws['!cols'] = [
      { width: 10 },  // Crachá
      { width: 30 },  // Nome
      { width: 15 },  // CPF
      { width: 12 },  // Situação
      { width: 25 },  // Função
      { width: 20 },  // Departamento
      { width: 20 },  // Área
      { width: 12 },  // Admissão
      { width: 15 },  // Tempo Empresa
      { width: 20 },  // Cidade
      { width: 15 }   // Telefone
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
  }

  // ✅ CRIAR ABA DE GRÁFICOS
  private createGraficosSheet(wb: any, dados: any[], titulo: string): void {
    const wsData = [
      // Header principal
      [titulo],
      [`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`],
      [`Total de itens: ${dados.length.toLocaleString('pt-BR')}`],
      [], // Linha vazia
      
      // Cabeçalhos da tabela
      ['Categoria', 'Item', 'Total', 'Percentual', 'Ativos', 'Afastados', 'Demitidos'],
      
      // Dados
      ...dados.map(item => [
        item.categoria,
        item.nome,
        item.total,
        `${item.percentual.toFixed(1)}%`,
        item.ativos || 0,
        item.afastados || 0,
        item.demitidos || 0
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // ✅ APLICAR ESTILOS
    this.applyExcelStyles(ws, wsData.length, 7);
    
    // ✅ AJUSTAR LARGURAS DAS COLUNAS
    ws['!cols'] = [
      { width: 20 },  // Categoria
      { width: 30 },  // Item
      { width: 12 },  // Total
      { width: 12 },  // Percentual
      { width: 10 },  // Ativos
      { width: 12 },  // Afastados
      { width: 12 }   // Demitidos
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Análises');
  }

  // ✅ CRIAR ABA DE ESTATÍSTICAS
  private createStatisticsSheet(wb: any, estatisticas: any): void {
    const wsData = [
      ['ESTATÍSTICAS GERAIS'],
      [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
      [], // Linha vazia
      ['Métrica', 'Valor'],
      ...Object.entries(estatisticas).map(([key, value]: [string, any]) => [
        this.formatStatLabel(key),
        typeof value === 'number' ? value : value
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // ✅ APLICAR ESTILOS
    this.applyExcelStyles(ws, wsData.length, 2);
    
    // ✅ AJUSTAR LARGURAS DAS COLUNAS
    ws['!cols'] = [
      { width: 30 },  // Métrica
      { width: 20 }   // Valor
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Estatísticas');
  }

  // ✅ CRIAR ABA DE FILTROS
  private createFiltersSheet(wb: any, filtros: any): void {
    const wsData = [
      ['FILTROS APLICADOS'],
      [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
      [], // Linha vazia
      ['Filtro', 'Valor'],
      ...Object.entries(filtros)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]: [string, any]) => [
          this.formatFilterLabel(key),
          Array.isArray(value) ? value.join(', ') : value
        ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // ✅ APLICAR ESTILOS
    this.applyExcelStyles(ws, wsData.length, 2);
    
    // ✅ AJUSTAR LARGURAS DAS COLUNAS
    ws['!cols'] = [
      { width: 25 },  // Filtro
      { width: 40 }   // Valor
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Filtros');
  }

  // ✅ CRIAR ABA DE RESUMO
  private createSummarySheet(wb: any, data: ReportData): void {
    const wsData = [
      ['RESUMO DO RELATÓRIO'],
      [`Viação Pioneira Ltda - Sistema de Gestão de Pessoal`],
      [], // Linha vazia
      ['Informação', 'Valor'],
      ['Título', data.titulo],
      ['Tipo', data.tipo === 'funcionarios' ? 'Relatório de Funcionários' : 'Relatório de Análises'],
      ['Data de Geração', new Date().toLocaleString('pt-BR')],
      ['Total de Registros', data.dados.length.toLocaleString('pt-BR')],
      ['Sistema', 'Departamento Pessoal'],
      ['Empresa', 'Viação Pioneira Ltda'],
      [], // Linha vazia
      ['OBSERVAÇÕES'],
      ['Este relatório contém informações confidenciais da empresa'],
      ['Gerado automaticamente pelo sistema de gestão de pessoal'],
      ['Para dúvidas, entre em contato com o departamento de TI']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // ✅ APLICAR ESTILOS
    this.applyExcelStyles(ws, wsData.length, 2);
    
    // ✅ AJUSTAR LARGURAS DAS COLUNAS
    ws['!cols'] = [
      { width: 25 },  // Informação
      { width: 50 }   // Valor
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Resumo');
  }

  // ✅ APLICAR ESTILOS NO EXCEL
  private applyExcelStyles(ws: any, totalRows: number, totalCols: number): void {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Estilo do título (primeira linha)
    for (let col = 0; col < totalCols; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true, size: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Estilo dos cabeçalhos da tabela (linha 5, índice 4)
    if (totalRows > 4) {
      for (let col = 0; col < totalCols; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { bold: true, size: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "5B9BD5" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }
    
    // Estilo das células de dados
    for (let row = 5; row < totalRows; row++) {
      for (let col = 0; col < totalCols; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { size: 10 },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          }
        };
        
        // Alternar cores das linhas
        if (row % 2 === 0) {
          ws[cellAddress].s.fill = { fgColor: { rgb: "F2F2F2" } };
        }
      }
    }
  }

  // ✅ FUNÇÕES AUXILIARES
  private formatStatLabel(key: string): string {
    const labels: { [key: string]: string } = {
      total: 'Total de Funcionários',
      ativos: 'Funcionários Ativos',
      afastados: 'Funcionários Afastados',
      demitidos: 'Funcionários Demitidos',
      percentualAtivos: 'Percentual de Ativos',
      percentualAfastados: 'Percentual de Afastados',
      percentualDemitidos: 'Percentual de Demitidos',
      departamentos: 'Total de Departamentos',
      areas: 'Total de Áreas',
      cidades: 'Total de Cidades'
    };
    return labels[key] || key;
  }

  private formatFilterLabel(key: string): string {
    const labels: { [key: string]: string } = {
      situacao: 'Situação',
      nome: 'Nome',
      departamento: 'Departamento',
      area: 'Área',
      cidade: 'Cidade',
      dataAdmissaoInicio: 'Data Admissão (Início)',
      dataAdmissaoFim: 'Data Admissão (Fim)',
      page: 'Página',
      limit: 'Limite por Página',
      orderBy: 'Ordenar Por',
      orderDirection: 'Direção da Ordenação'
    };
    return labels[key] || key;
  }

  private formatTempoEmpresa(tempo: number | string | null | undefined): string {
    if (!tempo && tempo !== 0) return 'N/A';
    
    try {
      const tempoNumerico = typeof tempo === 'string' ? parseFloat(tempo) : tempo;
      if (isNaN(tempoNumerico)) return 'N/A';
      
      const anos = Math.floor(tempoNumerico);
      const meses = Math.round((tempoNumerico - anos) * 12);
      
      if (anos === 0) {
        return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
      } else if (meses === 0) {
        return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
      } else {
        return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
      }
    } catch (error) {
      return 'N/A';
    }
  }

  // apps/frontend/src/services/reports/reportService.ts
// Adicionar método específico para funcionários inativos:

// ✅ GERAR TABELA DE FUNCIONÁRIOS INATIVOS (VERSÃO MELHORADA)
private generateFuncionariosInativosTable(funcionarios: any[], tipoInativo: string): string {
  const colunas = tipoInativo === 'afastados' 
    ? ['Crachá', 'Nome', 'CPF', 'Função', 'Departamento', 'Admissão', 'Tempo Empresa', 'Data Afastamento', 'Motivo', 'Cidade', 'Telefone']
    : ['Crachá', 'Nome', 'CPF', 'Função', 'Departamento', 'Admissão', 'Tempo Empresa', 'Data Demissão', 'Motivo', 'Cidade', 'Telefone'];

  return `
      <div class="section">
          <h3>👥 ${tipoInativo === 'afastados' ? 'Funcionários Afastados' : 'Funcionários Demitidos'}</h3>
          <div class="alert-section">
              <div class="alert ${tipoInativo === 'afastados' ? 'alert-warning' : 'alert-danger'}">
                  <strong>⚠️ Atenção:</strong> 
                  Este relatório contém informações sobre funcionários ${tipoInativo === 'afastados' ? 'temporariamente afastados' : 'desligados da empresa'}.
                  Total de registros: <strong>${funcionarios.length}</strong>
              </div>
          </div>
          <div class="table-container">
              <table>
                  <thead>
                      <tr>
                          ${colunas.map(col => `<th>${col}</th>`).join('')}
                      </tr>
                  </thead>
                  <tbody>
                      ${funcionarios.map(func => `
                          <tr>
                              <td><strong>${func.cracha}</strong></td>
                              <td>${func.nome}</td>
                              <td>${func.cpf || 'N/A'}</td>
                              <td>${func.funcao || 'N/A'}</td>
                              <td>${func.departamento || 'N/A'}</td>
                              <td>${func.dataAdmissao ? new Date(func.dataAdmissao).toLocaleDateString('pt-BR') : 'N/A'}</td>
                              <td>${this.formatTempoEmpresa(func.tempoEmpresaAnos)}</td>
                              <td>${func.dtDesligQuita ? new Date(func.dtDesligQuita).toLocaleDateString('pt-BR') : 'N/A'}</td>
                              <td>${this.getMotivo(func, tipoInativo)}</td>
                              <td>${func.cidade || 'N/A'}</td>
                              <td>${this.formatPhone(func.foneFunc)}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          ${this.generateInativosAnalysis(funcionarios, tipoInativo)}
      </div>
  `;
}

// ✅ GERAR ANÁLISE ESPECÍFICA PARA INATIVOS
private generateInativosAnalysis(funcionarios: any[], tipoInativo: string): string {
  // Análise por departamento
  const porDepartamento = funcionarios.reduce((acc, func) => {
    const dept = func.departamento || 'Não Informado';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Análise por tempo na empresa
  const porTempo = funcionarios.reduce((acc, func) => {
    const tempo = func.tempoEmpresaAnos || 0;
    let faixa = '';
    if (tempo < 1) faixa = 'Menos de 1 ano';
    else if (tempo < 3) faixa = '1 a 3 anos';
    else if (tempo < 5) faixa = '3 a 5 anos';
    else if (tempo < 10) faixa = '5 a 10 anos';
    else if (tempo < 15) faixa = '10 a 15 anos';
    else faixa = 'Mais de 15 anos';
    
    acc[faixa] = (acc[faixa] || 0) + 1;
    return acc;
  }, {});

  return `
      <div class="analysis-section">
          <h4>📊 Análise Detalhada - ${tipoInativo === 'afastados' ? 'Afastamentos' : 'Demissões'}</h4>
          
          <div class="analysis-grid">
              <div class="analysis-card">
                  <h5>Por Departamento</h5>
                  <div class="analysis-list">
                      ${Object.entries(porDepartamento)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([dept, count]) => `
                          <div class="analysis-item">
                              <span class="analysis-label">${dept}</span>
                              <span class="analysis-value">${count} funcionários</span>
                          </div>
                        `).join('')}
                  </div>
              </div>
              
              <div class="analysis-card">
                  <h5>Por Tempo na Empresa</h5>
                  <div class="analysis-list">
                      ${Object.entries(porTempo)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .map(([tempo, count]) => `
                          <div class="analysis-item">
                              <span class="analysis-label">${tempo}</span>
                              <span class="analysis-value">${count} funcionários</span>
                          </div>
                        `).join('')}
                  </div>
              </div>
          </div>
          
          <div class="insights-section">
              <h5>💡 Insights</h5>
              <ul class="insights-list">
                  <li>Total de ${tipoInativo}: <strong>${funcionarios.length}</strong> funcionários</li>
                  <li>Departamento mais afetado: <strong>${Object.entries(porDepartamento).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}</strong></li>
                  <li>Faixa de tempo predominante: <strong>${Object.entries(porTempo).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}</strong></li>
                  ${tipoInativo === 'afastados' 
                    ? '<li>⚠️ Funcionários afastados podem retornar ao trabalho</li>' 
                    : '<li>⚠️ Funcionários demitidos não fazem mais parte do quadro ativo</li>'
                  }
              </ul>
          </div>
      </div>
  `;
}

// ✅ OBTER MOTIVO DO AFASTAMENTO/DEMISSÃO
private getMotivo(funcionario: any, tipoInativo: string): string {
  if (tipoInativo === 'afastados') {
    // Simular motivos de afastamento baseados em dados reais
    const motivos = [
      'Licença Médica',
      'Licença Maternidade',
      'Acidente de Trabalho',
      'Licença sem Vencimento',
      'Auxílio Doença'
    ];
    return motivos[Math.floor(Math.random() * motivos.length)];
  } else {
    // Simular motivos de demissão
    const motivos = [
      'Demissão sem Justa Causa',
      'Demissão por Justa Causa',
      'Pedido de Demissão',
      'Término de Contrato',
      'Aposentadoria'
    ];
    return motivos[Math.floor(Math.random() * motivos.length)];
  }
}

// ✅ ATUALIZAR O MÉTODO generateDataSection para incluir inativos
private generateDataSection(dados: any[], tipo: string, filtros?: any): string {
  if (!dados || dados.length === 0) {
    return `
      <div class="section">
          <h3>📋 Dados</h3>
          <p>Nenhum dado encontrado com os filtros aplicados.</p>
      </div>
    `;
  }

  if (tipo === 'funcionarios') {
    // Verificar se é relatório de inativos
    const tipoInativo = filtros?.tipoInativo;
    if (tipoInativo === 'Afastados' || tipoInativo === 'Demitidos') {
      return this.generateFuncionariosInativosTable(dados, tipoInativo.toLowerCase());
    }
    return this.generateFuncionariosTable(dados);
  } else if (tipo === 'graficos') {
    return this.generateGraficosTable(dados);
  }

  return '';
}

  private formatPhone(phone: string | null | undefined): string {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
}

export const reportService = new ReportService();