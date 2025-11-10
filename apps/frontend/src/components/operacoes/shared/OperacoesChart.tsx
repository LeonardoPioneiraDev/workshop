// src/components/operacoes/shared/OperacoesChart.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { SimpleBarChart } from '../../ui/SimpleBarChart';
import { SimplePieChart } from '../../ui/SimplePieChart';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface OperacoesChartProps {
  title: string;
  type: 'bar' | 'pie' | 'line';
  data: any[];
  height?: number;
  dataKeys?: string[];
  colors?: string[];
  showLegend?: boolean;
  description?: string;
}

export function OperacoesChart({
  title,
  type,
  data,
  height = 300,
  dataKeys,
  colors,
  showLegend = true,
  description
}: OperacoesChartProps) {
  const getIcon = () => {
    switch (type) {
      case 'bar': return BarChart3;
      case 'pie': return PieChart;
      case 'line': return TrendingUp;
      default: return BarChart3;
    }
  };

  const Icon = getIcon();

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <SimpleBarChart
            data={data}
            height={height}
            dataKeys={dataKeys || ['value']}
            colors={colors || ['#3b82f6']}
          />
        );
      
      case 'pie':
        return (
          <SimplePieChart
            data={data}
            height={height}
          />
        );
      
      case 'line':
        // Para implementar no futuro com recharts
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Gráfico de linha em desenvolvimento
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        {showLegend && type === 'bar' && dataKeys && (
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {dataKeys.map((key, index) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors?.[index] || '#3b82f6' }}
                />
                <span className="text-sm">{key}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}