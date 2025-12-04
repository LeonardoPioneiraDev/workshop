// src/pages/departments/juridico/components/slides/CombinedPieCharts.tsx
import React from 'react';
import { PieChart } from '../charts/PieChart';

interface CombinedPieChartsProps {
  tiposData: any[];
  gravidadeData: any[];
  statusData: any[];
}

export const CombinedPieCharts: React.FC<CombinedPieChartsProps> = ({ 
  tiposData, 
  gravidadeData, 
  statusData 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 h-full overflow-hidden">
      {/* Tipos de Infração */}
      <div className="flex flex-col min-h-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center">
          Tipos de Infração
        </h3>
        <div className="flex-1 min-h-0">
          <PieChart 
            data={tiposData} 
            colors={["#3B82F6", "#EF4444"]}
            size="small"
          />
        </div>
      </div>
      
      {/* Gravidade */}
      <div className="flex flex-col min-h-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center">
          Classificação por Gravidade
        </h3>
        <div className="flex-1 min-h-0">
          <PieChart 
            data={gravidadeData} 
            colors={["#10B981", "#F59E0B", "#F97316", "#EF4444"]}
            size="small"
          />
        </div>
      </div>
      
      {/* Status */}
      <div className="flex flex-col min-h-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center">
          Status das Multas
        </h3>
        <div className="flex-1 min-h-0">
          <PieChart 
            data={statusData} 
            colors={["#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};