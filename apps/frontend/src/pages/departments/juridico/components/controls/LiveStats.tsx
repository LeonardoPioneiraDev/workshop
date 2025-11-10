// src/pages/departments/juridico/components/controls/LiveStats.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign } from 'lucide-react';

interface LiveStatsProps {
  totalMultas: number;
  totalValor: number;
}

export const LiveStats: React.FC<LiveStatsProps> = ({ totalMultas, totalValor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute bottom-4 right-4 z-30 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/20"
    >
      <div className="flex items-center gap-3 text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Ao Vivo</span>
        </div>
        <div className="w-px h-4 bg-white/20"></div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>{totalMultas?.toLocaleString('pt-BR') || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span>{(totalValor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </motion.div>
  );
};