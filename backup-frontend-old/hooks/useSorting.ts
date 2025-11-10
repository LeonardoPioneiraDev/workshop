// src/hooks/useSorting.ts
import { useState, useMemo } from 'react';

interface UseSortingProps<T> {
  data: T[];
  defaultSort?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
}

interface UseSortingReturn<T> {
  sortedData: T[];
  sortConfig: {
    field: keyof T | null;
    direction: 'asc' | 'desc';
  };
  handleSort: (field: keyof T) => void;
  getSortIcon: (field: keyof T) => 'asc' | 'desc' | null;
  isSorted: (field: keyof T) => boolean;
  resetSort: () => void;
}

export function useSorting<T>({
  data,
  defaultSort
}: UseSortingProps<T>): UseSortingReturn<T> {
  const [sortConfig, setSortConfig] = useState<{
    field: keyof T | null;
    direction: 'asc' | 'desc';
  }>({
    field: defaultSort?.field || null,
    direction: defaultSort?.direction || 'asc'
  });

  // ✅ Função de ordenação melhorada para diferentes tipos de dados
  const sortedData = useMemo(() => {
    if (!sortConfig.field) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.field!];
      const bValue = b[sortConfig.field!];

      // ✅ Tratamento para valores nulos/undefined
      if (aValue === null || aValue === undefined) {
        return bValue === null || bValue === undefined ? 0 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      let comparison = 0;

      // ✅ Tratamento específico por tipo de dado
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Ordenação de strings com suporte a números
        comparison = aValue.localeCompare(bValue, 'pt-BR', { 
          numeric: true, 
          sensitivity: 'base' 
        });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Ordenação numérica
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        // Ordenação de datas
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        // Ordenação booleana
        comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
      } else {
        // ✅ Fallback: converter para string e ordenar
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr, 'pt-BR', { 
          numeric: true, 
          sensitivity: 'base' 
        });
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [data, sortConfig]);

  // ✅ Função para alternar ordenação
  const handleSort = (field: keyof T) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // ✅ Função para obter ícone de ordenação
  const getSortIcon = (field: keyof T): 'asc' | 'desc' | null => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction;
  };

  // ✅ Função para verificar se campo está sendo ordenado
  const isSorted = (field: keyof T): boolean => {
    return sortConfig.field === field;
  };

  // ✅ Função para resetar ordenação
  const resetSort = () => {
    setSortConfig({
      field: null,
      direction: 'asc'
    });
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortIcon,
    isSorted,
    resetSort
  };
}