// apps/frontend/src/services/departments/pessoal/pessoalService.ts - VERSÃO COMPLETA EXPANDIDA
import { api } from '../../api';
import type {
  Funcionario,
  FuncionarioFilters,
  PaginatedFuncionarios,
  DashboardPessoal,
  EstatisticasBasicas,
  ResultadoSincronizacao
} from '../../../types/departments/pessoal';

// ✅ TIPOS COMPLETOS PARA FUNCIONÁRIOS COMPLETOS
export interface FuncionarioCompleto {
  id: number;
  valeRefeicao?: string;
  dataTransferencia?: Date;
  empresa: number;
  codintFunc: number;
  cracha: number;
  chapa?: string;
  nome: string;
  mae?: string;
  cpf?: string;
  funcao?: string;
  departamento?: string;
  area?: string;
  secao?: string;
  setor?: string;
  endereco?: string;
  casa?: string;
  bairro?: string;
  cidade?: string;
  foneFunc?: string;
  fone2Func?: string;
  dataAdmissao?: Date;
  situacao: string;
  situacaoDescricao?: string;
  salBase?: number;
  salAux1?: number;
  salAux2?: number;
  salarioTotal?: number;
  dtCompetQuita?: Date;
  idQuita?: number;
  dtDesligQuita?: Date;
  idade?: number;
  tempoEmpresaDias?: number;
  tempoEmpresaAnos?: number;
  temQuitacao: boolean;
  ativo: boolean;
  mesReferencia: string;
  sincronizadoEm: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FuncionarioCompletoFilters {
  empresa?: number;
  cracha?: number;
  chapa?: string;
  nome?: string;
  cpf?: string;
  mae?: string;
  funcao?: string;
  departamento?: string;
  area?: string;
  secao?: string;
  setor?: string;
  cidade?: string;
  bairro?: string;
  situacao?: 'A' | 'F' | 'D';
  dataAdmissaoInicio?: string;
  dataAdmissaoFim?: string;
  salarioMinimo?: number;
  salarioMaximo?: number;
  valeRefeicao?: 'S' | 'N';
  temQuitacao?: boolean;
  dataDesligamentoInicio?: string;
  dataDesligamentoFim?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  mesReferencia?: string;
}

export interface PaginatedFuncionariosCompletos {
  data: FuncionarioCompleto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardFuncionariosCompletos {
  resumo: {
    totalFuncionarios: number;
    ativos: number;
    funcionarios: number;
    demitidos: number;
    comQuitacao: number;
    semQuitacao: number;
    salarioMedio: number;
    tempoMedioEmpresa: number;
  };
  distribuicao: {
    porSituacao: Array<{ situacao: string; total: number; percentual: number }>;
    porDepartamento: Array<{ departamento: string; total: number; percentual: number }>;
    porArea: Array<{ area: string; total: number; percentual: number }>;
    porCidade: Array<{ cidade: string; total: number; percentual: number }>;
    porFaixaSalarial: Array<{ faixa: string; total: number; percentual: number }>;
    porTempoEmpresa: Array<{ faixa: string; total: number; percentual: number }>;
  };
  estatisticas: {
    maiorSalario: number;
    menorSalario: number;
    funcionarioMaisAntigo: string;
    funcionarioMaisNovo: string;
    departamentoMaior: string;
    cidadeMaior: string;
  };
}

export interface BuscaAvancadaResponse {
  success: boolean;
  message: string;
  data: FuncionarioCompleto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filtrosAplicados: string[];
  resumo: {
    totalEncontrados: number;
    salarioMedio: number;
    idadeMedia: number;
    funcionariosAtivos: number;
    funcionariosFuncionarios: number;
    funcionariosDemitidos: number;
  };
  timestamp: string;
  endpoint: string;
}

export interface AgrupamentoResponse {
  success: boolean;
  message: string;
  data: Array<{
    grupo?: string;
    departamento?: string;
    area?: string;
    cidade?: string;
    situacao?: string;
    faixa?: string;
    total: number;
    percentual: number;
    salarioMedio?: number;
  }>;
  tipo: string;
  mesReferencia: string;
  totalFuncionarios: number;
  timestamp: string;
  endpoint: string;
}

// ✅ TIPOS EXISTENTES MANTIDOS
export interface DashboardComparativo {
  success: boolean;
  message: string;
  data: {
    meses: {
      mesAtual: string;
      mesAnterior1: string;
      mesAnterior2: string;
      mesAnoAnterior: string;
    };
    mesesInfo: {
      mesAtual: { referencia: string; nome: string; tipo: string; fonte: string };
      mesAnterior1: { referencia: string; nome: string; tipo: string; fonte: string };
      mesAnterior2: { referencia: string; nome: string; tipo: string; fonte: string };
      mesAnoAnterior: { referencia: string; nome: string; tipo: string; fonte: string };
    };
    dashboards: {
      mesAtual: DashboardPessoal;
      mesAnterior1: DashboardPessoal;
      mesAnterior2: DashboardPessoal;
      mesAnoAnterior: DashboardPessoal;
    };
    metadados: {
      totalConsultasOracle: number;
      totalConsultasCache: number;
      tempoTotalExecucao: string;
    };
  };
  metadados: {
    dataReferencia: string;
    totalMeses: number;
    tipoComparacao: string;
    mesesCalculados: {
      mesAtual: string;
      mesAnterior1: string;
      mesAnterior2: string;
      mesAnoAnterior: string;
    };
  };
  timestamp: string;
  endpoint: string;
}

export interface EstatisticasComparativasResponse {
  success: boolean;
  message: string;
  data: {
    [mesReferencia: string]: {
      totalFuncionarios: number;
      funcionariosAtivos: number;
      funcionariosAfastados: number;
      funcionariosDemitidos: number;
      percentualAtivos: number;
      percentualAfastados: number;
    };
  };
  timestamp: string;
  endpoint: string;
}

export interface SincronizacaoMultiplaResponse {
  success: boolean;
  message: string;
  data: {
    totalMeses: number;
    sucessos: number;
    erros: number;
    performance: {
      usouCache: number;
      consultouOracle: number;
      economiaOracle: string;
    };
    resultados: Array<{
      mes?: string;
      resultado?: ResultadoSincronizacao;
      status: 'success' | 'error';
      fonte: 'cache' | 'oracle';
      error?: string;
    }>;
  };
  mesesSincronizados: string[];
  timestamp: string;
  endpoint: string;
}

export interface StatusSincronizacaoResponse {
  success: boolean;
  message: string;
  data: {
    resumo: {
      totalMeses: number;
      sincronizados: number;
      pendentes: number;
      precisamAtualizacao: number;
      percentualSincronizado: number;
      cacheValido: number;
    };
    detalhes: Array<{
      mes: string;
      nome: string;
      sincronizado: boolean;
      totalRegistros: number;
      ultimaAtualizacao: string | null;
      idadeCache: string;
      precisaAtualizar: boolean;
    }>;
  };
  timestamp: string;
  endpoint: string;
}

export interface StatusCacheResponse {
  success: boolean;
  message: string;
  data: {
    resumo: {
      totalMeses: number;
      comDados: number;
      semDados: number;
      precisamAtualizacao: number;
    };
    detalhes: Array<{
      mes: string;
      nome: string;
      existeNoCache: boolean;
      totalRegistros: number;
      ultimaAtualizacao: string | null;
      idadeCache: string;
      precisaAtualizar: boolean;
    }>;
  };
  timestamp: string;
  endpoint: string;
}

export interface DashboardAcumuladoResponse {
  success: boolean;
  message: string;
  data: {
    periodoInicio: string;
    periodoFim: string;
    nomeCompleto: string;
    fonte: 'cache' | 'oracle';
    resumo: {
      totalFuncionarios: number;
      funcionariosAtivos: number;
      funcionariosAfastados: number;
      funcionariosDemitidos: number;
      novasAdmissoes: number;
      demissoes: number;
      percentualAtivos: number;
      percentualAfastados: number;
    };
    detalhamentoMensal: Array<{
      mes: string;
      mesFormatado: string;
      totalFuncionarios: number;
      funcionariosAtivos: number;
      funcionariosAfastados: number;
      funcionariosDemitidos: number;
      percentualAfastados: number;
      fonte: string;
    }>;
  };
  metadados: {
    tipoRelatorio: string;
    periodoInicio: string;
    periodoFim: string;
    totalMesesIncluidos: number;
    fonte: string;
  };
  timestamp: string;
  endpoint: string;
}

// ✅ INTERFACE PARA TESTE DE CONEXÃO
export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  timestamp: string;
  responseTime: number;
}

const BASE_URL = '/departamentos/pessoal';

// ✅ CLASSE DE SERVICE COMPLETA E OTIMIZADA
class PessoalService {
  private requestCount = 0;
  private successCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;

  // ✅ MÉTODO PARA TESTE DE CONEXÃO
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔧 [PESSOAL_SERVICE] Testando conexão...');
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/status-cache`);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(true, responseTime);
      
      console.log(`✅ [PESSOAL_SERVICE] Conexão OK - ${responseTime}ms`);
      return response.data.success || true;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro na conexão:', error);
      return false;
    }
  }

  // ✅ MÉTODO PRIVADO PARA ATUALIZAR MÉTRICAS
  private updateMetrics(success: boolean, responseTime: number) {
    this.requestCount++;
    if (success) {
      this.successCount++;
      this.totalResponseTime += responseTime;
    } else {
      this.errorCount++;
    }
  }

  // ✅ MÉTODO PÚBLICO PARA OBTER MÉTRICAS
  getMetrics() {
    return {
      totalRequests: this.requestCount,
      successfulRequests: this.successCount,
      failedRequests: this.errorCount,
      averageResponseTime: this.successCount > 0 ? Math.round(this.totalResponseTime / this.successCount) : 0,
      successRate: this.requestCount > 0 ? Math.round((this.successCount / this.requestCount) * 100) : 0
    };
  }

  // ✅ MÉTODOS EXISTENTES PARA FUNCIONÁRIOS BÁSICOS
  async sincronizar(mesReferencia?: string, forcar?: boolean): Promise<ResultadoSincronizacao> {
    try {
      console.log('🔄 [PESSOAL_SERVICE] Iniciando sincronização...', { mesReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (mesReferencia) params.mesReferencia = mesReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.post(`${BASE_URL}/sincronizar`, {}, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Sincronização concluída:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro na sincronização:', error);
      throw error;
    }
  }

  async sincronizarMultiplos(dataReferencia?: string, forcar?: boolean): Promise<SincronizacaoMultiplaResponse> {
    try {
      console.log('🔄 [PESSOAL_SERVICE] Iniciando sincronização múltipla...', { dataReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (dataReferencia) params.dataReferencia = dataReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.post(`${BASE_URL}/sincronizar-multiplos`, {}, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Sincronização múltipla concluída:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro na sincronização múltipla:', error);
      throw error;
    }
  }

  async sincronizarAcumulado(mesReferencia?: string, forcar?: boolean): Promise<ResultadoSincronizacao> {
    try {
      console.log('🔄 [PESSOAL_SERVICE] Iniciando sincronização acumulada...', { mesReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (mesReferencia) params.mesReferencia = mesReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.post(`${BASE_URL}/sincronizar-acumulado`, {}, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Sincronização acumulada concluída:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro na sincronização acumulada:', error);
      throw error;
    }
  }

  async getStatusCache(): Promise<StatusCacheResponse> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Verificando status do cache...');
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/status-cache`);
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Status do cache obtido:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao obter status do cache:', error);
      throw error;
    }
  }

  async getStatusSincronizacao(): Promise<StatusSincronizacaoResponse> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Verificando status de sincronização...');
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/status-sincronizacao`);
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Status de sincronização obtido:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao obter status de sincronização:', error);
      throw error;
    }
  }

  async getDashboard(mesReferencia?: string, forcar?: boolean): Promise<DashboardPessoal> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Carregando dashboard...', { mesReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (mesReferencia) params.mesReferencia = mesReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.get(`${BASE_URL}/dashboard`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Dashboard carregado:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro no dashboard:', error);
      throw error;
    }
  }

  async getDashboardComparativo(dataReferencia?: string, forcar?: boolean): Promise<DashboardComparativo> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Carregando dashboard comparativo...', { dataReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (dataReferencia) params.dataReferencia = dataReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.get(`${BASE_URL}/dashboard-comparativo`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Dashboard comparativo carregado:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro na resposta do servidor');
      }
      
      if (!response.data.data || !response.data.data.dashboards) {
        throw new Error('Estrutura de dados inválida retornada pelo servidor');
      }
      
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro no dashboard comparativo:', error);
      throw error;
    }
  }

  async getDashboardAcumulado(mesReferencia?: string, forcar?: boolean): Promise<DashboardAcumuladoResponse> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Carregando dashboard acumulado...', { mesReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (mesReferencia) params.mesReferencia = mesReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.get(`${BASE_URL}/dashboard-acumulado`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Dashboard acumulado carregado:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro no dashboard acumulado:', error);
      throw error;
    }
  }

  async getDashboardAcumuladoComparativo(dataReferencia?: string, forcar?: boolean): Promise<any> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Carregando dashboard acumulado comparativo...', { dataReferencia, forcar });
      const startTime = Date.now();
      
      const params: any = {};
      if (dataReferencia) params.dataReferencia = dataReferencia;
      if (forcar !== undefined) params.forcar = forcar;
      
      const response = await api.get(`${BASE_URL}/dashboard-acumulado-comparativo`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Dashboard acumulado comparativo carregado:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro no dashboard acumulado comparativo:', error);
      throw error;
    }
  }

  async getEstatisticasComparativas(): Promise<EstatisticasComparativasResponse> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Carregando estatísticas comparativas...');
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/estatisticas-comparativas`);
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Estatísticas comparativas carregadas:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro na resposta do servidor');
      }
      
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro nas estatísticas comparativas:', error);
      throw error;
    }
  }

  async getFuncionarios(filters: FuncionarioFilters = {}): Promise<PaginatedFuncionarios> {
    try {
      console.log('👥 [PESSOAL_SERVICE] Carregando funcionários...', { filters });
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/funcionarios`, { params: filters });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionários carregados:', response.data);
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao carregar funcionários:', error);
      throw error;
    }
  }

  async getFuncionarioPorCodigo(codfunc: number, mesReferencia?: string): Promise<Funcionario> {
    try {
      console.log('🔍 [PESSOAL_SERVICE] Buscando funcionário por código...', { codfunc, mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/funcionarios/codigo/${codfunc}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionário encontrado:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionário por código:', error);
      throw error;
    }
  }

  async getFuncionarioPorCpf(cpf: string, mesReferencia?: string): Promise<Funcionario> {
    try {
      console.log('🔍 [PESSOAL_SERVICE] Buscando funcionário por CPF...', { cpf, mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/funcionarios/cpf/${cpf}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionário encontrado:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionário por CPF:', error);
      throw error;
    }
  }

  async getFuncionariosPorSituacao(
    situacao: 'ATIVO' | 'AFASTADO' | 'DEMITIDO',
    page = 1,
    limit = 50,
    mesReferencia?: string
  ): Promise<PaginatedFuncionarios> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Buscando funcionários por situação...', { situacao, page, limit, mesReferencia });
      const startTime = Date.now();
      
      const params = { page, limit, ...(mesReferencia && { mesReferencia }) };
      const response = await api.get(`${BASE_URL}/funcionarios/situacao/${situacao}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionários por situação carregados:', response.data);
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionários por situação:', error);
      throw error;
    }
  }

  async buscarFuncionariosPorNome(
    nome: string,
    limit = 20,
    mesReferencia?: string
  ): Promise<Funcionario[]> {
    try {
      console.log('🔍 [PESSOAL_SERVICE] Buscando funcionários por nome...', { nome, limit, mesReferencia });
      const startTime = Date.now();
      
      const params = { limit, ...(mesReferencia && { mesReferencia }) };
      const response = await api.get(`${BASE_URL}/funcionarios/busca/${nome}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionários por nome encontrados:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionários por nome:', error);
      throw error;
    }
  }

  async getEstatisticas(mesReferencia?: string): Promise<EstatisticasBasicas> {
    try {
      console.log('📈 [PESSOAL_SERVICE] Carregando estatísticas...', { mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/estatisticas`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Estatísticas carregadas:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao carregar estatísticas:', error);
      throw error;
    }
  }

  // ✅ NOVOS MÉTODOS PARA FUNCIONÁRIOS COMPLETOS

  async getFuncionariosCompletos(filters: FuncionarioCompletoFilters = {}): Promise<PaginatedFuncionariosCompletos> {
    try {
      console.log('👥 [PESSOAL_SERVICE] Carregando funcionários completos...', { filters });
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/funcionarios-completos`, { params: filters });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionários completos carregados:', response.data);
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao carregar funcionários completos:', error);
      throw error;
    }
  }

  async getFuncionarioCompletoPorCracha(cracha: number, mesReferencia?: string): Promise<FuncionarioCompleto> {
    try {
      console.log('🔍 [PESSOAL_SERVICE] Buscando funcionário completo por crachá...', { cracha, mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/funcionarios-completos/cracha/${cracha}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionário completo encontrado:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionário completo por crachá:', error);
      throw error;
    }
  }

  async getFuncionarioCompletoPorCpf(cpf: string, mesReferencia?: string): Promise<FuncionarioCompleto> {
    try {
      console.log('🔍 [PESSOAL_SERVICE] Buscando funcionário completo por CPF...', { cpf, mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/funcionarios-completos/cpf/${cpf}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionário completo encontrado:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionário completo por CPF:', error);
      throw error;
    }
  }

  async getFuncionariosPorDepartamento(
    departamento: string, 
    filters: Partial<FuncionarioCompletoFilters> = {}
  ): Promise<PaginatedFuncionariosCompletos> {
    try {
      console.log('🏢 [PESSOAL_SERVICE] Buscando funcionários por departamento...', { departamento, filters });
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/funcionarios-completos/departamento/${departamento}`, { params: filters });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionários por departamento carregados:', response.data);
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionários por departamento:', error);
      throw error;
    }
  }

  async getFuncionariosPorSituacaoCompleto(
    situacao: 'A' | 'F' | 'D',
    filters: Partial<FuncionarioCompletoFilters> = {}
  ): Promise<PaginatedFuncionariosCompletos> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Buscando funcionários por situação...', { situacao, filters });
      const startTime = Date.now();
      
      const response = await api.get(`${BASE_URL}/funcionarios-completos/situacao/${situacao}`, { params: filters });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Funcionários por situação carregados:', response.data);
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao buscar funcionários por situação:', error);
      throw error;
    }
  }

  async getDashboardFuncionariosCompletos(mesReferencia?: string): Promise<DashboardFuncionariosCompletos> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Carregando dashboard de funcionários completos...', { mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/funcionarios-completos/dashboard`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Dashboard de funcionários completos carregado:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro no dashboard de funcionários completos:', error);
      throw error;
    }
  }

  async sincronizarFuncionariosCompletos(mesReferencia?: string): Promise<ResultadoSincronizacao> {
    try {
      console.log('🔄 [PESSOAL_SERVICE] Sincronizando funcionários completos...', { mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.post(`${BASE_URL}/funcionarios-completos/sincronizar`, {}, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Sincronização de funcionários completos concluída:', response.data);
      return response.data.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro na sincronização de funcionários completos:', error);
      throw error;
    }
  }

  async buscaAvancadaFuncionariosCompletos(filtros: FuncionarioCompletoFilters): Promise<BuscaAvancadaResponse> {
    try {
      console.log('🔍 [PESSOAL_SERVICE] Realizando busca avançada...', { filtros });
      const startTime = Date.now();
      
      const response = await api.post(`${BASE_URL}/funcionarios-completos/busca-avancada`, filtros);
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Busca avançada concluída:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro na busca avançada:', error);
      throw error;
    }
  }

  async getAgrupamentos(
    tipo: 'departamento' | 'area' | 'cidade' | 'situacao' | 'faixaSalarial',
    mesReferencia?: string
  ): Promise<AgrupamentoResponse> {
    try {
      console.log('📊 [PESSOAL_SERVICE] Obtendo agrupamentos...', { tipo, mesReferencia });
      const startTime = Date.now();
      
      const params = mesReferencia ? { mesReferencia } : {};
      const response = await api.get(`${BASE_URL}/funcionarios-completos/agrupamentos/${tipo}`, { params });
      
      this.updateMetrics(true, Date.now() - startTime);
      console.log('✅ [PESSOAL_SERVICE] Agrupamentos obtidos:', response.data);
      return response.data;
    } catch (error) {
      this.updateMetrics(false, 0);
      console.error('❌ [PESSOAL_SERVICE] Erro ao obter agrupamentos:', error);
      throw error;
    }
  }

  // ✅ MÉTODO PARA RESETAR MÉTRICAS
  resetMetrics() {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
  }
}

// ✅ INSTÂNCIA ÚNICA DO SERVICE
export const pessoalService = new PessoalService();