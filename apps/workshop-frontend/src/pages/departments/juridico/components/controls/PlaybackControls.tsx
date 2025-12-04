// src/pages/departments/juridico/components/controls/PlaybackControls.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RefreshCw, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isFullscreen: boolean;
  loading: boolean;
  currentSlide: number;
  totalSlides: number;
  onPrevSlide: () => void;
  onTogglePlay: () => void;
  onNextSlide: () => void;
  onRefetch: () => void;
  onToggleFullscreen: () => void;
  variant?: 'normal' | 'fullscreen';
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isFullscreen,
  loading,
  currentSlide,
  totalSlides,
  onPrevSlide,
  onTogglePlay,
  onNextSlide,
  onRefetch,
  onToggleFullscreen,
  variant = 'normal'
}) => {
  const baseClasses = variant === 'fullscreen' 
    ? "bg-black/70 backdrop-blur-sm border-white/20 text-white hover:bg-black/80"
    : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      {/* Controles de navegação */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrevSlide}
          variant="outline"
          size="sm"
          className={baseClasses}
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={onTogglePlay}
          variant="outline"
          size="sm"
          className={baseClasses}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          onClick={onNextSlide}
          variant="outline"
          size="sm"
          className={baseClasses}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Indicadores e controles secundários */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className={`text-xs sm:text-sm font-medium ${variant === 'fullscreen' ? 'bg-black/70' : 'bg-white/10'} backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-white border border-white/20`}>
          {currentSlide + 1} / {totalSlides}
        </div>
        
        <Button
          onClick={onRefetch}
          disabled={loading}
          variant="outline"
          size="sm"
          className={baseClasses}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
        
        <Button
          onClick={onToggleFullscreen}
          variant="outline"
          size="sm"
          className={baseClasses}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};