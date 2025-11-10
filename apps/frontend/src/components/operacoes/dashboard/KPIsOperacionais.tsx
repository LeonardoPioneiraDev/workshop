// src/components/operacoes/dashboard/KPIsOperacionais.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Gauge,
  Target,
  Activity
} from 'lucide-react';
import type { KPIsOperacionais } from '@/types/departments/operacoes';

interface KPIsOperacionaisProps {
  kpis: KPIsOperacionais | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function KPIsOperacionais({ kpis, loading, error, className = "" }: KPIsOperacionaisProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar KPIs: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpis) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Nenhum dado de KPI disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const kpiItems = [
    {
      title: "Disponibilidade da Frota",
      value: `${kpis.percentualDisponibilidade?.toFixed(1) || '0.0'}%`,
      subtitle: `${kpis.veiculosDisponiveis || 0} de ${kpis.totalVeiculos || 0} veículos`,
      icon: <Truck className="h-4 w-4 text-blue-500" />,
      trend: {
        value: kpis.percentualDisponibilidade || 0,
        target: kpis.metaDisponibilidade || 90,
        isGood: (kpis.percentualDisponibilidade || 0) >= (kpis.metaDisponibilidade || 90)
      },
      color: "blue"
    },
    {
      title: "Índice de Sinistralidade",
      value: `${kpis.indiceSinistralidade?.toFixed(2) || '0.00'}%`,
      subtitle: "Acidentes por veículo",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      trend: {
        value: kpis.indiceSinistralidade || 0,
        target: kpis.metaSinistralidade || 5,
        isGood: (kpis.indiceSinistralidade || 0) <= (kpis.metaSinistralidade || 5)
      },
      color: "red"
    },
    {
      title: "Custo Médio por Acidente",
      value: (kpis.custoMedioAcidente || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
      }),
      subtitle: "Valor médio de danos",
      icon: <DollarSign className="h-4 w-4 text-green-500" />,
      trend: {
        value: kpis.custoMedioAcidente || 0,
        target: kpis.metaCustoMedio || 3000,
        isGood: (kpis.custoMedioAcidente || 0) <= (kpis.metaCustoMedio || 3000)
      },
      color: "green"
    },
    {
      title: "Eficiência Operacional",
      value: `${kpis.eficienciaOperacional?.toFixed(1) || '0.0'}%`,
      subtitle: "Performance geral",
      icon: <Gauge className="h-4 w-4 text-purple-500" />,
      trend: {
        value: kpis.eficienciaOperacional || 0,
        target: kpis.metaEficiencia || 85,
        isGood: (kpis.eficienciaOperacional || 0) >= (kpis.metaEficiencia || 85)
      },
      color: "purple"
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {kpiItems.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              <div className="flex items-center gap-1">
                {item.trend.isGood ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    item.trend.isGood 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.trend.isGood ? 'Meta atingida' : 'Abaixo da meta'}
                </Badge>
              </div>
            </div>
            
            {/* Barra de progresso para meta */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Meta: {item.trend.target}{item.title.includes('%') ? '%' : ''}</span>
                <span>{((item.trend.value / item.trend.target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.trend.isGood 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (item.trend.value / item.trend.target) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}