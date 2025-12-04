// src/components/dashboard/SlideBase.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { SlideProps } from '@/types/dashboard';

interface SlideBaseProps extends SlideProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export const SlideBase: React.FC<SlideBaseProps> = ({
  title,
  subtitle,
  children,
  className = "",
  isActive
}) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Conteúdo do slide sem header próprio */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95 }}
        transition={{ duration: 0.4 }}
        className="flex-1 min-h-0 overflow-auto"
      >
        {children}
      </motion.div>
    </div>
  );
};