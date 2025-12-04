// src/components/ui/sortable-header.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableHeaderProps {
  children: React.ReactNode;
  field: string;
  currentSort: {
    field: string | null;
    direction: 'asc' | 'desc';
  };
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  children,
  field,
  currentSort,
  onSort,
  className = ''
}: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : null;

  const getSortIcon = () => {
    if (!isActive) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className={`h-auto p-2 justify-start font-medium ${
        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900'
      } ${className}`}
    >
      <span className="mr-2">{children}</span>
      {getSortIcon()}
    </Button>
  );
}