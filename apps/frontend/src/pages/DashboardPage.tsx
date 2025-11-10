// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  Settings, 
  Calendar, 
  Clock, 
  Database, 
  Zap, 
  RefreshCw,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slidesConfig } from '@/config/slides';

export function DashboardPage() {
  const navigate = useNavigate();
  
  // Estados principais
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetaInput, setShowMetaInput] = useState(false);
  const [tempMeta, setTempMeta] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  // Metas dos slides
  const [slideMetas, setSlideMetas] = useState<Record<string, number>>(() => {
    const initialMetas: Record<string, number> = {};
    slidesConfig.forEach(slide => {
      initialMetas[slide.id] = slide.meta?.defaultValue || 50;
    });
    return initialMetas;
  });

  const autoPlayIntervalRef = React.useRef<NodeJS.Timeout>();

  // ✅ NAVEGAÇÃO
  const goToNext = React.useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slidesConfig.length);
  }, []);

  const goToPrevious = React.useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slidesConfig.length) % slidesConfig.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // ✅ AUTO-PLAY
  const toggleAutoPlay = React.useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  React.useEffect(() => {
    if (isAutoPlaying) {
      autoPlayIntervalRef.current = setInterval(() => {
        goToNext();
      }, 10000); // 10 segundos por slide
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, goToNext]);

  // ✅ CONTROLE DE TECLADO
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'Escape':
          setIsAutoPlaying(false);
          setIsFullscreen(false);
          break;
        case 'f':
        case 'F':
          if (event.ctrlKey) {
            event.preventDefault();
            setIsFullscreen(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious]);

  // ✅ FULLSCREEN
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // ✅ META MANAGEMENT
  const updateSlideMeta = React.useCallback((slideId: string, newMeta: number) => {
    setSlideMetas(prev => ({
      ...prev,
      [slideId]: newMeta
    }));
  }, []);

  const handleMetaSubmit = () => {
    const newMeta = parseInt(tempMeta);
    if (!isNaN(newMeta) && newMeta > 0) {
      updateSlideMeta(currentSlideConfig.id, newMeta);
      setShowMetaInput(false);
      setTempMeta('');
    }
  };

  // ✅ PERÍODO ATUAL
  const getPeriodoAtual = () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    return {
      ano: anoAtual,
      mes: mesAtual,
      dataCompleta: hoje.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  const periodoAtual = getPeriodoAtual();
  const currentSlideConfig = slidesConfig[currentSlide];
  const CurrentSlideComponent = currentSlideConfig.component;

  // Animação inicial
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ✅ CONTAINER PRINCIPAL
  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800"
    : "min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 text-gray-200";

  return (
    <div className={containerClass}>
      <div className={`${isFullscreen ? 'h-full' : 'container mx-auto px-4 py-6'} flex flex-col`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col h-full"
        >
          
          {/* ✅ HEADER PRINCIPAL */}
          {!isFullscreen && (
            <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/home')}
                  className="text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar aos Departamentos
                </Button>
                
                <div>
                  <h1 className="text-3xl font-bold text-yellow-400">Dashboard Apresentação</h1>
                  <p className="text-gray-400">Sistema de Slides Executivos - Departamento Pessoal</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-300">
                      Dados de {periodoAtual.mes}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  onClick={() => navigate('/departments/pessoal')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Dept. Pessoal
                </Button>

                <Button 
                  onClick={() => navigate('/departments/legal')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dept. Jurídico
                </Button>

                <Button 
                  onClick={toggleFullscreen}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Tela Cheia
                </Button>
              </div>
            </div>
          )}

          {/* ✅ BARRA DE STATUS */}
          {!isFullscreen && (
            <Card className="mb-6 bg-gray-800/50 border-gray-700">
              <CardContent className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-400">Sistema Online</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-400">Oracle Conectado</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-400">Cache Ativo</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">
                        Período: {periodoAtual.ano}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-800/50 text-green-300">
                      Tempo Real
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-800/50 text-blue-300">
                      Sincronizado
                    </Badge>
                    <Badge variant="secondary" className="bg-yellow-800/50 text-yellow-300">
                      {periodoAtual.ano}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ✅ CONTROLES DE NAVEGAÇÃO */}
          <Card className={`${isFullscreen ? 'mb-2' : 'mb-6'} bg-gray-800/50 border-gray-700`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                
                {/* Navegação */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goToPrevious}
                    disabled={currentSlide === 0}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <Badge variant="outline" className="px-3 py-1 bg-yellow-800/50 text-yellow-300">
                    {currentSlide + 1} / {slidesConfig.length}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goToNext}
                    disabled={currentSlide === slidesConfig.length - 1}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Título do slide atual */}
                <div className="text-center flex-1 mx-8">
                  <h2 className="text-lg lg:text-xl font-bold text-yellow-400">
                    {currentSlideConfig.title}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {currentSlideConfig.subtitle}
                  </p>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-2">
                  {/* Meta Control */}
                  {showMetaInput ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="meta" className="text-xs text-gray-400">
                        {currentSlideConfig.meta?.metaLabel || 'Meta'}:
                      </Label>
                      <Input
                        id="meta"
                        type="number"
                        value={tempMeta}
                        onChange={(e) => setTempMeta(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleMetaSubmit()}
                        className="w-20 h-8 text-xs bg-gray-700 border-gray-600 text-white"
                        min="1"
                        placeholder={slideMetas[currentSlideConfig.id].toString()}
                      />
                      <Button
                        size="sm"
                        onClick={handleMetaSubmit}
                        className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700"
                      >
                        OK
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowMetaInput(false);
                          setTempMeta('');
                        }}
                        className="h-8 px-2 text-xs bg-gray-700 border-gray-600"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowMetaInput(true);
                        setTempMeta(slideMetas[currentSlideConfig.id].toString());
                      }}
                      className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 border-gray-600"
                    >
                      <Target className="w-3 h-3" />
                      Meta: {slideMetas[currentSlideConfig.id]}
                    </Button>
                  )}
                  
                  {/* Auto-play */}
                  <Button
                    size="sm"
                    variant={isAutoPlaying ? "default" : "outline"}
                    onClick={toggleAutoPlay}
                    className={`flex items-center gap-1 text-xs ${
                      isAutoPlaying 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                    }`}
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Auto
                      </>
                    )}
                  </Button>

                  {/* Fullscreen */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFullscreen}
                    className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 border-gray-600"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-3 h-3" />
                        Sair
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3" />
                        Tela Cheia
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✅ BREADCRUMB */}
          {!isFullscreen && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
              <span>Departamentos</span>
              <span>›</span>
              <span>Pessoal</span>
              <span>›</span>
              <span className="text-yellow-400">Dashboard Apresentação</span>
              <span>›</span>
              <span className="text-blue-400">{currentSlideConfig.title}</span>
              <span>›</span>
              <span className="text-green-400">{periodoAtual.ano}</span>
            </div>
          )}

          {/* ✅ CONTEÚDO DO SLIDE */}
          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <CurrentSlideComponent
                  meta={slideMetas[currentSlideConfig.id]}
                  onMetaChange={(newMeta) => updateSlideMeta(currentSlideConfig.id, newMeta)}
                  isActive={true}
                  slideNumber={currentSlide + 1}
                  totalSlides={slidesConfig.length}
                  onPrevious={goToPrevious}
                  onNext={goToNext}
                  onToggleAutoPlay={toggleAutoPlay}
                  isAutoPlaying={isAutoPlaying}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ✅ INDICADORES DE SLIDE */}
          <div className={`${isFullscreen ? 'fixed bottom-4' : 'mt-4'} left-1/2 transform -translate-x-1/2 z-50`}>
            <Card className="bg-gray-800/80 border-gray-700">
              <CardContent className="p-3">
                <div className="flex gap-2">
                  {slidesConfig.map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'bg-yellow-400 scale-125' 
                          : 'bg-gray-500 hover:bg-gray-400'
                      }`}
                      title={slide.title}
                      aria-label={`Ir para slide ${index + 1}: ${slide.title}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ FOOTER COM AÇÕES RÁPIDAS */}
          {!isFullscreen && (
            <Card className="mt-6 bg-gray-800/30 border-gray-700">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">Ações Rápidas:</span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/departments/pessoal/dashboard')}
                      className="text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard Pessoal
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/departments/pessoal/funcionarios')}
                      className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Funcionários
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/departments/pessoal/estatisticas')}
                      className="text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Estatísticas
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAutoPlay}
                      className="text-green-400 hover:bg-green-900/20 hover:text-green-300"
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar Apresentação
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Apresentação
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Período: {periodoAtual.mes}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Atualizado: {new Date().toLocaleString('pt-BR')}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      v2.3.0
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ✅ INSTRUÇÕES DE TECLADO 
            {isFullscreen && (
            <div className="fixed top-4 right-4 z-50">
              <Card className="bg-gray-800/80 border-gray-700">
                <CardContent className="p-3">
                  <div className="text-white text-xs space-y-1">
                    <div>← → Navegar slides</div>
                    <div>Espaço: Próximo slide</div>
                    <div>Esc: Sair da tela cheia</div>
                    <div>Ctrl+F: Alternar tela cheia</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          */}
        
        </motion.div>
      </div>
    </div>
  );
}