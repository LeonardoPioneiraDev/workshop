// apps/frontend/src/components/charts/BarChartComponent.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartComponentProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  title?: string;
  options?: Partial<ChartOptions<'bar'>>;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  title,
  options = {}
}) => {
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString('pt-BR')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number(value).toLocaleString('pt-BR');
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
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
      <Bar data={data} options={mergedOptions} />
    </div>
  );
};