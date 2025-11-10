import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Download,
  ChevronDown,
  BarChart3,
  FileText,
  Target,
  Activity,
  FileSpreadsheet,
  Building,
  Clock,
  Database,
  MapPin
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { useFuncionariosCompletos } from '../../../services/departments/pessoal/hooks/useFuncionariosCompletos';
import logoImage from '@/assets/logo.png';

// Hook para dados do pessoal com limite alto
const usePessoalAnalytics = () => {
  const {
    funcionarios,
    loading,
    error,
    totalRecords,
    refetch
  } = useFuncionariosCompletos({
    page: 1,
    limit: 50000 // ✅ LIMITE ALTO PARA PEGAR TODOS OS DADOS
  });

  // Processar dados para analytics
  const analytics = useMemo(() => {
    if (!funcionarios.length) return null;

    const totalFuncionarios = funcionarios.length;
    const funcionariosAtivos = funcionarios.filter(f => f.situacao === 'A').length;
    const funcionariosAfastados = funcionarios.filter(f => f.situacao === 'F').length;
    const funcionariosDemitidos = funcionarios.filter(f => f.situacao === 'D').length;

    // Calcular idades
    const idades = funcionarios.map(f => f.idade).filter(i => i > 0);
    const idadeMedia = idades.length > 0 ? idades.reduce((sum, i) => sum + i, 0) / idades.length : 0;

    // Funcionários por departamento
    const porDepartamento = {};
    funcionarios.forEach(f => {
      porDepartamento[f.departamento] = (porDepartamento[f.departamento] || 0) + 1;
    });

    // Cidades de afastamento (para funcionários afastados)
    const cidadesAfastamento = {};
    funcionarios.filter(f => f.situacao === 'F' && f.cidade).forEach(f => {
      cidadesAfastamento[f.cidade] = (cidadesAfastamento[f.cidade] || 0) + 1;
    });

    // Admissões recentes (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    const admisoesRecentes = funcionarios.filter(f => {
      const dataAdmissao = new Date(f.dataAdmissao);
      return dataAdmissao >= trintaDiasAtras;
    }).length;

    // Desligamentos recentes (últimos 30 dias)
    const desligamentosRecentes = funcionarios.filter(f => {
      if (!f.dtDesligQuita) return false;
      const dataDeslig = new Date(f.dtDesligQuita);
      return dataDeslig >= trintaDiasAtras;
    }).length;

    // Top departamentos
    const topDepartamentos = Object.entries(porDepartamento)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([dept, count]) => ({ departamento: dept, total: count }));

    // Top cidades de afastamento
    const topCidadesAfastamento = Object.entries(cidadesAfastamento)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cidade, count]) => ({ cidade, total: count }));

    return {
      totalFuncionarios,
      funcionariosAtivos,
      funcionariosAfastados,
      funcionariosDemitidos,
      idadeMedia,
      admisoesRecentes,
      desligamentosRecentes,
      topDepartamentos,
      topCidadesAfastamento,
      porDepartamento,
      percentualAtivos: totalFuncionarios > 0 ? (funcionariosAtivos / totalFuncionarios) * 100 : 0,
      percentualAfastados: totalFuncionarios > 0 ? (funcionariosAfastados / totalFuncionarios) * 100 : 0,
      percentualDemitidos: totalFuncionarios > 0 ? (funcionariosDemitidos / totalFuncionarios) * 100 : 0
    };
  }, [funcionarios]);

  return { analytics, funcionarios, loading, error, refetch, totalRecords };
};

export default function DashboardPessoalPage() {
  const navigate = useNavigate();
  const { analytics, loading, error, refetch } = usePessoalAnalytics();

  // Configuração dos cards de estatísticas principais
  const statsCards = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: "Total de Funcionários",
        value: analytics.totalFuncionarios.toLocaleString('pt-BR'),
        icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />,
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        borderColor: "border-indigo-200 dark:border-indigo-800",
        textColor: "text-indigo-800 dark:text-indigo-200",
        description: "Funcionários cadastrados no sistema",
        trend: `+${analytics.admisoesRecentes} admissões (30 dias)`,
        trendColor: "text-green-600"
      },
      {
        title: "Funcionários Ativos",
        value: analytics.funcionariosAtivos.toLocaleString('pt-BR'),
        icon: <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />,
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        textColor: "text-green-800 dark:text-green-200",
        description: "Funcionários em atividade",
        trend: `${analytics.percentualAtivos.toFixed(1)}% do total`,
        trendColor: "text-green-600"
      },
      {
        title: "Funcionários Afastados",
        value: analytics.funcionariosAfastados.toLocaleString('pt-BR'),
        icon: <UserMinus className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-200",
        description: "Funcionários afastados",
        trend: `${analytics.percentualAfastados.toFixed(1)}% do total`,
        trendColor: "text-yellow-600"
      },
      {
        title: "Funcionários Demitidos",
        value: analytics.funcionariosDemitidos.toLocaleString('pt-BR'),
        icon: <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        description: "Funcionários demitidos",
        trend: `${analytics.desligamentosRecentes} desligamentos (60 dias)`,
        trendColor: "text-red-600"
      }
    ];
  }, [analytics]);

  // Configuração dos cards de ações rápidas
  const quickActions = useMemo(() => [
    {
      title: "Funcionários Ativos",
      description: "Gestão de funcionários em atividade",
      icon: "👥",
      path: "/pessoal/funcionarios-ativos",
      count: analytics?.funcionariosAtivos || 0,
      color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      borderColor: "border-green-200 dark:border-green-800 hover:border-green-400"
    },
    {
      title: "Funcionários Afastados",
      description: "Funcionários temporariamente afastados",
      icon: "⚠️",
      path: "/pessoal/funcionarios-afastados",
      count: analytics?.funcionariosAfastados || 0,
      color: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
      borderColor: "border-yellow-200 dark:border-yellow-800 hover:border-yellow-400"
    },
    {
      title: "Funcionários Demitidos",
      description: "Histórico de funcionários demitidos",
      icon: "❌",
      path: "/pessoal/funcionarios-demitidos",
      count: analytics?.funcionariosDemitidos || 0,
      color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      borderColor: "border-red-200 dark:border-red-800 hover:border-red-400"
    },
    {
      title: "Todos os Funcionários",
      description: "Visualização completa do quadro",
      icon: "📋",
      path: "/pessoal/funcionarios-completos",
      count: analytics?.totalFuncionarios || 0,
      color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      borderColor: "border-blue-200 dark:border-blue-800 hover:border-blue-400"
    },
    {
      title: "Gráficos & Analytics",
      description: "Análises visuais e relatórios",
      icon: "📊",
      path: "/pessoal/graficos",
      count: "6 gráficos",
      color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      borderColor: "border-purple-200 dark:border-purple-800 hover:border-purple-400"
    }
  ], [analytics]);

  const handleRefresh = async () => {
    await refetch();
  };

  // Componente de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="sm"
            className="mb-4 sm:mb-6 border-indigo-300 text-indigo-700 hover:bg-indigo-100 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <UserX className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">
                    Erro ao carregar dados
                  </h2>
                  <p className="text-sm sm:text-base text-red-600 dark:text-red-300">
                    {error}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleRefresh} 
                      variant="outline" 
                      size="sm"
                      className="border-red-300 text-red-700 w-full sm:w-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                    <Button 
                      onClick={() => navigate('/home')} 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Voltar ao Início
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Breadcrumb */}
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="sm"
            className="self-start border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/20 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          {/* Title and Actions */}
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="space-y-3 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl self-start">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-indigo-600" />
                </div>
                <span className="leading-tight">Departamento Pessoal</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                Sistema integrado de gestão de funcionários e recursos humanos
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Atualizado:</span>
                  <span className="sm:hidden">Atualizado</span>
                  {new Date().toLocaleString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                  {analytics?.totalFuncionarios || 0} funcionários cadastrados
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-600 dark:text-indigo-300 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar Dados</span>
                <span className="sm:hidden">Atualizar</span>
              </Button>

              {/* Dropdown de Relatórios */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={loading}
                    size="sm"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Gerar Relatórios</span>
                    <span className="sm:hidden">Relatórios</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-w-[90vw]">
                  <DropdownMenuLabel className="text-indigo-700 dark:text-indigo-300 text-base">
                    📊 Relatórios Disponíveis
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem className="cursor-pointer p-3">
                    <Download className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Relatório Completo</span>
                      <span className="text-xs text-gray-500 break-words">Todos os funcionários com detalhes</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer p-3">
                    <FileSpreadsheet className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Excel Detalhado</span>
                      <span className="text-xs text-gray-500 break-words">Planilha com múltiplas abas</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer p-3">
                    <BarChart3 className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Relatório Analítico</span>
                      <span className="text-xs text-gray-500 break-words">Gráficos e estatísticas</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse border-indigo-200 dark:border-indigo-800">
                  <CardHeader className="pb-3">
                    <div className="h-5 sm:h-6 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-6 sm:h-8 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-indigo-200 dark:bg-indigo-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              statsCards.map((stat, index) => (
                <Card 
                  key={index} 
                  className={`hover:shadow-xl transition-all duration-300 ${stat.bgColor} ${stat.borderColor} hover:scale-105`}
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className={`flex items-center gap-2 sm:gap-3 ${stat.textColor}`}>
                      {stat.icon}
                      <span className="text-xs sm:text-sm font-semibold leading-tight">{stat.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
                      {stat.value}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                      {stat.description}
                    </p>
                    <p className={`text-xs font-medium flex items-center gap-1 ${stat.trendColor} break-words`}>
                      <TrendingUp className="w-3 h-3 flex-shrink-0" />
                      <span className="break-words">{stat.trend}</span>
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-indigo-200 dark:border-indigo-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-indigo-800 dark:text-indigo-200 text-lg sm:text-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                <span className="leading-tight">Acesso Rápido às Funcionalidades</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${action.borderColor} bg-gradient-to-br ${action.color} hover:scale-105`}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                      <div className="text-3xl sm:text-4xl lg:text-5xl">{action.icon}</div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg leading-tight">
                          {action.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                          {action.description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Badge className="bg-indigo-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {typeof action.count === 'number' ? action.count.toLocaleString('pt-BR') : action.count}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Departments Section
        <Card className="border-indigo-200 dark:border-indigo-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-indigo-800 dark:text-indigo-200 text-lg sm:text-xl">
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  <span className="leading-tight">Top Departamentos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {analytics.topDepartamentos.map((dept, index) => (
                    <Card 
                      key={dept.departamento} 
                      className={`text-center border-2 transition-all duration-300 hover:scale-105 ${
                        index === 0 ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20' :
                        index === 1 ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-700' :
                        'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
                      }`}
                    >
                      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold mx-auto text-lg sm:text-xl ${
                          index === 0 ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 
                          index === 1 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 
                          'bg-gradient-to-br from-purple-400 to-purple-600'
                        }`}>
                          {index + 1}º
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg leading-tight">
                            {dept.departamento}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900 dark:text-white">
                            {dept.total.toLocaleString('pt-BR')} funcionários
                          </p>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-semibold break-words">
                            {((dept.total / analytics.totalFuncionarios) * 100).toFixed(1)}% do total
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
        */}
        {!loading && analytics?.topDepartamentos?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            
          </motion.div>
        )}

        {/* Cidades de Afastamento Section
         {!loading && analytics?.topCidadesAfastamento?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-yellow-200 dark:border-yellow-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-yellow-800 dark:text-yellow-200 text-lg sm:text-xl">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  <span className="leading-tight">Ma Cidades de Afastamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {analytics.topCidadesAfastamento.map((cidade, index) => (
                    <Card 
                      key={cidade.cidade} 
                      className="text-center border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 transition-all duration-300 hover:scale-105"
                    >
                      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold mx-auto text-lg sm:text-xl">
                          {index + 1}º
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg leading-tight">
                            {cidade.cidade}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900 dark:text-white">
                            {cidade.total.toLocaleString('pt-BR')} afastamentos
                          </p>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-semibold break-words">
                            {((cidade.total / analytics.funcionariosAfastados) * 100).toFixed(1)}% dos afastados
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        */}
       

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-green-700 dark:text-green-300 text-lg sm:text-xl">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span className="leading-tight">Status do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-green-700 dark:text-green-300 font-semibold text-sm sm:text-base lg:text-lg leading-tight">
                    Sistema operacional e funcionando perfeitamente
                  </span>
                </div>
                <div className="text-left sm:text-right space-y-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Última sincronização: {new Date().toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {analytics?.totalFuncionarios || 0} funcionários sincronizados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}