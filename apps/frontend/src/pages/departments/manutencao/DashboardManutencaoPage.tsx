// src/pages/departments/manutencao/DashboardManutencaoPage.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Download,
  ChevronDown,
  BarChart3,
  Target,
  Activity,
  FileSpreadsheet,
  Building,
  Database,
  Calendar,
  Filter,
  Eye,
  Zap,
  DollarSign,
  Truck,
  Settings
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

import { useManutencao2025 } from '@/hooks/useManutencao2025';
import { FiltrosAvancados } from '@/components/manutencao/FiltrosAvancados';
import { RelatoriosManutencaoService } from '@/services/relatorios/relatoriosManutencao';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';


export function DashboardManutencaoPage() {
  const navigate = useNavigate();
  const {
    ordensServico,
    estatisticasComparativas,
    loading,
    error,
    filtros,
    carregarDados,
    sincronizar,
    resetarFiltros
  } = useManutencao2025();

  // Configuração dos cards de estatísticas principais com comparação mensal
  const statsCards = useMemo(() => {
    if (!estatisticasComparativas) return [];

    const { mesAtual, crescimento } = estatisticasComparativas;

    return [
      {
        title: "Total OS - 2025",
        value: mesAtual.resumo.totalRegistros.toLocaleString('pt-BR'),
        icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />,
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
        textColor: "text-orange-800 dark:text-orange-200",
        description: "Ordens de serviço no período",
        trend: crescimento.totalOS !== 0 
          ? `${crescimento.totalOS >= 0 ? '+' : ''}${crescimento.totalOS.toFixed(1)}% vs mês anterior`
          : `R$ ${parseFloat(mesAtual.indicadores.totalValorTerceiros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} terceiros`,
        trendColor: crescimento.totalOS >= 0 ? "text-green-600" : "text-red-600",
        trendIcon: crescimento.totalOS >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
      },
      {
        title: "OS Abertas",
        value: mesAtual.resumo.osAbertas.toLocaleString('pt-BR'),
        icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />,
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        textColor: "text-green-800 dark:text-green-200",
        description: "Ordens em andamento",
        trend: crescimento.osAbertas !== 0
          ? `${crescimento.osAbertas >= 0 ? '+' : ''}${crescimento.osAbertas.toFixed(1)}% vs mês anterior`
          : `${((mesAtual.resumo.osAbertas / mesAtual.resumo.totalRegistros) * 100).toFixed(1)}% do total`,
        trendColor: crescimento.osAbertas >= 0 ? "text-orange-600" : "text-green-600",
        trendIcon: crescimento.osAbertas >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
      },
      {
        title: "Quebras & Defeitos",
        value: (mesAtual.resumo.quebras + mesAtual.resumo.defeitos).toLocaleString('pt-BR'),
        icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        description: "Manutenções não programadas",
        trend: `${mesAtual.resumo.socorros} socorros realizados`,
        trendColor: "text-red-600",
        trendIcon: <Zap className="w-3 h-3" />
      },
      {
        title: "Custos Terceiros",
        value: `R$ ${parseFloat(mesAtual.indicadores.totalValorTerceiros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-200",
        description: "Valor gasto com terceiros",
        trend: crescimento.valorTerceiros !== 0
          ? `${crescimento.valorTerceiros >= 0 ? '+' : ''}${crescimento.valorTerceiros.toFixed(1)}% vs mês anterior`
          : `${mesAtual.resumo.osFechadas.toLocaleString('pt-BR')} OS fechadas`,
        trendColor: crescimento.valorTerceiros >= 0 ? "text-red-600" : "text-green-600",
        trendIcon: crescimento.valorTerceiros >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
      }
    ];
  }, [estatisticasComparativas]);

  // Configuração dos cards de ações rápidas
  const quickActions = useMemo(() => [
    {
      title: "Todas as OS",
      description: "Visualizar todas as ordens de 2025",
      icon: "🔧",
      path: "/departments/manutencao/ordens-servico",
      count: estatisticasComparativas?.mesAtual.resumo.totalRegistros || 0,
      color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      borderColor: "border-orange-200 dark:border-orange-800 hover:border-orange-400"
    },
    {
      title: "OS Abertas",
      description: "Ordens pendentes de finalização",
      icon: "⏱️",
      path: "/departments/manutencao/ordens-servico?status=A",
      count: estatisticasComparativas?.mesAtual.resumo.osAbertas || 0,
      color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      borderColor: "border-green-200 dark:border-green-800 hover:border-green-400"
    },
    {
      title: "Manutenção Preventiva",
      description: "Manutenções programadas",
      icon: "📋",
      path: "/departments/manutencao/ordens-servico?tipo=P",
      count: estatisticasComparativas?.mesAtual.distribuicoes.tiposOS['Preventiva'] || 0,
      color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      borderColor: "border-blue-200 dark:border-blue-800 hover:border-blue-400"
    },
    {
      title: "Manutenção Corretiva",
      description: "Quebras e correções",
      icon: "⚠️",
      path: "/departments/manutencao/ordens-servico?tipo=C",
      count: estatisticasComparativas?.mesAtual.distribuicoes.tiposOS['Corretiva'] || 0,
      color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      borderColor: "border-red-200 dark:border-red-800 hover:border-red-400"
    },
    {
      title: "Dashboard Gráfico",
      description: "Análises visuais detalhadas",
      icon: "📊",
      path: "/departments/manutencao/graficos",
      count: "6 gráficos",
      color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      borderColor: "border-purple-200 dark:border-purple-800 hover:border-purple-400"
    }
  ], [estatisticasComparativas]);

  const handleSincronizar = async () => {
    try {
      await sincronizar();
      toast.success('Sincronização concluída com sucesso!');
    } catch (err) {
      toast.error('Erro ao sincronizar dados');
    }
  };

  const handleExportarHTML = () => {
    if (ordensServico.length === 0 || !estatisticasComparativas) {
      toast.error('Nenhum dado disponível para exportação');
      return;
    }
    
    try {
      RelatoriosManutencaoService.abrirRelatorioHTML(ordensServico, estatisticasComparativas, filtros);
      toast.success('Relatório HTML gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório HTML');
    }
  };

  const handleExportarExcel = () => {
    if (ordensServico.length === 0 || !estatisticasComparativas) {
      toast.error('Nenhum dado disponível para exportação');
      return;
    }
    
    try {
      RelatoriosManutencaoService.gerarRelatorioExcel(ordensServico, estatisticasComparativas, filtros);
      toast.success('Relatório Excel baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório Excel');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="sm"
            className="mb-6 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                  Erro ao carregar dados de manutenção
                </h2>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => carregarDados()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button onClick={() => navigate('/home')} variant="outline">
                    Voltar ao Início
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Wrench className="w-8 lg:w-10 h-8 lg:h-10 text-white" />
                </div>
                <span>Manutenção 2025</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Sistema integrado de gestão de manutenção da frota
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Atualizado: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {estatisticasComparativas?.mesAtual.resumo.totalRegistros || 0} OS cadastradas
                </span>
                {filtros.mesAtual && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    Mês Atual
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={handleSincronizar}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Sincronizando...' : 'Sincronizar'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={loading || ordensServico.length === 0}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Relatórios
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-orange-700 dark:text-orange-300">
                    📊 Relatórios Disponíveis
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem className="cursor-pointer p-3" onClick={handleExportarHTML}>
                    <Eye className="w-5 h-5 mr-3 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="font-semibold">Relatório HTML</span>
                      <span className="text-xs text-gray-500">Visualização completa formatada</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer p-3" onClick={handleExportarExcel}>
                    <FileSpreadsheet className="w-5 h-5 mr-3 text-green-500" />
                    <div className="flex flex-col">
                      <span className="font-semibold">Planilha Excel</span>
                      <span className="text-xs text-gray-500">Múltiplas abas com dados detalhados</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Filtros Avançados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FiltrosAvancados
            filtros={filtros}
            onFiltrosChange={carregarDados}
            onResetarFiltros={resetarFiltros}
            loading={loading}
            totalRegistros={ordensServico.length}
          />
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <div className="h-5 bg-orange-200 dark:bg-orange-700 rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-8 bg-orange-200 dark:bg-orange-700 rounded"></div>
                    <div className="h-4 bg-orange-200 dark:bg-orange-700 rounded"></div>
                    <div className="h-4 bg-orange-200 dark:bg-orange-700 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              statsCards.map((stat, index) => (
                <Card 
                  key={index} 
                  className={`hover:shadow-xl transition-all duration-300 ${stat.bgColor} ${stat.borderColor} hover:scale-105`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className={`flex items-center gap-3 ${stat.textColor}`}>
                      {stat.icon}
                      <span className="text-sm font-semibold">{stat.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.description}
                    </p>
                    <p className={`text-xs font-medium flex items-center gap-1 ${stat.trendColor}`}>
                      {stat.trendIcon}
                      <span>{stat.trend}</span>
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
          transition={{ delay: 0.3 }}
        >
          <Card className="border-orange-200 dark:border-orange-800 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-orange-800 dark:text-orange-200 text-xl">
                <Activity className="w-6 h-6 text-orange-600" />
                <span>Acesso Rápido às Funcionalidades</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer hover:shadow-xl transition-all duration-300 ${action.borderColor} bg-gradient-to-br ${action.color} hover:scale-105`}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="text-4xl lg:text-5xl">{action.icon}</div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Badge className="bg-orange-500 text-white px-3 py-1">
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

        {/* Top Performance Cards */}
        {!loading && estatisticasComparativas && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Top Garagens */}
            <Card className="border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Building className="w-5 h-5 text-blue-600" />
                  Top Garagens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estatisticasComparativas.top.garagens.map((garagem, index) => (
                  <div key={garagem.nome} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{garagem.nome}</p>
                        <p className="text-xs text-gray-500">{garagem.percentual.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">{garagem.total} OS</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Problemas */}
            <Card className="border-red-200 dark:border-red-800 bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Top Problemas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estatisticasComparativas.top.problemas.map((problema, index) => (
                  <div key={problema.tipo} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{problema.tipo}</p>
                        <p className="text-xs text-gray-500">{problema.percentual.toFixed(1)}% do total</p>
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-700">{problema.total} OS</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Veículos */}
            <Card className="border-green-200 dark:border-green-800 bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Truck className="w-5 h-5 text-green-600" />
                  Veículos c/ Mais OS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estatisticasComparativas.top.veiculos.map((veiculo, index) => (
                  <div key={`${veiculo.prefixo}-${veiculo.placa}`} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{veiculo.prefixo}</p>
                        <p className="text-xs text-gray-500">{veiculo.placa}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">{veiculo.total} OS</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-green-700 dark:text-green-300">
                <Database className="w-6 h-6 text-green-600" />
                <span>Status do Sistema de Manutenção</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 dark:text-green-300 font-semibold text-lg">
                    Sistema operacional - Dados de 2025 disponíveis
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Última sincronização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {estatisticasComparativas?.mesAtual.resumo.totalRegistros || 0} OS sincronizadas
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
