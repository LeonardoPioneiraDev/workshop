// src/pages/departments/juridico/components/hooks/useSlideshow.ts
import { useState, useEffect } from 'react';

interface UseSlideshowProps {
  totalSlides: number;
  autoPlayDuration?: number; // em segundos
}

export const useSlideshow = ({ totalSlides, autoPlayDuration = 30 }: UseSlideshowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Controle de apresentação automática - 30 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setCurrentSlide(current => (current + 1) % totalSlides);
            return 0;
          }
          return prev + (100 / (autoPlayDuration * 10)); // 100ms intervals
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSlides, autoPlayDuration]);

  // Reset progress quando muda slide manualmente
  useEffect(() => {
    setProgress(0);
  }, [currentSlide]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(current => (current + 1) % totalSlides);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(current => current === 0 ? totalSlides - 1 : current - 1);
      } else if (e.key === 'Escape') {
        setIsPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [totalSlides]);

  const nextSlide = () => {
    setCurrentSlide(current => (current + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(current => current === 0 ? totalSlides - 1 : current - 1);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return {
    currentSlide,
    isPlaying,
    progress,
    nextSlide,
    prevSlide,
    togglePlay,
    goToSlide,
    setCurrentSlide
  };
};