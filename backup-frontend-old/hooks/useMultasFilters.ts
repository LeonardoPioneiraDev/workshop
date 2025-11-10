// apps/frontend/src/hooks/useMultasFilters.ts
import { useState, useCallback, useMemo } from 'react';
import { MultaEnhancedFilter } from '../services/departments/legal/multasEnhancedService';

const defaultFilters: MultaEnhancedFilter = {
  page: 1,
  limit: 1000, // ✅ CORRIGIDO: era 1000, agora 50
  orderBy: 'dataEmissaoMulta',
  orderDirection: 'DESC',
  includeHistoricoSetor: true,
  includeAnalytics: true,
};

export const useMultasFilters = () => {
  const [filters, setFilters] = useState<MultaEnhancedFilter>(defaultFilters);

  const updateFilters = useCallback((newFilters: Partial<MultaEnhancedFilter>) => {
    console.log('🔍 [Hook] Atualizando filtros:', newFilters);
    
    setFilters(prev => {
      // ✅ MAPEAMENTO CORRIGIDO DOS CAMPOS
      const mappedFilters: Partial<MultaEnhancedFilter> = {};
      
      Object.entries(newFilters).forEach(([key, value]) => {
        switch (key) {
          // ✅ Mapear campos incompatíveis
          case 'gravidadeValor':
            mappedFilters.grupoInfracao = value as any;
            break;
          case 'statusMulta':
            mappedFilters.statusPagamento = value as any;
            break;
          case 'codigoSetor':
            mappedFilters.setorCodigo = value ? parseInt(value as string) : undefined;
            break;
          case 'dataInfracaoInicio':
            mappedFilters.dataInicio = value as string;
            break;
          case 'dataInfracaoFim':
            mappedFilters.dataFim = value as string;
            break;
          // ✅ Campos que permanecem iguais
          default:
            (mappedFilters as any)[key] = value;
        }
      });

      const updated = { ...prev, ...mappedFilters };
      
      // Reset page quando outros filtros mudam (exceto page e limit)
      if (Object.keys(mappedFilters).some(key => key !== 'page' && key !== 'limit')) {
        updated.page = 1;
      }
      
      console.log('🔍 [Hook] Filtros finais aplicados:', updated);
      return updated;
    });
  }, []);

  const clearFilters = useCallback(() => {
    console.log('🧹 [Hook] Limpando filtros');
    setFilters(defaultFilters);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.prefixoVeic) count++;
    if (filters.numeroAiMulta) count++;
    if (filters.tipoMulta && filters.tipoMulta !== 'TODOS') count++;
    if (filters.responsavelMulta && filters.responsavelMulta !== 'TODOS') count++;
    if (filters.statusPagamento && filters.statusPagamento !== 'TODOS') count++;
    if (filters.grupoInfracao && filters.grupoInfracao !== 'TODOS') count++;
    if (filters.dataInicio) count++;
    if (filters.dataFim) count++;
    if (filters.valorMinimo) count++;
    if (filters.valorMaximo) count++;
    if (filters.setorCodigo) count++;
    if (filters.alertaDefesa) count++;
    if (filters.setorMudou) count++;
    if (filters.observacaoRealMotivo) count++;
    
    console.log('📊 [Hook] Contando filtros ativos:', count, filters);
    return count;
  }, [filters]);

  const hasActiveFilters = useMemo(() => activeFiltersCount > 0, [activeFiltersCount]);

  return {
    filters,
    updateFilters,
    clearFilters,
    activeFiltersCount,
    hasActiveFilters
  };
};