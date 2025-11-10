// src/pages/departments/juridico/components/filters/RelatoriosFilters.tsx
import React, { useState } from 'react';
import { Filter, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RelatoriosFiltersProps {
  onFilterChange: (filters: any) => void;
}

export const RelatoriosFilters: React.FC<RelatoriosFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    busca: '',
    tipo: '',
    status: '',
    formato: '',
    agendamento: '',
    criadoPor: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Remover campos vazios antes de enviar
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v !== '')
    );
    
    onFilterChange(cleanFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          Filtros de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <Input
              placeholder="Nome do relatório..."
              value={filters.busca}
              onChange={(e) => handleFilterChange('busca', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Tipo
            </label>
            <Select value={filters.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Tipos</SelectItem>
                <SelectItem value="multas_geral">Relatório Geral</SelectItem>
                <SelectItem value="multas_transito">Multas Trânsito</SelectItem>
                <SelectItem value="multas_semob">Multas SEMOB</SelectItem>
                <SelectItem value="agentes_ranking">Ranking Agentes</SelectItem>
                <SelectItem value="setores_analise">Análise Setores</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="estatistico">Estatístico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Formato</label>
            <Select value={filters.formato} onValueChange={(value) => handleFilterChange('formato', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os formatos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Formatos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Agendamento</label>
            <Select value={filters.agendamento} onValueChange={(value) => handleFilterChange('agendamento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Criado Por</label>
            <Input
              placeholder="Nome do usuário..."
              value={filters.criadoPor}
              onChange={(e) => handleFilterChange('criadoPor', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};