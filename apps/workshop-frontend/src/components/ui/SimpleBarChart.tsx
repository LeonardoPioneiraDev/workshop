// apps/frontend/src/components/departments/legal/charts/SimpleBarChart.tsx

import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

interface SimpleBarChartProps {
  data: Array<{ month: string; total: number; valor: number }>;
  title: string;
  description: string;
  loading?: boolean;
}

export function SimpleBarChart({ data, title, description, loading }: SimpleBarChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item.total));
  const totalMultas = data.reduce((sum, item) => sum + item.total, 0);
  const valorTotal = data.reduce((sum, item) => sum + item.valor, 0);
  
  const crescimento = data.length > 1 ? 
    ((data[data.length - 1].total - data[0].total) / data[0].total * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end justify-between gap-2 p-4">
          {data.map((item, index) => {
            const height = (item.total / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {item.month}<br/>
                    {item.total} multas<br/>
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  
                  {/* Barra */}
                  <div 
                    className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  
                  {/* Valor no topo */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                    {item.total}
                  </div>
                </div>
                
                {/* Label */}
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {item.month.slice(0, 6)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {crescimento > 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600">
                Crescimento de {crescimento.toFixed(1)}% no período
              </span>
            </>
          ) : crescimento < 0 ? (
            <>
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600">
                Redução de {Math.abs(crescimento).toFixed(1)}% no período
              </span>
            </>
          ) : (
            <span className="text-gray-600">Período estável</span>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {totalMultas} multas • Valor: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </CardFooter>
    </Card>
  );
}