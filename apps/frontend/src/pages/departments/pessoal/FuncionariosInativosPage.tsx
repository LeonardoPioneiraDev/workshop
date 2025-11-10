import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  TrendingDown,
  UserMinus,
  UserX,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  MapPin,
  Building,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useFuncionariosCompletos } from '../../../services/departments/pessoal/hooks/useFuncionariosCompletos';
import logoImage from '@/assets/logo.png';

// Hook específico para funcionários inativos com filtros
const useFuncionariosInativos = () => {
  const [filters, setFilters] = useState({
    search: '',
    tipo: 'Todos', // Todos, Afastados, Demitidos
    departamento: 'Todos',
    funcao: 'Todos',
    cidade: 'Todos',
    dataDesligamentoInicio: '',
    dataDesligamentoFim: '',
    tempoEmpresaMin: '',
    tempoEmpresaMax: ''
  });

  const {
    funcionarios: todosFuncionarios,
    loading,
    error,
    refetch
  } = useFuncionariosCompletos({
    page: 1,
    limit: 50000 // ✅ LIMITE MUITO ALTO PARA PEGAR TODOS
  });

  // Filtrar funcionários inativos
  const funcionariosInativos = useMemo(() => {
    if (!todosFuncionarios.length) return [];

    let funcionarios = todosFuncionarios.filter(f => 
      f.situacao === 'F' || f.situacao === 'D' || !f.ativo
    );

    // Aplicar filtros
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      funcionarios = funcionarios.filter(f => 
        f.nome.toLowerCase().includes(searchLower) ||
        f.cpf.includes(filters.search) ||
        f.cracha.toString().includes(filters.search)
      );
    }

    if (filters.tipo && filters.tipo !== 'Todos') {
      if (filters.tipo === 'Afastados') {
        funcionarios = funcionarios.filter(f => f.situacao === 'F' || !f.ativo);
      } else if (filters.tipo === 'Demitidos') {
        funcionarios = funcionarios.filter(f => f.situacao === 'D');
      }
    }

    if (filters.departamento && filters.departamento !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.departamento === filters.departamento);
    }

    if (filters.funcao && filters.funcao !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.funcao === filters.funcao);
    }

    if (filters.cidade && filters.cidade !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.cidade === filters.cidade);
    }

    if (filters.dataDesligamentoInicio && filters.dataDesligamentoFim) {
      funcionarios = funcionarios.filter(f => {
        if (!f.dtDesligQuita) return false;
        const dataDeslig = new Date(f.dtDesligQuita);
        const inicio = new Date(filters.dataDesligamentoInicio);
        const fim = new Date(filters.dataDesligamentoFim);
        return dataDeslig >= inicio && dataDeslig <= fim;
      });
    }

    if (filters.tempoEmpresaMin) {
      funcionarios = funcionarios.filter(f => f.tempoEmpresaDias >= parseInt(filters.tempoEmpresaMin));
    }

    if (filters.tempoEmpresaMax) {
      funcionarios = funcionarios.filter(f => f.tempoEmpresaDias <= parseInt(filters.tempoEmpresaMax));
    }

    return funcionarios;
  }, [todosFuncionarios, filters]);

  // Opções para filtros
  const filterOptions = useMemo(() => {
    const funcionariosBase = todosFuncionarios.filter(f => 
      f.situacao === 'F' || f.situacao === 'D' || !f.ativo
    );

    return {
      departamentos: [...new Set(funcionariosBase.map(f => f.departamento))].sort(),
      funcoes: [...new Set(funcionariosBase.map(f => f.funcao))].sort(),
      cidades: [...new Set(funcionariosBase.map(f => f.cidade).filter(Boolean))].sort()
    };
  }, [todosFuncionarios]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      tipo: 'Todos',
      departamento: 'Todos',
      funcao: 'Todos',
      cidade: 'Todos',
      dataDesligamentoInicio: '',
      dataDesligamentoFim: '',
      tempoEmpresaMin: '',
      tempoEmpresaMax: ''
    });
  };

  return {
    funcionarios: funcionariosInativos,
    loading,
    error,
    filters,
    filterOptions,
    updateFilter,
    clearFilters,
    refetch
  };
};

export default function FuncionariosInativosPage() {
  const navigate = useNavigate();
  const { 
    funcionarios, 
    loading, 
    error, 
    filters, 
    filterOptions, 
    updateFilter, 
    clearFilters, 
    refetch 
  } = useFuncionariosInativos();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);

  // Paginação
  const totalPages = Math.ceil(funcionarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const funcionariosPaginados = funcionarios.slice(startIndex, endIndex);

  // Estatísticas
  const stats = useMemo(() => {
    if (!funcionarios.length) return null;

    const afastados = funcionarios.filter(f => f.situacao === 'F' || !f.ativo).length;
    const demitidos = funcionarios.filter(f => f.situacao === 'D').length;
    const temposEmpresa = funcionarios.map(f => f.tempoEmpresaDias).filter(t => t > 0);
    const tempoMedioEmpresa = temposEmpresa.length > 0 ? 
      temposEmpresa.reduce((sum, t) => sum + t, 0) / temposEmpresa.length : 0;

    // Calcular desligamentos recentes (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    const desligamentosRecentes = funcionarios.filter(f => {
      if (!f.dtDesligQuita) return false;
      const dataDeslig = new Date(f.dtDesligQuita);
      return dataDeslig >= trintaDiasAtras;
    }).length;

    return {
      total: funcionarios.length,
      afastados,
      demitidos,
      tempoMedioEmpresa,
      desligamentosRecentes
    };
  }, [funcionarios]);

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSituacaoColor = (situacao) => {
    switch (situacao) {
      case 'F': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'D': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getSituacaoIcon = (situacao) => {
    switch (situacao) {
      case 'F': return <UserMinus className="w-3 h-3" />;
      case 'D': return <UserX className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
    }
  };

  // Componente de filtros
  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-yellow-200">Buscar:</label>
        <Input
          placeholder="Nome, CPF ou crachá..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="bg-slate-700/80 border-yellow-500/30 text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-yellow-200">Tipo:</label>
        <Select value={filters.tipo} onValueChange={(value) => updateFilter('tipo', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-yellow-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-yellow-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Afastados">Afastados</SelectItem>
            <SelectItem value="Demitidos">Demitidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-yellow-200">Departamento:</label>
        <Select value={filters.departamento} onValueChange={(value) => updateFilter('departamento', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-yellow-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-yellow-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            {filterOptions.departamentos.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-yellow-200">Função:</label>
        <Select value={filters.funcao} onValueChange={(value) => updateFilter('funcao', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-yellow-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-yellow-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            {filterOptions.funcoes.map(funcao => (
              <SelectItem key={funcao} value={funcao}>{funcao}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-yellow-200">Período de Desligamento:</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={filters.dataDesligamentoInicio}
            onChange={(e) => updateFilter('dataDesligamentoInicio', e.target.value)}
            className="bg-slate-700/80 border-yellow-500/30 text-white"
          />
          <Input
            type="date"
            value={filters.dataDesligamentoFim}
            onChange={(e) => updateFilter('dataDesligamentoFim', e.target.value)}
            className="bg-slate-700/80 border-yellow-500/30 text-white"
          />
        </div>
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Limpar Filtros
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-900 to-red-900/20 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-yellow-900/30 border-yellow-500/30">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Erro ao carregar dados</h2>
            <p className="text-sm sm:text-base mb-4">{error}</p>
            <Button onClick={refetch} className="bg-yellow-600 hover:bg-yellow-700 w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-900 to-red-900/20 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/90 via-yellow-900/30 to-slate-800/90 border-b border-yellow-500/20 p-3 sm:p-4 flex-shrink-0 backdrop-blur-sm">
        <div className="container mx-auto">
          
          {/* Layout Mobile */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/pessoal/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-yellow-700/30 p-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <img 
                    src={logoImage} 
                    alt="Viação Pioneira Logo" 
                    className="w-8 h-8 object-contain rounded-lg" 
                  />
                  <div>
                    <h2 className="text-sm font-bold text-white">Funcionários Inativos</h2>
                    <p className="text-xs text-yellow-300">{stats?.total || 0} funcionários</p>
                  </div>
                </div>
              </div>

              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-yellow-700/30">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-800 border-yellow-500/30 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-yellow-200">Filtros</SheetTitle>
                    <SheetDescription className="text-yellow-300">
                      Configure os filtros para encontrar funcionários
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Layout Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/pessoal/dashboard')}
                variant="ghost"
                className="text-white hover:bg-yellow-700/30 p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <div className="flex items-center gap-2">
                <img 
                  src={logoImage} 
                  alt="Viação Pioneira Logo" 
                  className="w-10 h-10 object-contain rounded-lg" 
                />
                <div>
                  <h2 className="text-lg font-bold text-white">Funcionários Afastados/Demitidos</h2>
                  <p className="text-xs text-yellow-300">{stats?.total || 0} funcionários inativos</p>
                </div>
              </div>
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-yellow-300" />
                <Input
                  placeholder="Buscar funcionário..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-64 bg-slate-700/80 border-yellow-500/30 text-white"
                />
              </div>

              <Select value={filters.tipo} onValueChange={(value) => updateFilter('tipo', value)}>
                <SelectTrigger className="w-32 bg-slate-700/80 border-yellow-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-yellow-500/30">
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Afastados">Afastados</SelectItem>
                  <SelectItem value="Demitidos">Demitidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={refetch}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-300 hover:bg-yellow-700/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full max-w-screen-2xl">
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 flex-shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-400 text-sm sm:text-base">
                  <UserMinus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Total Inativos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {loading ? '...' : (stats?.total || 0).toLocaleString('pt-BR')}
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-yellow-400">
                  <TrendingDown className="w-3 h-3 flex-shrink-0" />
                  <span>Funcionários inativos</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Afastados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : (stats?.afastados || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs sm:text-sm text-orange-400">
                  Funcionários afastados
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-red-400 text-sm sm:text-base">
                  <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Demitidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : (stats?.demitidos || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs sm:text-sm text-red-400">
                  Funcionários demitidos
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-400 text-sm sm:text-base">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Tempo Médio</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : `${Math.floor((stats?.tempoMedioEmpresa || 0) / 365)} anos`}
                </div>
                <div className="text-xs sm:text-sm text-blue-400">
                  Tempo médio na empresa
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabela de funcionários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <Card className="bg-gradient-to-br from-slate-800/80 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm flex-1 flex flex-col">
            <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                  Lista de Funcionários Inativos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500 text-white">
                    {funcionarios.length} funcionários
                  </Badge>
                  {funcionarios.length !== stats?.total && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-300">
                      Filtrado de {stats?.total}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : funcionarios.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-gray-400">
                  Nenhum funcionário encontrado com os filtros aplicados
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-yellow-500/20">
                          <TableHead className="text-yellow-300">Crachá</TableHead>
                          <TableHead className="text-yellow-300">Nome</TableHead>
                          <TableHead className="text-yellow-300">Função</TableHead>
                          <TableHead className="text-yellow-300">Departamento</TableHead>
                          <TableHead className="text-yellow-300">Situação</TableHead>
                          <TableHead className="text-yellow-300">Desligamento</TableHead>
                          <TableHead className="text-yellow-300">Tempo Empresa</TableHead>
                          <TableHead className="text-yellow-300">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {funcionariosPaginados.map((funcionario) => (
                          <TableRow key={funcionario.id} className="border-yellow-500/10 hover:bg-yellow-500/5">
                            <TableCell className="text-white font-medium">
                              {funcionario.cracha}
                            </TableCell>
                            <TableCell className="text-white">
                              <div>
                                <div className="font-medium">{funcionario.nome}</div>
                                <div className="text-xs text-gray-400">CPF: {funcionario.cpf}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">{funcionario.funcao}</TableCell>
                            <TableCell className="text-white">{funcionario.departamento}</TableCell>
                            <TableCell>
                              <Badge className={getSituacaoColor(funcionario.situacao)}>
                                <span className="flex items-center gap-1">
                                  {getSituacaoIcon(funcionario.situacao)}
                                  {funcionario.situacaoDescricao}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">
                              {formatDate(funcionario.dtDesligQuita)}
                            </TableCell>
                            <TableCell className="text-white">
                              {Math.floor(funcionario.tempoEmpresaDias / 365)} anos
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-yellow-400 hover:bg-yellow-500/20"
                                    onClick={() => setSelectedFuncionario(funcionario)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl bg-slate-800 border-yellow-500/30 text-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-yellow-300">
                                      Detalhes do Funcionário
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedFuncionario && (
                                    <div className="space-y-6">
                                      {/* Status de Afastamento/Demissão */}
                                      <div className="bg-yellow-50/10 p-4 rounded-lg border border-yellow-500/30">
                                        <div className="flex items-center gap-2 mb-2">
                                          {getSituacaoIcon(selectedFuncionario.situacao)}
                                          <h3 className="font-semibold text-yellow-300">
                                            Status: {selectedFuncionario.situacaoDescricao}
                                          </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <strong>Cidade:</strong> {selectedFuncionario.cidade}
                                          </div>
                                          {selectedFuncionario.dtDesligQuita && (
                                            <div>
                                              <strong>Data de Desligamento:</strong> {formatDate(selectedFuncionario.dtDesligQuita)}
                                            </div>
                                          )}
                                          <div>
                                            <strong>Tempo na Empresa:</strong> {Math.floor(selectedFuncionario.tempoEmpresaDias / 365)} anos
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                          <h3 className="font-semibold text-yellow-300">Informações Pessoais</h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Nome:</strong> {selectedFuncionario.nome}</div>
                                            <div><strong>CPF:</strong> {selectedFuncionario.cpf}</div>
                                            <div><strong>Crachá:</strong> {selectedFuncionario.cracha}</div>
                                            <div><strong>Idade:</strong> {selectedFuncionario.idade} anos</div>
                                            <div><strong>Admissão:</strong> {formatDate(selectedFuncionario.dataAdmissao)}</div>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <h3 className="font-semibold text-yellow-300">Informações Profissionais</h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Função:</strong> {selectedFuncionario.funcao}</div>
                                            <div><strong>Departamento:</strong> {selectedFuncionario.departamento}</div>
                                            <div><strong>Área:</strong> {selectedFuncionario.area}</div>
                                            <div><strong>Último Salário:</strong> {formatCurrency(parseFloat(selectedFuncionario.salarioTotal || '0'))}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-yellow-500/20">
                      <div className="text-sm text-gray-400">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, funcionarios.length)} de {funcionarios.length} funcionários
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-yellow-300">
                          {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}