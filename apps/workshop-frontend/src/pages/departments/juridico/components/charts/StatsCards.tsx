// src/pages/departments/juridico/components/charts/StatsCards.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  DollarSign, 
  Target, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

interface StatsCardsProps {
  data: {
    totalMultas: number;
    totalValor: number;
    totalPontos: number;
    agentesAtivos: number;
    veiculosUnicos: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const stats = [
    {
      title: "Total de Multas",
      value: (data.totalMultas || 0).toLocaleString('pt-BR'),
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      change: "+12%",
      changeType: "increase"
    },
    {
      title: "Valor Total",
      value: formatCurrency(data.totalValor),
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      change: "+8.5%",
      changeType: "increase"
    },
    {
      title: "Pontos CNH",
      value: (data.totalPontos || 0).toLocaleString('pt-BR'),
      icon: Target,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      change: "+15%",
      changeType: "increase"
    },
    {
      title: "Agentes Ativos",
      value: (data.agentesAtivos || 0).toString(),
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      change: "+3",
      changeType: "increase"
    },
    {
      title: "Veículos Únicos",
      value: (data.veiculosUnicos || 0).toString(),
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      change: "+7",
      changeType: "increase"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
          className={`${stat.bgColor} rounded-2xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${stat.color} rounded-xl shadow-lg`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium">
              {stat.changeType === 'increase' ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                {stat.change}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              {stat.title}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};