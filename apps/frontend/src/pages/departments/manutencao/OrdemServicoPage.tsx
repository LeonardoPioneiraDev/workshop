// src/pages/departments/manutencao/OrdemServicoPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { manutencaoApi } from '@/services/departments/manutencao/api/manutencaoApi';
import type { OrdemServico, FiltrosOS, EstatisticasOS } from '@/services/departments/manutencao/types';
import { GARAGENS, STATUS_OS_LABELS, TIPO_OS_LABELS, TIPO_PROBLEMA_LABELS } from '@/services/departments/manutencao/types';
import { toast } from 'sonner';
import {
  Wrench,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowLeft,
  Loader,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

export function OrdemServicoPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasOS | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosOS>({
    startDate: format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    page: 1,
    limit: 500
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await manutencaoApi.buscarOS(filtros);
      setOrdensServico(response.data);
      setEstatisticas(response.statistics || null);

      toast.success('Dados carregados com sucesso!');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(message);
      toast.error('Erro ao carregar dados', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtros.page, filtros.limit]);

  const handleSincronizar = async () => {
    try {
      setIsSyncing(true);
      await manutencaoApi.sincronizarOS({
        startDate: filtros.startDate,
        endDate: filtros.endDate,
        garagens: filtros.garagens
      });
      toast.success('Sincronização concluída!');
      await carregarDados();
    } catch (err: any) {
      toast.error('Erro na sincronização', { description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBuscar = () => {
    setFiltros(prev => ({ ...prev, page: 1 }));
    carregarDados();
  };

  const getStatusBadge = (condicaoOS?: string) => {
    if (condicaoOS === 'A') {
      return <Badge className="bg-green-100 text-green-800">Aberta</Badge>;
    } else if (condicaoOS === 'FC') {
      return <Badge className="bg-gray-100 text-gray-800">Fechada</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Outro</Badge>;
  };

  const getTipoBadge = (tipoOS?: string) => {
    if (tipoOS === 'C') {
      return <Badge className="bg-red-100 text-red-800">Corretiva</Badge>;
    } else if (tipoOS === 'P') {
      return <Badge className="bg-blue-100 text-blue-800">Preventiva</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Outro</Badge>;
  };

  const filteredOS = ordensServico.filter(os => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      os.numeroOS?.toLowerCase().includes(search) ||
      os.prefixoVeiculo?.toLowerCase().includes(search) ||
      os.placaVeiculo?.toLowerCase().includes(search) ||
      os.garagem?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil((filteredOS.length || 0) / (filtros.limit || 500));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wrench className="h-8 w-8 text-orange-600" />
              Ordens de Serviço
            </h1>
            <p className="text-gray-600">Gestão de manutenção de veículos</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSincronizar}
            disabled={isSyncing}
            variant="outline"
          >
            {isSyncing ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{estatisticas.resumo.totalRegistros}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Abertas</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.resumo.osAbertas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fechadas</p>
                  <p className="text-2xl font-bold text-gray-600">{estatisticas.resumo.osFechadas}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quebras</p>
                  <p className="text-2xl font-bold text-red-600">{estatisticas.resumo.quebras}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Defeitos</p>
                  <p className="text-2xl font-bold text-orange-600">{estatisticas.resumo.defeitos}</p>
                </div>
                <Wrench className="h-8 w-8 text-orange-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={filtros.startDate}
                onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={filtros.endDate}
                onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Garagem</label>
              <Select
                value={filtros.garagem || ''}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, garagem: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {GARAGENS.map(g => (
                    <SelectItem key={g.codigo} value={g.nome}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filtros.condicaoOS || ''}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, condicaoOS: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="A">Aberta</SelectItem>
                  <SelectItem value="FC">Fechada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Número OS, Prefixo, Placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prefixo</label>
              <Input
                placeholder="Prefixo do veículo"
                value={filtros.prefixo || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, prefixo: e.target.value || undefined }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Número OS</label>
              <Input
                placeholder="Número da OS"
                value={filtros.numeroOS || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, numeroOS: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => {
              setFiltros({
                startDate: format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                page: 1,
                limit: 500
              });
              setSearchTerm('');
            }} variant="outline">
              Limpar
            </Button>
            <Button onClick={handleBuscar}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de OS */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                Carregando...
              </span>
            ) : (
              `${filteredOS.length} Ordens de Serviço`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          ) : filteredOS.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOS.map((os) => (
                <motion.div
                  key={os.codigoInternoOS}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">OS #{os.numeroOS}</span>
                        {getStatusBadge(os.condicaoOS)}
                        {getTipoBadge(os.tipoOS)}
                        {os.tipoProblema && (
                          <Badge className={os.tipoProblema === 'QUEBRA' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {os.tipoProblema}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Veículo:</span>
                          <p className="font-medium">{os.prefixoVeiculo} - {os.placaVeiculo}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Garagem:</span>
                          <p className="font-medium">{os.garagem}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Abertura:</span>
                          <p className="font-medium">{os.dataAbertura}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Dias:</span>
                          <p className="font-medium">{os.diasEmAndamento?.toFixed(0) || 0} dias</p>
                        </div>
                      </div>

                      {os.descricaoServico && (
                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">{os.descricaoServico}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
