// src/pages/departments/juridico/components/slides/Slide.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface SlideProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

export const Slide: React.FC<SlideProps> = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon, 
  gradient = "from-blue-500 to-purple-600" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full h-full flex flex-col"
    >
      {/* Header do Slide */}
      <div className={`bg-gradient-to-r ${gradient} text-white p-3 sm:p-4 lg:p-6 rounded-t-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 lg:gap-4">
          {Icon && (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 animate-pulse rounded-xl bg-white/20 opacity-70 blur-lg"></div>
              <div className="relative p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm lg:text-base opacity-90 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Conteúdo do Slide */}
      <div className="flex-1 bg-white dark:bg-gray-900 p-3 sm:p-4 lg:p-6 rounded-b-2xl shadow-2xl border-x border-b border-gray-200 dark:border-gray-700 overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};