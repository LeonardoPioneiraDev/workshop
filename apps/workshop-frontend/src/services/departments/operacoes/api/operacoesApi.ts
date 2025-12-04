// src/services/departments/operacoes/api/operacoesApi.ts
import { api } from '@/services/api/client';

export interface VeiculoOperacional {
  id: number;
  prefixo: string;
  placa: string;
  modelo?: string;
  marca?: string;
  ano?: number;
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO' | 'RESERVA';
  garagem?: string;
  garagemNome?: string;
  setor?: string;
  tipoVeiculo?: string;
  capacidadePassageiros?: number;
  combustivel?: string;
  quilometragem?: number;
  motoristaAtual?: string;
  rotaAtual?: string;
  observacoes?: string;
}

export interface Acidente {
  id: number;
  dataAcidente: string;
  horaAcidente?: string;
  grauAcidente?: string;
  prefixoVeiculo?: string;
  placaVeiculo?: string;
  garagemVeiculoNome?: string;
  valorTotalDano?: number;
  valorAcordo?: number;
  municipio?: string;
  bairro?: string;
  tipoAcidenteGeral?: string;
  statusProcesso?: string;
}

export interface Linha {
  id: number;
  numero: string;
  descricao?: string;
  garagem?: string;
  garagemNome?: string;
  tipoLinha?: string;
  status: 'ATIVA' | 'INATIVA' | 'SUSPENSA';
  origem?: string;
  destino?: string;
  extensaoKm?: number;
  tempoViagemMinutos?: number;
  tarifa?: number;
  receitaEstimadaDia?: number;
  veiculosNecessarios?: number;
  passageirosDia?: number;
}

export interface EstatisticasOperacoes {
  id: number;
  data: string;
  ano: number;
  mes: number;
  garagem: string;
  totalVeiculos: number;
  veiculosAtivos: number;
  veiculosInativos: number;
  totalAcidentes: number;
  acidentesComVitimas: number;
  acidentesSemVitimas: number;
  valorTotalDanos: number;
  indiceSinistralidade: number;
  custoMedioAcidente: number;
  eficienciaOperacional: number;
  percentualDisponibilidade: number;
}

export const operacoesApi = {
  // ==========================================
  // 📊 DASHBOARD E STATUS
  // ==========================================
  
  async getDashboard(): Promise<any> {
    return api.get('/departamentos/operacoes/dashboard');
  },

  async getStatus(): Promise<any> {
    return api.get('/departamentos/operacoes/status');
  },

  async getResumoExecutivo(): Promise<any> {
    return api.get('/departamentos/operacoes/resumo-executivo');
  },

  // ==========================================
  // 🚗 FROTA
  // ==========================================
  
  async getVeiculos(params?: {
    garagem?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<VeiculoOperacional[]> {
    const data = await api.get('/departamentos/operacoes/frota', { params });
    return (data as any)?.data || data || [];
  },

  async getVeiculoByPrefixo(prefixo: string): Promise<VeiculoOperacional> {
    return api.get(`/departamentos/operacoes/frota/${prefixo}`);
  },

  async buscarVeiculos(termo: string): Promise<VeiculoOperacional[]> {
    const data = await api.get(`/departamentos/operacoes/frota/busca/${termo}`);
    return (data as any)?.data || data || [];
  },

  async getFrotaEstatisticas(): Promise<any> {
    return api.get('/departamentos/operacoes/frota/estatisticas');
  },

  async getFrotaPorGaragem(): Promise<any> {
    return api.get('/departamentos/operacoes/frota/por-garagem');
  },

  async getFrotaDashboard(): Promise<any> {
    return api.get('/departamentos/operacoes/frota/dashboard');
  },

  async sincronizarFrota(): Promise<any> {
    return api.post('/departamentos/operacoes/frota/sincronizar');
  },

  async obterFrota(filtros?: {
    status?: string;
    garagem?: string;
    prefixo?: string;
    tipoVeiculo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    veiculos: VeiculoOperacional[];
    totalRegistros: number;
    totalPaginas: number;
    paginaAtual: number;
    estatisticas: any;
    ultimaSincronizacao: string;
  }> {
    const data = await api.get('/departamentos/operacoes/frota', { params: filtros });
    return {
      veiculos: (data as any)?.veiculos || (data as any)?.data || [],
      totalRegistros: (data as any)?.totalRegistros || 0,
      totalPaginas: (data as any)?.totalPaginas || 1,
      paginaAtual: (data as any)?.paginaAtual || 1,
      estatisticas: (data as any)?.estatisticas || null,
      ultimaSincronizacao: (data as any)?.ultimaSincronizacao || new Date().toISOString()
    };
  },

  // ==========================================
  // 🚨 ACIDENTES
  // ==========================================
  
  async getAcidentes(params?: {
    dataInicio?: string;
    dataFim?: string;
    garagem?: string;
    grauAcidente?: string;
    limit?: number;
    page?: number;
  }): Promise<Acidente[]> {
    const data = await api.get('/departamentos/operacoes/acidentes', { params });
    return (data as any)?.data || data || [];
  },

  async getAcidentesByPeriodo(dataInicio: string, dataFim: string): Promise<Acidente[]> {
    const data = await api.get('/departamentos/operacoes/acidentes', { params: { dataInicio, dataFim } });
    return (data as any)?.data || data || [];
  },

  async getAcidentesEstatisticas(): Promise<any> {
    return api.get('/departamentos/operacoes/acidentes/estatisticas');
  },

  async getTopVeiculosAcidentes(): Promise<any> {
    return api.get('/departamentos/operacoes/acidentes/top-veiculos');
  },

  async getAcidentesDashboard(): Promise<any> {
    const response = await api.get('/departamentos/operacoes/acidentes/dashboard');
    return response.data;
  },

  async getValoresFiltros(): Promise<any> {
    const response = await api.get('/departamentos/operacoes/acidentes/valores-filtros');
    return response.data;
  },

  async sincronizarAcidentes(): Promise<any> {
    const response = await api.post('/departamentos/operacoes/acidentes/sincronizar');
    return response.data;
  },

  // ==========================================
  // 📋 HISTÓRICO
  // ==========================================
  
  async getHistoricoVeiculos(params?: {
    prefixo?: string;
    dataInicio?: string;
    dataFim?: string;
    tipo?: string;
    limit?: number;
    page?: number;
  }): Promise<any> {
    const response = await api.get('/departamentos/operacoes/historico', { params });
    return response.data;
  },

  async getHistoricoVeiculo(prefixo: string): Promise<any> {
    const response = await api.get(`/departamentos/operacoes/historico/veiculo/${prefixo}`);
    return response.data;
  },

  async getHistoricoSincronizacoes(): Promise<any> {
    const response = await api.get('/departamentos/operacoes/historico/sincronizacoes');
    return response.data;
  },

  async getUltimaSincronizacao(): Promise<any> {
    const response = await api.get('/departamentos/operacoes/historico/ultima-sincronizacao');
    return response.data;
  },

  // ==========================================
  // 🛣️ LINHAS (SIMULADAS - não existem no backend)
  // ==========================================
  
  async getLinhas(): Promise<Linha[]> {
    // Dados simulados até o backend implementar
    return [
      {
        id: 1,
        numero: '001',
        descricao: 'Terminal Rodoviário - Asa Norte',
        garagem: '004',
        garagemNome: 'VIAÇÃO PIONEIRA',
        tipoLinha: 'URBANA',
        status: 'ATIVA',
        origem: 'Terminal Rodoviário',
        destino: 'Asa Norte',
        extensaoKm: 25.5,
        tempoViagemMinutos: 45,
        tarifa: 4.50,
        receitaEstimadaDia: 2500,
        veiculosNecessarios: 8,
        passageirosDia: 1200
      },
      {
        id: 2,
        numero: '031',
        descricao: 'Paranoá - Plano Piloto',
        garagem: '031',
        garagemNome: 'PARANOÁ',
        tipoLinha: 'URBANA',
        status: 'ATIVA',
        origem: 'Paranoá',
        destino: 'Plano Piloto',
        extensaoKm: 35.2,
        tempoViagemMinutos: 60,
        tarifa: 4.50,
        receitaEstimadaDia: 3200,
        veiculosNecessarios: 12,
        passageirosDia: 1800
      }
    ];
  },

  async getLinhaByNumero(numero: string): Promise<Linha> {
    const linhas = await this.getLinhas();
    const linha = linhas.find(l => l.numero === numero);
    if (!linha) throw new Error('Linha não encontrada');
    return linha;
  },

  // ==========================================
  // 📈 ESTATÍSTICAS (SIMULADAS - não existem no backend)
  // ==========================================
  
  async getEstatisticas(): Promise<EstatisticasOperacoes[]> {
    // Dados simulados até o backend implementar
    const hoje = new Date();
    return [
      {
        id: 1,
        data: hoje.toISOString(),
        ano: hoje.getFullYear(),
        mes: hoje.getMonth() + 1,
        garagem: 'TODAS',
        totalVeiculos: 150,
        veiculosAtivos: 135,
        veiculosInativos: 15,
        totalAcidentes: 8,
        acidentesComVitimas: 2,
        acidentesSemVitimas: 6,
        valorTotalDanos: 45000,
        indiceSinistralidade: 5.9,
        custoMedioAcidente: 5625,
        eficienciaOperacional: 94.1,
        percentualDisponibilidade: 90.0
      }
    ];
  },

  async getEstatisticasByPeriodo(ano: number, mes?: number): Promise<EstatisticasOperacoes[]> {
    const estatisticas = await this.getEstatisticas();
    return estatisticas.filter(e => e.ano === ano && (!mes || e.mes === mes));
  },

  // ==========================================
  // 🔄 SINCRONIZAÇÃO
  // ==========================================
  
  async sincronizarTudo(params?: {
    dataInicio?: string;
    dataFim?: string;
    forcarSincronizacao?: boolean;
  }): Promise<{
    sucesso: boolean;
    frota?: any;
    acidentes?: any;
    resumo?: any;
    erro?: string;
    timestamp: Date;
  }> {
    const response = await api.post('/departamentos/operacoes/sincronizar-tudo', {}, { params });
    return response.data;
  },

  async sincronizarFrotaCompleta(data?: string): Promise<any> {
    const response = await api.post('/departamentos/operacoes/frota/sincronizar', {}, {
      params: { data }
    });
    return response.data;
  },

  async sincronizarAcidentesCompleto(params?: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<any> {
    const response = await api.post('/departamentos/operacoes/acidentes/sincronizar', {}, { params });
    return response.data;
  },

  // ==========================================
  // 📊 ANALYTICS
  // ==========================================
  
  async getAnalytics(): Promise<{
    eficiencia: any;
    sinistralidade: any;
    disponibilidade: any;
    custos: any;
  }> {
    try {
      // Tentar buscar dados reais do dashboard
      const dashboard = await this.getDashboard();
      
      return {
        eficiencia: {
          operacional: dashboard?.resumo?.kpis?.eficienciaOperacional || 85.5,
          combustivel: 12.5,
          manutencao: 92.3
        },
        sinistralidade: {
          indice: dashboard?.resumo?.kpis?.indiceSinistralidade || 5.9,
          tendencia: 'ESTÁVEL',
          meta: 8.0
        },
        disponibilidade: {
          frota: dashboard?.resumo?.kpis?.percentualDisponibilidade || 90.0,
          garagens: dashboard?.distribuicoes?.frotaPorGaragem || [],
          historico: []
        },
        custos: {
          medioAcidente: dashboard?.resumo?.kpis?.custoMedioAcidente || 5625,
          totalDanos: dashboard?.resumo?.acidentes?.valorTotalDanos || 45000,
          manutencao: 125000
        }
      };
    } catch (error) {
      console.warn('⚠️ Erro ao buscar analytics reais, usando dados simulados:', error);
      
      // Fallback para dados simulados
      return {
        eficiencia: {
          operacional: 85.5,
          combustivel: 12.5,
          manutencao: 92.3
        },
        sinistralidade: {
          indice: 5.9,
          tendencia: 'ESTÁVEL',
          meta: 8.0
        },
        disponibilidade: {
          frota: 90.0,
          garagens: [],
          historico: []
        },
        custos: {
          medioAcidente: 5625,
          totalDanos: 45000,
          manutencao: 125000
        }
      };
    }
  }
};
