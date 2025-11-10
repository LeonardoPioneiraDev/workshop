// src/components/ui/loading.tsx (Arquivo completo corrigido)
import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Loading Spinner Simples
export function LoadingSpinner({ size = 'default', className = '' }: { 
  size?: 'sm' | 'default' | 'lg'; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

// Loading com Texto
export function LoadingWithText({ 
  text = 'Carregando...', 
  size = 'default',
  className = '' 
}: { 
  text?: string; 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-gray-600">{text}</span>
    </div>
  );
}

// Loading Skeleton para Cards
export function LoadingSkeleton({ 
  lines = 3, 
  showHeader = true,
  className = '' 
}: { 
  lines?: number; 
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <Card className={`animate-pulse ${className}`}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div key={`skeleton-line-${index}`} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading para Listas
export function LoadingList({ 
  items = 3, 
  showHeader = true,
  className = '' 
}: { 
  items?: number; 
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={`loading-item-${i}`} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading para Métricas
export function LoadingMetrics({ 
  cards = 4,
  className = '' 
}: { 
  cards?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={`metric-loading-${i}`} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Estado de Erro
export function ErrorState({ 
  title = 'Erro ao carregar dados',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  onRetry,
  className = ''
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      )}
    </div>
  );
}

// Estado Vazio
export function EmptyState({ 
  icon: Icon,
  title = 'Nenhum item encontrado',
  message = 'Não há dados para exibir no momento.',
  action,
  actionLabel,
  className = ''
}: {
  icon?: React.ComponentType<any>;
  title?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 text-gray-500 ${className}`}>
      {Icon && <Icon className="h-16 w-16 mx-auto mb-4 opacity-50" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm mb-4 max-w-md mx-auto">{message}</p>
      {action && actionLabel && (
        <Button onClick={action} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Loading Overlay
export function LoadingOverlay({ 
  isVisible,
  text = 'Carregando...',
  className = ''
}: {
  isVisible: boolean;
  text?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <p className="mt-2 text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}