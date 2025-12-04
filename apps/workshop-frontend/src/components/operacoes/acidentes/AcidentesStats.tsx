// src/components/operacoes/acidentes/AcidentesStats.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  MapPin,
  Car,
  Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { EstatisticasAcidentes } from '@/types/departments/operacoes';

interface AcidentesStatsProps {
  estatisticas: EstatisticasAcidentes | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function AcidentesStats({ estatisticas, loading, error, className = "" }: AcidentesStatsProps) {
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar estatísticas: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estatisticas) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Nenhuma estatística disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resumo, distribuicao } = estatisticas;

  // Dados para gráfico de pizza
  const dadosPizza = [
    { name: 'Com Vítimas', value: resumo.comVitimas, color: '#ef4444' },
    { name: 'Sem Vítimas', value: resumo.semVitimas, color: '#22c55e' }
  ];

  // Dados para gráfico de barras por garagem
  const dadosGaragem = distribuicao.porGaragem.slice(0, 5).map(item => ({
    garagem: item.garagem.length > 10 ? item.garagem.substring(0, 10) + '...' : item.garagem,
    total: item.total,
    comVitimas: item.comVitimas,
    valorTotal: item.valorTotal / 1000 // em milhares
  }));

  const statsCards = [
    {
      title: "Total de Acidentes",
      value: resumo.total.toLocaleString('pt-BR'),
      subtitle: "Registrados no período",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      color: "red"
    },
    {
      title: "Com Vítimas",
      value: resumo.comVitimas.toLocaleString('pt-BR'),
      subtitle: `${resumo.percentualComVitimas.toFixed(1)}% do total`,
      icon: <Users className="h-4 w-4 text-orange-500" />,
      color: "orange",
      badge: resumo.percentualComVitimas <= 20 ? 'Baixo' : resumo.percentualComVitimas <= 40 ? 'Médio' : 'Alto'
    },
    {
      title: "Sem Vítimas",
      value: resumo.semVitimas.toLocaleString('pt-BR'),
      subtitle: `${(100 - resumo.percentualComVitimas).toFixed(1)}% do total`,
      icon: <Car className="h-4 w-4 text-green-500" />,
      color: "green"
    },
    {
      title: "Valor Total Danos",
      value: resumo.valorTotalDanos.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }),
      subtitle: `Média: ${(resumo.valorTotalDanos / (resumo.total || 1)).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      })}`,
      icon: <DollarSign className="h-4 w-4 text-blue-500" />,
      color: "blue"
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Baixo':
        return 'bg-green-100 text-green-800';
      case 'Médio':
        return 'bg-yellow-100 text-yellow-800';
      case 'Alto':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                {card.badge && (
                  <Badge className={`text-xs ${getBadgeColor(card.badge)}`}>
                    {card.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Distribuição por Gravidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Gravidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Acidentes']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Por Garagem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acidentes por Garagem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGaragem}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="garagem" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'valorTotal' ? `R$ ${value}k` : value,
                      name === 'total' ? 'Total' : 
                      name === 'comVitimas' ? 'Com Vítimas' : 'Valor (R$ mil)'
                    ]}
                  />
                  <Bar dataKey="total" fill="#3b82f6" name="total" />
                  <Bar dataKey="comVitimas" fill="#ef4444" name="comVitimas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuições detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Por Turno */}
        {distribuicao.porTurno && distribuicao.porTurno.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Por Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {distribuicao.porTurno.map((turno, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{turno.turno || 'Não informado'}</div>
                      <div className="text-sm text-gray-600">
                        {turno.comVitimas} com vítimas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {turno.total}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((turno.total / resumo.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Por Mês */}
        {distribuicao.porMes && distribuicao.porMes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {distribuicao.porMes.slice(-6).map((mes, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{mes.mesAno}</div>
                      <div className="text-sm text-gray-600">
                        {mes.comVitimas} com vítimas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {mes.total}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mes.valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Garagens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Garagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribuicao.porGaragem.slice(0, 5).map((garagem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{garagem.garagem}</div>
                    <div className="text-sm text-gray-600">
                      {garagem.percentualComVitimas.toFixed(1)}% com vítimas
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      {garagem.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      Índice: {garagem.indiceSinistralidade.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}