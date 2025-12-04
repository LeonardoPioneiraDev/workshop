// src/components/pessoal/filters/FiltrosPessoal.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import type { FiltrosPessoal } from '../../../types/departments/pessoal';

interface FiltrosPessoalProps {
  filtros: FiltrosPessoal;
  onFiltrosChange: (filtros: FiltrosPessoal) => void;
  onLimparFiltros: () => void;
  isLoading?: boolean;
  showAdvanced?: boolean;
}

const FiltrosPessoalComponent: React.FC<FiltrosPessoalProps> = ({
  filtros,
  onFiltrosChange,
  onLimparFiltros,
  isLoading = false,
  showAdvanced = false
}) => {
  const updateFiltro = (key: keyof FiltrosPessoal, value: any) => {
    onFiltrosChange({
      ...filtros,
      [key]: value,
      page: 1 // Reset página ao filtrar
    });
  };

  const filtrosAtivos = Object.entries(filtros).filter(([key, value]) => 
    value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit'
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <div className="flex items-center gap-2">
            {filtrosAtivos.length > 0 && (
              <Badge variant="secondary">
                {filtrosAtivos.length} filtro{filtrosAtivos.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              onClick={onLimparFiltros}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Buscar por nome..."
              value={filtros.nome || ''}
              onChange={(e) => updateFiltro('nome', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Situação */}
          <div className="space-y-2">
            <Label htmlFor="situacao">Situação</Label>
            <Select
              value={filtros.situacao || ''}
              onValueChange={(value) => updateFiltro('situacao', value || undefined)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="A">Ativo</SelectItem>
                <SelectItem value="F">Afastado</SelectItem>
                <SelectItem value="D">Demitido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Input
              id="departamento"
              placeholder="Ex: OPERACAO"
              value={filtros.departamento || ''}
              onChange={(e) => updateFiltro('departamento', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Cidade */}
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              placeholder="Ex: BRASILIA"
              value={filtros.cidade || ''}
              onChange={(e) => updateFiltro('cidade', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Função */}
          <div className="space-y-2">
            <Label htmlFor="funcao">Função</Label>
            <Input
              id="funcao"
              placeholder="Ex: MOTORISTA"
              value={filtros.funcao || ''}
              onChange={(e) => updateFiltro('funcao', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filtros Avançados */}
        {showAdvanced && (
          <>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Filtros Avançados</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Data de Admissão */}
                <div className="space-y-2">
                  <Label htmlFor="dataAdmissaoInicio">Data Admissão (Início)</Label>
                  <Input
                    id="dataAdmissaoInicio"
                    type="date"
                    value={filtros.dataAdmissaoInicio || ''}
                    onChange={(e) => updateFiltro('dataAdmissaoInicio', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAdmissaoFim">Data Admissão (Fim)</Label>
                  <Input
                    id="dataAdmissaoFim"
                    type="date"
                    value={filtros.dataAdmissaoFim || ''}
                    onChange={(e) => updateFiltro('dataAdmissaoFim', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Salário */}
                <div className="space-y-2">
                  <Label htmlFor="salarioMinimo">Salário Mínimo</Label>
                  <Input
                    id="salarioMinimo"
                    type="number"
                    placeholder="0"
                    value={filtros.salarioMinimo || ''}
                    onChange={(e) => updateFiltro('salarioMinimo', e.target.value ? Number(e.target.value) : undefined)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salarioMaximo">Salário Máximo</Label>
                  <Input
                    id="salarioMaximo"
                    type="number"
                    placeholder="99999"
                    value={filtros.salarioMaximo || ''}
                    onChange={(e) => updateFiltro('salarioMaximo', e.target.value ? Number(e.target.value) : undefined)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="temQuitacao"
                    checked={filtros.temQuitacao || false}
                    onCheckedChange={(checked) => updateFiltro('temQuitacao', checked)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="temQuitacao">Tem Quitação</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ativo"
                    checked={filtros.ativo || false}
                    onCheckedChange={(checked) => updateFiltro('ativo', checked)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="ativo">Apenas Ativos</Label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Filtros Aplicados */}
        {filtrosAtivos.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Filtros Aplicados:</h4>
            <div className="flex flex-wrap gap-2">
              {filtrosAtivos.map(([key, value]) => (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {String(value)}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => updateFiltro(key as keyof FiltrosPessoal, undefined)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FiltrosPessoalComponent;