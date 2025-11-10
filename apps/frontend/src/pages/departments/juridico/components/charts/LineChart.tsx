// src/pages/departments/juridico/components/charts/LineChart.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';

interface LineChartProps {
  data: any[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.quantidade || 0));
  const minValue = Math.min(...data.map(item => item.quantidade || 0));
  
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: maxValue > minValue ? 90 - ((item.quantidade - minValue) / (maxValue - minValue)) * 70 : 50,
    data: item
  }));
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Análise de tendências
  const getTrendAnalysis = () => {
    const trends = [];
    
    // Encontrar picos e vales
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1].quantidade;
      const current = data[i].quantidade;
      const next = data[i + 1].quantidade;
      
      if (current > prev && current > next && current > maxValue * 0.7) {
        trends.push(`Pico em ${data[i].mes} (${current} multas)`);
      } else if (current < prev && current < next && current < maxValue * 0.3) {
        trends.push(`Vale em ${data[i].mes} (${current} multas)`);
      }
    }
    
    // Tendência geral
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const avgFirst = firstHalf.reduce((sum, item) => sum + item.quantidade, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, item) => sum + item.quantidade, 0) / secondHalf.length;
    
    if (avgSecond > avgFirst * 1.1) {
      trends.push("Tendência crescente nos últimos meses");
    } else if (avgSecond < avgFirst * 0.9) {
      trends.push("Tendência decrescente nos últimos meses");
    } else {
      trends.push("Comportamento estável no período");
    }
    
    return trends;
  };

  const trends = getTrendAnalysis();
  
  return (
    <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 min-h-[250px] sm:min-h-[300px]">
        <svg width="100%" height="100%" className="absolute inset-4 sm:inset-6" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            d={`${pathData} L 100 90 L 0 90 Z`}
            fill="url(#gradient)"
            className="drop-shadow-sm"
          />
          
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.8"
            className="drop-shadow-sm"
            vectorEffect="non-scaling-stroke"
          />
          
          {points.map((point, index) => (
            <motion.circle
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill="#3B82F6"
              className="drop-shadow-sm"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        
        {/* Análise de tendências */}
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold">Análise</span>
          </div>
          <div className="space-y-1">
            {trends.slice(0, 3).map((trend, index) => (
              <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                • {trend}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
        {data.map((item, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">
              {(item.quantidade || 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {item.mes}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              {item.valorFormatado}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};