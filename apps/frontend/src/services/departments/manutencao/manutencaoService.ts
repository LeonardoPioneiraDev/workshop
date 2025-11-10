// src/services/departments/manutencao/manutencaoService.ts
import { manutencaoApi } from './api/manutencaoApi';
import type { 
  OrdemServico, 
  FiltrosOS, 
  RespostaOSData,
  RespostaSincronizacao,
  EstatisticasOS 
} from './types';

/**
 * Serviço principal para o Departamento de Manutenção
 * Gerencia Ordens de Serviço, sincronização e análises
 */
export const manutencaoService = {
  /**
   * Busca Ordens de Serviço com filtros
   */
  async buscarOrdens(filtros?: FiltrosOS): Promise<RespostaOSData> {
    return await manutencaoApi.buscarOS(filtros);
  },

  /**
   * Força sincronização do Oracle
   */
  async sincronizar(filtros?: {
    startDate?: string;
    endDate?: string;
    origens?: number[];
    garagens?: number[];
    setor_codigo?: number;
    limit?: number;
  }): Promise<RespostaSincronizacao> {
    return await manutencaoApi.sincronizarOS(filtros);
  },

  /**
   * ✅ CORRIGIDO: Busca OS abertas usando statusOS
   */
  async buscarOSAbertas(filtros?: Omit<FiltrosOS, 'statusOS'>): Promise<OrdemServico[]> {
    const response = await manutencaoApi.buscarOSAbertas(filtros);
    return response.data;
  },

  /**
   * ✅ CORRIGIDO: Busca OS fechadas usando statusOS
   */
  async buscarOSFechadas(filtros?: Omit<FiltrosOS, 'statusOS'>): Promise<OrdemServico[]> {
    const response = await manutencaoApi.buscarOSFechadas(filtros);
    return response.data;
  },

  /**
   * Busca OS corretivas
   */
  async buscarOSCorretivas(filtros?: Omit<FiltrosOS, 'tipoOS'>): Promise<OrdemServico[]> {
    const response = await manutencaoApi.buscarOSCorretivas(filtros);
    return response.data;
  },

  /**
   * Busca OS preventivas
   */
  async buscarOSPreventivas(filtros?: Omit<FiltrosOS, 'tipoOS'>): Promise<OrdemServico[]> {
    const response = await manutencaoApi.buscarOSPreventivas(filtros);
    return response.data;
  },

  /**
   * Busca OS por número
   */
  async buscarPorNumero(numeroOS: string): Promise<OrdemServico[]> {
    return await manutencaoApi.buscarPorNumero(numeroOS);
  },

  /**
   * Busca OS por prefixo de veículo
   */
  async buscarPorPrefixo(
    prefixo: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<OrdemServico[]> {
    return await manutencaoApi.buscarPorPrefixo(prefixo, startDate, endDate);
  },

  /**
   * Busca OS por placa de veículo
   */
  async buscarPorPlaca(
    placa: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<OrdemServico[]> {
    return await manutencaoApi.buscarPorPlaca(placa, startDate, endDate);
  },

  /**
   * Busca OS por garagem
   */
  async buscarPorGaragem(
    garagem: string, 
    filtros?: Omit<FiltrosOS, 'garagem'>
  ): Promise<OrdemServico[]> {
    const response = await manutencaoApi.buscarPorGaragem(garagem, filtros);
    return response.data;
  },

  /**
   * Busca OS por tipo de problema (QUEBRA ou DEFEITO)
   */
  async buscarPorTipoProblema(
    tipoProblema: 'QUEBRA' | 'DEFEITO',
    filtros?: Omit<FiltrosOS, 'tipoProblema'>
  ): Promise<OrdemServico[]> {
    const response = await manutencaoApi.buscarPorTipoProblema(tipoProblema, filtros);
    return response.data;
  },

  /**
   * ✅ CORRIGIDO: Calcula estatísticas considerando A e AB como abertas
   */
  calcularEstatisticas(ordensServico: OrdemServico[]): EstatisticasOS {
    const totalRegistros = ordensServico.length;
    
    // ✅ CORREÇÃO: Considerar tanto 'A' quanto 'AB' como abertas
    const osAbertas = ordensServico.filter(os => os.condicaoOS === 'A' || os.condicaoOS === 'AB').length;
    const osFechadas = ordensServico.filter(os => os.condicaoOS === 'FC').length;
    const quebras = ordensServico.filter(os => os.tipoProblema === 'QUEBRA').length;
    const defeitos = ordensServico.filter(os => os.tipoProblema === 'DEFEITO').length;
    const socorros = ordensServico.filter(os => os.ehSocorro === 'Sim').length;

    const tiposOS: Record<string, number> = {};
    const statusOS: Record<string, number> = {};
    const garagens: Record<string, number> = {};
    const tiposProblema: Record<string, number> = {};

    ordensServico.forEach(os => {
      // Tipos de OS
      const tipo = os.tipoOSDescricao || 'Não informado';
      tiposOS[tipo] = (tiposOS[tipo] || 0) + 1;

      // Status
      const status = os.condicaoOSDescricao || 'Não informado';
      statusOS[status] = (statusOS[status] || 0) + 1;

      // Garagens
      const garagem = os.garagem || 'Não informado';
      garagens[garagem] = (garagens[garagem] || 0) + 1;

      // Tipos de problema
      const problema = os.tipoProblema || 'Não informado';
      tiposProblema[problema] = (tiposProblema[problema] || 0) + 1;
    });

    const totalValorTerceiros = ordensServico.reduce(
      (sum, os) => 
        sum + 
        (parseFloat(String(os.valorMaoObraTerceiros || 0))) + 
        (parseFloat(String(os.valorPecasTerceiros || 0))),
      0
    );

    return {
      resumo: {
        totalRegistros,
        osAbertas,
        osFechadas,
        quebras,
        defeitos,
        socorros
      },
      distribuicoes: {
        tiposOS,
        statusOS,
        garagens,
        tiposProblema
      },
      indicadores: {
        totalValorTerceiros: totalValorTerceiros.toFixed(2),
        percentualAbertas: totalRegistros > 0 
          ? ((osAbertas / totalRegistros) * 100).toFixed(1) + '%' 
          : '0%',
        percentualFechadas: totalRegistros > 0 
          ? ((osFechadas / totalRegistros) * 100).toFixed(1) + '%' 
          : '0%'
      }
    };
  },

  /**
   * Exporta dados para relatório
   */
  async exportarRelatorio(filtros?: FiltrosOS): Promise<OrdemServico[]> {
    return await manutencaoApi.exportarRelatorio(filtros);
  },

  /**
   * Obtém status do departamento
   */
  async getStatus(): Promise<{ departamento: string; status: string; timestamp: string }> {
    return await manutencaoApi.getStatus();
  }
};