// src/components/operacoes/shared/OperacoesStatsCard.tsx
import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OperacoesStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  trend?: {
    value: number;
    isPositive?: boolean;
    period?: string;
  };
  onClick?: () => void;
  actionLabel?: string;
  loading?: boolean;
}

export function OperacoesStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badge,
  trend,
  onClick,
  actionLabel = 'Ver detalhes',
  loading = false
}: OperacoesStatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    gray: 'text-gray-600 bg-gray-100'
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value === 0) return Minus;
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? TrendingUp : TrendingDown;
    }
    return trend.value > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend.value === 0) return 'text-gray-500';
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? 'text-green-600' : 'text-red-600';
    }
    return trend.value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
      <CardContent className="p-4" onClick={onClick}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {badge && (
              <Badge variant={badge.variant || 'default'} className="text-xs">
                {badge.text}
              </Badge>
            )}
            
            {trend && TrendIcon && (
              <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
                {trend.period && (
                  <span className="text-muted-foreground">({trend.period})</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {onClick && (
          <div className="mt-3">
            <Button variant="link" className="p-0 h-auto text-xs">
              {actionLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}