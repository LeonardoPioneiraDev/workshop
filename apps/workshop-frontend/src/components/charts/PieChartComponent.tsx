// apps/frontend/src/components/charts/PieChartComponent.tsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartComponentProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }>;
  };
  title?: string;
  options?: Partial<ChartOptions<'pie'>>;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  options = {}
}) => {
  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString('pt-BR')} (${percentage}%)`;
          }
        }
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className="w-full h-full">
      {title && (
        <h3 className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          {title}
        </h3>
      )}
      <Pie data={data} options={mergedOptions} />
    </div>
  );
};