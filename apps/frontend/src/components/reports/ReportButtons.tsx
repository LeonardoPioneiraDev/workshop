// apps/frontend/src/components/reports/ReportButtons.tsx
import React from 'react';
import { Button } from '../ui/button';
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Loader2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { useReports } from '../../hooks/useReports';

interface ReportButtonsProps {
  funcionarios?: any[];
  dadosGraficos?: any[];
  filtros?: any;
  estatisticas?: any;
  tipo: 'funcionarios' | 'graficos';
  className?: string;
}

export const ReportButtons: React.FC<ReportButtonsProps> = ({
  funcionarios = [],
  dadosGraficos = [],
  filtros = {},
  estatisticas = {},
  tipo,
  className = ''
}) => {
  const { isGenerating, generateFuncionariosReport, generateGraficosReport } = useReports();

  const handleGenerateReport = async (format: 'html' | 'excel' | 'both') => {
    if (tipo === 'funcionarios') {
      await generateFuncionariosReport(funcionarios, filtros, format);
    } else {
      await generateGraficosReport(dadosGraficos, estatisticas, format);
    }
  };

  const getTotalRecords = () => {
    return tipo === 'funcionarios' ? funcionarios.length : dadosGraficos.length;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isGenerating || getTotalRecords() === 0}
          className={className}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'Gerando...' : 'Relatórios'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-b">
          <div className="font-medium">Gerar Relatório</div>
          <div className="text-xs">{getTotalRecords()} registros</div>
        </div>
        
        <DropdownMenuItem
          onClick={() => handleGenerateReport('html')}
          disabled={isGenerating}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2 text-blue-500" />
          <div>
            <div className="font-medium">Relatório HTML</div>
            <div className="text-xs text-gray-500">Visualização web completa</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleGenerateReport('excel')}
          disabled={isGenerating}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
          <div>
            <div className="font-medium">Planilha Excel</div>
            <div className="text-xs text-gray-500">Dados formatados e estilizados</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleGenerateReport('both')}
          disabled={isGenerating}
          className="cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2 text-purple-500" />
          <div>
            <div className="font-medium">Ambos os Formatos</div>
            <div className="text-xs text-gray-500">HTML + Excel</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};