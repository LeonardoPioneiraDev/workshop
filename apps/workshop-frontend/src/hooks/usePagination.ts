// src/hooks/usePagination.ts
import { useState, useMemo } from 'react';

interface UsePaginationProps {
  data: any[];
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  paginatedData: any[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  pageNumbers: (number | string)[];
  startIndex: number;
  endIndex: number;
  setItemsPerPage: (items: number) => void;
}

export function usePagination({
  data,
  itemsPerPage = 10,
  initialPage = 1
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPageState);

  // ✅ Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPageState;
    const endIndex = startIndex + itemsPerPageState;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPageState]);

  // ✅ Calcular números das páginas para exibir com reticências
  const pageNumbers = useMemo(() => {
    const delta = 2; // Quantas páginas mostrar de cada lado da página atual
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Se há poucas páginas, mostrar todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Sempre incluir primeira página
    rangeWithDots.push(1);

    // Calcular range ao redor da página atual
    const startRange = Math.max(2, currentPage - delta);
    const endRange = Math.min(totalPages - 1, currentPage + delta);

    // Adicionar reticências se necessário antes do range
    if (startRange > 2) {
      rangeWithDots.push('...');
    }

    // Adicionar páginas do range
    for (let i = startRange; i <= endRange; i++) {
      rangeWithDots.push(i);
    }

    // Adicionar reticências se necessário depois do range
    if (endRange < totalPages - 1) {
      rangeWithDots.push('...');
    }

    // Sempre incluir última página (se não for a primeira)
    if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Remover duplicatas mantendo ordem
    return rangeWithDots.filter((item, index, arr) => {
      if (typeof item === 'string') return true; // Manter reticências
      return arr.findIndex(x => x === item) === index;
    });
  }, [currentPage, totalPages]);

  // ✅ Funções de navegação com validação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const goToLastPage = () => {
    if (currentPage !== totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  const setItemsPerPage = (items: number) => {
    if (items !== itemsPerPageState) {
      setItemsPerPageState(items);
      setCurrentPage(1); // Resetar para primeira página
    }
  };

  // ✅ Estados de navegação
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  // ✅ Índices para exibição
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPageState + 1;
  const endIndex = Math.min(currentPage * itemsPerPageState, totalItems);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: itemsPerPageState,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrev,
    pageNumbers,
    startIndex,
    endIndex,
    setItemsPerPage
  };
}