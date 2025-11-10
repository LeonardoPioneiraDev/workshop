// src/pages/departments/operacoes/FrotaPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Pagination } from '../../../components/ui/pagination';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Truck,
  MapPin,
  Calendar,
  History
} from 'lucide-react';
import { useFrotaData } from '../../../services/departments/operacoes/hooks/useFrotaData';
import { Loading } from '../../../components/ui/loading';
import type { FiltrosFrota } from '../../../types/departments/operacoes';

export function FrotaPage() {
  const { 
    veiculos, 
    estatisticas, 
    loading, 
    error, 
    totalPages, 
    total,
    buscarFrota, 
    sincronizarFrota 
  } = useFrotaData();

  const [filtros, setFiltros] = useState<FiltrosFrota>({
    status: 'TODOS',
    page: 1,
    limit: 30
  });

  const [sincronizando, setSincronizando] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    buscarFrota(filtros);
  }, [filtros]);

  const handleFiltroChange = (campo: keyof FiltrosFrota, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1 // Reset página ao filtrar
    }));
  };

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      await sincronizarFrota();
      await buscarFrota(filtros);
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setSincronizando(false);
    }
  };

  const obterCorStatus = (status: string) => {
    return status === 'ATIVO' ? 'bg-green-500' : 'bg-red-500';
  };

  const garagens = [
    'VIAÇÃO PIONEIRA',
    'PARANOÁ', 
    'SANTA M.',
    'SÃO SEBAS.',
    'GAMA'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão da Frota</h1>
          <p className="text-muted-foreground">
            Controle detalhado de veículos por setor
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSincronizar} 
            disabled={sincronizando}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${sincronizando ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{estatisticas.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.inativos}</p>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">%</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {estatisticas.percentualAtivos.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Disponibilidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filtros.status} 
                onValueChange={(value) => handleFiltroChange('status', value)}
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
              <label className="text-sm font-medium mb-2 block">Garagem/Setor</label>
              <Select 
                value={filtros.garagem || ''} 
                onValueChange={(value) => handleFiltroChange('garagem', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as garagens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {garagens.map(garagem => (
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
                onChange={(e) => handleFiltroChange('prefixo', e.target.value || undefined)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Placa</label>
              <Input
                placeholder="Ex: ABC-1234"
                value={filtros.placa || ''}
                onChange={(e) => handleFiltroChange('placa', e.target.value || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Veículos ({total} registros)</span>
            <div className="flex gap-2">
              <Select 
                value={filtros.limit?.toString()} 
                onValueChange={(value) => handleFiltroChange('limit', parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="text-red-500">Erro: {error}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prefixo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Garagem</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculos.map((veiculo) => (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-medium">{veiculo.prefixo}</TableCell>
                      <TableCell>{veiculo.placa}</TableCell>
                      <TableCell>{veiculo.modelo} {veiculo.marca}</TableCell>
                      <TableCell>
                        <Badge className={obterCorStatus(veiculo.status)}>
                          {veiculo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {veiculo.garagemNome}
                        </div>
                      </TableCell>
                      <TableCell>{veiculo.motoristaAtual || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(veiculo.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setVeiculoSelecionado(veiculo.prefixo)}
                        >
                          <History className="h-3 w-3 mr-1" />
                          Histórico
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="mt-4">
                <Pagination
                  currentPage={filtros.page || 1}
                  totalPages={totalPages}
                  onPageChange={(page) => handleFiltroChange('page', page)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}