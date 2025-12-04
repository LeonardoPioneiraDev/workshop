// apps/frontend/src/hooks/useChartExport.ts - VERSÃO CORRIGIDA FINAL
import { useCallback, useRef } from 'react';

interface ExportOptions {
  filename?: string;
  format?: 'png' | 'pdf' | 'html' | 'excel';
  quality?: number;
  includeData?: boolean;
  chartTitle?: string;
  chartDescription?: string;
}

interface ChartData {
  title: string;
  data: any[];
  type: 'bar' | 'pie' | 'line' | 'area';
  metadata?: {
    totalRecords: number;
    dateRange?: string;
    filters?: string[];
  };
}

export const useChartExport = () => {
  const exportRef = useRef<HTMLDivElement>(null);

  // 🖼️ EXPORTAR COMO PNG
  const exportToPNG = useCallback(async (options: ExportOptions = {}) => {
    if (!exportRef.current) return;

    try {
      // Importação dinâmica com fallback
      const html2canvas = await import('html2canvas').then(m => m.default).catch(() => {
        throw new Error('Biblioteca html2canvas não encontrada. Execute: npm install html2canvas');
      });
      
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0f172a',
        scale: options.quality || 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true
      });

      const link = document.createElement('a');
      link.download = `${options.filename || 'grafico'}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      throw new Error('Falha ao gerar imagem PNG');
    }
  }, []);

  // 📄 EXPORTAR COMO PDF
  const exportToPDF = useCallback(async (options: ExportOptions = {}) => {
    if (!exportRef.current) return;

    try {
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas').then(m => m.default).catch(() => {
          throw new Error('Biblioteca html2canvas não encontrada');
        }),
        import('jspdf').then(m => m.default).catch(() => {
          throw new Error('Biblioteca jspdf não encontrada. Execute: npm install jspdf');
        })
      ]);

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFontSize(16);
      pdf.setTextColor(40);
      pdf.text(options.chartTitle || 'Relatório de Gráfico', pdfWidth / 2, 20, { align: 'center' });

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        pdfWidth / 2,
        pdfHeight - 10,
        { align: 'center' }
      );

      pdf.save(`${options.filename || 'grafico'}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error('Falha ao gerar PDF');
    }
  }, []);

  // 🌐 EXPORTAR COMO HTML
  const exportToHTML = useCallback((chartData: ChartData, options: ExportOptions = {}) => {
    const htmlContent = generateHTMLReport(chartData, options);
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${options.filename || 'relatorio'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, []);

  // 📊 EXPORTAR DADOS COMO CSV
  const exportToExcel = useCallback((chartData: ChartData, options: ExportOptions = {}) => {
    const csvContent = generateCSVData(chartData);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${options.filename || 'dados'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, []);

  // 👁️ VISUALIZAR EM NOVA ABA
  const previewHTML = useCallback((chartData: ChartData, options: ExportOptions = {}) => {
    const htmlContent = generateHTMLReport(chartData, options);
    const newWindow = window.open('', '_blank');
    
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  }, []);

  return {
    exportRef,
    exportToPNG,
    exportToPDF,
    exportToHTML,
    exportToExcel,
    previewHTML
  };
};

// 🎨 GERAR HTML COMPLETO
const generateHTMLReport = (chartData: ChartData, options: ExportOptions) => {
  const { title, data, type, metadata } = chartData;
  
  // 📝 FUNÇÃO CSV CORRIGIDA - Escape adequado
  const csvDataForScript = generateCSVData(chartData)
   
    .replace(/`/g, '\`')    // Escapar template literals
    .replace(/\$/g, '\$')   // Escapar cifrões
    .replace(/"/g, '"');   // Escapar aspas duplas
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Relatório</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(30, 41, 59, 0.8);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid rgba(148, 163, 184, 0.2);
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #60a5fa, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #94a3b8;
            font-size: 1.1rem;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .metadata-card {
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(148, 163, 184, 0.1);
            transition: transform 0.3s ease;
        }
        
        .metadata-card:hover {
            transform: translateY(-2px);
        }
        
        .metadata-card h3 {
            color: #60a5fa;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metadata-card p {
            color: #f1f5f9;
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .data-table th {
            background: linear-gradient(135deg, #1e40af, #059669);
            color: white;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 0.95rem;
            letter-spacing: 0.5px;
        }
        
        .data-table td {
            padding: 14px 16px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            color: #e2e8f0;
        }
        
        .data-table tr:hover {
            background: rgba(59, 130, 246, 0.1);
        }
        
        .data-table tr:nth-child(even) {
            background: rgba(15, 23, 42, 0.3);
        }
        
        .chart-placeholder {
            background: rgba(15, 23, 42, 0.6);
            border: 2px dashed rgba(148, 163, 184, 0.3);
            border-radius: 12px;
            padding: 60px 20px;
            text-align: center;
            margin: 30px 0;
            color: #94a3b8;
        }
        
        .chart-placeholder h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #60a5fa;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(148, 163, 184, 0.2);
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .download-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .success-message {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            display: none;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .metadata {
                grid-template-columns: 1fr;
            }
            
            .data-table {
                font-size: 0.85rem;
            }
            
            .data-table th,
            .data-table td {
                padding: 10px 8px;
            }
        }
        
        @media print {
            body {
                background: white;
                color: black;
            }
            
            .container {
                background: white;
                box-shadow: none;
                border: 1px solid #ccc;
            }
            
            .download-buttons {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>${options.chartDescription || 'Relatório gerado automaticamente'}</p>
        </div>
        
        <div class="metadata">
            <div class="metadata-card">
                <h3>Total de Registros</h3>
                <p>${metadata?.totalRecords || data.length}</p>
            </div>
            <div class="metadata-card">
                <h3>Tipo de Gráfico</h3>
                <p>${getChartTypeName(type)}</p>
            </div>
            <div class="metadata-card">
                <h3>Data de Geração</h3>
                <p>${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="metadata-card">
                <h3>Horário</h3>
                <p>${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
        </div>
        
        <div class="chart-placeholder">
            <h3>📊 Visualização do Gráfico</h3>
            <p>O gráfico interativo seria exibido aqui na versão web</p>
            <p>Tipo: ${getChartTypeName(type)} | Dados: ${data.length} itens</p>
        </div>
        
        <div class="download-buttons">
            <button class="btn btn-primary" onclick="window.print()">
                🖨️ Imprimir Relatório
            </button>
            <button class="btn btn-secondary" onclick="downloadCSV()">
                📊 Baixar Dados (CSV)
            </button>
            <button class="btn btn-primary" onclick="copyToClipboard()">
                📋 Copiar Dados
            </button>
        </div>
        
        <div id="success-message" class="success-message">
            ✅ Operação realizada com sucesso!
        </div>
        
        ${generateDataTable(data, type)}
        
        <div class="footer">
            <p>Relatório gerado pelo Sistema de Gestão Jurídica</p>
            <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
    </div>
    
    <script>
        // 📊 FUNÇÃO CSV CORRIGIDA
        function downloadCSV() {
            try {
                const csvContent = "${csvDataForScript}";
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = '${options.filename || 'dados'}.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                showSuccessMessage('Arquivo CSV baixado com sucesso!');
            } catch (error) {
                console.error('Erro ao baixar CSV:', error);
                alert('Erro ao baixar arquivo CSV. Tente novamente.');
            }
        }
        
        // 📋 COPIAR PARA CLIPBOARD
        function copyToClipboard() {
            try {
                const table = document.querySelector('.data-table');
                if (table) {
                    const range = document.createRange();
                    range.selectNode(table);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    
                    const successful = document.execCommand('copy');
                    window.getSelection().removeAllRanges();
                    
                    if (successful) {
                        showSuccessMessage('Dados copiados para a área de transferência!');
                    } else {
                        throw new Error('Comando de cópia falhou');
                    }
                } else {
                    throw new Error('Tabela não encontrada');
                }
            } catch (error) {
                console.error('Erro ao copiar:', error);
                alert('Erro ao copiar dados. Tente selecionar manualmente.');
            }
        }
        
        // 💬 MOSTRAR MENSAGEM DE SUCESSO
        function showSuccessMessage(message) {
            const messageEl = document.getElementById('success-message');
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.style.display = 'block';
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 3000);
            }
        }
        
        // 🎨 ANIMAÇÕES DE ENTRADA
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.metadata-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            
            // Animar entrada da tabela
            const table = document.querySelector('.data-table');
            if (table) {
                table.style.opacity = '0';
                table.style.transform = 'translateY(30px)';
                table.style.transition = 'all 0.8s ease';
                
                setTimeout(() => {
                    table.style.opacity = '1';
                    table.style.transform = 'translateY(0)';
                }, 500);
            }
        });
        
        // 🔧 FUNCIONALIDADES EXTRAS
        document.addEventListener('keydown', function(event) {
            // Ctrl+P para imprimir
            if (event.ctrlKey && event.key === 'p') {
                event.preventDefault();
                window.print();
            }
            
            // Ctrl+S para baixar CSV
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                downloadCSV();
            }
            
            // Ctrl+C quando tabela selecionada
            if (event.ctrlKey && event.key === 'c') {
                const selection = window.getSelection();
                if (selection && selection.toString().length > 0) {
                    showSuccessMessage('Seleção copiada!');
                }
            }
        });
    </script>
</body>
</html>`;
};

// 📊 GERAR TABELA DE DADOS
const generateDataTable = (data: any[], type: string) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  
  return `
    <table class="data-table">
        <thead>
            <tr>
                ${headers.map(header => `<th>${formatHeader(header)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map((row, index) => `
                <tr>
                    ${headers.map(header => `<td>${formatCellValue(row[header], header)}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
  `;
};

// 📝 GERAR CSV - FUNÇÃO CORRIGIDA
const generateCSVData = (chartData: ChartData) => {
  const { data } = chartData;
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Tratar valores que contêm vírgulas, quebras de linha ou aspas
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// 🎯 HELPERS
const getChartTypeName = (type: string) => {
  const types: Record<string, string> = {
    'bar': 'Gráfico de Barras',
    'pie': 'Gráfico de Pizza',
    'line': 'Gráfico de Linha',
    'area': 'Gráfico de Área'
  };
  return types[type] || 'Gráfico';
};

const formatHeader = (header: string) => {
  return header
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const formatCellValue = (value: any, header: string) => {
  if (value === null || value === undefined) return '-';
  
  if (typeof value === 'number') {
    if (header.toLowerCase().includes('valor') || header.toLowerCase().includes('price')) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return value.toLocaleString('pt-BR');
  }
  
  return String(value);
};