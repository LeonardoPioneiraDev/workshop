// src/components/operacoes/acidentes/AcidentesFilters.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, RotateCcw, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FiltrosAcidentes, GrauAcidente, StatusProcesso } from '@/types/departments/operacoes';

interface AcidentesFiltersProps {
  filtros: FiltrosAcidentes;
  valoresFiltros?: {
    garagens: string[];
    municipios: string[];
    bairros: string[];
    turnos: string[];
    grausAcidente: string[];
    statusProcesso: string[];
  };
  onFiltrosChange: (filtros: FiltrosAcidentes) => void;
  onLimpar: () => void;
  onAplicar: () => void;
  loading?: boolean;
  className?: string;
}

export function AcidentesFilters({
  filtros,
  valoresFiltros,
  onFiltrosChange,
  onLimpar,
  onAplicar,
  loading = false,
  className = ""
}: AcidentesFiltersProps) {
  const handleChange = (campo: keyof FiltrosAcidentes, valor: any) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const filtrosAtivos = Object.entries(filtros).filter(([key, value]) => 
    value !== undefined && value !== null && value !== '' && 
    key !== 'page' && key !== 'limit' && value !== 'TODOS'
  ).length;

  const grauAcidenteOptions = [
    { value: 'TODOS', label: 'Todos os Graus' },
    { value: 'COM_VITIMAS', label: 'Com Vítimas' },
    { value: 'SEM_VITIMAS', label: 'Sem Vítimas' }
  ];

  const statusProcessoOptions = [
    { value: 'TODOS', label: 'Todos os Status' },
    { value: 'ABERTO', label: 'Aberto' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
    { value: 'FECHADO', label: 'Fechado' }
  ];

  const turnoOptions = [
    { value: '', label: 'Todos os Turnos' },
    { value: 'MANHA', label: 'Manhã' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOITE', label: 'Noite' },
    { value: 'MADRUGADA', label: 'Madrugada' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Acidentes</span>
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
        {/* Primeira linha - Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.dataInicio ? 
                    format(new Date(filtros.dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : 
                    'Selecione a data'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filtros.dataInicio ? new Date(filtros.dataInicio) : undefined}
                  onSelect={(date) => handleChange('dataInicio', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.dataFim ? 
                    format(new Date(filtros.dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 
                    'Selecione a data'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filtros.dataFim ? new Date(filtros.dataFim) : undefined}
                  onSelect={(date) => handleChange('dataFim', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grauAcidente">Grau do Acidente</Label>
            <Select 
              value={filtros.grauAcidente || 'TODOS'} 
              onValueChange={(value) => handleChange('grauAcidente', value as GrauAcidente)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grau" />
              </SelectTrigger>
              <SelectContent>
                {grauAcidenteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusProcesso">Status do Processo</Label>
            <Select 
              value={filtros.statusProcesso || 'TODOS'} 
              onValueChange={(value) => handleChange('statusProcesso', value as StatusProcesso)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusProcessoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segunda linha - Localização */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <SelectItem value="">Todas as Garagens</SelectItem>
                {valoresFiltros?.garagens.map((garagem) => (
                  <SelectItem key={garagem} value={garagem}>
                    {garagem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="municipio">Município</Label>
            <Select 
              value={filtros.municipio || ''} 
              onValueChange={(value) => handleChange('municipio', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o município" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Municípios</SelectItem>
                {valoresFiltros?.municipios.map((municipio) => (
                  <SelectItem key={municipio} value={municipio}>
                    {municipio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Select 
              value={filtros.bairro || ''} 
              onValueChange={(value) => handleChange('bairro', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Bairros</SelectItem>
                {valoresFiltros?.bairros.map((bairro) => (
                  <SelectItem key={bairro} value={bairro}>
                    {bairro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno">Turno</Label>
            <Select 
              value={filtros.turno || ''} 
              onValueChange={(value) => handleChange('turno', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                {turnoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Terceira linha - Veículo e valores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prefixoVeiculo">Prefixo do Veículo</Label>
            <Input
              id="prefixoVeiculo"
              placeholder="Ex: 1234"
              value={filtros.prefixoVeiculo || ''}
              onChange={(e) => handleChange('prefixoVeiculo', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              type="number"
              placeholder="Ex: 2024"
              value={filtros.ano || ''}
              onChange={(e) => handleChange('ano', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mes">Mês</Label>
            <Input
              id="mes"
              type="number"
              min="1"
              max="12"
              placeholder="Ex: 1"
              value={filtros.mes || ''}
              onChange={(e) => handleChange('mes', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMinimoAcidente">Valor Mínimo (R$)</Label>
            <Input
              id="valorMinimoAcidente"
              type="number"
              placeholder="Ex: 1000"
              value={filtros.valorMinimoAcidente || ''}
              onChange={(e) => handleChange('valorMinimoAcidente', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Filtros ativos */}
        {filtrosAtivos > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Filtros ativos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filtros).map(([key, value]) => {
                if (!value || value === '' || value === 'TODOS' || key === 'page' || key === 'limit') return null;
                
                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    <span className="text-xs">
                      {key === 'dataInicio' && `De: ${format(new Date(value as string), 'dd/MM/yyyy')}`}
                      {key === 'dataFim' && `Até: ${format(new Date(value as string), 'dd/MM/yyyy')}`}
                      {key === 'grauAcidente' && `Grau: ${value}`}
                      {key === 'statusProcesso' && `Status: ${value}`}
                      {key === 'garagem' && `Garagem: ${value}`}
                      {key === 'municipio' && `Município: ${value}`}
                      {key === 'bairro' && `Bairro: ${value}`}
                      {key === 'turno' && `Turno: ${value}`}
                      {key === 'prefixoVeiculo' && `Veículo: ${value}`}
                      {key === 'ano' && `Ano: ${value}`}
                      {key === 'mes' && `Mês: ${value}`}
                      {key === 'valorMinimoAcidente' && `Min: R$ ${value}`}
                    </span>
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleChange(key as keyof FiltrosAcidentes, undefined)}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

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