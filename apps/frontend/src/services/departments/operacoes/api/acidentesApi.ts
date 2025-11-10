// src/services/departments/operacoes/api/acidentesApi.ts
import { operacoesApi } from './operacoesApi';
import type { 
  FiltrosAcidentes, 
  Acidente, 
  EstatisticasAcidentes, 
  ResultadoAcidentes,
  ValoresFiltros
} from '@/types/departments/operacoes';

// Interface para ValoresDistintos (caso não exista)
export interface ValoresDistintos {
  garagens: string[];
  municipios: string[];
  bairros: string[];
  turnos: string[];
  grausAcidente: string[];
  statusProcesso: string[];
  tiposAcidente: string[];
  condicoesTempo: string[];
}

export const acidentesApi = {
  /**
   * Buscar acidentes com filtros
   */
  async buscarAcidentes(filtros: FiltrosAcidentes): Promise<ResultadoAcidentes> {
    const params = {
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      garagem: filtros.garagem,
      grauAcidente: filtros.grauAcidente !== 'TODOS' ? filtros.grauAcidente : undefined,
      limit: filtros.limit,
      page: filtros.page
    };

    const acidentes = await operacoesApi.getAcidentes(params);
    const estatisticas = await operacoesApi.getAcidentesEstatisticas();

    // Calcular total de páginas
    const limit = filtros.limit || 10;
    const total = acidentes.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: acidentes,
      total,
      page: filtros.page || 1,
      limit,
      totalPages,
      filtros,
      estatisticas: estatisticas as EstatisticasAcidentes
    };
  },

  /**
   * Obter estatísticas de acidentes
   */
  async obterEstatisticas(filtros: FiltrosAcidentes): Promise<EstatisticasAcidentes> {
    const stats = await operacoesApi.getAcidentesEstatisticas();
    return stats as EstatisticasAcidentes;
  },

  /**
   * Obter valores disponíveis para filtros
   */
  async obterValoresFiltros(): Promise<ValoresDistintos> {
    const valores = await operacoesApi.getValoresFiltros();
    
    // Mapear para o formato esperado
    return {
      garagens: valores.garagens || [],
      municipios: valores.municipios || [],
      bairros: valores.bairros || [],
      turnos: valores.turnos || [],
      grausAcidente: valores.grausAcidente || [],
      statusProcesso: valores.statusProcesso || [],
      tiposAcidente: valores.tiposAcidente || [],
      condicoesTempo: valores.condicoesTempo || []
    };
  },

  /**
   * Sincronizar acidentes
   */
  async sincronizarAcidentes(dataInicio?: string, dataFim?: string): Promise<any> {
    return await operacoesApi.sincronizarAcidentes();
  },

  /**
   * Obter acidentes por período
   */
  async obterAcidentesPorPeriodo(dataInicio: string, dataFim: string): Promise<Acidente[]> {
    return await operacoesApi.getAcidentesByPeriodo(dataInicio, dataFim);
  },

  /**
   * Obter top veículos com mais acidentes
   */
  async obterTopVeiculosAcidentes(): Promise<any> {
    return await operacoesApi.getTopVeiculosAcidentes();
  },

  /**
   * Obter dashboard de acidentes
   */
  async obterDashboard(): Promise<any> {
    return await operacoesApi.getAcidentesDashboard();
  }
};
