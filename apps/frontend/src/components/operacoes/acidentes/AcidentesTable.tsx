// src/components/operacoes/acidentes/AcidentesTable.tsx
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
  FileText,
  AlertTriangle,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Car
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Acidente } from '@/types/departments/operacoes';

interface AcidentesTableProps {
  acidentes: Acidente[];
  loading?: boolean;
  error?: string | null;
  totalPages: number;
  currentPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewAcidente?: (acidente: Acidente) => void;
  onEditAcidente?: (acidente: Acidente) => void;
  className?: string;
}

export function AcidentesTable({
  acidentes,
  loading = false,
  error = null,
  totalPages,
  currentPage,
  total,
  onPageChange,
  onViewAcidente,
  onEditAcidente,
  className = ""
}: AcidentesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Acidente>('dataAcidente');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Acidente) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getGrauBadge = (grau: string) => {
    const grauConfig = {
      'COM VÍTIMAS': { color: 'bg-red-100 text-red-800', label: 'Com Vítimas' },
      'SEM VÍTIMAS': { color: 'bg-green-100 text-green-800', label: 'Sem Vítimas' },
      'COM_VITIMAS': { color: 'bg-red-100 text-red-800', label: 'Com Vítimas' },
      'SEM_VITIMAS': { color: 'bg-green-100 text-green-800', label: 'Sem Vítimas' }
    };
    
    const config = grauConfig[grau as keyof typeof grauConfig] || { color: 'bg-gray-100 text-gray-800', label: grau };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ABERTO': { color: 'bg-yellow-100 text-yellow-800', label: 'Aberto' },
      'EM_ANDAMENTO': { color: 'bg-blue-100 text-blue-800', label: 'Em Andamento' },
      'FECHADO': { color: 'bg-gray-100 text-gray-800', label: 'Fechado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredAcidentes = acidentes.filter(acidente =>
    acidente.prefixoVeiculo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acidente.placaVeiculo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acidente.municipio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acidente.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acidente.garagemVeiculoNome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAcidentes = [...filteredAcidentes].sort((a, b) => {
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
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
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
              <Skeleton key={index} className="h-16 w-full" />
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
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar acidentes: {error}</span>
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
            <AlertTriangle className="h-5 w-5" />
            Acidentes Registrados
            <Badge variant="secondary">
              {total.toLocaleString('pt-BR')} acidentes
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por veículo, local, garagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedAcidentes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum acidente encontrado</p>
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
                      onClick={() => handleSort('dataAcidente')}
                    >
                      <div className="flex items-center gap-1">
                        Data
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Grau</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('valorTotalDano')}
                    >
                      <div className="flex items-center gap-1">
                        Valor Danos
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Garagem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAcidentes.map((acidente) => (
                    <TableRow key={acidente.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {format(new Date(acidente.dataAcidente), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {acidente.horaAcidente || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="font-medium">{acidente.prefixoVeiculo || '-'}</div>
                            <div className="text-xs text-gray-500">{acidente.placaVeiculo || '-'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <div className="max-w-32">
                            <div className="font-medium truncate" title={acidente.municipio}>
                              {acidente.municipio || '-'}
                            </div>
                            <div className="text-xs text-gray-500 truncate" title={acidente.bairro}>
                              {acidente.bairro || '-'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getGrauBadge(acidente.grauAcidente || '')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(acidente.statusProcesso || '')}
                      </TableCell>
                      <TableCell>
                        {acidente.valorTotalDano ? 
                          acidente.valorTotalDano.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0
                          }) : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="max-w-24 truncate" title={acidente.garagemVeiculoNome}>
                          {acidente.garagemVeiculoNome || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewAcidente && (
                              <DropdownMenuItem onClick={() => onViewAcidente(acidente)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                            )}
                            {onEditAcidente && (
                              <DropdownMenuItem onClick={() => onEditAcidente(acidente)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
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
                  Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, total)} de {total} acidentes
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