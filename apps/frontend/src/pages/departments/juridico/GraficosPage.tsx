// src/pages/departments/juridico/GraficosPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  Target,
  Calendar,
  TrendingUp,
  Building,
  AlertTriangle
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Hooks
import { useGraficosData } from './components/hooks/useGraficosData';
import { useFullscreen } from './components/hooks/useFullscreen';
import { useSlideshow } from './components/hooks/useSlideshow';

// Componentes
import { Slide } from './components/slides/Slide';
import { DashboardWithSectors } from './components/slides/DashboardWithSectors';
import { CombinedPieCharts } from './components/slides/CombinedPieCharts';
import { BarChart } from './components/charts/BarChart';
import { LineChart } from './components/charts/LineChart';
import { PlaybackControls } from './components/controls/PlaybackControls';
import { NavigationDots } from './components/controls/NavigationDots';
import { LiveStats } from './components/controls/LiveStats';

export default function GraficosPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Hooks customizados
  const { data, loading, error, refetch } = useGraficosData();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  // Definir slides
  const slides = [
    {
      id: 'dashboard-setores',
      title: 'Dashboard Executivo & Setores',
      subtitle: 'Visão geral das multas, indicadores principais e análise por setor',
      icon: BarChart3,
      gradient: 'from-blue-500 to-purple-600',
      component: <DashboardWithSectors resumoData={data.resumoGeral} setoresData={data.multasPorSetor} />
    },
    {
      id: 'horarios',
      title: 'Distribuição por Horário',
      subtitle: 'Padrão de aplicação de multas ao longo do dia',
      icon: Clock,
      gradient: 'from-orange-500 to-red-600',
      component: <BarChart data={data.multasPorHorario} dataKey="quantidade" nameKey="horario" color="#F59E0B" isFullscreen={isFullscreen} />
    },
    {
      id: 'dias-semana',
      title: 'Multas por Dia da Semana',
      subtitle: 'Análise semanal da aplicação de multas',
      icon: Calendar,
      gradient: 'from-green-500 to-teal-600',
      component: <BarChart data={data.multasPorDiaSemana} dataKey="quantidade" nameKey="dia" color="#10B981" isFullscreen={isFullscreen} />
    },
    {
      id: 'locais',
      title: 'Locais Críticos',
      subtitle: 'Locais com maior incidência de infrações',
      icon: MapPin,
      gradient: 'from-purple-500 to-pink-600',
      component: <BarChart data={data.multasPorLocal} dataKey="quantidade" nameKey="local" color="#8B5CF6" showTooltip={true} isFullscreen={isFullscreen} />
    },
    {
      id: 'evolucao',
      title: 'Evolução Temporal',
      subtitle: 'Tendência das multas nos últimos 12 meses',
      icon: TrendingUp,
      gradient: 'from-cyan-500 to-blue-600',
      component: <LineChart data={data.evolucaoMensal} />
    },
    {
      id: 'agentes',
      title: 'Ranking de Agentes SEMOB',
      subtitle: 'Agentes com maior número de multas aplicadas e seus locais principais',
      icon: Users,
      gradient: 'from-yellow-500 to-orange-600',
      component: <BarChart data={data.agentesRanking} dataKey="total" nameKey="nome" color="#F59E0B" showTooltip={true} isFullscreen={isFullscreen} />
    },
    {
      id: 'analise-completa',
      title: 'Análise Completa',
      subtitle: 'Visão geral de tipos, gravidade e status das multas',
      icon: Target,
      gradient: 'from-rose-500 to-pink-600',
      component: <CombinedPieCharts 
        tiposData={data.tiposInfracao} 
        gravidadeData={data.multasPorGravidade} 
        statusData={data.statusMultas} 
      />
    }
  ];

  const {
    currentSlide,
    isPlaying,
    progress,
    nextSlide,
    prevSlide,
    togglePlay,
    goToSlide
  } = useSlideshow({ totalSlides: slides.length, autoPlayDuration: 30 });

  // Atualizar hora
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="border-red-300 bg-red-50/80 backdrop-blur-sm p-8 max-w-md w-full shadow-2xl">
          <CardContent className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-700 mb-2">Erro ao carregar gráficos</h2>
              <p className="text-red-600 mb-4 leading-relaxed">{error}</p>
              <Button 
                onClick={refetch} 
                className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-6"
              >
                <BarChart3 className="w-16 h-16 text-blue-500 mx-auto" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Carregando Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Processando dados das multas...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="bg-blue-500 h-2 rounded-full"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden`}>
      
      {/* Background elements */}
      <div className="absolute top-4 left-4 w-20 h-20 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-4 w-20 h-20 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-20 h-20 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 h-full flex flex-col relative z-10">
        
        {/* Header - oculto em tela cheia */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <Button
                onClick={() => navigate('/departments/juridico')}
                variant="outline"
                size="sm"
                className="self-start border-blue-300 text-blue-300 hover:bg-blue-100/10 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Jurídico
              </Button>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 bg-white/5 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">
                  {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex justify-center mb-3 sm:mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-blue-200/60 opacity-70 blur-xl"></div>
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl border-2 border-blue-200/30">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Dashboard de Multas
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
                Análise visual e interativa dos dados de multas de trânsito e SEMOB
              </p>
            </div>
          </motion.div>
        )}

        {/* Controles - Modo Normal */}
        {!isFullscreen && (
          <div className="mb-3 sm:mb-6">
            <PlaybackControls
              isPlaying={isPlaying}
              isFullscreen={isFullscreen}
              loading={loading}
              currentSlide={currentSlide}
              totalSlides={slides.length}
              onPrevSlide={prevSlide}
              onTogglePlay={togglePlay}
              onNextSlide={nextSlide}
              onRefetch={refetch}
              onToggleFullscreen={toggleFullscreen}
              variant="normal"
            />
          </div>
        )}

        {/* Controles - Modo Tela Cheia */}
        {isFullscreen && (
          <>
            <div className="absolute top-4 left-4 z-30">
              <PlaybackControls
                isPlaying={isPlaying}
                isFullscreen={isFullscreen}
                loading={loading}
                currentSlide={currentSlide}
                totalSlides={slides.length}
                onPrevSlide={prevSlide}
                onTogglePlay={togglePlay}
                onNextSlide={nextSlide}
                onRefetch={refetch}
                onToggleFullscreen={toggleFullscreen}
                variant="fullscreen"
              />
            </div>

            <LiveStats 
              totalMultas={data.resumoGeral.totalMultas}
              totalValor={data.resumoGeral.totalValor}
            />
          </>
        )}

        {/* Barra de Progresso */}
        {isPlaying && (
          <div className={`${isFullscreen ? 'absolute top-16 left-4 right-4 z-20' : 'mb-3 sm:mb-4'}`}>
            <Progress 
              value={progress} 
              className="h-1 sm:h-2 bg-white/20 border border-white/30 rounded-full overflow-hidden"
            />
          </div>
        )}

        {/* Slide Atual */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full h-full max-w-none">
            <AnimatePresence mode="wait">
              <Slide
                key={currentSlide}
                title={slides[currentSlide].title}
                subtitle={slides[currentSlide].subtitle}
                icon={slides[currentSlide].icon}
                gradient={slides[currentSlide].gradient}
              >
                {slides[currentSlide].component}
              </Slide>
            </AnimatePresence>
          </div>
        </div>

        {/* Navegação por pontos - oculta em tela cheia */}
        {!isFullscreen && (
          <NavigationDots
            totalSlides={slides.length}
            currentSlide={currentSlide}
            onSlideChange={goToSlide}
          />
        )}
      </div>

      {/* Estilos CSS */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .fixed.inset-0 {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
        
        @media (max-width: 640px) {
          .bg-grid-pattern {
            background-size: 15px 15px;
          }
          .animate-blob {
            width: 3rem !important;
            height: 3rem !important;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }
        }
        
        @media (max-width: 480px) {
          .backdrop-blur-sm {
            backdrop-filter: none;
            background-color: rgba(0, 0, 0, 0.3);
          }
          
          .container {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .bg-grid-pattern {
            background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          }
        }
        
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        svg {
          max-width: 100%;
          height: auto;
        }
        
        @media (max-width: 768px) {
          .text-xs { font-size: 0.7rem; }
          .text-sm { font-size: 0.8rem; }
          .text-base { font-size: 0.9rem; }
        }
        
        .overflow-hidden {
          overflow: hidden !important;
        }
        
        .hover\:scale-105:hover {
          transform: scale(1.05);
        }
        
        .hover\:brightness-110:hover {
          filter: brightness(1.1);
        }
        
        .min-h-0 {
          min-height: 0;
        }
        
        @media (max-width: 360px) {
          .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
          
          .gap-3 {
            gap: 0.5rem;
          }
          
          .p-3 {
            padding: 0.5rem;
          }
        }
        
        .will-change-transform {
          will-change: transform;
        }
        
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 640px) {
          .space-y-3 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.5rem;
          }
          
          .gap-6 {
            gap: 1rem;
          }
        }
        
        .fixed.inset-0 .container {
          height: 100vh !important;
          max-height: 100vh !important;
        }
        
        .z-30 {
          z-index: 30;
        }
        
        .z-20 {
          z-index: 20;
        }
      `}</style>
    </div>
  );
}