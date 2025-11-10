// apps/frontend/src/components/charts/DoughnutChartComponent.tsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartComponentProps {
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
  options?: Partial<ChartOptions<'doughnut'>>;
}

export const DoughnutChartComponent: React.FC<DoughnutChartComponentProps> = ({
  data,
  title,
  options = {}
}) => {
  const defaultOptions: ChartOptions<'doughnut'> = {
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
    },
    cutout: '60%'
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className="w-full h-full">
      {title && (
        <h3 className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          {title}
        </h3>
      )}
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
};