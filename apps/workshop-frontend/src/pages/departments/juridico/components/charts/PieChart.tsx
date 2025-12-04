// src/pages/departments/juridico/components/charts/PieChart.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface PieChartProps {
  data: any[];
  colors?: string[];
  size?: 'small' | 'medium' | 'large';
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"], 
  size = "medium" 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  let currentAngle = 0;
  
  const sizes = {
    small: { svg: 160, radius: 60, center: 80 },
    medium: { svg: 240, radius: 90, center: 120 },
    large: { svg: 320, radius: 130, center: 160 }
  };
  
  const { svg: svgSize, radius, center } = sizes[size] || sizes.medium;
  
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 h-full overflow-hidden">
      <div className="relative flex-shrink-0">
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          {data.map((item, index) => {
            const quantidade = item.quantidade || 0;
            const percentage = total > 0 ? (quantidade / total) * 100 : 0;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            if (angle === 0) return null;
            
            const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = center + radius * Math.cos(((startAngle + angle) * Math.PI) / 180);
            const y2 = center + radius * Math.sin(((startAngle + angle) * Math.PI) / 180);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            return (
              <motion.path
                key={index}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
                className="drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 cursor-pointer hover:brightness-110"
                style={{ filter: 'brightness(1.05)' }}
              />
            );
          })}
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-gray-800 rounded-full p-3 sm:p-4 lg:p-6 shadow-xl border-4 border-gray-100 dark:border-gray-700">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              {total.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              Total
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 space-y-2 sm:space-y-3 min-w-0 overflow-hidden">
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          {data.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <div 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md flex-shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base truncate">
                  {item.tipo || item.status || item.gravidade || item.categoria || item.setor}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{(item.quantidade || 0).toLocaleString('pt-BR')}</span>
                  <span className="ml-2 text-xs">({item.percentual}%)</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};