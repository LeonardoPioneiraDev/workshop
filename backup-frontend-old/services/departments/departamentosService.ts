// src/services/departments/departamentosService.ts
import { api } from '../api';

// ✅ INTERFACES PARA DEPARTAMENTOS CENTRALIZADOS
export interface DepartamentoInfo {
  nome: string;
  path: string;
  descricao: string;
  funcionalidades: string[];
  endpoints: Record<string, string>;
}

export interface StatusDepartamento {
  status: 'ativo' | 'inativo';
  endpoints: number;
  ultimaAtualizacao: string | null;
  funcionalidades: Record<string, boolean>;
}

export interface DepartamentosResponse {
  success: boolean;
  message: string;
  data: {
    departamentos: DepartamentoInfo[];
  };
  timestamp: string;
}

export interface StatusDepartamentosResponse {
  success: boolean;
  message: string;
  data: {
    juridico: StatusDepartamento & {
      totalMultas: number;
    };
    pessoal: StatusDepartamento & {
      totalFuncionarios: number;
      cache?: {
        totalMeses: number;
        comDados: number;
        percentual: number;
      };
    };
    resumo: {
      totalDepartamentos: number;
      departamentosAtivos: number;
      totalEndpoints: number;
      sistemaEnhanced: boolean;
    };
  };
  timestamp: string;
}

export interface DashboardGeralResponse {
  success: boolean;
  message: string;
  data: {
    estatisticas: {
      juridico: {
        status: 'ativo' | 'inativo';
        totalMultas: number;
        multasAbertas: number;
        valorTotal: number;
        alertasDefesa: number;
      };
      pessoal: {
        status: 'ativo' | 'inativo';
        totalFuncionarios: number;
        funcionariosAtivos: number;
        funcionariosAfastados: number;
        novasAdmissoes: number;
      };
      consolidado: {
        departamentosAtivos: number;
        totalRegistros: number;
        sistemaEnhanced: boolean;
        cacheOtimizado: boolean;
      };
    };
    departamentos: {
      juridico: {
        nome: string;
        status: 'ATIVO' | 'INATIVO';
        resumo?: any;
        endpoints: Record<string, string>;
        erro?: string;
      };
      pessoal: {
        nome: string;
        status: 'ATIVO' | 'INATIVO';
        resumo?: any;
        endpoints: Record<string, string>;
        erro?: string;
      };
    };
    detalhes?: {
      juridico?: any;
      pessoal?: any;
    };
  };
  metadados: {
    incluiuDetalhes: boolean;
    tempoGeracao: string;
    versaoSistema: string;
  };
  timestamp: string;
}

export interface DashboardExecutivoResponse {
  success: boolean;
  message: string;
  data: {
    kpis: {
      financeiro: {
        valorTotalMultas: number;
        multasAbertas: number;
        taxaRecuperacao: number;
        tendencia: string;
      };
      operacional: {
        totalFuncionarios: number;
        funcionariosAtivos: number;
        taxaAfastamento: number;
        novasAdmissoes: number;
      };
      compliance: {
        alertasDefesa: number;
        prazosMedios: number;
        documentacaoCompleta: number;
        sincronizacaoAtualizada: boolean;
      };
      performance: {
        tempoMedioResposta: string;
        disponibilidadeSistema: string;
        cacheHitRate: number;
        consultasOtimizadas: number;
      };
    };
    alertas: Array<{
      tipo: string;
      mensagem: string;
      prioridade: 'alta' | 'media' | 'baixa';
    }>;
    tendencias: {
      juridico: Record<string, any>;
      pessoal: Record<string, any>;
    };
    acoes: {
      prioritarias: string[];
      recomendadas: string[];
    };
  };
  metadados: {
    ultimaAtualizacao: string;
    proximaAtualizacao: string;
    versaoSistema: string;
    departamentosMonitorados: string[];
  };
  timestamp: string;
}

const BASE_URL = '/departamentos';

export const departamentosService = {
  // ✅ LISTAR DEPARTAMENTOS DISPONÍVEIS
  async getDepartamentos(): Promise<DepartamentosResponse> {
    try {
      console.log('🏢 [DEPARTAMENTOS_SERVICE] Carregando departamentos...');
      const response = await api.get(`${BASE_URL}`);
      console.log('✅ [DEPARTAMENTOS_SERVICE] Departamentos carregados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_SERVICE] Erro ao carregar departamentos:', error);
      throw error;
    }
  },

  // ✅ STATUS DE TODOS OS DEPARTAMENTOS
  async getStatusDepartamentos(): Promise<StatusDepartamentosResponse> {
    try {
      console.log('📊 [DEPARTAMENTOS_SERVICE] Verificando status dos departamentos...');
      const response = await api.get(`${BASE_URL}/status`);
      console.log('✅ [DEPARTAMENTOS_SERVICE] Status obtido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_SERVICE] Erro ao obter status:', error);
      throw error;
    }
  },

  // ✅ DASHBOARD GERAL DE TODOS OS DEPARTAMENTOS
  async getDashboardGeral(incluirDetalhes: boolean = false): Promise<DashboardGeralResponse> {
    try {
      console.log('📊 [DEPARTAMENTOS_SERVICE] Carregando dashboard geral...', { incluirDetalhes });
      const params = { incluirDetalhes };
      const response = await api.get(`${BASE_URL}/dashboard-geral`, params);
      console.log('✅ [DEPARTAMENTOS_SERVICE] Dashboard geral carregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_SERVICE] Erro no dashboard geral:', error);
      throw error;
    }
  },

  // ✅ DASHBOARD EXECUTIVO CONSOLIDADO
  async getDashboardExecutivo(): Promise<DashboardExecutivoResponse> {
    try {
      console.log('📊 [DEPARTAMENTOS_SERVICE] Carregando dashboard executivo...');
      const response = await api.get(`${BASE_URL}/dashboard-executivo`);
      console.log('✅ [DEPARTAMENTOS_SERVICE] Dashboard executivo carregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DEPARTAMENTOS_SERVICE] Erro no dashboard executivo:', error);
      throw error;
    }
  }
};