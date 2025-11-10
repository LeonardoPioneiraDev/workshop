// src/pages/departments/juridico/components/charts/BarChart.tsx
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface BarChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  color?: string;
  showTooltip?: boolean;
  isFullscreen?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  dataKey, 
  nameKey, 
  color = "#3B82F6", 
  showTooltip = false,
  isFullscreen = false 
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item[dataKey] || 0));
  
  // Auto-scroll em tela cheia
  useEffect(() => {
    if (isFullscreen && scrollContainerRef.current && data.length > 10) {
      const container = scrollContainerRef.current;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      
      if (scrollHeight > 0) {
        const scrollInterval = setInterval(() => {
          setScrollPosition(prev => {
            const newPosition = prev + 2;
            if (newPosition >= scrollHeight) {
              return 0; // Volta ao topo
            }
            return newPosition;
          });
        }, 100);

        return () => clearInterval(scrollInterval);
      }
    }
  }, [isFullscreen, data.length]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const itemHeight = isFullscreen ? 50 : 40;
  const maxVisibleItems = isFullscreen ? Math.floor(window.innerHeight * 0.6 / itemHeight) : 12;
  const shouldScroll = data.length > maxVisibleItems && !isFullscreen;
  const containerHeight = isFullscreen ? '60vh' : shouldScroll ? `${maxVisibleItems * itemHeight}px` : 'auto';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className={`flex-1 space-y-2 ${shouldScroll ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}
        style={{ maxHeight: containerHeight }}
      >
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ duration: 1, delay: index * 0.03, ease: "easeOut" }}
            className="flex items-center gap-2 sm:gap-3 group"
            style={{ minHeight: `${itemHeight - 8}px` }}
          >
            <div 
              className={`${isFullscreen ? 'w-32 sm:w-40 lg:w-48' : 'w-16 sm:w-20 lg:w-24'} text-xs sm:text-sm font-medium text-right flex-shrink-0`}
              title={showTooltip ? (item.localCompleto || item.nomeCompleto || item[nameKey]) : undefined}
            >
              <span className="block">
                {isFullscreen ? (item.localCompleto || item.nomeCompleto || item[nameKey]) : item[nameKey]}
              </span>
              {item.localPrincipal && (
                <span className="block text-xs text-gray-500">
                  {isFullscreen ? item.localCompleto : item.localPrincipal}
                </span>
              )}
            </div>
            <div className="flex-1 relative min-h-[32px] sm:min-h-[36px]">
              <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${maxValue > 0 ? (item[dataKey] / maxValue) * 100 : 0}%` }}
                  transition={{ duration: 1.2, delay: index * 0.03, ease: "easeOut" }}
                  className="h-8 sm:h-9 rounded-lg flex items-center px-2 sm:px-3 text-white font-bold text-xs sm:text-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:brightness-110"
                  style={{ backgroundColor: color, minWidth: '60px' }}
                >
                  <span className="text-white drop-shadow-sm">
                    {item[dataKey]?.toLocaleString('pt-BR') || 0}
                  </span>
                </motion.div>
              </div>
            </div>
            <div className="w-10 sm:w-12 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex-shrink-0 text-center">
              {item.percentual}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};