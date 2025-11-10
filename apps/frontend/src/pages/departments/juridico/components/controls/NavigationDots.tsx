// src/pages/departments/juridico/components/controls/NavigationDots.tsx
import React from 'react';

interface NavigationDotsProps {
  totalSlides: number;
  currentSlide: number;
  onSlideChange: (index: number) => void;
}

export const NavigationDots: React.FC<NavigationDotsProps> = ({
  totalSlides,
  currentSlide,
  onSlideChange
}) => {
  return (
    <div className="flex justify-center gap-2 mt-4 sm:mt-6">
      {Array.from({ length: totalSlides }, (_, index) => (
        <button
          key={index}
          onClick={() => onSlideChange(index)}
          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
            index === currentSlide 
              ? 'bg-blue-400 shadow-lg shadow-blue-400/50 scale-125' 
              : 'bg-white/30 hover:bg-white/50'
          }`}
        />
      ))}
    </div>
  );
};