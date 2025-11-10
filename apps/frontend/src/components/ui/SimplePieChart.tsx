// apps/frontend/src/components/departments/legal/charts/SimplePieChart.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface SimplePieChartProps {
  data: Array<{ gravidade: string; total: number; valor: number; color: string }>;
  loading?: boolean;
}

export function SimplePieChart({ data, loading }: SimplePieChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Gravidade</CardTitle>
          <CardDescription>Classificação das infrações por nível de gravidade</CardDescription>
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
          <CardTitle>Distribuição por Gravidade</CardTitle>
          <CardDescription>Classificação das infrações por nível de gravidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.total, 0);
  
  // Calcular ângulos para o gráfico de pizza
  let currentAngle = 0;
  const segments = data.map(item => {
    const percentage = (item.total / total) * 100;
    const angle = (item.total / total) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    };
    currentAngle += angle;
    return segment;
  });

  // Função para criar path do SVG
  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Gravidade</CardTitle>
        <CardDescription>Classificação das infrações por nível de gravidade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Gráfico de Pizza SVG */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {segments.map((segment, index) => (
                <g key={segment.gravidade}>
                  <path
                    d={createPath(100, 100, 80, segment.startAngle, segment.endAngle)}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                  {/* Label no centro do segmento */}
                  {segment.percentage > 5 && (
                    <text
                      x={100 + 50 * Math.cos(((segment.startAngle + segment.endAngle) / 2 - 90) * Math.PI / 180)}
                      y={100 + 50 * Math.sin(((segment.startAngle + segment.endAngle) / 2 - 90) * Math.PI / 180)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-medium fill-white"
                    >
                      {segment.percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Legenda */}
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.gravidade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="font-medium text-sm">{item.gravidade}</div>
                    <div className="text-xs text-gray-600">
                      {((item.total / total) * 100).toFixed(1)}% do total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {item.total}
                  </Badge>
                  <div className="text-xs text-gray-600 mt-1">
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}