// src/components/ui/pagination.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal 
} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  pageNumbers: (number | string)[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  pageNumbers,
  onPageChange,
  onItemsPerPageChange,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPrevPage,
  canGoNext,
  canGoPrev,
  className = ''
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Informações da Paginação */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Exibindo <span className="font-medium">{startIndex}</span> a <span className="font-medium">{endIndex}</span> de <span className="font-medium">{totalItems.toLocaleString('pt-BR')}</span> resultados
        </span>
        
        {/* Seletor de Itens por Página */}
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controles de Navegação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Primeira Página */}
          <Button
            variant="outline"
            size="sm"
            onClick={onFirstPage}
            disabled={!canGoPrev}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Página Anterior */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>

          {/* Números das Páginas */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNumber, index) => {
              if (pageNumber === '...') {
                return (
                  <div key={`dots-${index}`} className="px-2">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                );
              }

              const page = pageNumber as number;
              const isCurrentPage = page === currentPage;

              return (
                <Button
                  key={page}
                  variant={isCurrentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={`min-w-[40px] ${
                    isCurrentPage 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          {/* Próxima Página */}
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!canGoNext}
          >
            <span className="hidden sm:inline mr-1">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Última Página */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLastPage}
            disabled={!canGoNext}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}