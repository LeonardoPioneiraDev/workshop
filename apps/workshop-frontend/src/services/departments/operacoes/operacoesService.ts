import api from '../../api';

export interface OracleVerificationResult {
  oracle: {
    total: number;
    dataMinima?: Date;
    dataMaxima?: Date;
    exemplos?: any[];
    conexao: 'OK' | 'FALHA' | 'ERRO';
    erro?: string;
  };
  postgresql: {
    total: number;
    conexao: string;
  };
  status: string;
  recomendacao: string;
}

export interface CreateTestDataResult {
  sucesso: boolean;
  quantidade: number;
  mensagem: string;
  periodo: {
    inicio: string;
    fim: string;
  };
  estatisticas: {
    comVitimas: number;
    semVitimas: number;
    garagens: string[];
  };
}

export interface SincronizarResult {
  sucesso: boolean;
  novosRegistros: number;
  registrosAtualizados: number;
  totalProcessado: number;
  mensagem: string;
  tempoProcessamento: string;
  periodo: {
    inicio: string;
    fim: string;
  };
}

export const operacoesService = {
  // 🔍 Verificar dados no Oracle
  async verificarDadosOracle(): Promise<OracleVerificationResult> {
    try {
      const response = await api.get('/departamentos/operacoes/acidentes/verificar-oracle');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao verificar Oracle:', error);
      throw new Error(error.response?.data?.message || 'Falha ao verificar dados do Oracle');
    }
  },

  // 🧪 Criar dados de teste
  async criarDadosTeste(quantidade: number = 50): Promise<CreateTestDataResult> {
    try {
      const response = await api.post(`/departamentos/operacoes/acidentes/criar-dados-teste?quantidade=${quantidade}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar dados de teste:', error);
      throw new Error(error.response?.data?.message || 'Falha ao criar dados de teste');
    }
  },

  // 🔄 Sincronizar acidentes do Oracle
  async sincronizarAcidentes(): Promise<SincronizarResult> {
    try {
      const response = await api.post('/departamentos/operacoes/acidentes/sincronizar');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar acidentes:', error);
      throw new Error(error.response?.data?.message || 'Falha ao sincronizar acidentes');
    }
  },

  // 🔄 Sincronizar frota do Oracle
  async sincronizarFrota(): Promise<SincronizarResult> {
    try {
      const response = await api.post('/departamentos/operacoes/frota/sincronizar');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar frota:', error);
      throw new Error(error.response?.data?.message || 'Falha ao sincronizar frota');
    }
  },
};

export default operacoesService;