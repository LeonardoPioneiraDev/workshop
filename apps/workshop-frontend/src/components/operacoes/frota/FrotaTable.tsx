// src/components/operacoes/frota/FrotaTable.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  History, 
  FileText,
  Truck,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { VeiculoOperacional, FiltrosFrota } from '@/types/departments/operacoes';

interface FrotaTableProps {
  veiculos: VeiculoOperacional[];
  loading?: boolean;
  error?: string | null;
  totalPages: number;
  currentPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewVeiculo?: (veiculo: VeiculoOperacional) => void;
  onEditVeiculo?: (veiculo: VeiculoOperacional) => void;
  onViewHistorico?: (prefixo: string) => void;
  className?: string;
}

export function FrotaTable({
  veiculos,
  loading = false,
  error = null,
  totalPages,
  currentPage,
  total,
  onPageChange,
  onViewVeiculo,
  onEditVeiculo,
  onViewHistorico,
  className = ""
}: FrotaTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof VeiculoOperacional>('prefixo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof VeiculoOperacional) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ATIVO': { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      'INATIVO': { color: 'bg-red-100 text-red-800', label: 'Inativo' },
      'MANUTENCAO': { color: 'bg-yellow-100 text-yellow-800', label: 'Manutenção' },
      'RESERVA': { color: 'bg-blue-100 text-blue-800', label: 'Reserva' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INATIVO;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredVeiculos = veiculos.filter(veiculo =>
    veiculo.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedVeiculos = [...filteredVeiculos].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <Truck className="h-5 w-5" />
            <span>Erro ao carregar veículos: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Frota Operacional
            <Badge variant="secondary">
              {total.toLocaleString('pt-BR')} veículos
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por prefixo, placa, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedVeiculos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum veículo encontrado</p>
            {searchTerm && (
              <p className="text-sm mt-2">
                Tente ajustar os filtros de busca
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('prefixo')}
                    >
                      <div className="flex items-center gap-1">
                        Prefixo
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('placa')}
                    >
                      <div className="flex items-center gap-1">
                        Placa
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('ano')}
                    >
                      <div className="flex items-center gap-1">
                        Ano
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Garagem</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('quilometragem')}
                    >
                      <div className="flex items-center gap-1">
                        KM
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVeiculos.map((veiculo) => (
                    <TableRow key={veiculo.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {veiculo.prefixo}
                      </TableCell>
                      <TableCell>{veiculo.placa}</TableCell>
                      <TableCell>{veiculo.modelo || '-'}</TableCell>
                      <TableCell>{veiculo.marca || '-'}</TableCell>
                      <TableCell>{veiculo.ano || '-'}</TableCell>
                      <TableCell>
                        {getStatusBadge(veiculo.status)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={veiculo.garagemNome}>
                          {veiculo.garagemNome || veiculo.garagem || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {veiculo.quilometragem ? 
                          veiculo.quilometragem.toLocaleString('pt-BR') : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewVeiculo && (
                              <DropdownMenuItem onClick={() => onViewVeiculo(veiculo)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                            )}
                            {onEditVeiculo && (
                              <DropdownMenuItem onClick={() => onEditVeiculo(veiculo)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onViewHistorico && (
                              <DropdownMenuItem onClick={() => onViewHistorico(veiculo.prefixo)}>
                                <History className="mr-2 h-4 w-4" />
                                Histórico
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Relatório
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, total)} de {total} veículos
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}