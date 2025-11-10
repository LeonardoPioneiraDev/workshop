import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { FuncionariosCompletosFilters } from '../../../services/departments/pessoal/funcionariosCompletosService';

interface FuncionariosCompletosFiltersProps {
  filters: FuncionariosCompletosFilters;
  onFiltersChange: (filters: Partial<FuncionariosCompletosFilters>) => void;
  onExport: (format: 'excel' | 'pdf') => void;
  onRefresh: () => void;
  loading?: boolean;
  totalRecords: number;
}

export const FuncionariosCompletosFiltersComponent: React.FC<FuncionariosCompletosFiltersProps> = ({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  loading = false,
  totalRecords
}) => {
  const handleClearFilters = () => {
    onFiltersChange({
      situacao: undefined,
      departamento: undefined,
      funcao: undefined,
      ativo: undefined,
      dataAdmissaoInicio: undefined,
      dataAdmissaoFim: undefined,
      search: undefined
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Funcionários
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} filtro(s) ativo(s)</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('excel')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('pdf')}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          {/* Busca por nome */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Situação - CORRIGIDO: usando placeholder dinâmico */}
          <Select
            value={filters.situacao || ''}
            onValueChange={(value) => onFiltersChange({ situacao: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas as situações</SelectItem>
              <SelectItem value="A">Ativo</SelectItem>
              <SelectItem value="D">Demitido</SelectItem>
              <SelectItem value="L">Licenciado</SelectItem>
              <SelectItem value="F">Férias</SelectItem>
            </SelectContent>
          </Select>

          {/* Departamento - CORRIGIDO */}
          <Select
            value={filters.departamento || ''}
            onValueChange={(value) => onFiltersChange({ departamento: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os departamentos</SelectItem>
              <SelectItem value="OPERACAO">Operação</SelectItem>
              <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
              <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
              <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Ativo - CORRIGIDO */}
          <Select
            value={filters.ativo === undefined ? '' : filters.ativo.toString()}
            onValueChange={(value) => onFiltersChange({ 
              ativo: value === '' ? undefined : value === 'true' 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="true">Ativos</SelectItem>
              <SelectItem value="false">Inativos</SelectItem>
            </SelectContent>
          </Select>

          {/* Data Admissão Início */}
          <Input
            type="date"
            placeholder="Data admissão início"
            value={filters.dataAdmissaoInicio || ''}
            onChange={(e) => onFiltersChange({ dataAdmissaoInicio: e.target.value || undefined })}
          />

          {/* Data Admissão Fim */}
          <Input
            type="date"
            placeholder="Data admissão fim"
            value={filters.dataAdmissaoFim || ''}
            onChange={(e) => onFiltersChange({ dataAdmissaoFim: e.target.value || undefined })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalRecords} funcionário(s) encontrado(s)
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};