// src/pages/departments/operacoes/AcidentesPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Pagination } from '../../../components/ui/pagination';
import { Calendar } from '../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  AlertTriangle,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { useAcidentesData } from '../../../services/departments/operacoes/hooks/useAcidentesData';
import { Loading } from '../../../components/ui/loading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FiltrosAcidentes } from '../../../types/departments/operacoes';

export function AcidentesPage() {
  const { 
    acidentes, 
    estatisticas,
    valoresFiltros,
    loading, 
    error, 
    totalPages, 
    total,
    buscarAcidentes, 
    carregarEstatisticas,
    sincronizarAcidentes 
  } = useAcidentesData();

  const [filtros, setFiltros] = useState<FiltrosAcidentes>({
    grauAcidente: 'TODOS',
    statusProcesso: 'TODOS',
    page: 1,
    limit: 20
  });

  const [sincronizando, setSincronizando] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  useEffect(() => {
    buscarAcidentes(filtros);
    carregarEstatisticas(filtros);
  }, [filtros]);

  const handleFiltroChange = (campo: keyof FiltrosAcidentes, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1
    }));
  };

  const handleDataChange = (inicio?: Date, fim?: Date) => {
    setDataInicio(inicio);
    setDataFim(fim);
    
    const novosFiltros = {
      ...filtros,
      dataInicio: inicio ? format(inicio, 'yyyy-MM-dd') : undefined,
      dataFim: fim ? format(fim, 'yyyy-MM-dd') : undefined,
      page: 1
    };
    
    setFiltros(novosFiltros);
  };

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      await sincronizarAcidentes(
        filtros.dataInicio,
        filtros.dataFim
      );
      await buscarAcidentes(filtros);
      await carregarEstatisticas(filtros);
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setSincronizando(false);
    }
  };

  const obterCorGrau = (grau: string) => {
    return grau === 'COM VÍTIMAS' ? 'bg-red-500' : 'bg-yellow-500';
  };

  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'FECHADO': return 'bg-green-500';
      case 'ABERTO': return 'bg-red-500';
      case 'EM_ANDAMENTO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Acidentes</h1>
          <p className="text-muted-foreground">
            Controle detalhado de ocorrências e sinistros
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
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{estatisticas.resumo.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.resumo.comVitimas}</p>
                  <p className="text-sm text-muted-foreground">Com Vítimas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{estatisticas.resumo.semVitimas}</p>
                  <p className="text-sm text-muted-foreground">Sem Vítimas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatarMoeda(estatisticas.resumo.valorTotalDanos)}
                  </p>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
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
            {/* Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Grau do Acidente */}
            <div>
              <label className="text-sm font-medium mb-2 block">Grau do Acidente</label>
              <Select 
                value={filtros.grauAcidente} 
                onValueChange={(value) => handleFiltroChange('grauAcidente', value)}
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

            {/* Status do Processo */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filtros.statusProcesso} 
                onValueChange={(value) => handleFiltroChange('statusProcesso', value)}
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

            {/* Garagem */}
            <div>
              <label className="text-sm font-medium mb-2 block">Garagem</label>
              <Select 
                value={filtros.garagem || ''} 
                onValueChange={(value) => handleFiltroChange('garagem', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as garagens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {valoresFiltros?.garagens.map(garagem => (
                    <SelectItem key={garagem} value={garagem}>{garagem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prefixo */}
            <div>
              <label className="text-sm font-medium mb-2 block">Prefixo</label>
              <Input
                placeholder="Ex: 226191"
                value={filtros.prefixoVeiculo || ''}
                onChange={(e) => handleFiltroChange('prefixoVeiculo', e.target.value || undefined)}
              />
            </div>

            {/* Município */}
            <div>
              <label className="text-sm font-medium mb-2 block">Município</label>
              <Select 
                value={filtros.municipio || ''} 
                onValueChange={(value) => handleFiltroChange('municipio', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os municípios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {valoresFiltros?.municipios.map(municipio => (
                    <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Turno */}
            <div>
              <label className="text-sm font-medium mb-2 block">Turno</label>
              <Select 
                value={filtros.turno || ''} 
                onValueChange={(value) => handleFiltroChange('turno', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {valoresFiltros?.turnos.map(turno => (
                    <SelectItem key={turno} value={turno}>{turno}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleDataChange(dataInicio, dataFim)}>
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setDataInicio(undefined);
                setDataFim(undefined);
                setFiltros({
                  grauAcidente: 'TODOS',
                  statusProcesso: 'TODOS',
                  page: 1,
                  limit: 20
                });
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Acidentes ({total} registros)</span>
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
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Grau</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Garagem</TableHead>
                    <TableHead>Valor Dano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Turno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acidentes.map((acidente) => (
                    <TableRow key={acidente.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(acidente.dataAcidente).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {acidente.horaAcidente}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{acidente.prefixoVeiculo}</span>
                          <span className="text-sm text-muted-foreground">{acidente.placaVeiculo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={obterCorGrau(acidente.grauAcidente)}>
                          {acidente.grauAcidente}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{acidente.municipio}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {acidente.bairro}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{acidente.garagemVeiculoNome}</TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          {formatarMoeda(acidente.valorTotalDano || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={obterCorStatus(acidente.statusProcesso)}>
                          {acidente.statusProcesso}
                        </Badge>
                      </TableCell>
                      <TableCell>{acidente.turno}</TableCell>
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