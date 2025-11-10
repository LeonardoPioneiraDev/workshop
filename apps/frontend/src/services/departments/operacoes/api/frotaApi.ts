// src/services/departments/operacoes/api/frotaApi.ts
import { operacoesApi } from './operacoesApi';
import type { 
  FiltrosFrota, 
  VeiculoOperacional, 
  EstatisticasFrota, 
  ResultadoFrota 
} from '@/types/departments/operacoes';

// Interface para histórico de veículo (caso não exista ainda)
export interface HistoricoVeiculo {
  id: number;
  prefixo: string;
  data: string;
  tipo: 'MANUTENCAO' | 'ACIDENTE' | 'TROCA_MOTORISTA' | 'MUDANCA_STATUS' | 'OUTROS';
  descricao: string;
  responsavel?: string;
  observacoes?: string;
}

export const frotaApi = {
  /**
   * Buscar frota com filtros
   */
  async buscarFrota(filtros: FiltrosFrota): Promise<ResultadoFrota> {
    const params = {
      garagem: filtros.garagem,
      status: filtros.status !== 'TODOS' ? filtros.status : undefined,
      limit: filtros.limit,
      page: filtros.page
    };

    const veiculos = await operacoesApi.getVeiculos(params);
    const estatisticas = await operacoesApi.getFrotaEstatisticas();

    // Calcular total de páginas
    const limit = filtros.limit || 10;
    const total = veiculos.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: veiculos,
      total,
      page: filtros.page || 1,
      limit,
      totalPages,
      filtros,
      estatisticas: estatisticas as EstatisticasFrota
    };
  },

  /**
   * Obter estatísticas da frota
   */
  async obterEstatisticas(): Promise<EstatisticasFrota> {
    const stats = await operacoesApi.getFrotaEstatisticas();
    return stats as EstatisticasFrota;
  },

  /**
   * Sincronizar frota
   */
  async sincronizarFrota(data?: string): Promise<any> {
    return await operacoesApi.sincronizarFrota();
  },

  /**
   * Obter histórico de um veículo
   */
  async obterHistoricoVeiculo(prefixo: string, limite?: number): Promise<HistoricoVeiculo[]> {
    // Por enquanto, retornar dados simulados até o backend implementar
    // Você pode ajustar isso quando tiver o endpoint real
    return [
      {
        id: 1,
        prefixo,
        data: new Date().toISOString(),
        tipo: 'MANUTENCAO',
        descricao: 'Manutenção preventiva realizada',
        responsavel: 'Oficina Central',
        observacoes: 'Troca de óleo e filtros'
      }
    ];
  },

  /**
   * Obter veículo por prefixo
   */
  async obterVeiculoPorPrefixo(prefixo: string): Promise<VeiculoOperacional> {
    return await operacoesApi.getVeiculoByPrefixo(prefixo);
  },

  /**
   * Buscar veículos por termo
   */
  async buscarVeiculosPorTermo(termo: string): Promise<VeiculoOperacional[]> {
    return await operacoesApi.buscarVeiculos(termo);
  },

  /**
   * Obter dashboard da frota
   */
  async obterDashboard(): Promise<any> {
    return await operacoesApi.getFrotaDashboard();
  },

  /**
   * Obter distribuição da frota por garagem
   */
  async obterFrotaPorGaragem(): Promise<any> {
    return await operacoesApi.getFrotaPorGaragem();
  }
};
