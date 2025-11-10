// src/pages/operacoes/HistoricoPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operacoesApi } from '@/services/departments/operacoes/api/operacoesApi';
import { toast } from 'sonner';
import {
  History,
  Search,
  Calendar,
  Filter,
  Download,
  ArrowLeft,
  Clock,
  User,
  Truck,
  Settings,
  AlertTriangle,
  CheckCircle,
  FileText,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Activity,
  Loader,
  ChevronDown,
  BarChart3
} from 'lucide-react';

interface HistoricoEvento {
  id: string;
  data: string;
  hora: string;
  veiculo: string;
  prefixo: string;
  tipo: 'SINCRONIZACAO' | 'TRANSFERENCIA' | 'STATUS' | 'CADASTRO' | 'ATIVACAO' | 'INATIVACAO';
  descricao: string;
  responsavel: string;
  status: 'CONCLUIDO' | 'PENDENTE' | 'ERRO';
  observacoes?: string;
  localizacao?: string;
  setor?: string;
  garagemAnterior?: string;
  garagemNova?: string;
  statusAnterior?: string;
  statusNovo?: string;
}

export function HistoricoPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroVeiculo, setFiltroVeiculo] = useState('TODOS');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventos, setEventos] = useState<HistoricoEvento[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      
      // Carregar veículos para filtros
      const veiculosResponse = await operacoesApi.getVeiculos({ limit: 5000 });
      const veiculosData = Array.isArray(veiculosResponse) ? veiculosResponse : veiculosResponse.veiculos || [];
      setVeiculos(veiculosData);
      
      // Carregar histórico real de sincronizações
      await carregarHistoricoReal();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar histórico');
      // Em caso de erro, mostrar que não há dados
      setEventos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarHistoricoReal = async () => {
    try {
      // Tentar carregar histórico de sincronizações do backend
      const historicoResponse = await operacoesApi.getHistoricoSincronizacoes();
      
      if (historicoResponse && historicoResponse.length > 0) {
        // Transformar dados do backend para o formato esperado
        const eventosHistorico = historicoResponse.map((item: any, index: number) => ({
          id: String(item.id || index + 1),
          data: item.dataSincronizacao || item.data || new Date().toISOString().split('T')[0],
          hora: item.horaSincronizacao || item.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          veiculo: item.modelo || 'Veículo',
          prefixo: item.prefixo || item.codigoVeiculo || `V${String(index + 1).padStart(3, '0')}`,
          tipo: determinarTipoEvento(item),
          descricao: gerarDescricaoEvento(item),
          responsavel: item.responsavel || 'Sistema de Sincronização',
          status: item.sucesso ? 'CONCLUIDO' : 'PENDENTE',
          observacoes: item.observacoes || item.detalhes,
          localizacao: item.garagemNome || item.garagem,
          setor: item.garagemNome || item.garagem
        }));
        
        setEventos(eventosHistorico);
      } else {
        // Se não houver dados reais, mostrar mensagem apropriada
        setEventos([]);
      }
    } catch (error) {
      console.warn('Nenhum histórico de sincronização encontrado no backend:', error);
      setEventos([]);
    }
  };

  const determinarTipoEvento = (item: any): string => {
    // Lógica para determinar o tipo de evento baseado nas mudanças
    if (item.mudancaStatus) return 'STATUS';
    if (item.mudancaGaragem) return 'TRANSFERENCIA';
    if (item.novoVeiculo) return 'CADASTRO';
    if (item.veiculoInativo) return 'INATIVACAO';
    if (item.veiculoAtivo) return 'ATIVACAO';
    return 'SINCRONIZACAO';
  };

  const gerarDescricaoEvento = (item: any): string => {
    // Gerar descrição baseada no tipo de mudança
    if (item.statusAnterior && item.statusNovo && item.statusAnterior !== item.statusNovo) {
      return `Status alterado de ${item.statusAnterior} para ${item.statusNovo}`;
    }
    
    if (item.garagemAnterior && item.garagemNova && item.garagemAnterior !== item.garagemNova) {
      return `Transferido de ${item.garagemAnterior} para ${item.garagemNova}`;
    }
    
    if (item.novoVeiculo) {
      return `Veículo cadastrado no sistema`;
    }
    
    if (item.veiculoInativo) {
      return `Veículo inativado na sincronização`;
    }
    
    if (item.veiculoAtivo) {
      return `Veículo ativado na sincronização`;
    }
    
    return `Dados sincronizados com o sistema externo`;
  };


  const filtrarEventos = () => {
    return eventos.filter(evento => {
      const matchesSearch = !searchTerm || 
        evento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = filtroTipo === 'TODOS' || evento.tipo === filtroTipo;
      const matchesStatus = filtroStatus === 'TODOS' || evento.status === filtroStatus;
      const matchesVeiculo = filtroVeiculo === 'TODOS' || evento.prefixo === filtroVeiculo;
      
      return matchesSearch && matchesTipo && matchesStatus && matchesVeiculo;
    });
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      MANUTENCAO: Settings,
      ACIDENTE: AlertTriangle,
      ABASTECIMENTO: Activity,
      TRANSFERENCIA: Truck,
      INSPECAO: CheckCircle,
      OUTROS: FileText
    };
    const IconComponent = icons[tipo as keyof typeof icons] || FileText;
    return <IconComponent className="w-5 h-5" />;
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      MANUTENCAO: 'from-blue-400 to-blue-600',
      ACIDENTE: 'from-red-400 to-red-600',
      ABASTECIMENTO: 'from-green-400 to-green-600',
      TRANSFERENCIA: 'from-purple-400 to-purple-600',
      INSPECAO: 'from-orange-400 to-orange-600',
      OUTROS: 'from-gray-400 to-gray-600'
    };
    return colors[tipo as keyof typeof colors] || colors.OUTROS;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
      EM_ANDAMENTO: 'bg-blue-100 text-blue-800 border-blue-200',
      PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CANCELADO: 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || variants.PENDENTE;
  };

  const handleExport = () => {
    const eventosExibidos = filtrarEventos();
    const csvContent = [
      ['Data', 'Hora', 'Veículo', 'Tipo', 'Descrição', 'Responsável', 'Status', 'Custo', 'Localização'].join(','),
      ...eventosExibidos.map(evento => [
        evento.data,
        evento.hora,
        evento.prefixo,
        evento.tipo,
        `"${evento.descricao}"`,
        evento.responsavel,
        evento.status,
        evento.custo ? `R$ ${evento.custo.toFixed(2)}` : '',
        evento.localizacao || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_frota_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Histórico exportado com sucesso!');
  };

  const eventosExibidos = filtrarEventos();
  const totalEventos = eventosExibidos.length;
  const eventosConcluidos = eventosExibidos.filter(e => e.status === 'CONCLUIDO').length;
  const eventosAndamento = eventosExibidos.filter(e => e.status === 'EM_ANDAMENTO').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Button
            onClick={() => navigate('/departments/operacoes')}
            className="group relative bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 w-full sm:w-auto"
          >
            <div className="relative flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="tracking-wide">Voltar ao Dashboard</span>
            </div>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:bg-purple-900/30 rounded-xl">
                  <History className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <span>Histórico de Veículos</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Consultar eventos e histórico da frota
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className={`group relative font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 ${
                  showFilters 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="relative flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="tracking-wide">Filtrar por Data</span>
                </div>
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={totalEventos === 0}
                className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="relative flex items-center">
                  <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                  <span className="font-medium tracking-wide">Exportar</span>
                </div>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de Eventos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalEventos}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Concluídos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {eventosConcluidos}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Em Andamento</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {eventosAndamento}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar no histórico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`group relative font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 ${
                      showFilters 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="relative flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="tracking-wide">Filtros Avançados</span>
                      <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                        showFilters ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </Button>
                </div>
                
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t"
                  >
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
                      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS">Todos os Tipos</SelectItem>
                          <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                          <SelectItem value="ACIDENTE">Acidente</SelectItem>
                          <SelectItem value="ABASTECIMENTO">Abastecimento</SelectItem>
                          <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                          <SelectItem value="INSPECAO">Inspeção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS">Todos os Status</SelectItem>
                          <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                          <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Veículo</label>
                      <Select value={filtroVeiculo} onValueChange={setFiltroVeiculo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os veículos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS">Todos os Veículos</SelectItem>
                          {veiculos.slice(0, 20).map((veiculo) => (
                            <SelectItem key={veiculo.prefixo} value={veiculo.prefixo}>
                              {veiculo.prefixo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        onClick={() => {
                          setFiltroTipo('TODOS');
                          setFiltroStatus('TODOS');
                          setFiltroVeiculo('TODOS');
                          setSearchTerm('');
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Eventos Registrados ({totalEventos})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Carregando histórico...</span>
                </div>
              ) : eventosExibidos.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Tente ajustar os filtros ou o termo de busca.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventosExibidos.map((evento, index) => (
                    <motion.div
                      key={evento.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-6 border border-gray-100 rounded-2xl hover:shadow-lg hover:border-purple-200 transition-all duration-300 group bg-gradient-to-r hover:from-white hover:to-purple-50/30"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${getTipoColor(evento.tipo)} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {getTipoIcon(evento.tipo)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-purple-700 transition-colors">
                              {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1).toLowerCase().replace('_', ' ')}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {evento.descricao}
                            </p>
                          </div>
                          <Badge className={`${getStatusBadge(evento.status)} px-3 py-1 text-sm font-semibold shadow-sm`}>
                            {evento.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span className="font-medium">Veículo: {evento.prefixo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{evento.responsavel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(evento.data).toLocaleDateString('pt-BR')} às {evento.hora}</span>
                          </div>
                          {evento.custo && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className="font-medium text-green-600">R$ {evento.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
