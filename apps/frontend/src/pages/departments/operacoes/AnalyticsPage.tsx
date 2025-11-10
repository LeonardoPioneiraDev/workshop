// src/pages/departments/operacoes/AnalyticsPageSimple.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  ArrowLeft,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { acidentesApi } from '@/services/departments/operacoes/api/acidentesApi';
import { toast } from 'sonner';
import type { Acidente } from '@/types/departments/operacoes';

const COLORS = {
  turno: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
  prefixo: ['#dc2626', '#ef4444', '#f87171', '#fca5a5'],
  gravidade: ['#ef4444', '#10b981']
};

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [acidentes, setAcidentes] = useState<Acidente[]>([]);
  const [dadosPorTurno, setDadosPorTurno] = useState<any[]>([]);
  const [dadosPorPrefixo, setDadosPorPrefixo] = useState<any[]>([]);
  const [dadosPorGravidade, setDadosPorGravidade] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const { data } = await acidentesApi.buscarAcidentes({ limit: 10000, page: 1 });
      setAcidentes(data);
      processarDados(data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const processarDados = (dados: Acidente[]) => {
    if (!dados || dados.length === 0) return;

    const totalGeral = dados.length;

    // ===== POR TURNO =====
    const turnoMap = new Map<string, number>();
    dados.forEach(ac => {
      if (ac.turno) {
        turnoMap.set(ac.turno, (turnoMap.get(ac.turno) || 0) + 1);
      }
    });
    
    const dadosTurno = Array.from(turnoMap.entries())
      .map(([turno, total]) => ({ 
        turno, 
        total,
        percentual: (total / totalGeral) * 100
      }))
      .sort((a, b) => b.total - a.total);
    setDadosPorTurno(dadosTurno);

    // ===== POR PREFIXO (TOP 12) =====
    const prefixoMap = new Map<string, number>();
    dados.forEach(ac => {
      const prefixo = ac.prefixoVeiculo;
      if (prefixo && prefixo.trim() !== '') {
        prefixoMap.set(prefixo, (prefixoMap.get(prefixo) || 0) + 1);
      }
    });
    
    const dadosPrefixo = Array.from(prefixoMap.entries())
      .map(([prefixo, total]) => ({ prefixo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
    setDadosPorPrefixo(dadosPrefixo);

    // ===== POR GRAVIDADE =====
    const gravidadeMap = new Map<string, { total: number, valor: number }>();
    dados.forEach(ac => {
      const gravidade = ac.grauAcidente || 'NÃO INFORMADO';
      const atual = gravidadeMap.get(gravidade) || { total: 0, valor: 0 };
      const valor = typeof ac.valorTotalDano === 'number' && !isNaN(ac.valorTotalDano) ? ac.valorTotalDano : 0;
      
      gravidadeMap.set(gravidade, {
        total: atual.total + 1,
        valor: atual.valor + valor
      });
    });
    
    const dadosGravidade = Array.from(gravidadeMap.entries())
      .map(([tipo, stats]) => ({ 
        tipo, 
        total: stats.total,
        percentual: (stats.total / totalGeral) * 100,
        valor: stats.valor
      }))
      .sort((a, b) => b.total - a.total);
    setDadosPorGravidade(dadosGravidade);
  };

  const comVitimas = dadosPorGravidade
    .filter(g => g.tipo.toUpperCase().includes('VÍTIMA') || g.tipo.toUpperCase().includes('VITIMA'))
    .reduce((acc, g) => acc + g.total, 0);

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
                  Analytics de Acidentes
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Visão geral dos acidentes operacionais
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={carregarDados}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* KPI Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-red-600 to-red-700 border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-red-100 text-sm font-medium mb-2">
                    Total de Acidentes Registrados
                  </p>
                  <p className="text-5xl font-bold mb-3">
                    {isLoading ? '...' : acidentes.length.toLocaleString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-4 text-red-100 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{comVitimas} com vítimas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>{dadosPorTurno.length} turnos ativos</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                  <AlertTriangle className="h-16 w-16 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top 12 Prefixos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-red-200 dark:border-red-800 shadow-lg border-2">
              <CardHeader className="border-b border-red-100 dark:border-red-900 pb-4 bg-red-50 dark:bg-red-900/10">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  Top 12 Veículos com Mais Acidentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                  </div>
                ) : dadosPorPrefixo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dadosPorPrefixo} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" opacity={0.5} />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis 
                        dataKey="prefixo" 
                        type="category" 
                        stroke="#6b7280" 
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '2px solid #ef4444',
                          borderRadius: '10px',
                          padding: '10px'
                        }}
                        formatter={(value: number) => [`${value} acidentes`, 'Total']}
                      />
                      <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                        {dadosPorPrefixo.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS.prefixo[Math.min(index, 3)]}
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

          {/* Distribuição por Turno */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
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
                  <div className="h-[400px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : dadosPorTurno.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <RechartsPieChart>
                        <Pie
                          data={dadosPorTurno}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.turno}: ${entry.percentual.toFixed(1)}%`}
                          outerRadius={80}
                          dataKey="total"
                        >
                          {dadosPorTurno.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.turno[index % COLORS.turno.length]} />
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
                    
                    <div className="space-y-2">
                      {dadosPorTurno.map((turno, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS.turno[index % COLORS.turno.length] }}
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
                  <div className="h-[400px] flex items-center justify-center text-gray-400">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Acidentes por Gravidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                Acidentes por Gravidade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                </div>
              ) : dadosPorGravidade.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dadosPorGravidade.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.tipo.toUpperCase().includes('VÍTIMA') || item.tipo.toUpperCase().includes('VITIMA')
                              ? 'bg-red-100 dark:bg-red-900/30' 
                              : 'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {item.tipo.toUpperCase().includes('VÍTIMA') || item.tipo.toUpperCase().includes('VITIMA') ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Activity className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.total}</p>
                      </div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{item.tipo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.percentual.toFixed(1)}% do total
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            item.tipo.toUpperCase().includes('VÍTIMA') || item.tipo.toUpperCase().includes('VITIMA')
                              ? 'bg-red-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${item.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
