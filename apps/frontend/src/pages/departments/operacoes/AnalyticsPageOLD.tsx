// src/pages/operacoes/AnalyticsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Truck,
  LineChart as LineChartIcon,
  Calendar,
  DollarSign,
  Activity,
  MapPin,
  Clock,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { acidentesApi } from '@/services/departments/operacoes/api/acidentesApi';
import { toast } from 'sonner';
import type { Acidente, EstatisticasAcidentes } from '@/types/departments/operacoes';

// Cores para os gráficos
const COLORS = {
  primary: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  secondary: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
  success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  blue: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
  gradient: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899']
};

interface DadosMensaisType {
  mes: string;
  total: number;
  comVitimas: number;
  semVitimas: number;
  valor: number;
  media: number;
}

interface DadosGaragemType {
  garagem: string;
  total: number;
  comVitimas: number;
  semVitimas: number;
  valor: number;
  percentual: number;
}

interface DadosGravidadeType {
  tipo: string;
  total: number;
  percentual: number;
  valor: number;
}

interface DadosTurnoType {
  turno: string;
  total: number;
  percentual: number;
}

interface DadosMunicipioType {
  municipio: string;
  total: number;
  risco: 'BAIXO' | 'MÉDIO' | 'ALTO';
}

interface ComparativoAnoType {
  periodo: string;
  anoAtual: number;
  anoAnterior: number;
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [acidentes, setAcidentes] = useState<Acidente[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAcidentes | null>(null);
  
  // Estados para dados processados
  const [dadosMensais, setDadosMensais] = useState<any[]>([]);
  const [dadosPorGaragem, setDadosPorGaragem] = useState<any[]>([]);
  const [dadosPorPrefixo, setDadosPorPrefixo] = useState<any[]>([]);
  const [dadosPorTurno, setDadosPorTurno] = useState<any[]>([]);
  const [dadosPorGravidade, setDadosPorGravidade] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      
      const [acidentesData, estatisticasData] = await Promise.allSettled([
        acidentesApi.buscarAcidentes({ 
          limit: 10000, 
          page: 1
        }),
        acidentesApi.obterEstatisticas()
      ]);
      
      if (acidentesData.status === 'fulfilled') {
        const dados = acidentesData.value.data;
        console.log('[ANALYTICS] Acidentes carregados:', dados.length);
        setAcidentes(dados);
        processarDados(dados);
      } else {
        console.error('[ANALYTICS] Erro ao carregar acidentes:', acidentesData.reason);
      }
      
      if (estatisticasData.status === 'fulfilled') {
        setEstatisticas(estatisticasData.value);
      }
      
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setIsLoading(false);
    }
  };
  

  const processarDados = (dados: Acidente[]) => {
    if (!dados || dados.length === 0) {
      setDadosMensais([]);
      setDadosPorGaragem([]);
      setDadosPorPrefixo([]);
      setDadosPorTurno([]);
      setDadosPorGravidade([]);
      setDadosPorDiaSemana([]);
      return;
    }

    console.log('[ANALYTICS] Total de acidentes:', dados.length);
    
    // ===== PROCESSAR DADOS MENSAIS =====
    const mesesMap = new Map<string, { total: number, comVitimas: number, semVitimas: number, valor: number }>();
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    // Inicializar todos os meses com zeros
    meses.forEach(mes => {
      mesesMap.set(mes, { total: 0, comVitimas: 0, semVitimas: 0, valor: 0 });
    });
    
    // Processar todos os acidentes
    dados.forEach(ac => {
      const data = new Date(ac.dataAcidente);
      const mesIndex = data.getMonth();
      const mesNome = meses[mesIndex];
      const atual = mesesMap.get(mesNome)!;
      
      const temVitima = ac.grauAcidente?.toUpperCase().includes('VÍTIMA') || 
                        ac.grauAcidente?.toUpperCase().includes('VITIMA') ||
                        (ac.vitimas && ac.vitimas.length > 0);
      
      const valor = typeof ac.valorTotalDano === 'number' && !isNaN(ac.valorTotalDano) ? ac.valorTotalDano : 0;
      
      mesesMap.set(mesNome, {
        total: atual.total + 1,
        comVitimas: atual.comVitimas + (temVitima ? 1 : 0),
        semVitimas: atual.semVitimas + (temVitima ? 0 : 1),
        valor: atual.valor + valor
      });
    });
    
    const dadosMensaisArr = meses.map(mes => ({
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      total: mesesMap.get(mes)!.total,
      comVitimas: mesesMap.get(mes)!.comVitimas,
      semVitimas: mesesMap.get(mes)!.semVitimas,
      valor: mesesMap.get(mes)!.valor,
      media: mesesMap.get(mes)!.total > 0 ? mesesMap.get(mes)!.valor / mesesMap.get(mes)!.total : 0
    }));
    setDadosMensais(dadosMensaisArr);
    
    // ===== PROCESSAR DADOS POR GARAGEM (ACIDENTES) =====
    const garagemMap = new Map<string, { total: number, valor: number, comVitimas: number }>();
    dados.forEach(ac => {
      const garagem = ac.garagemVeiculoNome || ac.garagemLinhaNome;
      if (garagem && garagem.trim() !== '') {
        const atual = garagemMap.get(garagem) || { total: 0, valor: 0, comVitimas: 0 };
        const temVitima = ac.grauAcidente?.toUpperCase().includes('VÍTIMA') || 
                          ac.grauAcidente?.toUpperCase().includes('VITIMA') ||
                          (ac.vitimas && ac.vitimas.length > 0);
        const valor = typeof ac.valorTotalDano === 'number' && !isNaN(ac.valorTotalDano) ? ac.valorTotalDano : 0;
        
        garagemMap.set(garagem, {
          total: atual.total + 1,
          valor: atual.valor + valor,
          comVitimas: atual.comVitimas + (temVitima ? 1 : 0)
        });
      }
    });
    console.log('[ANALYTICS] Garagens processadas (acidentes):', garagemMap.size);
    
    const totalGeral = dados.length;
    const dadosPorGaragemArr = Array.from(garagemMap.entries())
      .map(([garagem, stats]) => ({ 
        garagem, 
        total: stats.total,
        comVitimas: stats.comVitimas,
        semVitimas: stats.total - stats.comVitimas,
        valor: stats.valor,
        percentual: (stats.total / totalGeral) * 100
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    setDadosPorGaragem(dadosPorGaragemArr);
    
    // ===== PROCESSAR DADOS POR PREFIXO =====
    const prefixoMap = new Map<string, number>();
    dados.forEach(ac => {
      const prefixo = ac.prefixoVeiculo || ac.prefixo;
      if (prefixo && prefixo.trim() !== '') {
        prefixoMap.set(prefixo, (prefixoMap.get(prefixo) || 0) + 1);
      }
    });
    console.log('[ANALYTICS] Prefixos processados:', prefixoMap.size);
    
    const dadosPorPrefixoArr = Array.from(prefixoMap.entries())
      .map(([prefixo, total]) => ({ prefixo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
    setDadosPorPrefixo(dadosPorPrefixoArr);
    
    // ===== PROCESSAR DADOS POR TURNO =====
    const turnoMap = new Map<string, number>();
    dados.forEach(ac => {
      if (ac.turno) {
        turnoMap.set(ac.turno, (turnoMap.get(ac.turno) || 0) + 1);
      }
    });
    
    const dadosPorTurnoArr = Array.from(turnoMap.entries())
      .map(([turno, total]) => ({ 
        turno, 
        total,
        percentual: (total / totalGeral) * 100
      }))
      .sort((a, b) => b.total - a.total);
    setDadosPorTurno(dadosPorTurnoArr);
    
    // ===== PROCESSAR DADOS POR GRAVIDADE =====
    const gravidadeMap = new Map<string, { total: number, valor: number }>();
    dados.forEach(ac => {
      const gravidade = ac.grauAcidente || ac.tipoAcidenteGeral || 'NÃO INFORMADO';
      const atual = gravidadeMap.get(gravidade) || { total: 0, valor: 0 };
      const valor = typeof ac.valorTotalDano === 'number' && !isNaN(ac.valorTotalDano) ? ac.valorTotalDano : 0;
      
      gravidadeMap.set(gravidade, {
        total: atual.total + 1,
        valor: atual.valor + valor
      });
    });
    console.log('[ANALYTICS] Gravidades processadas:', gravidadeMap);
    
    const dadosPorGravidadeArr = Array.from(gravidadeMap.entries())
      .map(([tipo, stats]) => ({ 
        tipo, 
        total: stats.total,
        percentual: (stats.total / totalGeral) * 100,
        valor: stats.valor
      }))
      .sort((a, b) => b.total - a.total);
    setDadosPorGravidade(dadosPorGravidadeArr);
    
    // ===== PROCESSAR DADOS POR DIA DA SEMANA =====
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemanaMap = new Map<number, { total: number, valor: number }>();
    
    // Inicializar todos os dias
    diasSemana.forEach((_, index) => {
      diaSemanaMap.set(index, { total: 0, valor: 0 });
    });
    
    dados.forEach(ac => {
      const data = new Date(ac.dataAcidente);
      const diaSemana = data.getDay();
      const atual = diaSemanaMap.get(diaSemana)!;
      const valor = typeof ac.valorTotalDano === 'number' && !isNaN(ac.valorTotalDano) ? ac.valorTotalDano : 0;
      
      diaSemanaMap.set(diaSemana, {
        total: atual.total + 1,
        valor: atual.valor + valor
      });
    });
    
    const dadosPorDiaSemanaArr = diasSemana.map((dia, index) => ({
      dia,
      total: diaSemanaMap.get(index)!.total,
      valor: diaSemanaMap.get(index)!.valor,
      media: diaSemanaMap.get(index)!.total > 0 
        ? diaSemanaMap.get(index)!.valor / diaSemanaMap.get(index)!.total 
        : 0
    }));
    setDadosPorDiaSemana(dadosPorDiaSemanaArr);
  };

  const handleRefresh = () => {
    carregarDados();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/departments/operacoes')}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <BarChart3 className="w-7 h-7 text-blue-600" />
                  Analytics Operacionais
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Análise de acidentes da frota • Ano {new Date().getFullYear()}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </motion.div>

        {/* KPIs Principais - Frota e Acidentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KPI Frota */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-blue-100 text-sm font-medium mb-2">
                      Frota Total
                    </p>
                    <p className="text-5xl font-bold mb-3">
                      {isLoading ? '...' : (estatisticasFrota?.total || 0).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 text-blue-100 text-sm">
                      <Truck className="h-4 w-4" />
                      <span>
                        {estatisticasFrota?.ativos || 0} ativos ({estatisticasFrota && estatisticasFrota.total > 0 
                          ? ((estatisticasFrota.ativos / estatisticasFrota.total) * 100).toFixed(1)
                          : '0'}%)
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <Truck className="h-16 w-16 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Acidentes */}
            <Card className="bg-gradient-to-br from-red-600 to-red-700 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-red-100 text-sm font-medium mb-2">
                      Total de Acidentes
                    </p>
                    <p className="text-5xl font-bold mb-3">
                      {isLoading ? '...' : acidentes.length.toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 text-red-100 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {dadosMensais.reduce((acc, m) => acc + m.comVitimas, 0)} com vítimas
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <AlertTriangle className="h-16 w-16 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Evolução Mensal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <LineChartIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  Evolução Mensal de Acidentes - {new Date().getFullYear()}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : dadosMensais.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={dadosMensais}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#6b7280"
                      style={{ fontSize: '13px', fontWeight: 500 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '13px' }}
                      tickMargin={10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        border: '2px solid #3b82f6',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      name="Acidentes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cards de Estatísticas Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Veículos Ativos */}
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Veículos Ativos</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {isLoading ? '...' : (estatisticasFrota?.ativos || 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                      {estatisticasFrota && estatisticasFrota.total > 0
                        ? `${((estatisticasFrota.ativos / estatisticasFrota.total) * 100).toFixed(1)}% da frota`
                        : '0% da frota'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-200/50 dark:bg-green-800/30 rounded-xl">
                    <Truck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Veículos Inativos */}
            <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Veículos Inativos</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {isLoading ? '...' : (estatisticasFrota?.inativos || 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {estatisticasFrota && estatisticasFrota.total > 0
                        ? `${((estatisticasFrota.inativos / estatisticasFrota.total) * 100).toFixed(1)}% da frota`
                        : '0% da frota'}
                    </p>
                  </div>
                  <div className="p-3 bg-red-200/50 dark:bg-red-800/30 rounded-xl">
                    <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acidentes com Vítimas */}
            <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Acidentes com Vítimas</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {dadosMensais.reduce((acc, m) => acc + m.comVitimas, 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                      {dadosMensais.length > 0 && acidentes.length > 0
                        ? `${((dadosMensais.reduce((acc, m) => acc + m.comVitimas, 0) / acidentes.length) * 100).toFixed(1)}% dos acidentes`
                        : '0% dos acidentes'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-200/50 dark:bg-orange-800/30 rounded-xl">
                    <AlertTriangle className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total de Garagens */}
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Total de Garagens</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {frotaPorGaragem.length.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                      Distribuídas no sistema
                    </p>
                  </div>
                  <div className="p-3 bg-purple-200/50 dark:bg-purple-800/30 rounded-xl">
                    <MapPin className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Distribuição da Frota por Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                Distribuição da Frota por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : frotaPorStatus.length > 0 && frotaPorStatus.some(s => s.total > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gráfico de Pizza */}
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <Pie
                        data={frotaPorStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.status}: ${entry.total}`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {frotaPorStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '2px solid #3b82f6',
                          borderRadius: '10px',
                          padding: '10px'
                        }}
                        formatter={(value: number) => [`${value} veículos`, 'Total']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  {/* Cards de Resumo */}
                  <div className="space-y-3">
                    {frotaPorStatus.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border-2 hover:shadow-md transition-all"
                        style={{ 
                          borderColor: item.cor,
                          backgroundColor: `${item.cor}10`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.cor }}
                            />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              {item.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {item.total}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {estatisticasFrota && estatisticasFrota.total > 0
                                ? `${((item.total / estatisticasFrota.total) * 100).toFixed(1)}%`
                                : '0%'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Análises Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Garagens (Frota) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-gray-200 dark:border-gray-700 shadow-lg h-full">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  Top 10 Garagens (Frota)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : frotaPorGaragem.length > 0 && frotaPorGaragem.some(g => g.total > 0) ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={frotaPorGaragem.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        type="number" 
                        stroke="#6b7280" 
                        style={{ fontSize: '12px' }}
                        tickMargin={8}
                      />
                      <YAxis 
                        dataKey="garagem" 
                        type="category" 
                        stroke="#6b7280" 
                        style={{ fontSize: '11px' }}
                        width={100}
                        tickMargin={8}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '2px solid #3b82f6',
                          borderRadius: '10px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          padding: '10px'
                        }}
                        formatter={(value: number, name: string, entry: any) => [
                          `${value} veículos (${entry.payload.percentual.toFixed(1)}%)`, 
                          'Total'
                        ]}
                      />
                      <Bar dataKey="total" radius={[0, 8, 8, 0]} name="Veículos">
                        {frotaPorGaragem.slice(0, 10).map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index < 3 ? '#3b82f6' : index < 6 ? '#60a5fa' : '#93c5fd'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-400">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top 12 Prefixos com Mais Acidentes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-red-200 dark:border-red-800 shadow-lg h-full border-2">
              <CardHeader className="border-b border-red-100 dark:border-red-900 pb-4 bg-red-50 dark:bg-red-900/10">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  Top 12 Prefixos (Acidentes)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                  </div>
                ) : dadosPorPrefixo.length > 0 && dadosPorPrefixo.some(p => p.total > 0) ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dadosPorPrefixo} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" opacity={0.5} />
                      <XAxis 
                        type="number" 
                        stroke="#6b7280" 
                        style={{ fontSize: '12px' }}
                        tickMargin={8}
                      />
                      <YAxis 
                        dataKey="prefixo" 
                        type="category" 
                        stroke="#6b7280" 
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                        width={80}
                        tickMargin={8}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '2px solid #ef4444',
                          borderRadius: '10px',
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
                          padding: '10px'
                        }}
                        formatter={(value: number) => [`${value} acidentes`, 'Total']}
                      />
                      <Bar dataKey="total" radius={[0, 8, 8, 0]} name="Acidentes">
                        {dadosPorPrefixo.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              index < 3 ? '#dc2626' : 
                              index < 6 ? '#ef4444' : 
                              index < 9 ? '#f87171' : '#fca5a5'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-400">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Distribuição por Turno e Acidentes por Gravidade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Turno */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-200 dark:border-gray-700 shadow-lg h-full">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  Distribuição por Turno
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="h-[500px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : dadosPorTurno.length > 0 ? (
                  <div className="h-[500px] flex flex-col">
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsPieChart>
                        <Pie
                          data={dadosPorTurno}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.turno}: ${entry.percentual.toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="total"
                        >
                          {dadosPorTurno.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.purple[index % COLORS.purple.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                            border: '2px solid #8b5cf6',
                            borderRadius: '10px',
                            padding: '10px'
                          }}
                          formatter={(value: number, name: string, entry: any) => [
                            `${value} acidentes (${entry.payload.percentual.toFixed(1)}%)`,
                            'Total'
                          ]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    
                    {/* Detalhes dos Turnos */}
                    <div className="mt-4 space-y-2">
                      {dadosPorTurno.map((turno, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS.purple[index % COLORS.purple.length] }}
                            />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {turno.turno}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{turno.total}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {turno.percentual.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-gray-400">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Acidentes por Gravidade */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-200 dark:border-gray-700 shadow-lg h-full">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  Acidentes por Gravidade
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="h-[460px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                  </div>
                ) : dadosPorGravidade.length > 0 ? (
                  <div className="space-y-3">
                    {dadosPorGravidade.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              item.tipo.includes('COM') ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                            }`}>
                              {item.tipo.includes('COM') ? (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Activity className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.tipo}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {typeof item.valor === 'number' && !isNaN(item.valor)
                                  ? new Intl.NumberFormat('pt-BR', { 
                                      style: 'currency', 
                                      currency: 'BRL' 
                                    }).format(item.valor)
                                  : 'R$ 0,00'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{item.total}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.percentual.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              item.tipo.includes('COM') ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${item.percentual}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[460px] flex items-center justify-center text-gray-400">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Insights e Recomendações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg border-l-4 border-l-blue-600">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                Recomendações de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border-2 border-blue-300 dark:border-blue-700 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Gestão da Frota</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Focar manutenção preventiva nos {dadosPorPrefixo.slice(0, 5).length} veículos críticos
                      </p>
                      <div className="mt-2">
                        <Badge className="bg-blue-500 text-white text-xs">PRIORIDADE</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-xl border-2 border-purple-300 dark:border-purple-700 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Monitoramento Operacional</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Reforçar controles nas {frotaPorGaragem.slice(0, 3).length} garagens principais
                      </p>
                      <div className="mt-2">
                        <Badge className="bg-purple-500 text-white text-xs">OPERAÇÃO</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-xl border-2 border-green-300 dark:border-green-700 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Meta de Segurança</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Reduzir 20% dos acidentes com vítimas nos próximos 6 meses
                      </p>
                      <div className="mt-2">
                        <Badge className="bg-green-500 text-white text-xs">OBJETIVO</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
