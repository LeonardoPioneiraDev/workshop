// src/pages/departments/juridico/components/filters/MultasTransitoFilters.tsx
import React, { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MultasTransitoFiltersProps {
  onFilterChange: (filters: any) => void;
  loading?: boolean;
}

export const MultasTransitoFilters: React.FC<MultasTransitoFiltersProps> = ({ 
  onFilterChange, 
  loading = false 
}) => {
  const [filters, setFilters] = useState({
    numeroMulta: '',
    prefixoVeiculo: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    localMulta: '',
    codigoInfra: '',
    grupoInfracao: '',
    responsavelMulta: '',
    status: ''
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

  const clearFilters = () => {
    const emptyFilters = {
      numeroMulta: '',
      prefixoVeiculo: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      localMulta: '',
      codigoInfra: '',
      grupoInfracao: '',
      responsavelMulta: '',
      status: ''
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          Filtros de Multas de Trânsito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div>
            <label className="text-sm font-medium mb-2 block">Número da Multa</label>
            <Input
              placeholder="Ex: FT01140764"
              value={filters.numeroMulta}
              onChange={(e) => handleFilterChange('numeroMulta', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Prefixo do Veículo</label>
            <Input
              placeholder="Ex: 0227757"
              value={filters.prefixoVeiculo}
              onChange={(e) => handleFilterChange('prefixoVeiculo', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Data Início</label>
            <Input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Data Fim</label>
            <Input
              type="date"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Valor Mínimo (R\$)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filters.valorMin}
              onChange={(e) => handleFilterChange('valorMin', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Valor Máximo (R\$)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="999.99"
              value={filters.valorMax}
              onChange={(e) => handleFilterChange('valorMax', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Local da Multa</label>
            <Input
              placeholder="Ex: W3 SUL"
              value={filters.localMulta}
              onChange={(e) => handleFilterChange('localMulta', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Código da Infração</label>
            <Input
              placeholder="Ex: 6050"
              value={filters.codigoInfra}
              onChange={(e) => handleFilterChange('codigoInfra', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Grupo da Infração</label>
            <Select value={filters.grupoInfracao} onValueChange={(value) => handleFilterChange('grupoInfracao', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="LEVE">Leve</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="GRAVE">Grave</SelectItem>
                <SelectItem value="GRAVISSIMA">Gravíssima</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Responsável</label>
            <Select value={filters.responsavelMulta} onValueChange={(value) => handleFilterChange('responsavelMulta', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="F">Frota</SelectItem>
                <SelectItem value="C">Condutor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="recurso">Em Recurso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Ações</label>
            <div className="flex gap-2">
              <Button 
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};