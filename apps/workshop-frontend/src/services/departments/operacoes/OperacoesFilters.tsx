// src/components/operacoes/OperacoesFilters.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Filter, Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OperacoesFiltrosProps {
  filtros: any;
  onFiltroChange: (campo: string, valor: any) => void;
  onLimpar: () => void;
  onAplicar: () => void;
  valoresFiltros?: any;
  tipo: 'frota' | 'acidentes';
}

export function OperacoesFilters({
  filtros,
  onFiltroChange,
  onLimpar,
  onAplicar,
  valoresFiltros,
  tipo
}: OperacoesFiltrosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros - {tipo === 'frota' ? 'Frota' : 'Acidentes'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tipo === 'frota' ? (
            <>
              {/* Filtros específicos da frota */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select 
                  value={filtros.status || 'TODOS'} 
                  onValueChange={(value) => onFiltroChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ATIVO">Ativos</SelectItem>
                    <SelectItem value="INATIVO">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Garagem</label>
                <Select 
                  value={filtros.garagem || ''} 
                  onValueChange={(value) => onFiltroChange('garagem', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as garagens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {valoresFiltros?.garagens?.map((garagem: string) => (
                      <SelectItem key={garagem} value={garagem}>{garagem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Prefixo</label>
                <Input
                  placeholder="Ex: 226191"
                  value={filtros.prefixo || ''}
                  onChange={(e) => onFiltroChange('prefixo', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Placa</label>
                <Input
                  placeholder="Ex: ABC-1234"
                  value={filtros.placa || ''}
                  onChange={(e) => onFiltroChange('placa', e.target.value || undefined)}
                />
              </div>
            </>
          ) : (
            <>
              {/* Filtros específicos de acidentes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Grau do Acidente</label>
                <Select 
                  value={filtros.grauAcidente || 'TODOS'} 
                  onValueChange={(value) => onFiltroChange('grauAcidente', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="COM_VITIMAS">Com Vítimas</SelectItem>
                    <SelectItem value="SEM_VITIMAS">Sem Vítimas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select 
                  value={filtros.statusProcesso || 'TODOS'} 
                  onValueChange={(value) => onFiltroChange('statusProcesso', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ABERTO">Aberto</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="FECHADO">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Município</label>
                <Select 
                  value={filtros.municipio || ''} 
                  onValueChange={(value) => onFiltroChange('municipio', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os municípios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {valoresFiltros?.municipios?.map((municipio: string) => (
                      <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Prefixo</label>
                <Input
                  placeholder="Ex: 226191"
                  value={filtros.prefixoVeiculo || ''}
                  onChange={(e) => onFiltroChange('prefixoVeiculo', e.target.value || undefined)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onAplicar}>
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={onLimpar}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}