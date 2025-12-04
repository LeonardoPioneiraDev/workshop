// src/components/operacoes/shared/OperacoesExportButton.tsx
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image,
  Printer,
  ChevronDown
} from 'lucide-react';

interface OperacoesExportButtonProps {
  data: any;
  filename?: string;
  title?: string;
  onExport?: (type: 'pdf' | 'excel' | 'csv' | 'png') => void;
}

export function OperacoesExportButton({ 
  data, 
  filename = 'operacoes-export', 
  title = 'Dados de Operações',
  onExport 
}: OperacoesExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'pdf' | 'excel' | 'csv' | 'png') => {
    setExporting(true);
    
    try {
      if (onExport) {
        await onExport(type);
      } else {
        // Implementação padrão de exportação
        await defaultExport(type);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      setExporting(false);
    }
  };

  const defaultExport = async (type: string) => {
    switch (type) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'png':
        exportToPNG();
        break;
      default:
        console.log('Tipo de exportação não implementado:', type);
    }
  };

  const exportToCSV = () => {
    if (!Array.isArray(data)) return;
    
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    // Implementação básica - pode ser melhorada com bibliotecas como xlsx
    console.log('Exportação para Excel em desenvolvimento');
  };

  const exportToPDF = () => {
    // Implementação básica - pode ser melhorada com bibliotecas como jsPDF
    window.print();
  };

  const exportToPNG = () => {
    // Implementação básica - pode ser melhorada com html2canvas
    console.log('Exportação para PNG em desenvolvimento');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar'}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <Image className="h-4 w-4 mr-2" />
          Exportar Imagem
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}