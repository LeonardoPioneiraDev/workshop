// apps/frontend/src/services/departments/legal/multasSetorService.ts
import { api } from '../../api';

export interface MultaSetor {
  numeroAiMulta: string;
  prefixoVeic: string;
  codigoVeic: string;
  dataEmissaoMulta: string;
  valorMulta: number;
  setorNaDataInfracao?: {
    prefixoVeiculo: string;
    codigoGaragem: number;
    nomeGaragem: string;
    dataInicio: string;
    dataFim: string | null;
    periodoAtivo: boolean;
  };
  setorAtual?: {
    codigoGaragem: number;
    nomeGaragem: string;
  };
  setorMudou: boolean;
  setorEncontrado: boolean;
}

export interface SetorComparacaoData {
  codigoGaragem: number;
  nomeGaragem: string;
  totalMultas: number;
  valorTotal: number;
  percentualTotal: number;
}

export interface HistoricoSetorData {
  prefixo: string;
  setorAnterior: string;
  setorNovo: string;
  data: string;
  motivo: string;
}

class MultasSetorService {
  private baseUrl = '/juridico/multas-setor';

  async buscarMultasPorSetor(filtros: any = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.setor) params.append('setor', filtros.setor);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros.page) params.append('page', filtros.page.toString());
      if (filtros.limit) params.append('limit', filtros.limit.toString());

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar multas por setor:', error);
      throw error;
    }
  }

  async obterComparacaoSetores(filtros: any = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await api.get(`${this.baseUrl}/comparacao?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter comparação de setores:', error);
      throw error;
    }
  }

  async obterDashboardSetores(filtros: any = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await api.get(`${this.baseUrl}/dashboard?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter dashboard de setores:', error);
      throw error;
    }
  }

  async obterHistoricoSetores(filtros: any = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await api.get('/juridico/historico-setores/multas-historico');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico de setores:', error);
      throw error;
    }
  }

  async obterMultasSemSetor(filtros: any = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await api.get(`${this.baseUrl}/sem-setor?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter multas sem setor:', error);
      throw error;
    }
  }

  async inicializarHistoricoSetores() {
    try {
      const response = await api.post('/juridico/historico-setores/inicializar');
      return response.data;
    } catch (error) {
      console.error('Erro ao inicializar histórico de setores:', error);
      throw error;
    }
  }

  async sincronizarHistoricoSetores() {
    try {
      const response = await api.post('/juridico/historico-setores/sincronizar');
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar histórico de setores:', error);
      throw error;
    }
  }
}

export const multasSetorService = new MultasSetorService();