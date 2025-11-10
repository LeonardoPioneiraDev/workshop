// src/pages/departments/juridico/components/slides/DashboardWithSectors.tsx
import React from 'react';
import { StatsCards } from '../charts/StatsCards';
import { PieChart } from '../charts/PieChart';

interface DashboardWithSectorsProps {
  resumoData: {
    totalMultas: number;
    totalValor: number;
    totalPontos: number;
    agentesAtivos: number;
    veiculosUnicos: number;
  };
  setoresData: any[];
}

export const DashboardWithSectors: React.FC<DashboardWithSectorsProps> = ({ 
  resumoData, 
  setoresData 
}) => {
  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 overflow-hidden">
      {/* Cards de Estatísticas - Ocupando toda a largura */}
      <div className="flex-shrink-0">
        <StatsCards data={resumoData} />
      </div>
      
      {/* Análise por Setor - Ocupando o restante do espaço */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Análise por Setor
        </h3>
        <div className="flex-1 min-h-0 overflow-hidden">
          <PieChart data={setoresData} size="large" />
        </div>
      </div>
    </div>
  );
};