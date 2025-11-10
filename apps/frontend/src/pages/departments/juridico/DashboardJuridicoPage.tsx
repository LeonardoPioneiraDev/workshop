// src/pages/departments/juridico/DashboardJuridicoPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  AlertTriangle,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  Download,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
  Target,
  Activity,
  FileSpreadsheet,
  ChevronDown,
  TrendingUp,
  Calendar,
  Database,
  Clock,
  Building,
  Menu
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

// Importar o hook de relatórios atualizado
import { useRelatorios } from '@/hooks/useRelatorios';

// Hook para buscar dados reais do sistema
const useJuridicoAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Função para identificar multas SUFISA (mesmo critério do SEMOB)
  const isMultaSufisa = (multa) => {
    const temAgente = multa.agenteCodigo && multa.agenteCodigo.trim() !== '';
    const temPontos = multa.pontuacaoInfracao && multa.pontuacaoInfracao > 0;
    const temGrupo = multa.grupoInfracao && multa.grupoInfracao.trim() !== '';
    
    // Se tem agente E não tem pontos E não tem grupo, é SUFISA
    if (temAgente && !temPontos && !temGrupo) {
      return true;
    }
    
    // Se tem agente mas também tem pontos/grupo, é trânsito
    if (temAgente && (temPontos || temGrupo)) {
      return false;
    }
    
    // Default: se tem agente, considera SUFISA
    return temAgente;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados de múltiplas fontes em paralelo
      const [multasResponse, agentesResponse, setoresResponse] = await Promise.all([
        fetch('http://localhost:3336/juridico/multas-completas?limit=10000'),
        fetch('http://localhost:3336/juridico/multas-enhanced/agrupamentos/agente'),
        fetch('http://localhost:3336/juridico/historico-setores/multas-historico?limit=1000')
      ]);

      const [multasData, agentesData, setoresData] = await Promise.all([
        multasResponse.json(),
        agentesResponse.json(),
        setoresResponse.json()
      ]);

      if (multasData.success && agentesData.success && setoresData.success) {
        const multas = multasData.data;
        const agentesInfo = agentesData.data;

        // Separar multas por tipo
        const multasTransito = multas.filter(m => !m.agenteCodigo);
        const multasSemob = multas.filter(m => m.agenteCodigo);
        
        // ✅ Filtrar multas SUFISA (mesmo que SEMOB para este sistema)
        const multasSufisa = multas.filter(isMultaSufisa);

        // Calcular estatísticas principais
        const totalMultas = multas.length;
        const valorTotal = multas.reduce((sum, m) => sum + parseFloat(m.valorMulta || 0), 0);
        const pontosTotal = multas.reduce((sum, m) => sum + (m.pontuacaoInfracao || 0), 0);
        const veiculosUnicos = new Set(multas.map(m => m.prefixoVeic)).size;

        // Calcular multas recentes (últimos 30 dias)
        const hoje = new Date();
        const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
        const multasRecentes = multas.filter(m => {
          const dataMulta = new Date(m.dataHoraMulta);
          return dataMulta >= trintaDiasAtras;
        });

        // Processar dados finais
        const processedAnalytics = {
          totalMultas,
          valorTotal,
          pontosTotal,
          veiculosUnicos,
          totalTransito: multasTransito.length,
          totalSemob: multasSemob.length,
          totalSufisa: multasSufisa.length,
          valorTransito: multasTransito.reduce((sum, m) => sum + parseFloat(m.valorMulta || 0), 0),
          valorSemob: multasSemob.reduce((sum, m) => sum + parseFloat(m.valorMulta || 0), 0),
          valorSufisa: multasSufisa.reduce((sum, m) => sum + parseFloat(m.valorMulta || 0), 0),
          agentesAtivos: agentesInfo.length,
          multasRecentes: multasRecentes.length,
          valorMedio: totalMultas > 0 ? valorTotal / totalMultas : 0,
          pontosMedio: totalMultas > 0 ? pontosTotal / totalMultas : 0
        };

        setAnalytics(processedAnalytics);
        setAgentes(agentesInfo.slice(0, 3)); // Top 3 agentes
      } else {
        throw new Error('Erro ao carregar dados do servidor');
      }
    } catch (err) {
      console.error('Erro ao buscar analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { analytics, agentes, loading, error, refetch: fetchData };
};

export default function DashboardJuridicoPage() {
  const navigate = useNavigate();
  const { analytics, agentes, loading, error, refetch } = useJuridicoAnalytics();
  
  // Hook de relatórios com novas funcionalidades
  const { 
    loading: loadingRelatorio,
    gerarESalvarRelatorioCompleto,
    gerarESalvarExcel,
    gerarESalvarHTML,
    gerarRelatorioGeral,
    exportarParaExcel,
    exportarParaHTML
  } = useRelatorios();

  // Configuração dos cards de estatísticas principais
  const statsCards = useMemo(() => {
    if (!analytics) return [];

    return [
      {
        title: "Total de Multas",
        value: analytics.totalMultas.toLocaleString('pt-BR'),
        icon: <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-200",
        description: "Multas registradas no sistema",
        trend: `+${analytics.multasRecentes} (últimos 30 dias)`,
        trendColor: "text-green-600"
      },
      {
        title: "Valor Total",
        value: analytics.valorTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0
        }),
        icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-200",
        description: "Valor total das multas",
        trend: `Média: ${analytics.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        trendColor: "text-blue-600"
      },
      {
        title: "Agentes SEMOB",
        value: analytics.agentesAtivos.toString(),
        icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-200",
        description: "Agentes ativos no sistema",
        trend: `${analytics.totalSemob.toLocaleString('pt-BR')} multas SEMOB`,
        trendColor: "text-purple-600"
      },
      {
        title: "Pontos CNH",
        value: analytics.pontosTotal.toLocaleString('pt-BR'),
        icon: <Target className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-200",
        description: "Pontos aplicados total",
        trend: `Média: ${analytics.pontosMedio.toFixed(1)} pts/multa`,
        trendColor: "text-orange-600"
      }
    ];
  }, [analytics]);

  // ✅ Configuração dos cards de ações rápidas (ATUALIZADO COM SUFISA)
  const quickActions = useMemo(() => [
    {
      title: "Multas de Trânsito",
      description: "Gestão completa de multas de trânsito",
      icon: "🚌",
      path: "/departments/juridico/transito",
      count: analytics?.totalTransito || 0,
      value: analytics?.valorTransito || 0,
      color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      borderColor: "border-blue-200 dark:border-blue-800 hover:border-blue-400"
    },
    {
      title: "Multas SEMOB",
      description: "Gestão de multas da SEMOB",
      icon: "🚨",
      path: "/departments/juridico/semob",
      count: analytics?.totalSemob || 0,
      value: analytics?.valorSemob || 0,
      color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      borderColor: "border-red-200 dark:border-red-800 hover:border-red-400"
    },
    {
      title: "Multas SUFISA",
      description: "Superintendência de Fiscalização",
      icon: "🏛️",
      path: "/departments/juridico/sufisa",
      count: analytics?.totalSufisa || 0,
      value: analytics?.valorSufisa || 0,
      color: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
      borderColor: "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400"
    },
    {
      title: "Dashboards",
      description: "Gráficos e análises avançadas",
      icon: "📊",
      path: "/departments/juridico/graficos",
      count: "6 gráficos",
      value: null,
      color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      borderColor: "border-green-200 dark:border-green-800 hover:border-green-400"
    },
    {
      title: "Relatórios",
      description: "Relatórios personalizados e salvos",
      icon: "📋",
      path: "/departments/juridico/relatorios",
      count: "Personalizado",
      value: null,
      color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      borderColor: "border-purple-200 dark:border-purple-800 hover:border-purple-400"
    }
  ], [analytics]);

  // Handlers para ações
  const handleRefresh = async () => {
    await refetch();
  };

  // Handlers para relatórios com melhor organização
  const handleGerarRelatorioCompleto = async () => {
    try {
      await gerarESalvarRelatorioCompleto();
    } catch (error) {
      console.error('Erro ao gerar relatório completo:', error);
    }
  };

  const handleGerarExcel = async () => {
    try {
      await gerarESalvarExcel();
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
    }
  };

  const handleGerarHTML = async () => {
    try {
      await gerarESalvarHTML();
    } catch (error) {
      console.error('Erro ao gerar HTML:', error);
    }
  };

  // Componente de erro melhorado
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="sm"
            className="mb-4 sm:mb-6 border-yellow-300 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto"
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
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
            className="self-start border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/20 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          {/* Title and Actions */}
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="space-y-3 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl self-start">
                  <Scale className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-600" />
                </div>
                <span className="leading-tight">Departamento Jurídico</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                Sistema integrado de gestão de multas de trânsito, SEMOB e SUFISA
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
                  {analytics?.veiculosUnicos || 0} veículos únicos
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
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar Dados</span>
                <span className="sm:hidden">Atualizar</span>
              </Button>

              {/* Dropdown de Relatórios Melhorado */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={loadingRelatorio}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg w-full sm:w-auto"
                  >
                    <Download className={`w-4 h-4 mr-2 ${loadingRelatorio ? 'animate-spin' : ''}`} />
                    {loadingRelatorio ? 'Processando...' : (
                      <>
                        <span className="hidden sm:inline">Gerar Relatórios</span>
                        <span className="sm:hidden">Relatórios</span>
                      </>
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-w-[90vw]">
                  <DropdownMenuLabel className="text-yellow-700 dark:text-yellow-300 text-base">
                    �� Relatórios Disponíveis
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={handleGerarRelatorioCompleto}
                    disabled={loadingRelatorio}
                    className="cursor-pointer p-3"
                  >
                    <Download className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Relatório Completo</span>
                      <span className="text-xs text-gray-500 break-words">HTML + Excel formatado e salvo automaticamente</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleGerarExcel}
                    disabled={loadingRelatorio}
                    className="cursor-pointer p-3"
                  >
                    <FileSpreadsheet className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Excel Profissional</span>
                      <span className="text-xs text-gray-500 break-words">Planilha formatada com múltiplas abas</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleGerarHTML}
                    disabled={loadingRelatorio}
                    className="cursor-pointer p-3"
                  >
                    <FileText className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Relatório Visual</span>
                      <span className="text-xs text-gray-500 break-words">HTML estilizado para apresentação</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => navigate('/departments/juridico/relatorios')}
                    className="cursor-pointer p-3"
                  >
                    <BarChart3 className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Gerenciar Relatórios</span>
                      <span className="text-xs text-gray-500 break-words">Ver histórico e relatórios salvos</span>
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
              // Loading skeleton melhorado
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse border-yellow-200 dark:border-yellow-800">
                  <CardHeader className="pb-3">
                    <div className="h-5 sm:h-6 bg-yellow-200 dark:bg-yellow-700 rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-6 sm:h-8 bg-yellow-200 dark:bg-yellow-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-yellow-200 dark:bg-yellow-700 rounded"></div>
                    <div className="h-3 sm:h-4 bg-yellow-200 dark:bg-yellow-700 rounded w-3/4"></div>
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

        {/* Quick Actions - RESPONSIVO PARA 5 CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-yellow-200 dark:border-yellow-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-yellow-800 dark:text-yellow-200 text-lg sm:text-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                <span className="leading-tight">Acesso Rápido às Funcionalidades</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Grid responsivo para 5 cards */}
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
                        <Badge className="bg-yellow-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {typeof action.count === 'number' ? action.count.toLocaleString('pt-BR') : action.count}
                        </Badge>
                        {action.value && (
                          <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-semibold break-words">
                            {action.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Agents Section */}
        {!loading && agentes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-yellow-200 dark:border-yellow-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-yellow-800 dark:text-yellow-200 text-lg sm:text-xl">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  <span className="leading-tight">Top Agentes SEMOB/SUFISA</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {agentes.map((agente, index) => (
                    <Card 
                      key={agente.codigo} 
                      className={`text-center border-2 transition-all duration-300 hover:scale-105 ${
                        index === 0 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20' :
                        index === 1 ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700' :
                        'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
                      }`}
                    >
                      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold mx-auto text-lg sm:text-xl ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                          'bg-gradient-to-br from-orange-400 to-orange-600'
                        }`}>
                          {index + 1}º
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg leading-tight">
                            {agente.descricao}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Código: {agente.codigo}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900 dark:text-white">
                            {agente.total.toLocaleString('pt-BR')} multas
                          </p>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-semibold break-words">
                            {parseFloat(agente.valorTotal).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              maximumFractionDigits: 0
                            })}
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
                    Última sincronização: {new Date().toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Próxima manutenção: Domingo às 02:00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Overlay Responsivo */}
        {loadingRelatorio && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
            <Card className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-800 max-w-md w-full mx-4 shadow-2xl">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-0">
                <div className="relative flex-shrink-0">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-yellow-500 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                    Gerando Relatório
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                    Coletando dados, formatando e salvando automaticamente...
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Processando {loadingRelatorio ? '...' : 'concluído'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
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