// src/pages/departments/juridico/components/charts/RealChart.tsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface RealChartProps {
  type: string;
  title: string;
  apiEndpoint: string;
  filters?: any;
  height?: number | string;
  fullscreen?: boolean;
}

export const RealChart: React.FC<RealChartProps> = ({ 
  type, 
  title, 
  apiEndpoint,
  filters = {},
  height = 300, 
  fullscreen = false 
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartHeight = fullscreen ? '70vh' : typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${apiEndpoint}${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Erro ao carregar dados do gráfico');
        }
      } catch (err: any) {
        console.error(`Erro ao carregar gráfico ${title}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [apiEndpoint, filters, title]);

  if (loading) {
    return (
      <div 
        className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center"
        style={{ height: chartHeight }}
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Carregando {title}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800"
        style={{ height: chartHeight }}
      >
        <div className="text-center p-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Erro ao carregar gráfico</p>
          <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      style={{ height: chartHeight }}
    >
      {/* Aqui você integraria com uma biblioteca real de gráficos como Recharts, Chart.js, etc. */}
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-3">📊</div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Array.isArray(data) ? `${data.length} registros` : 'Dados carregados'}
          </p>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs text-left max-w-md">
            <strong>Dados da API:</strong>
            <pre className="mt-2 text-xs overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};