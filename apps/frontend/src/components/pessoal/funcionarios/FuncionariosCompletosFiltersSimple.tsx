import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
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

          {/* Situação - USANDO SELECT NATIVO */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.situacao || ''}
            onChange={(e) => onFiltersChange({ situacao: e.target.value || undefined })}
          >
            <option value="">Todas as situações</option>
            <option value="A">Ativo</option>
            <option value="D">Demitido</option>
            <option value="L">Licenciado</option>
            <option value="F">Férias</option>
          </select>

          {/* Departamento - USANDO SELECT NATIVO */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.departamento || ''}
            onChange={(e) => onFiltersChange({ departamento: e.target.value || undefined })}
          >
            <option value="">Todos os departamentos</option>
            <option value="OPERACAO">Operação</option>
            <option value="ADMINISTRATIVO">Administrativo</option>
            <option value="MANUTENCAO">Manutenção</option>
            <option value="FINANCEIRO">Financeiro</option>
          </select>

          {/* Status Ativo - USANDO SELECT NATIVO */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={filters.ativo === undefined ? '' : filters.ativo.toString()}
            onChange={(e) => onFiltersChange({ 
              ativo: e.target.value === '' ? undefined : e.target.value === 'true' 
            })}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>

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