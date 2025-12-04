// src/pages/departments/juridico/components/filters/MultasSemobFilters.tsx
import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Filter, Search, X, RefreshCw } from 'lucide-react';
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

interface Agente {
  codigo: string;
  descricao: string;
}

interface MultasSemobFiltersProps {
  onFilterChange: (filters: any) => void;
  loading?: boolean;
}

export const MultasSemobFilters: React.FC<MultasSemobFiltersProps> = ({ 
  onFilterChange, 
  loading = false 
}) => {
  const [filters, setFilters] = useState({
    numeroMulta: '',
    prefixoVeiculo: '',
    agenteCodigo: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    localMulta: '',
    grupoInfracao: '',
    status: ''
  });

  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loadingAgentes, setLoadingAgentes] = useState(false);

  // Buscar lista de agentes SEMOB
  useEffect(() => {
    const fetchAgentes = async () => {
      setLoadingAgentes(true);
      try {
        const data = await api.get<any>('/juridico/multas-enhanced/agrupamentos/agente');
        
        if (data.success) {
          setAgentes(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar agentes:', error);
      } finally {
        setLoadingAgentes(false);
      }
    };

    fetchAgentes();
  }, []);

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
      agenteCodigo: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      localMulta: '',
      grupoInfracao: '',
      status: ''
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-orange-500" />
          Filtros de Multas SEMOB
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div>
            <label className="text-sm font-medium mb-2 block">Número da Multa</label>
            <Input
              placeholder="Ex: SM01140764"
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
            <label className="text-sm font-medium mb-2 block">Agente SEMOB</label>
            <Select value={filters.agenteCodigo} onValueChange={(value) => handleFilterChange('agenteCodigo', value)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingAgentes ? "Carregando..." : "Selecione o agente"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Agentes</SelectItem>
                {agentes.map((agente) => (
                  <SelectItem key={agente.codigo} value={agente.codigo}>
                    {agente.codigo} - {agente.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingAgentes && (
              <div className="flex items-center gap-1 mt-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs text-gray-500">Carregando agentes...</span>
              </div>
            )}
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
              placeholder="Ex: SETOR COMERCIAL"
              value={filters.localMulta}
              onChange={(e) => handleFilterChange('localMulta', e.target.value)}
            />
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
