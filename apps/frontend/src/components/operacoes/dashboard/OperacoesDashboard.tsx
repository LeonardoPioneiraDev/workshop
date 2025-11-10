// src/components/operacoes/dashboard/OperacoesDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Download, 
  Settings,
  BarChart3,
  Truck,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';
import { KPIsOperacionais } from './KPIsOperacionais';
import { AlertasOperacionais } from './AlertasOperacionais';
import { TendenciasOperacionais } from './TendenciasOperacionais';
import { useOperacoesData } from '@/services/departments/operacoes/hooks/useOperacoesData';
import type { DashboardOperacoes, FiltrosDashboard } from '@/types/departments/operacoes';

interface OperacoesDashboardProps {
  filtros?: FiltrosDashboard;
  onFiltrosChange?: (filtros: FiltrosDashboard) => void;
  className?: string;
}

export function OperacoesDashboard({ 
  filtros = {}, 
  onFiltrosChange,
  className = "" 
}: OperacoesDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { stats, loading, error, refetch } = useOperacoesData({
    enabled: true,
    autoLoad: true,
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000 // 2 minutos
  });

  // Simular dados do dashboard baseado nos stats
  const dashboardData: DashboardOperacoes | null = stats ? {
    resumo: {
      frota: {
        total: stats.veiculos.total,
        ativos: stats.veiculos.ativos,
        inativos: stats.veiculos.inativos,
        percentualAtivos: stats.veiculos.percentualAtivos,
        ultimaAtualizacao: new Date().toISOString(),
        status: stats.veiculos.percentualAtivos >= 90 ? 'OPERACIONAL' : 'ATENÇÃO'
      },
      acidentes: {
        total: stats.acidentes.total,
        comVitimas: stats.acidentes.comVitimas,
        semVitimas: stats.acidentes.semVitimas,
        valorTotalDanos: stats.acidentes.valorTotal,
        percentualComVitimas: stats.acidentes.total > 0 ? (stats.acidentes.comVitimas / stats.acidentes.total) * 100 : 0,
        ultimaAtualizacao: new Date().toISOString(),
        status: stats.acidentes.comVitimas === 0 ? 'BOM' : stats.acidentes.comVitimas <= 2 ? 'ATENÇÃO' : 'CRÍTICO'
      },
      kpis: {
        disponibilidadeFrota: stats.estatisticas.percentualDisponibilidade,
        indiceSinistralidade: stats.estatisticas.indiceSinistralidade,
        custoMedioAcidente: stats.estatisticas.custoMedioAcidente,
        eficienciaOperacional: stats.estatisticas.eficienciaOperacional,
        scoreGeral: (stats.estatisticas.percentualDisponibilidade + stats.estatisticas.eficienciaOperacional) / 2,
        veiculosDisponiveis: stats.veiculos.ativos,
        totalVeiculos: stats.veiculos.total,
        metaDisponibilidade: 90,
        metaSinistralidade: 5,
        metaCustoMedio: 3000,
        metaEficiencia: 85
      }
    },
    distribuicoes: {
      frotaPorGaragem: [
        { garagem: 'VIAÇÃO PIONEIRA', total: Math.floor(stats.veiculos.total * 0.6), ativos: Math.floor(stats.veiculos.ativos * 0.6), inativos: Math.floor(stats.veiculos.inativos * 0.6), percentualAtivos: 92 },
        { garagem: 'PARANOÁ', total: Math.floor(stats.veiculos.total * 0.25), ativos: Math.floor(stats.veiculos.ativos * 0.25), inativos: Math.floor(stats.veiculos.inativos * 0.25), percentualAtivos: 88 },
        { garagem: 'GAMA', total: Math.floor(stats.veiculos.total * 0.15), ativos: Math.floor(stats.veiculos.ativos * 0.15), inativos: Math.floor(stats.veiculos.inativos * 0.15), percentualAtivos: 85 }
      ],
      acidentesPorGaragem: [
        { garagem: 'VIAÇÃO PIONEIRA', total: Math.floor(stats.acidentes.total * 0.5), comVitimas: Math.floor(stats.acidentes.comVitimas * 0.5), semVitimas: Math.floor(stats.acidentes.semVitimas * 0.5), valorTotal: stats.acidentes.valorTotal * 0.5, percentualComVitimas: 20, indiceSinistralidade: 4.2 },
        { garagem: 'PARANOÁ', total: Math.floor(stats.acidentes.total * 0.3), comVitimas: Math.floor(stats.acidentes.comVitimas * 0.3), semVitimas: Math.floor(stats.acidentes.semVitimas * 0.3), valorTotal: stats.acidentes.valorTotal * 0.3, percentualComVitimas: 25, indiceSinistralidade: 6.1 },
        { garagem: 'GAMA', total: Math.floor(stats.acidentes.total * 0.2), comVitimas: Math.floor(stats.acidentes.comVitimas * 0.2), semVitimas: Math.floor(stats.acidentes.semVitimas * 0.2), valorTotal: stats.acidentes.valorTotal * 0.2, percentualComVitimas: 30, indiceSinistralidade: 7.8 }
      ],
      acidentesPorMes: [],
      acidentesPorTurno: [],
      acidentesPorTipo: [],
      frotaPorTipo: []
    },
    rankings: {
      topVeiculosAcidentes: [
        { prefixo: '1234', placa: 'ABC-1234', garagem: 'VIAÇÃO PIONEIRA', totalAcidentes: 3, valorTotalDanos: 15000, comVitimas: 1, ultimoAcidente: '2024-01-15', risco: 'ALTO' },
        { prefixo: '5678', placa: 'DEF-5678', garagem: 'PARANOÁ', totalAcidentes: 2, valorTotalDanos: 8000, comVitimas: 0, ultimoAcidente: '2024-01-10', risco: 'MÉDIO' }
      ],
      garagensMaisAcidentes: [],
      topMotoristas: [],
      topRotas: []
    },
    alertas: {
      mudancasRecentes: [
        {
          id: 1,
          prefixo: '1234',
          tipoMudanca: 'STATUS',
          campoAlterado: 'status',
          valorAnterior: 'ATIVO',
          valorNovo: 'MANUTENCAO',
          dataMudanca: new Date().toISOString(),
          impacto: 'MÉDIO'
        }
      ],
      veiculosRisco: [
        { prefixo: '1234', placa: 'ABC-1234', garagem: 'VIAÇÃO PIONEIRA', totalAcidentes: 3, valorTotalDanos: 15000, comVitimas: 1, risco: 'ALTO' }
      ],
      garagensProblematicas: [
        { garagem: 'GAMA', total: 3, comVitimas: 2, semVitimas: 1, valorTotal: 12000, percentualComVitimas: 66.7, indiceSinistralidade: 7.8 }
      ],
      metasNaoAtingidas: stats.estatisticas.indiceSinistralidade > 5 ? [
        {
          tipo: 'SINISTRALIDADE',
          valorAtual: stats.estatisticas.indiceSinistralidade,
          valorMeta: 5,
          diferenca: stats.estatisticas.indiceSinistralidade - 5,
          periodo: 'Mês atual'
        }
      ] : []
    },
    tendencias: {
      anoAtual: {
        ano: new Date().getFullYear(),
        total: stats.acidentes.total,
        comVitimas: stats.acidentes.comVitimas,
        valorDanos: stats.acidentes.valorTotal,
        indiceSinistralidade: stats.estatisticas.indiceSinistralidade,
        custoMedio: stats.estatisticas.custoMedioAcidente
      },
      anoAnterior: {
        ano: new Date().getFullYear() - 1,
        total: Math.floor(stats.acidentes.total * 0.9),
        comVitimas: Math.floor(stats.acidentes.comVitimas * 0.8),
        valorDanos: stats.acidentes.valorTotal * 0.85,
        indiceSinistralidade: stats.estatisticas.indiceSinistralidade * 0.9,
        custoMedio: stats.estatisticas.custoMedioAcidente * 0.95
      },
      variacoes: {
        total: 10,
        comVitimas: 25,
        tendencia: 'CRESCENTE',
        confiabilidade: 0.85
      },
      porMes: [
        { mesAno: '2024-01', mes: 1, ano: 2024, total: 2, comVitimas: 0, valorTotal: 5000, mediaMovel: 2.5, tendencia: 'ESTÁVEL' },
        { mesAno: '2024-02', mes: 2, ano: 2024, total: 3, comVitimas: 1, valorTotal: 8000, mediaMovel: 2.8, tendencia: 'CRESCENTE' },
        { mesAno: '2024-03', mes: 3, ano: 2024, total: 1, comVitimas: 0, valorTotal: 3000, mediaMovel: 2.2, tendencia: 'DECRESCENTE' }
      ],
      previsoes: [
        {
          mes: new Date().getMonth() + 2,
          previsaoTotal: 2,
          previsaoComVitimas: 0,
          intervaloConfianca: { min: 1, max: 4 },
          probabilidade: 0.75
        }
      ],
      sazonalidade: {
        mesesMaiorIncidencia: [12, 1, 6],
        mesesMenorIncidencia: [3, 4, 9],
        fatoresSazonais: [],
        correlacoes: []
      }
    },
    comparativos: {
      mesAnterior: {
        mesAtual: {
          periodo: 'Janeiro 2024',
          totalAcidentes: stats.acidentes.total,
          comVitimas: stats.acidentes.comVitimas,
          valorDanos: stats.acidentes.valorTotal,
          disponibilidadeFrota: stats.estatisticas.percentualDisponibilidade,
          indiceSinistralidade: stats.estatisticas.indiceSinistralidade
        },
        mesAnterior: {
          periodo: 'Dezembro 2023',
          totalAcidentes: Math.floor(stats.acidentes.total * 0.8),
          comVitimas: Math.floor(stats.acidentes.comVitimas * 0.7),
          valorDanos: stats.acidentes.valorTotal * 0.9,
          disponibilidadeFrota: stats.estatisticas.percentualDisponibilidade * 0.95,
          indiceSinistralidade: stats.estatisticas.indiceSinistralidade * 1.1
        },
        variacao: {
          totalAcidentes: 25,
          comVitimas: 42.8,
          valorDanos: 11.1,
          disponibilidadeFrota: 5.3,
          indiceSinistralidade: -9.1,
          tendenciaGeral: 'PIORA'
        }
      },
      anoAnterior: {
        anoAtual: {
          periodo: '2024',
          totalAcidentes: stats.acidentes.total,
          comVitimas: stats.acidentes.comVitimas,
          valorDanos: stats.acidentes.valorTotal,
          disponibilidadeFrota: stats.estatisticas.percentualDisponibilidade,
          indiceSinistralidade: stats.estatisticas.indiceSinistralidade
        },
        anoAnterior: {
          periodo: '2023',
          totalAcidentes: Math.floor(stats.acidentes.total * 0.9),
          comVitimas: Math.floor(stats.acidentes.comVitimas * 0.8),
          valorDanos: stats.acidentes.valorTotal * 0.85,
          disponibilidadeFrota: stats.estatisticas.percentualDisponibilidade * 0.97,
          indiceSinistralidade: stats.estatisticas.indiceSinistralidade * 0.9
        },
        variacao: {
          totalAcidentes: 11.1,
          comVitimas: 25,
          valorDanos: 17.6,
          disponibilidadeFrota: 3.1,
          indiceSinistralidade: 11.1,
          tendenciaGeral: 'PIORA'
        }
      },
      benchmarks: [],
      metas: {
        disponibilidadeFrota: { valor: 90, valorAtual: stats.estatisticas.percentualDisponibilidade, percentualAtingido: (stats.estatisticas.percentualDisponibilidade / 90) * 100, status: stats.estatisticas.percentualDisponibilidade >= 90 ? 'ATINGIDA' : 'NAO_ATINGIDA', prazo: '2024-12-31' },
        indiceSinistralidade: { valor: 5, valorAtual: stats.estatisticas.indiceSinistralidade, percentualAtingido: stats.estatisticas.indiceSinistralidade <= 5 ? 100 : (5 / stats.estatisticas.indiceSinistralidade) * 100, status: stats.estatisticas.indiceSinistralidade <= 5 ? 'ATINGIDA' : 'NAO_ATINGIDA', prazo: '2024-12-31' },
        custoMedioAcidente: { valor: 3000, valorAtual: stats.estatisticas.custoMedioAcidente, percentualAtingido: stats.estatisticas.custoMedioAcidente <= 3000 ? 100 : (3000 / stats.estatisticas.custoMedioAcidente) * 100, status: stats.estatisticas.custoMedioAcidente <= 3000 ? 'ATINGIDA' : 'NAO_ATINGIDA', prazo: '2024-12-31' },
        eficienciaOperacional: { valor: 85, valorAtual: stats.estatisticas.eficienciaOperacional, percentualAtingido: (stats.estatisticas.eficienciaOperacional / 85) * 100, status: stats.estatisticas.eficienciaOperacional >= 85 ? 'ATINGIDA' : 'NAO_ATINGIDA', prazo: '2024-12-31' }
      }
    },
    timestamp: new Date().toISOString()
  } : null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdate(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportando dashboard...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERACIONAL':
      case 'BOM':
        return 'bg-green-100 text-green-800';
      case 'ATENÇÃO':
        return 'bg-yellow-100 text-yellow-800';
      case 'CRÍTICO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header do Dashboard */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Operações</h1>
          <p className="text-gray-600">
            Última atualização: {lastUpdate.toLocaleString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {dashboardData && (
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(dashboardData.resumo.frota.status)}>
                Frota: {dashboardData.resumo.frota.status}
              </Badge>
              <Badge className={getStatusColor(dashboardData.resumo.acidentes.status)}>
                Acidentes: {dashboardData.resumo.acidentes.status}
              </Badge>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Resumidos */}
          <KPIsOperacionais 
            kpis={dashboardData?.resumo.kpis || null}
            loading={loading}
            error={error}
          />

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
                <Truck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.veiculos.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? '...' : `${stats?.veiculos.ativos || 0} ativos, ${stats?.veiculos.inativos || 0} inativos`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acidentes no Mês</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.acidentes.mesAtual || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? '...' : `${stats?.acidentes.comVitimas || 0} com vítimas`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Linhas Ativas</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats?.linhas.ativas || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? '...' : `${stats?.linhas.total || 0} total`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : (stats?.linhas.receita || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Por dia</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas Resumidos */}
          {dashboardData?.alertas && (
            <AlertasOperacionais 
              alertas={dashboardData.alertas}
              loading={loading}
              error={error}
            />
          )}
        </TabsContent>

        {/* Aba KPIs */}
        <TabsContent value="kpis">
          <KPIsOperacionais 
            kpis={dashboardData?.resumo.kpis || null}
            loading={loading}
            error={error}
          />
        </TabsContent>

        {/* Aba Alertas */}
        <TabsContent value="alerts">
          {dashboardData?.alertas && (
            <AlertasOperacionais 
              alertas={dashboardData.alertas}
              loading={loading}
              error={error}
            />
          )}
        </TabsContent>

        {/* Aba Tendências */}
        <TabsContent value="trends">
          {dashboardData?.tendencias && (
            <TendenciasOperacionais 
              tendencias={dashboardData.tendencias}
              loading={loading}
              error={error}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}