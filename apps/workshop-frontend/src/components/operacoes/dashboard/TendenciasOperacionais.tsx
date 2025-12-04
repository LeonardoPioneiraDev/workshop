// src/components/operacoes/dashboard/TendenciasOperacionais.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { TendenciasOperacionais } from '@/types/departments/operacoes';

interface TendenciasOperacionaisProps {
  tendencias: TendenciasOperacionais | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function TendenciasOperacionais({ 
  tendencias, 
  loading, 
  error, 
  className = "" 
}: TendenciasOperacionaisProps) {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <TrendingDown className="h-5 w-5" />
            <span>Erro ao carregar tendências: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tendencias) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhum dado de tendência disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'CRESCENTE':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'DECRESCENTE':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (tendencia: string) => {
    switch (tendencia) {
      case 'CRESCENTE':
        return 'bg-red-100 text-red-700';
      case 'DECRESCENTE':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Preparar dados para gráficos
  const dadosGraficoMensal = tendencias.porMes.map(item => ({
    mes: item.mesAno,
    acidentes: item.total,
    comVitimas: item.comVitimas,
    valorDanos: item.valorTotal / 1000 // em milhares
  }));

  const dadosComparativo = [
    {
      categoria: 'Total de Acidentes',
      anoAtual: tendencias.anoAtual.total,
      anoAnterior: tendencias.anoAnterior.total,
      variacao: tendencias.variacoes.total
    },
    {
      categoria: 'Com Vítimas',
      anoAtual: tendencias.anoAtual.comVitimas,
      anoAnterior: tendencias.anoAnterior.comVitimas,
      variacao: tendencias.variacoes.comVitimas
    },
    {
      categoria: 'Valor Danos (R$ mil)',
      anoAtual: Math.round(tendencias.anoAtual.valorDanos / 1000),
      anoAnterior: Math.round(tendencias.anoAnterior.valorDanos / 1000),
      variacao: ((tendencias.anoAtual.valorDanos - tendencias.anoAnterior.valorDanos) / tendencias.anoAnterior.valorDanos) * 100
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resumo das tendências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumo das Tendências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {tendencias.anoAtual.ano}
              </div>
              <div className="text-sm text-gray-600 mb-2">Ano Atual</div>
              <div className="space-y-1 text-xs">
                <div>{tendencias.anoAtual.total} acidentes</div>
                <div>{tendencias.anoAtual.comVitimas} com vítimas</div>
                <div>
                  {tendencias.anoAtual.valorDanos.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0
                  })} em danos
                </div>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">
                {tendencias.anoAnterior.ano}
              </div>
              <div className="text-sm text-blue-600 mb-2">Ano Anterior</div>
              <div className="space-y-1 text-xs">
                <div>{tendencias.anoAnterior.total} acidentes</div>
                <div>{tendencias.anoAnterior.comVitimas} com vítimas</div>
                <div>
                  {tendencias.anoAnterior.valorDanos.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0
                  })} em danos
                </div>
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getTrendIcon(tendencias.variacoes.tendencia)}
                <Badge className={getTrendColor(tendencias.variacoes.tendencia)}>
                  {tendencias.variacoes.tendencia}
                </Badge>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  {tendencias.variacoes.total > 0 ? '+' : ''}
                  {tendencias.variacoes.total.toFixed(1)}% acidentes
                </div>
                <div>
                  {tendencias.variacoes.comVitimas > 0 ? '+' : ''}
                  {tendencias.variacoes.comVitimas.toFixed(1)}% com vítimas
                </div>
                <div className="text-xs text-gray-500">
                  Confiabilidade: {(tendencias.variacoes.confiabilidade * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de evolução mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGraficoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'valorDanos' ? `R$ ${value}k` : value,
                    name === 'acidentes' ? 'Total de Acidentes' :
                    name === 'comVitimas' ? 'Com Vítimas' : 'Valor Danos (R$ mil)'
                  ]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="acidentes" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="comVitimas" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo anual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Comparativo Anual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosComparativo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="categoria" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'anoAtual' ? `${tendencias.anoAtual.ano}` : `${tendencias.anoAnterior.ano}`
                  ]}
                />
                <Bar dataKey="anoAnterior" fill="#94a3b8" name="anoAnterior" />
                <Bar dataKey="anoAtual" fill="#3b82f6" name="anoAtual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Previsões (se disponível) */}
      {tendencias.previsoes && tendencias.previsoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Previsões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tendencias.previsoes.slice(0, 3).map((previsao, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    {new Date(2024, previsao.mes - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </div>
                  <div className="space-y-2 mt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Acidentes previstos:</span>
                      <span className="font-medium">{previsao.previsaoTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Com vítimas:</span>
                      <span className="font-medium">{previsao.previsaoComVitimas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confiabilidade:</span>
                      <Badge variant="outline" className="text-xs">
                        {(previsao.probabilidade * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}