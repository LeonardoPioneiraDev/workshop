// src/pages/departments/operacoes/DashboardOperacoesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  Settings,
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Truck,
  FileText,
  History,
  BarChart3,
  CheckCircle,
  Database,
  Activity
} from 'lucide-react';
import { OperacoesDashboard } from '@/components/operacoes/dashboard/OperacoesDashboard';
import { SincronizacaoComponent } from '@/components/operacoes/SincronizacaoComponent';
import { VeiculoDetailsModal } from '@/components/operacoes/modals/VeiculoDetailsModal';
import { useOperacoesData } from '@/services/departments/operacoes/hooks/useOperacoesData';
import type { FiltrosDashboard } from '@/types/departments/operacoes';

export function DashboardOperacoesPage() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    ano: new Date().getFullYear(),
    incluirTendencias: true,
    incluirRecomendacoes: true
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showSincronizacao, setShowSincronizacao] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<any>(null);
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);

  const { stats, loading, error, refetch, isConnected } = useOperacoesData({
    enabled: true,
    autoLoad: true,
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdate(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSincronizacaoSuccess = async (resultado: any) => {
    console.log('✅ Sincronização concluída com sucesso:', resultado);
    // Recarregar dados após sincronização
    await refetch();
    setLastUpdate(new Date());
  };

  const handleSincronizacaoError = (erro: string) => {
    console.error('❌ Erro na sincronização:', erro);
  };

  const handleExport = () => {
    // Implementar exportação do dashboard
    console.log('Exportando dashboard de operações...');
  };

  const handleFiltrosChange = (novosFiltros: FiltrosDashboard) => {
    setFiltros(novosFiltros);
  };

  const handleSincronizar = () => {
    setShowSincronizacao(true);
  };

  const handleSincronizacaoClose = () => {
    setShowSincronizacao(false);
  };

  const handleViewVeiculo = (veiculo: any) => {
    setSelectedVeiculo(veiculo);
    setShowVeiculoModal(true);
  };

  const handleCloseVeiculoModal = () => {
    setShowVeiculoModal(false);
    setSelectedVeiculo(null);
  };

  // Cards de estatísticas principais
  const statsCards = useMemo(() => {
    if (!stats || stats.veiculos.total === 0) {
      console.warn('⚠️ [DASHBOARD] Stats vazio ou zerado:', stats);
      return [];
    }

    return [
      {
        title: "Frota Total",
        value: stats.veiculos.total.toString(),
        icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-200",
        description: "Veículos no sistema",
        trend: `${stats.veiculos.ativos} ativos (${stats.veiculos.percentualAtivos.toFixed(1)}%)`,
        trendColor: "text-green-600"
      },
      {
        title: "Acidentes",
        value: stats.acidentes.total.toString(),
        icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        description: "Total de acidentes registrados",
        trend: `${stats.acidentes.comVitimas} com vítimas`,
        trendColor: "text-orange-600"
      },
      {
        title: "Eficiência Operacional",
        value: `${stats.estatisticas.eficienciaOperacional.toFixed(1)}%`,
        icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />,
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        textColor: "text-green-800 dark:text-green-200",
        description: "Performance da frota",
        trend: stats.estatisticas.eficienciaOperacional >= 85 ? 'Boa' : 'Atenção',
        trendColor: stats.estatisticas.eficienciaOperacional >= 85 ? "text-green-600" : "text-red-600"
      },
      {
        title: "Sinistralidade",
        value: `${stats.estatisticas.indiceSinistralidade.toFixed(2)}%`,
        icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />,
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-800",
        textColor: "text-purple-800 dark:text-purple-200",
        description: "Índice de sinistralidade",
        trend: stats.estatisticas.indiceSinistralidade <= 5 ? 'Dentro da meta' : 'Crítco',
        trendColor: stats.estatisticas.indiceSinistralidade <= 5 ? "text-green-600" : "text-red-600"
      }
    ];
  }, [stats]);

  // Ações rápidas
  const quickActions = useMemo(() => [
    {
      title: "Gestão de Frota",
      description: "Gerenciar veículos e manutenção",
      icon: "🚌",
      path: "/departments/operacoes/frota",
      count: stats?.veiculos.total || 0,
      value: null,
      color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      borderColor: "border-blue-200 dark:border-blue-800 hover:border-blue-400"
    },
    {
      title: "Histórico de Veículos",
      description: "Consultar histórico completo",
      icon: "📋",
      path: "/departments/operacoes/historico",
      count: "Completo",
      value: null,
      color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      borderColor: "border-green-200 dark:border-green-800 hover:border-green-400"
    },
    {
      title: "Gestão de Acidentes",
      description: "Gerenciar acidentes e sinistros",
      icon: "⚠️",
      path: "/departments/operacoes/acidentes",
      count: stats?.acidentes.total || 0,
      value: null,
      color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      borderColor: "border-red-200 dark:border-red-800 hover:border-red-400"
    },
    {
      title: "Analytics",
      description: "Gráficos e análises avançadas",
      icon: "📊",
      path: "/departments/operacoes/analytics",
      count: "Análises",
      value: null,
      color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      borderColor: "border-purple-200 dark:border-purple-800 hover:border-purple-400"
    },
    {
      title: "Relatórios",
      description: "Relatórios personalizados",
      icon: "📄",
      path: "/departments/operacoes/relatorios",
      count: "Personalizados",
      value: null,
      color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      borderColor: "border-orange-200 dark:border-orange-800 hover:border-orange-400"
    }
  ], [stats]);

  // Componente de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="sm"
            className="mb-4 sm:mb-6 border-blue-300 text-blue-700 hover:bg-blue-100 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 flex-shrink-0" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
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
            className="self-start border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          {/* Title and Actions */}
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="space-y-3 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl self-start">
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" />
                </div>
                <span className="leading-tight">Departamento de Operações</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                Gestão completa de frota, acidentes e performance operacional
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? 'Sistema Online' : 'Sistema Offline'}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  Atualizado: {lastUpdate.toLocaleString('pt-BR')}
                </span>
                {stats && (
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                    {stats.veiculos.total} veículos
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
                <span className="sm:hidden">{isRefreshing ? 'Sincronizando' : 'Sincronizar'}</span>
              </Button>

              <Button
                onClick={handleExport}
                disabled={loading}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exportar Dados</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
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
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <div className="h-5 sm:h-6 bg-blue-200 dark:bg-blue-700 rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-6 sm:h-8 bg-blue-200 dark:bg-blue-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-blue-200 dark:bg-blue-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-blue-200 dark:bg-blue-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : statsCards.length === 0 ? (
              <Card className="col-span-full border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <CardContent className="p-6 text-center">
                  <Database className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Aguardando dados da API
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                    Verifique se o backend está rodando em <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">http://localhost:3336</code>
                  </p>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </CardContent>
              </Card>
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
          <Card className="border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-blue-800 dark:text-blue-200 text-lg sm:text-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span className="leading-tight">Acesso Rápido às Funcionalidades</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      <Badge className="bg-blue-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1">
                        {typeof action.count === 'number' ? action.count.toLocaleString('pt-BR') : action.count}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sincronização de Dados
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SincronizacaoComponent
            titulo="Sincronização de Dados do Sistema"
            subtitulo="Buscar dados atualizados do sistema Globus (Oracle) e sincronizar com o banco local"
            onSuccess={handleSincronizacaoSuccess}
            onError={handleSincronizacaoError}
            showProgress={true}
            autoClose={false}
          />
        </motion.div>
        */}
      

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-green-700 dark:text-green-300 text-lg sm:text-xl">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
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
                    Última sincronização: {lastUpdate.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Próxima manutenção: Domingo às 02:00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Overlay */}
        {isRefreshing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
            <Card className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 max-w-md w-full mx-4 shadow-2xl">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-0">
                <div className="relative flex-shrink-0">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-500 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                    Sincronizando Dados
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                    Atualizando informações do sistema...
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Processando...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
