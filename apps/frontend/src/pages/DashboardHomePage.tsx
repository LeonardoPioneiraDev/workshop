import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Truck,
  Bus,
  DollarSign,
  Route,
  Wrench,
  Fuel,
  Scale,
  UserPlus,
  Clock,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  Building2,
  AlertTriangle,
  Database,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAuth } from '@/contexts/AuthContext';
import { useMultasAnalytics } from '@/services/departments/legal/hooks/useMultasAnalytics';
import { useFuncionariosCompletos } from '@/services/departments/pessoal/hooks/useFuncionariosCompletos';
import { useOperacoesData } from '@/services/departments/operacoes/hooks/useOperacoesData';
import { useManutencao2025 } from '@/hooks/useManutencao2025';
import logo from "@/assets/logo.png";

// ✅ Types
interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    maintenance: number;
    percentage: number;
  };
  revenue: {
    today: string;
    month: string;
    growth: string;
  };
  efficiency: {
    fuel: string;
    onTime: string;
    satisfaction: string;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

export function DashboardHomePage() {
  // ✅ Estados locais
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ Hooks
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ Controlar quando carregar dados baseado no usuário
  const shouldLoadJuridico = useMemo(() => {
    if (!user) return false;
    const allowedRoles = ['admin', 'diretor', 'juridico', 'gerente'];
    return allowedRoles.includes(user.role);
  }, [user?.role]);

  const shouldLoadPessoal = useMemo(() => {
    if (!user) return false;
    return ['admin', 'diretor', 'pessoal', 'rh'].includes(user.role);
  }, [user?.role]);

  const shouldLoadOperacoes = useMemo(() => {
    if (!user) return false;
    const allowedRoles = ['admin', 'diretor', 'operacoes', 'gerente'];
    return allowedRoles.includes(user.role);
  }, [user?.role]);

  const shouldLoadManutencao = useMemo(() => {
    if (!user) return false;
    return ['admin', 'diretor', 'manutencao', 'gerente'].includes(user.role);
  }, [user?.role]);

  // ✅ Dados do jurídico
  const { 
    analytics: juridicAnalytics, 
    loading: juridicLoading,
    error: juridicError,
    recarregar: refetchJuridico
  } = useMultasAnalytics({
    enabled: shouldLoadJuridico
  });

  // ✅ Dados dos funcionários completos
  const {
    funcionarios,
    loading: funcionariosLoading,
    error: funcionariosError,
    totalRecords,
    refetch: refetchPessoal
  } = useFuncionariosCompletos({
    enabled: shouldLoadPessoal,
    page: 1,
    limit: 10000,
    retry: 3,
    retryDelay: 10000,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('❌ [PESSOAL] Erro ao carregar funcionários:', error);
    },
    onSuccess: (data) => {
      console.log('✅ [PESSOAL] Funcionários carregados:', {
        total: data?.funcionarios?.length || 0,
        totalRecords: data?.totalRecords || 0
      });
    }
  });

  // ✅ Dados de operações
  const {
    stats: operacoesStats,
    loading: operacoesLoading,
    error: operacoesError,
    refetch: refetchOperacoes
  } = useOperacoesData({
    enabled: shouldLoadOperacoes,
    autoLoad: true,
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000
  });

  // ✅ Dados de manutenção
  const {
    ordensServico,
    estatisticasComparativas,
    loading: manutencaoLoading,
    error: manutencaoError,
    carregarDados: refetchManutencao
  } = useManutencao2025({
    enabled: shouldLoadManutencao,
    autoLoad: true
  });

  // ✅ Effects para verificar dados e erros
  useEffect(() => {
    if (shouldLoadJuridico && juridicError) {
      console.error('❌ [JURIDICO] Erro ao carregar dados:', juridicError);
    }
    if (shouldLoadJuridico && juridicAnalytics) {
      console.log('✅ [JURIDICO] Dados carregados:', juridicAnalytics);
    }
  }, [shouldLoadJuridico, juridicError, juridicAnalytics]);

  useEffect(() => {
    if (shouldLoadOperacoes && operacoesStats) {
      console.log('✅ [OPERACOES] Estrutura dos dados:', {
        stats: operacoesStats,
        veiculos: operacoesStats.veiculos,
        frota: operacoesStats.frota,
        acidentes: operacoesStats.acidentes,
        estatisticas: operacoesStats.estatisticas,
        kpis: operacoesStats.kpis
      });
    }
    if (shouldLoadOperacoes && operacoesError) {
      console.error('❌ [OPERACOES] Erro ao carregar dados:', operacoesError);
    }
  }, [shouldLoadOperacoes, operacoesStats, operacoesError]);

  // ✅ Dados simulados (memoizados)
  const dashboardStats = useMemo<DashboardStats>(() => ({
    vehicles: {
      total: operacoesStats?.veiculos?.total || operacoesStats?.frota?.totalVeiculos || 0,
      active: operacoesStats?.veiculos?.ativos || operacoesStats?.frota?.veiculosAtivos || 0,
      maintenance: operacoesStats?.veiculos?.manutencao || 0,
      percentage: operacoesStats?.veiculos?.percentualAtivos || 0
    },
    revenue: {
      today: "R$ 0",
      month: "R$ 0",
      growth: "+0.0%"
    },
    efficiency: {
      fuel: "0.0 km/L",
      onTime: "0.0%",
      satisfaction: "0.0%"
    },
    alerts: {
      critical: operacoesStats?.acidentes?.comVitimas || 0,
      warning: operacoesStats?.acidentes?.semVitimas || 0,
      info: operacoesStats?.veiculos?.manutencao || 0,
    }
  }), [operacoesStats]);

  // ✅ Função para calcular dados do jurídico
  const getJuridicStats = useCallback(() => {
    if (!shouldLoadJuridico) {
      return {
        totalMultas: "N/A",
        valorTotal: "N/A",
        agentesAtivos: "N/A",
        transitoTrend: "0%",
        semobTrend: "0%",
        pontosTotal: "0"
      };
    }

    if (juridicLoading) {
      return {
        totalMultas: "Carregando...",
        valorTotal: "Carregando...",
        agentesAtivos: "Carregando...",
        transitoTrend: "...",
        semobTrend: "...",
        pontosTotal: "..."
      };
    }

    if (juridicError) {
      return {
        totalMultas: "Erro",
        valorTotal: "Erro",
        agentesAtivos: "Erro",
        transitoTrend: "0%",
        semobTrend: "0%",
        pontosTotal: "0"
      };
    }

    if (!juridicAnalytics) {
      return {
        totalMultas: "0",
        valorTotal: "R$ 0",
        agentesAtivos: "0",
        transitoTrend: "0%",
        semobTrend: "0%",
        pontosTotal: "0"
      };
    }

    const totalMultas = (juridicAnalytics.totalTransito || 0) + (juridicAnalytics.totalSemob || 0);
    const valorTotal = (juridicAnalytics.valorTransito || 0) + (juridicAnalytics.valorSemob || 0);
    const agentesAtivos = juridicAnalytics.totalAgentesUnicos || 0;

    const transitoPercentage = totalMultas > 0 ? ((juridicAnalytics.totalTransito || 0) / totalMultas * 100) : 0;
    const semobPercentage = totalMultas > 0 ? ((juridicAnalytics.totalSemob || 0) / totalMultas * 100) : 0;

    return {
      totalMultas: totalMultas.toLocaleString('pt-BR'),
      valorTotal: valorTotal.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        maximumFractionDigits: 0 
      }),
      agentesAtivos: agentesAtivos.toString(),
      transitoTrend: `${transitoPercentage.toFixed(0)}%`,
      semobTrend: `${semobPercentage.toFixed(0)}%`,
      pontosTotal: (juridicAnalytics.pontosTotal || 0).toString()
    };
  }, [shouldLoadJuridico, juridicAnalytics, juridicLoading, juridicError]);

  // ✅ Função para dados do pessoal
  const getPessoalStatsFormatted = useCallback(() => {
    if (!shouldLoadPessoal) {
      return [
        { label: "Total Funcionários", value: "N/A", trend: "" },
        { label: "Ativos", value: "N/A", trend: "" } 
      ];
    }

    if (funcionariosLoading) {
      return [
        { label: "Total Funcionários", value: "Carregando...", trend: "" },
        { label: "Ativos", value: "Carregando...", trend: "" },
        { label: "Inativos", value: "Carregando...", trend: "" }
      ];
    }

    if (funcionariosError || !funcionarios.length) {
      return [
        { label: "Total Funcionários", value: "0", trend: "Sincronizar" },
        { label: "Ativos", value: "0", trend: "0%" },
        { label: "Inativos", value: "0", trend: "0%" }
      ];
    }

    const totalFuncionarios = funcionarios.length;
    const funcionariosAtivos = funcionarios.filter(f => f.situacao === 'A' && f.ativo).length;
    const funcionariosInativos = funcionarios.filter(f => f.situacao === 'F' || !f.ativo).length;

    const percentualAtivos = totalFuncionarios > 0 ? (funcionariosAtivos / totalFuncionarios) * 100 : 0;
    const percentualInativos = totalFuncionarios > 0 ? (funcionariosInativos / totalFuncionarios) * 100 : 0;

    return [
      { 
        label: "Total Funcionários", 
        value: totalFuncionarios.toLocaleString('pt-BR'), 
        trend: totalRecords > totalFuncionarios ? `+${totalRecords - totalFuncionarios}` : "0"
      },
      { 
        label: "Ativos", 
        value: funcionariosAtivos.toLocaleString('pt-BR'), 
        trend: `${percentualAtivos.toFixed(0)}%` 
      },
      { 
        label: "Inativos", 
        value: funcionariosInativos.toLocaleString('pt-BR'), 
        trend: `${percentualInativos.toFixed(0)}%` 
      }
    ];
  }, [
    shouldLoadPessoal,
    funcionariosLoading,
    funcionariosError,
    funcionarios,
    totalRecords
  ]);

  // ✅ Função para dados de operações - AJUSTADA
  const getOperacoesStatsFormatted = useCallback(() => {
    if (!shouldLoadOperacoes) {
      return [
        { label: "Veículos Ativos", value: "N/A", trend: "" },
        { label: "Acidentes Mês", value: "N/A", trend: "" },
        { label: "Eficiência Operacional", value: "N/A", trend: "" }
      ];
    }

    if (operacoesLoading) {
      return [
        { label: "Veículos Ativos", value: "Carregando...", trend: "" },
        { label: "Acidentes Mês", value: "Carregando...", trend: "" },
        { label: "Eficiência Operacional", value: "Carregando...", trend: "" }
      ];
    }

    if (operacoesError || !operacoesStats) {
      return [
        { label: "Veículos Ativos", value: "Erro", trend: "Falha" },
        { label: "Acidentes Mês", value: "Erro", trend: "Falha" },
        { label: "Eficiência Operacional", value: "Erro", trend: "Falha" }
      ];
    }

    // Extrair dados de múltiplas fontes possíveis
    const totalVeiculos = operacoesStats.veiculos?.total || operacoesStats.frota?.totalVeiculos || 0;
    const veiculosAtivos = operacoesStats.veiculos?.ativos || operacoesStats.frota?.veiculosAtivos || 0;
    const totalAcidentes = operacoesStats.acidentes?.mesAtual || operacoesStats.acidentes?.total || 0;
    const acidentesComVitimas = operacoesStats.acidentes?.comVitimas || 0;
    const eficiencia = operacoesStats.estatisticas?.eficienciaOperacional || 
                       operacoesStats.kpis?.eficienciaOperacional || 0;
    const sinistralidade = operacoesStats.estatisticas?.indiceSinistralidade || 
                          operacoesStats.kpis?.indiceSinistralidade || 10;

    // Calcular percentual de ativos
    const percentualAtivos = totalVeiculos > 0 
      ? (veiculosAtivos / totalVeiculos * 100).toFixed(1)
      : '0.0';

    return [
      { 
        label: "Veículos Ativos", 
        value: veiculosAtivos.toLocaleString('pt-BR'), 
        trend: `${percentualAtivos}%` 
      },
      { 
        label: "Acidentes Mês", 
        value: totalAcidentes.toLocaleString('pt-BR'), 
        trend: `${acidentesComVitimas} c/vítimas` 
      },
      { 
        label: "Eficiência Operacional", 
        value: `${eficiencia.toFixed(1)}%`, 
       
      }
    ];
  }, [shouldLoadOperacoes, operacoesLoading, operacoesError, operacoesStats]);

  // ✅ Função para dados de manutenção - AJUSTADA
  const getManutencaoStatsFormatted = useCallback(() => {
    if (!shouldLoadManutencao) {
      return [
        { label: "Total OS", value: "N/A", trend: "" },
        { label: "OS Abertas", value: "N/A", trend: "" },
         
      ];
    }

    if (manutencaoLoading) {
      return [
        { label: "Total OS", value: "Carregando...", trend: "" },
        { label: "OS Abertas", value: "Carregando...", trend: "" },
        { label: "Custos Terceiros", value: "Carregando...", trend: "" }
      ];
    }

    if (manutencaoError || !estatisticasComparativas) {
      return [
        { label: "Total OS", value: "Erro", trend: "Falha" },
        { label: "OS Abertas", value: "Erro", trend: "Falha" },
        { label: "Custos Terceiros", value: "Erro", trend: "Falha" }
      ];
    }

    const { mesAtual, crescimento } = estatisticasComparativas;

    // Calcular percentual de OS abertas
    const percentualAbertas = mesAtual.resumo.totalRegistros > 0
      ? ((mesAtual.resumo.osAbertas / mesAtual.resumo.totalRegistros) * 100).toFixed(1)
      : '0.0';

    // Formatar valor terceiros com segurança
    const valorTerceiros = parseFloat(mesAtual.indicadores.totalValorTerceiros || '0');
    const valorFormatado = valorTerceiros.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });

    return [
      { 
        label: "Total OS", 
        value: mesAtual.resumo.totalRegistros.toLocaleString('pt-BR'), 
        trend: crescimento.totalOS !== 0 
          ? `${crescimento.totalOS >= 0 ? '+' : ''}${crescimento.totalOS.toFixed(1)}%`
          : "0%" 
      },
      { 
        label: "OS Abertas", 
        value: mesAtual.resumo.osAbertas.toLocaleString('pt-BR'), 
        trend: `${percentualAbertas}%` 
      },
      { 
        label: "Custos Terceiros", 
        value: `R$ ${valorFormatado}`, 
        trend: crescimento.valorTerceiros !== 0
          ? `${crescimento.valorTerceiros >= 0 ? '+' : ''}${crescimento.valorTerceiros.toFixed(1)}%`
          : "0%"
      }
    ];
  }, [shouldLoadManutencao, manutencaoLoading, manutencaoError, estatisticasComparativas]);

  // ✅ Configuração dos cards dos departamentos
  const departmentCards = useMemo(() => {
    const juridicStats = getJuridicStats();
    const pessoalStats = getPessoalStatsFormatted();
    const operacoesStatsFormatted = getOperacoesStatsFormatted();
    const manutencaoStatsFormatted = getManutencaoStatsFormatted();

    // Determinar destaques
    const shouldHighlightPessoal = shouldLoadPessoal && funcionarios.length > 0;
    const shouldHighlightOperacoes = shouldLoadOperacoes && operacoesStats && 
      ((operacoesStats.veiculos?.ativos || operacoesStats.frota?.veiculosAtivos || 0) > 0);
    const shouldHighlightJuridico = shouldLoadJuridico && !juridicError && !juridicLoading && juridicAnalytics;
    const shouldHighlightManutencao = shouldLoadManutencao && !manutencaoError && !manutencaoLoading && estatisticasComparativas;

    return [
      {
        title: "Operações",
        description: "Gestão da frota e rotas operacionais",
        icon: <Bus className="w-6 h-6 text-blue-500" />,
        stats: operacoesStatsFormatted,
        color: "border-blue-500/30",
        bgColor: "bg-blue-500/10",
        path: "/departments/operacoes",
        highlight: shouldHighlightOperacoes && !operacoesError,
        enabled: shouldLoadOperacoes,
        loading: operacoesLoading,
        error: operacoesError,
        extraInfo: shouldLoadOperacoes && !operacoesLoading && operacoesStats ? {
          totalVeiculos: operacoesStats.veiculos?.total || operacoesStats.frota?.totalVeiculos || 0,
          veiculosAtivos: operacoesStats.veiculos?.ativos || operacoesStats.frota?.veiculosAtivos || 0,
          eficiencia: `${(operacoesStats.estatisticas?.eficienciaOperacional || operacoesStats.kpis?.eficienciaOperacional || 0).toFixed(1)}%`,
          sinistralidade: (operacoesStats.estatisticas?.indiceSinistralidade || operacoesStats.kpis?.indiceSinistralidade || 0).toFixed(1),
          isConnected: !operacoesError
        } : null
      },
      {
        title: "Manutenção",
        description: "Ordens de serviço e manutenção da frota",
        icon: <Wrench className="w-6 h-6 text-orange-500" />,
        stats: manutencaoStatsFormatted,
        color: "border-orange-500/30",
        bgColor: "bg-orange-500/10",
        path: "/departments/manutencao",
        highlight: shouldHighlightManutencao && !manutencaoError,
        enabled: shouldLoadManutencao,
        loading: manutencaoLoading,
        error: manutencaoError,
        extraInfo: shouldLoadManutencao && !manutencaoLoading && estatisticasComparativas ? {
          quebras: estatisticasComparativas.mesAtual.resumo.quebras,
          defeitos: estatisticasComparativas.mesAtual.resumo.defeitos,
          osFechadas: estatisticasComparativas.mesAtual.resumo.osFechadas,
          custosTerceiros: parseFloat(estatisticasComparativas.mesAtual.indicadores.totalValorTerceiros || '0'),
          isConnected: !manutencaoError
        } : null
      },
      {
        title: "Financeiro",
        description: "Controle financeiro e faturamento",
        icon: <DollarSign className="w-6 h-6 text-green-500" />,
        stats: [
          { label: "Receita Hoje", value: dashboardStats.revenue.today, trend: dashboardStats.revenue.growth },
          { label: "Meta Mensal", value: "0%", trend: "+0%" },
          { label: "Lucro Líquido", value: "R$ 0K", trend: "+0.0%" }
        ],
        color: "border-green-500/30",
        bgColor: "bg-green-500/10",
        path: "/home",
        enabled: true
      },
      {
        title: "Jurídico",
        description: "Sistema de multas de trânsito e SEMOB",
        icon: <Scale className="w-6 h-6 text-purple-500" />,
        stats: [
          { 
            label: "Total de Multas", 
            value: juridicStats.totalMultas, 
            trend: shouldLoadJuridico && !juridicLoading && juridicAnalytics ? 
              `+${(juridicAnalytics.totalTransito || 0) + (juridicAnalytics.totalSemob || 0)}` : ""
          },
          { 
            label: "Valor Total", 
            value: juridicStats.valorTotal, 
            trend: juridicStats.transitoTrend 
          },
          { 
            label: "Agentes SEMOB", 
            value: juridicStats.agentesAtivos, 
            trend: shouldLoadJuridico && !juridicLoading && juridicAnalytics ? 
              `${juridicAnalytics.totalSemob || 0} multas` : ""
          }
        ],
        color: "border-purple-500/30",
        bgColor: "bg-purple-500/10",
        path: "/departments/juridico",
        highlight: shouldHighlightJuridico,
        enabled: shouldLoadJuridico,
        loading: juridicLoading,
        error: juridicError,
        extraInfo: shouldLoadJuridico && !juridicLoading && juridicAnalytics ? {
          pontos: juridicAnalytics.pontosTotal || 0,
          veiculos: juridicAnalytics.totalVeiculosUnicos || 0,
          transitoTotal: juridicAnalytics.totalTransito || 0,
          semobTotal: juridicAnalytics.totalSemob || 0
        } : null
      },
      {
        title: "Recursos Humanos",
        description: "Gestão de pessoas e talentos",
        icon: <Users className="w-6 h-6 text-cyan-500" />,
        stats: pessoalStats,
        color: "border-cyan-500/30",
        bgColor: "bg-cyan-500/10",
        path: "/pessoal/dashboard",
        highlight: shouldHighlightPessoal && !funcionariosError,
        enabled: shouldLoadPessoal,
        loading: funcionariosLoading,
        error: funcionariosError,
        extraInfo: shouldLoadPessoal && !funcionariosLoading && shouldHighlightPessoal ? {
          total: funcionarios.length,
          ativos: funcionarios.filter(f => f.situacao === 'A' && f.ativo).length,
          inativos: funcionarios.filter(f => f.situacao === 'F' || !f.ativo).length,
          connectionStatus: 'Conectado'
        } : null
      },
      {
        title: "Logística",
        description: "Planejamento de rotas e cargas",
        icon: <Route className="w-6 h-6 text-teal-500" />,
        stats: [
          { label: "Rotas Ativas", value: "2", trend: "+0" },
          { label: "Taxa Entrega", value: "95.0%", trend: "+2.1%" },
          { label: "Km Rodados", value: "12.5K", trend: "+850" }
        ],
        color: "border-teal-500/30",
        bgColor: "bg-teal-500/10",
        path: "/home",
        enabled: true
      },
      {
        title: "Combustível",
        description: "Controle de abastecimento e consumo",
        icon: <Fuel className="w-6 h-6 text-red-500" />,
        stats: [
          { label: "Consumo Médio", value: dashboardStats.efficiency.fuel, trend: "+0.0" },
          { label: "Economia", value: "8.5%", trend: "+1.2%" },
          { label: "Abastecimentos", value: "45", trend: "+12" }
        ],
        color: "border-red-500/30",
        bgColor: "bg-red-500/10",
        path: "/home",
        enabled: true
      }
    ];
  }, [
    getJuridicStats, 
    getPessoalStatsFormatted, 
    getOperacoesStatsFormatted,
    getManutencaoStatsFormatted,
    dashboardStats, 
    shouldLoadJuridico, 
    shouldLoadPessoal,
    shouldLoadOperacoes,
    shouldLoadManutencao,
    juridicLoading,
    funcionariosLoading,
    operacoesLoading,
    manutencaoLoading,
    juridicError,
    funcionariosError,
    operacoesError,
    manutencaoError,
    funcionarios,
    juridicAnalytics,
    operacoesStats,
    estatisticasComparativas
  ]);

  // ✅ Effects otimizados
  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Funções auxiliares
  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, [currentTime]);

  const getRoleName = useCallback((role: string) => {
    const roles = {
      admin: 'Administrador',
      diretor: 'Diretor',
      gerente: 'Gerente',
      coordenador: 'Coordenador',
      supervisor: 'Supervisor',
      operador: 'Operador',
      usuario: 'Usuário',
      juridico: 'Jurídico',
      pessoal: 'Recursos Humanos',
      rh: 'RH',
      operacoes: 'Operações',
      manutencao: 'Manutenção'
    };
    return roles[role as keyof typeof roles] || 'Usuário';
  }, []);

  const isAdmin = useCallback(() => user?.role === 'admin', [user?.role]);

  // ✅ Função de logout otimizada
  const handleLogout = useCallback(async () => {
    if (!confirm('Tem certeza que deseja sair do sistema?')) return;

    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ [LOGOUT] Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800">
      
      {/* ✅ Elementos de background animados */}
      <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-2 sm:right-4 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-amber-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-4 left-8 sm:-bottom-8 sm:left-20 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* ✅ Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm"
      >
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Logo e empresa */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <img 
                src={logo} 
                alt="Viação Pioneira" 
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                }}
              />
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg items-center justify-center hidden">
                <Building2 className="h-7 w-7 text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Viação Pioneira Ltda</h1>
                <p className="text-sm text-gray-300">Workshop Operacional</p>
              </div>
            </div>

            {/* Saudação, data e menu do usuário */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Data e hora */}
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>

              {/* Menu do usuário */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10 flex items-center gap-2 px-3 py-2"
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold">
                          {getGreeting()}, {user.fullName || user.username}!
                        </p>
                        <p className="text-xs text-gray-300">
                          {getRoleName(user.role)}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-900" />
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="hover:bg-yellow-500/20 hover:text-red-300 cursor-pointer text-red-400"
                    >
                      {isLoggingOut ? (
                        <>
                          <div className="mr-2 h-4 w-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          <span>Saindo...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sair</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ✅ SIDEBAR MOBILE */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute left-0 top-0 h-full w-80 bg-slate-900 border-r border-white/10 p-6 overflow-y-auto"
          >
            {/* Header do Sidebar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="Viação Pioneira" 
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <h2 className="text-lg font-semibold text-white">Viação Pioneira</h2>
                  <p className="text-xs text-gray-400">Workshop Operacional</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* ✅ NAVEGAÇÃO DOS DEPARTAMENTOS */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Departamentos</h3>
              {departmentCards.map((dept, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`
                    w-full justify-start text-white hover:bg-white/10 p-3 h-auto
                    ${dept.highlight ? 'bg-purple-500/20 border border-purple-500/30' : ''}
                    ${dept.error ? 'bg-red-500/20 border border-red-500/30' : ''}
                  `}
                  onClick={() => {
                    navigate(dept.path);
                    setSidebarOpen(false);
                  }}
                  disabled={!dept.enabled}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {dept.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dept.title}</span>
                        {dept.highlight && (
                          <Badge className="bg-purple-500 text-white text-xs px-1 py-0">
                            Ativo
                          </Badge>
                        )}
                        {dept.error && (
                          <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                            Erro
                          </Badge>
                        )}
                        {dept.loading && (
                          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {!dept.enabled && (
                          <Badge className="bg-gray-500 text-white text-xs px-1 py-0">
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{dept.description}</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {/* ✅ SEÇÃO ADMINISTRATIVA (APENAS PARA ADMIN) */}
            {isAdmin() && (
              <div className="space-y-2 mb-6 border-t border-white/10 pt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Administração</h3>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 p-3 h-auto bg-yellow-500/10 border border-yellow-500/30"
                  onClick={() => {
                    navigate('/dashboard');
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <BarChart3 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Dashboard Geral</span>
                        <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                          Admin
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Visão completa dos sistemas</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 p-3 h-auto bg-red-500/10 border border-red-500/30"
                  onClick={() => {
                    navigate('/users');
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Users className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Gerenciar Usuários</span>
                        <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                          Admin
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Administrar usuários do sistema</p>
                    </div>
                  </div>
                </Button>
              </div>
            )}

            {/* ✅ SEÇÃO DE LOGOUT */}
            <div className="border-t border-white/10 pt-4 mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-red-500/20 hover:text-red-300 p-3 h-auto"
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
              >
                <div className="flex items-center gap-3 w-full">
                  {isLoggingOut ? (
                    <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <span className="font-medium">{isLoggingOut ? 'Saindo...' : 'Sair do Sistema'}</span>
                    <p className="text-xs text-red-400/70 mt-1">Encerrar sessão atual</p>
                  </div>
                </div>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ✅ Conteúdo principal */}
      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* ✅ Seção de boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Dashboard Operacional
              </span>
            </h2>
          </div>
        </motion.div>

        {/* ✅ AÇÕES ADMINISTRATIVAS - APENAS PARA ADMIN */}
        {isAdmin() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-semibold text-white">Ações Administrativas</h3>
              <Badge className="bg-red-500/20 text-red-400 text-xs px-2 py-1">
                Apenas Administradores
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <Card 
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group ring-2 ring-yellow-500/30"
                onClick={() => navigate('/dashboard')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center text-gray-900">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white group-hover:text-yellow-300 transition-colors">
                        Dashboard Geral
                      </h4>
                      <p className="text-xs text-gray-400">
                        Visão completa dos sistemas
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-all group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group ring-2 ring-red-500/30"
                onClick={() => navigate('/users')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white group-hover:text-yellow-300 transition-colors">
                        Gerenciar Usuários
                      </h4>
                      <p className="text-xs text-gray-400">
                        Administrar usuários do sistema
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-all group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ✅ CARDS DOS DEPARTAMENTOS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Departamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {departmentCards.map((dept, index) => (
              <Card 
                key={index}
                className={`
                  bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group 
                  ${dept.color}
                  ${dept.highlight ? 'ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/20' : ''}
                  ${dept.error ? 'ring-2 ring-red-400/50 shadow-lg shadow-red-500/20' : ''}
                  ${!dept.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => dept.enabled && navigate(dept.path)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-white group-hover:text-yellow-300 transition-colors">
                    {dept.icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{dept.title}</div>
                        {dept.loading && (
                          <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {dept.error && (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                        {!dept.enabled && (
                          <Badge className="bg-gray-500 text-white text-xs px-1 py-0">
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{dept.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dept.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{stat.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          dept.highlight && !dept.loading ? 'text-purple-300' : 
                          dept.error ? 'text-red-300' : 'text-white'
                        }`}>
                          {stat.value}
                        </span>
                        {stat.trend && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              dept.highlight 
                                ? 'bg-purple-500/20 text-purple-300'
                                : dept.error
                                ? 'bg-red-500/20 text-red-300'
                                : stat.trend.startsWith('+') 
                                ? 'bg-green-500/20 text-green-400' 
                                : stat.trend.startsWith('-')
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {stat.trend.startsWith('+') && <TrendingUp className="w-2 h-2 mr-1" />}
                            {stat.trend.startsWith('-') && <TrendingDown className="w-2 h-2 mr-1" />}
                            {stat.trend}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* ✅ INFORMAÇÃO ADICIONAL PARA O JURÍDICO */}
                  {dept.title === "Jurídico" && dept.extraInfo && (
                    <div className="mt-3 pt-3 border-t border-purple-500/30">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 text-purple-300">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            {dept.extraInfo.pontos} pontos CNH • {dept.extraInfo.veiculos} veículos
                          </span>
                        </div>
                        <div className="text-purple-200/80">
                          Trânsito: {dept.extraInfo.transitoTotal} multas
                        </div>
                        <div className="text-purple-200/80">
                          SEMOB: {dept.extraInfo.semobTotal} multas
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ✅ INFORMAÇÃO ADICIONAL PARA OPERAÇÕES */}
                  {dept.title === "Operações" && dept.extraInfo && (
                    <div className="mt-3 pt-3 border-t border-blue-500/30">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 text-blue-300">
                          <Activity className="h-3 w-3" />
                          <span>
                            {dept.extraInfo.totalVeiculos} veículos total
                          </span>
                        </div>
                        <div className="text-blue-200/80">
                          Ativos: {dept.extraInfo.veiculosAtivos}
                        </div>
                        <div className="text-blue-200/80">
                          Eficiência: {dept.extraInfo.eficiencia}
                        </div>
                       
                      </div>
                    </div>
                  )}

                  {/* ✅ INFORMAÇÃO ADICIONAL PARA MANUTENÇÃO */}
                  {dept.title === "Manutenção" && dept.extraInfo && (
                    <div className="mt-3 pt-3 border-t border-orange-500/30">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 text-orange-300">
                          <Wrench className="h-3 w-3" />
                          <span>
                            {dept.extraInfo.quebras} quebras • {dept.extraInfo.defeitos} defeitos
                          </span>
                        </div>
                        <div className="text-orange-200/80">
                          Fechadas: {dept.extraInfo.osFechadas}
                        </div>
                        
                      </div>
                    </div>
                  )}

                  {/* ✅ INFORMAÇÃO ADICIONAL PARA RH */}
                  {dept.title === "Recursos Humanos" && dept.extraInfo && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/30">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 text-cyan-300">
                          <Users className="h-3 w-3" />
                          <span>
                            {dept.extraInfo.total} funcionários total
                          </span>
                        </div>
                        <div className="text-cyan-200/80">
                          Ativos: {dept.extraInfo.ativos} ({((dept.extraInfo.ativos / dept.extraInfo.total) * 100).toFixed(1)}%)
                        </div>
                        <div className="text-cyan-200/80">
                          Inativos: {dept.extraInfo.inativos} ({((dept.extraInfo.inativos / dept.extraInfo.total) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* ✅ INDICADOR DE ERRO */}
                  {dept.error && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                      <div className="flex items-center gap-2 text-xs text-red-300">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Erro ao carregar dados</span>
                      </div>
                    </div>
                  )}

                  {/* ✅ INDICADOR DE ACESSO BLOQUEADO */}
                  {!dept.enabled && (
                    <div className="mt-3 pt-3 border-t border-gray-500/30">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <X className="h-3 w-3" />
                        <span>Acesso restrito para seu perfil</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ✅ RESUMO EXECUTIVO
           <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8"
        >
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-green-700 dark:text-green-300">
                <Database className="w-6 h-6 text-green-600" />
                <span>Resumo Executivo dos Sistemas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {shouldLoadOperacoes && operacoesStats && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <Bus className="w-4 h-4" />
                      Operações
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{operacoesStats.veiculos?.ativos || operacoesStats.frota?.veiculosAtivos || 0}</span> veículos ativos de{' '}
                        <span className="font-medium">{operacoesStats.veiculos?.total || operacoesStats.frota?.totalVeiculos || 0}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{operacoesStats.acidentes?.total || operacoesStats.acidentes?.mesAtual || 0}</span> acidentes registrados
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Eficiência: <span className="font-medium">{(operacoesStats.estatisticas?.eficienciaOperacional || operacoesStats.kpis?.eficienciaOperacional || 0).toFixed(1)}%</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Sinistralidade: <span className="font-medium">{(operacoesStats.estatisticas?.indiceSinistralidade || operacoesStats.kpis?.indiceSinistralidade || 0).toFixed(1)}</span>
                      </p>
                    </div>
                  </div>
                )}

                 
                {shouldLoadManutencao && estatisticasComparativas && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Manutenção
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{estatisticasComparativas.mesAtual.resumo.totalRegistros}</span> OS registradas
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{estatisticasComparativas.mesAtual.resumo.osAbertas}</span> OS abertas
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{estatisticasComparativas.mesAtual.resumo.osFechadas}</span> OS fechadas
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Custos: <span className="font-medium">R$ {parseFloat(estatisticasComparativas.mesAtual.indicadores.totalValorTerceiros || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </p>
                    </div>
                  </div>
                )}

                 
                {shouldLoadJuridico && juridicAnalytics && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      Jurídico
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{((juridicAnalytics.totalTransito || 0) + (juridicAnalytics.totalSemob || 0)).toLocaleString('pt-BR')}</span> multas
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Trânsito: <span className="font-medium">{(juridicAnalytics.totalTransito || 0).toLocaleString('pt-BR')}</span> multas
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        SEMOB: <span className="font-medium">{(juridicAnalytics.totalSemob || 0).toLocaleString('pt-BR')}</span> multas
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{juridicAnalytics.totalAgentesUnicos || 0}</span> agentes ativos
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Pontos CNH: <span className="font-medium">{juridicAnalytics.pontosTotal || 0}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Valor total: <span className="font-medium">
                          {((juridicAnalytics.valorTransito || 0) + (juridicAnalytics.valorSemob || 0)).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            maximumFractionDigits: 0 
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
 
                {shouldLoadPessoal && funcionarios.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Recursos Humanos
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{funcionarios.length}</span> funcionários
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{funcionarios.filter(f => f.situacao === 'A' && f.ativo).length}</span> ativos
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{funcionarios.filter(f => f.situacao === 'F' || !f.ativo).length}</span> inativos
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Taxa atividade: <span className="font-medium">{((funcionarios.filter(f => f.situacao === 'A' && f.ativo).length / funcionarios.length) * 100).toFixed(1)}%</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 dark:text-green-300 font-semibold text-lg">
                      Sistemas operacionais - Dados integrados disponíveis
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Última atualização: {new Date().toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[
                        shouldLoadOperacoes && operacoesStats ? 'Operações' : null,
                        shouldLoadManutencao && estatisticasComparativas ? 'Manutenção' : null,
                        shouldLoadJuridico && juridicAnalytics ? 'Jurídico' : null,
                        shouldLoadPessoal && funcionarios.length > 0 ? 'RH' : null
                      ].filter(Boolean).join(' • ')} conectados
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        */}
     
      </div>

      {/* ✅ Estilos CSS */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 15px 15px;
        }
      `}</style>
    </div>
  );
}