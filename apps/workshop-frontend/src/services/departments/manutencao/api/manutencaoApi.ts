// src/services/departments/manutencao/api/manutencaoApi.ts
import { api } from '@/services/api/client';
import type {
  OrdemServico,
  FiltrosOS,
  RespostaOSData,
  RespostaSincronizacao,
  EstatisticasOS
} from '../types';

export const manutencaoApi = {
  /**
   * ✅ NOVO: Buscar todas as OS (usa novo endpoint)
   */
  async buscarTodasOS(filtros?: FiltrosOS): Promise<RespostaOSData> {
    const params: any = {};

    if (filtros?.startDate) params.startDate = filtros.startDate;
    if (filtros?.endDate) params.endDate = filtros.endDate;
    if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
    if (filtros?.data_fim) params.data_fim = filtros.data_fim;
    if (filtros?.origens) params.origens = filtros.origens.join(',');
    if (filtros?.garagens) params.garagens = filtros.garagens.join(',');
    if (filtros?.setor_codigo) params.setor_codigo = filtros.setor_codigo;
    if (filtros?.setor) params.setor = filtros.setor;
    if (filtros?.garagem) params.garagem = filtros.garagem;
    if (filtros?.prefixo) params.prefixo = filtros.prefixo;
    if (filtros?.numeroOS) params.numeroOS = filtros.numeroOS;
    if (filtros?.numero_os) params.numero_os = filtros.numero_os;
    if (filtros?.placa) params.placa = filtros.placa;
    if (filtros?.tipoOS) params.tipoOS = filtros.tipoOS;
    if (filtros?.condicaoOS) params.condicaoOS = filtros.condicaoOS;
    if (filtros?.statusOS) params.statusOS = filtros.statusOS;
    if (filtros?.tipoProblema) params.tipoProblema = filtros.tipoProblema;
    if (filtros?.limit) params.limit = filtros.limit;
    if (filtros?.page) params.page = filtros.page;
    if (filtros?.forcarSincronizacao !== undefined) params.forcarSincronizacao = filtros.forcarSincronizacao;

    const response = await api.get('/departamentos/manutencao/os-todas', { params });
    return response;
  },

  /**
   * ✅ NOVO: Buscar OS do mês atual
   */
  async buscarOSMesAtual(): Promise<RespostaOSData> {
    const response = await api.get('/departamentos/manutencao/os-mes-atual');
    return response;
  },

  /**
   * ✅ NOVO: Sincronizar do Globus (usa novo endpoint)
   */
  async sincronizarDoGlobus(params?: any): Promise<RespostaSincronizacao> {
    const filteredParams: any = {};

    if (params?.startDate) filteredParams.startDate = params.startDate;
    if (params?.endDate) filteredParams.endDate = params.endDate;
    if (params?.origens) filteredParams.origens = params.origens.join(',');
    if (params?.garagens) filteredParams.garagens = params.garagens.join(',');
    if (params?.setor_codigo) filteredParams.setor_codigo = params.setor_codigo;
    if (params?.limit) filteredParams.limit = params.limit;

    const response = await api.post('/departamentos/manutencao/sincronizar-globus', {}, { params: filteredParams });
    return response;
  },

  /**
   * ✅ LEGADO: Busca OS com sincronização automática (compatibilidade)
   */
  async buscarOS(filtros?: FiltrosOS): Promise<RespostaOSData> {
    const params: any = {};

    if (filtros?.startDate) params.startDate = filtros.startDate;
    if (filtros?.endDate) params.endDate = filtros.endDate;
    if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
    if (filtros?.data_fim) params.data_fim = filtros.data_fim;
    if (filtros?.origens) params.origens = filtros.origens.join(',');
    if (filtros?.garagens) params.garagens = filtros.garagens.join(',');
    if (filtros?.setor_codigo) params.setor_codigo = filtros.setor_codigo;
    if (filtros?.setor) params.setor = filtros.setor;
    if (filtros?.garagem) params.garagem = filtros.garagem;
    if (filtros?.prefixo) params.prefixo = filtros.prefixo;
    if (filtros?.numeroOS) params.numeroOS = filtros.numeroOS;
    if (filtros?.numero_os) params.numero_os = filtros.numero_os;
    if (filtros?.placa) params.placa = filtros.placa;
    if (filtros?.tipoOS) params.tipoOS = filtros.tipoOS;
    if (filtros?.condicaoOS) params.condicaoOS = filtros.condicaoOS;
    if (filtros?.statusOS) params.statusOS = filtros.statusOS;
    if (filtros?.tipoProblema) params.tipoProblema = filtros.tipoProblema;
    if (filtros?.limit) params.limit = filtros.limit;
    if (filtros?.page) params.page = filtros.page;
    if (filtros?.forcarSincronizacao !== undefined) params.forcarSincronizacao = filtros.forcarSincronizacao;

    const response = await api.get('/departamentos/manutencao/os-data', { params });
    return response;
  },

  /**
   * ✅ LEGADO: Força sincronização do Oracle (compatibilidade)
   */
  async sincronizarOS(filtros?: {
    startDate?: string;
    endDate?: string;
    origens?: number[];
    garagens?: number[];
    setor_codigo?: number;
    limit?: number;
  }): Promise<RespostaSincronizacao> {
    const params: any = {};

    if (filtros?.startDate) params.startDate = filtros.startDate;
    if (filtros?.endDate) params.endDate = filtros.endDate;
    if (filtros?.origens) params.origens = filtros.origens.join(',');
    if (filtros?.garagens) params.garagens = filtros.garagens.join(',');
    if (filtros?.setor_codigo) params.setor_codigo = filtros.setor_codigo;
    if (filtros?.limit) params.limit = filtros.limit;

    const response = await api.get('/departamentos/manutencao/sincronizar', { params });
    return response;
  },

  /**
   * Obtém status do departamento de manutenção
   */
  async getStatus(): Promise<{ departamento: string; status: string; timestamp: string }> {
    const response = await api.get('/departamentos/manutencao/status');
    return response;
  },

  /**
   * Busca OS com filtros simplificados
   */
  async buscarOSSimples(params: {
    startDate: string;
    endDate: string;
    garagens?: number[];
    prefixo?: string;
    limit?: number;
    page?: number;
  }): Promise<OrdemServico[]> {
    const response = await this.buscarOS({
      startDate: params.startDate,
      endDate: params.endDate,
      garagens: params.garagens,
      prefixo: params.prefixo,
      limit: params.limit,
      page: params.page
    });
    return response.data;
  },

  /**
   * Busca OS por número
   */
  async buscarPorNumero(numeroOS: string): Promise<OrdemServico[]> {
    const response = await this.buscarOS({ numeroOS });
    return response.data;
  },

  /**
   * Busca OS por prefixo
   */
  async buscarPorPrefixo(prefixo: string, startDate?: string, endDate?: string): Promise<OrdemServico[]> {
    const response = await this.buscarOS({ prefixo, startDate, endDate });
    return response.data;
  },

  /**
   * Busca OS por placa
   */
  async buscarPorPlaca(placa: string, startDate?: string, endDate?: string): Promise<OrdemServico[]> {
    const response = await this.buscarOS({ placa, startDate, endDate });
    return response.data;
  },

  /**
   * ✅ CORRIGIDO: Busca OS abertas usando statusOS
   */
  async buscarOSAbertas(filtros?: Omit<FiltrosOS, 'statusOS'>): Promise<RespostaOSData> {
    return await this.buscarOS({
      ...filtros,
      statusOS: 'A'
    });
  },

  /**
   * ✅ CORRIGIDO: Busca OS fechadas usando statusOS
   */
  async buscarOSFechadas(filtros?: Omit<FiltrosOS, 'statusOS'>): Promise<RespostaOSData> {
    return await this.buscarOS({
      ...filtros,
      statusOS: 'FC'
    });
  },

  /**
   * Busca OS do tipo Corretiva
   */
  async buscarOSCorretivas(filtros?: Omit<FiltrosOS, 'tipoOS'>): Promise<RespostaOSData> {
    return await this.buscarOS({
      ...filtros,
      tipoOS: 'C'
    });
  },

  /**
   * Busca OS do tipo Preventiva
   */
  async buscarOSPreventivas(filtros?: Omit<FiltrosOS, 'tipoOS'>): Promise<RespostaOSData> {
    return await this.buscarOS({
      ...filtros,
      tipoOS: 'P'
    });
  },

  /**
   * Busca OS por tipo de problema
   */
  async buscarPorTipoProblema(
    tipoProblema: 'QUEBRA' | 'DEFEITO',
    filtros?: Omit<FiltrosOS, 'tipoProblema'>
  ): Promise<RespostaOSData> {
    return await this.buscarOS({
      ...filtros,
      tipoProblema
    });
  },

  /**
   * Busca OS por garagem
   */
  async buscarPorGaragem(garagem: string, filtros?: Omit<FiltrosOS, 'garagem'>): Promise<RespostaOSData> {
    return await this.buscarOS({
      ...filtros,
      garagem
    });
  },

  /**
   * Exporta dados para relatório
   */
  async exportarRelatorio(filtros?: FiltrosOS): Promise<OrdemServico[]> {
    const response = await this.buscarOS({
      ...filtros,
      limit: 50000 // Buscar mais dados para relatório
    });
    return response.data;
  }
};
