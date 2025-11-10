// src/components/operacoes/frota/FrotaFilters.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, RotateCcw, Search } from 'lucide-react';
import type { FiltrosFrota, StatusVeiculo } from '@/types/departments/operacoes';

interface FrotaFiltersProps {
  filtros: FiltrosFrota;
  onFiltrosChange: (filtros: FiltrosFrota) => void;
  onLimpar: () => void;
  onAplicar: () => void;
  loading?: boolean;
  className?: string;
}

export function FrotaFilters({
  filtros,
  onFiltrosChange,
  onLimpar,
  onAplicar,
  loading = false,
  className = ""
}: FrotaFiltersProps) {
  const handleChange = (campo: keyof FiltrosFrota, valor: any) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const filtrosAtivos = Object.entries(filtros).filter(([key, value]) => 
    value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit'
  ).length;

  const statusOptions = [
    { value: 'TODOS', label: 'Todos os Status' },
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'MANUTENCAO', label: 'Manutenção' },
    { value: 'RESERVA', label: 'Reserva' }
  ];

  const tipoVeiculoOptions = [
    { value: '', label: 'Todos os Tipos' },
    { value: 'ONIBUS', label: 'Ônibus' },
    { value: 'MICROONIBUS', label: 'Microônibus' },
    { value: 'VAN', label: 'Van' },
    { value: 'UTILITARIO', label: 'Utilitário' },
    { value: 'ADMINISTRATIVO', label: 'Administrativo' }
  ];

  const combustivelOptions = [
    { value: '', label: 'Todos os Combustíveis' },
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'GASOLINA', label: 'Gasolina' },
    { value: 'ETANOL', label: 'Etanol' },
    { value: 'GNV', label: 'GNV' },
    { value: 'ELETRICO', label: 'Elétrico' },
    { value: 'HIBRIDO', label: 'Híbrido' }
  ];

  const garagemOptions = [
    { value: '', label: 'Todas as Garagens' },
    { value: 'VIAÇÃO PIONEIRA', label: 'Viação Pioneira' },
    { value: 'PARANOÁ', label: 'Paranoá' },
    { value: 'SANTA M.', label: 'Santa Maria' },
    { value: 'SÃO SEBAS.', label: 'São Sebastião' },
    { value: 'GAMA', label: 'Gama' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Filtros da Frota</span>
            {filtrosAtivos > 0 && (
              <Badge variant="secondary">
                {filtrosAtivos} ativo{filtrosAtivos !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLimpar}
            disabled={loading || filtrosAtivos === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primeira linha - Filtros principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filtros.status || 'TODOS'} 
              onValueChange={(value) => handleChange('status', value as StatusVeiculo)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="garagem">Garagem</Label>
            <Select 
              value={filtros.garagem || ''} 
              onValueChange={(value) => handleChange('garagem', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a garagem" />
              </SelectTrigger>
              <SelectContent>
                {garagemOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoVeiculo">Tipo de Veículo</Label>
            <Select 
              value={filtros.tipoVeiculo || ''} 
              onValueChange={(value) => handleChange('tipoVeiculo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoVeiculoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="combustivel">Combustível</Label>
            <Select 
              value={filtros.combustivel || ''} 
              onValueChange={(value) => handleChange('combustivel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o combustível" />
              </SelectTrigger>
              <SelectContent>
                {combustivelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segunda linha - Filtros de busca */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prefixo">Prefixo</Label>
            <Input
              id="prefixo"
              placeholder="Ex: 1234"
              value={filtros.prefixo || ''}
              onChange={(e) => handleChange('prefixo', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              placeholder="Ex: ABC-1234"
              value={filtros.placa || ''}
              onChange={(e) => handleChange('placa', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              placeholder="Ex: Mercedes"
              value={filtros.marca || ''}
              onChange={(e) => handleChange('marca', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              placeholder="Ex: OF-1721"
              value={filtros.modelo || ''}
              onChange={(e) => handleChange('modelo', e.target.value)}
            />
          </div>
        </div>

        {/* Terceira linha - Filtros numéricos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="anoInicio">Ano (De)</Label>
            <Input
              id="anoInicio"
              type="number"
              placeholder="Ex: 2010"
              value={filtros.anoInicio || ''}
              onChange={(e) => handleChange('anoInicio', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anoFim">Ano (Até)</Label>
            <Input
              id="anoFim"
              type="number"
              placeholder="Ex: 2024"
              value={filtros.anoFim || ''}
              onChange={(e) => handleChange('anoFim', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quilometragemMinima">KM Mínima</Label>
            <Input
              id="quilometragemMinima"
              type="number"
              placeholder="Ex: 50000"
              value={filtros.quilometragemMinima || ''}
              onChange={(e) => handleChange('quilometragemMinima', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quilometragemMaxima">KM Máxima</Label>
            <Input
              id="quilometragemMaxima"
              type="number"
              placeholder="Ex: 500000"
              value={filtros.quilometragemMaxima || ''}
              onChange={(e) => handleChange('quilometragemMaxima', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={onAplicar} 
            disabled={loading}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Aplicando...' : 'Aplicar Filtros'}
          </Button>
          
          {filtrosAtivos > 0 && (
            <Button
              variant="outline"
              onClick={onLimpar}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}