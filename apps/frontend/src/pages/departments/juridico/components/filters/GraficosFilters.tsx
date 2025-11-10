// src/pages/departments/juridico/components/filters/GraficosFilters.tsx
import React, { useState } from 'react';
import { Filter, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GraficosFiltersProps {
  onFilterChange: (filters: any) => void;
  loading?: boolean;
}

export const GraficosFilters: React.FC<GraficosFiltersProps> = ({ 
  onFilterChange, 
  loading = false 
}) => {
  const [filters, setFilters] = useState({
    periodo: '30dias',
    tipoMulta: 'todos',
    agrupamento: 'dia',
    setor: '',
    agente: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-purple-500" />
          Filtros dos Gráficos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Período
            </label>
            <Select value={filters.periodo} onValueChange={(value) => handleFilterChange('periodo', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="15dias">Últimos 15 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                <SelectItem value="1ano">Último ano</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Tipo de Multa
            </label>
            <Select value={filters.tipoMulta} onValueChange={(value) => handleFilterChange('tipoMulta', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="transito">Apenas Trânsito</SelectItem>
                <SelectItem value="semob">Apenas SEMOB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Agrupamento</label>
            <Select value={filters.agrupamento} onValueChange={(value) => handleFilterChange('agrupamento', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hora">Por Hora</SelectItem>
                <SelectItem value="dia">Por Dia</SelectItem>
                <SelectItem value="semana">Por Semana</SelectItem>
                <SelectItem value="mes">Por Mês</SelectItem>
                <SelectItem value="trimestre">Por Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Setor</label>
            <Select value={filters.setor} onValueChange={(value) => handleFilterChange('setor', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Setores</SelectItem>
                <SelectItem value="PARANOÁ">PARANOÁ</SelectItem>
                <SelectItem value="PLANO PILOTO">PLANO PILOTO</SelectItem>
                <SelectItem value="TAGUATINGA">TAGUATINGA</SelectItem>
                <SelectItem value="CEILÂNDIA">CEILÂNDIA</SelectItem>
                <SelectItem value="SOBRADINHO">SOBRADINHO</SelectItem>
                <SelectItem value="GAMA">GAMA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Visualização</label>
            <Select value={filters.agente} onValueChange={(value) => handleFilterChange('agente', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Visualização Padrão</SelectItem>
                <SelectItem value="detalhada">Visualização Detalhada</SelectItem>
                <SelectItem value="resumida">Visualização Resumida</SelectItem>
                <SelectItem value="comparativa">Visualização Comparativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};