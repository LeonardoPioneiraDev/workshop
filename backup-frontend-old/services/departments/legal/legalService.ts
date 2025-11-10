// apps/frontend/src/services/departments/legal/legalService.ts - COMPLETO ATUALIZADO
import { apiClient } from '../../api/client';
import { fineAdapter, processAdapter, contractAdapter } from './adapters';
import {
  LegalDashboardResponse,
  LegalProcess,
  LegalContract,
  Fine,
  CacheInfo,
  ApiResponse,
  FineFilters,
  ProcessFilters,
  ContractFilters
} from './types';

class LegalService {
  private readonly baseUrl = '/departamentos/juridico';

  // Dashboard
  async getDashboard(): Promise<LegalDashboardResponse> {
    const response = await apiClient.get<LegalDashboardResponse>(`${this.baseUrl}/dashboard`);
    return response; // Dashboard já retorna dados formatados diretamente
  }

  // Processos
  async getProcesses(filters?: ProcessFilters): Promise<ApiResponse<LegalProcess[]>> {
    // ✅ Alterar o tipo genérico para o que o backend de fato retorna antes da adaptação
    const apiResponse = await apiClient.get<ApiResponse<{ processos: any[]; total: number; resumo: any; }>>(`${this.baseUrl}/processos`, filters);
    
    if (apiResponse.success && apiResponse.data?.processos) {
      apiResponse.data.processos = processAdapter.normalizeArray(apiResponse.data.processos);
      // ✅ Renomear o 'data' para 'data.processos' para o hook consumir corretamente
      (apiResponse.data as any) = apiResponse.data.processos; // Sobrescreve o objeto data com o array de processos
      apiResponse.count = apiResponse.data.total; // Atualiza o count
    } else {
      apiResponse.data = []; // Garante que data seja um array vazio se não houver processos
      apiResponse.count = 0;
    }
    return (apiResponse as ApiResponse<LegalProcess[]>); // Retorna com o tipo corrigido
  }

  // Contratos
  async getContracts(filters?: ContractFilters): Promise<ApiResponse<LegalContract[]>> {
    // ✅ Alterar o tipo genérico para o que o backend de fato retorna antes da adaptação
    const apiResponse = await apiClient.get<ApiResponse<{ contratos: any[]; total: number; }>>(`${this.baseUrl}/contratos`, filters);
    
    if (apiResponse.success && apiResponse.data?.contratos) {
      apiResponse.data.contratos = contractAdapter.normalizeArray(apiResponse.data.contratos);
      // ✅ Renomear o 'data' para 'data.contratos' para o hook consumir corretamente
      (apiResponse.data as any) = apiResponse.data.contratos; // Sobrescreve o objeto data com o array de contratos
      apiResponse.count = apiResponse.data.total; // Atualiza o count
    } else {
      apiResponse.data = []; // Garante que data seja um array vazio se não houver contratos
      apiResponse.count = 0;
    }
    return (apiResponse as ApiResponse<LegalContract[]>); // Retorna com o tipo corrigido
  }

  // ✅ OTIMIZADO: Método específico para analytics com filtros inteligentes
  async getAnalyticsData(filters?: FineFilters): Promise<ApiResponse<Fine[]>> {
    // ✅ Alterar o tipo genérico para o que o backend de fato retorna antes da adaptação
    const apiResponse = await apiClient.get<ApiResponse<{ multas: any[]; total: number; }>>(`${this.baseUrl}/multas`, filters);
    
    if (apiResponse.success && apiResponse.data?.multas) {
      apiResponse.data.multas = fineAdapter.normalizeArray(apiResponse.data.multas);
      // ✅ Renomear o 'data' para 'data.multas' para o hook consumir corretamente
      (apiResponse.data as any) = apiResponse.data.multas; // Sobrescreve o objeto data com o array de multas
      apiResponse.count = apiResponse.data.total; // Atualiza o count
    } else {
      apiResponse.data = []; // Garante que data seja um array vazio se não houver multas
      apiResponse.count = 0;
    }
    return (apiResponse as ApiResponse<Fine[]>); // Retorna com o tipo corrigido
  }

  // ✅ NOVO: Método para obter multas com paginação
  async getFinesWithPagination(filters?: FineFilters): Promise<ApiResponse<Fine[]>> {
    // ✅ Alterar o tipo genérico para o que o backend de fato retorna antes da adaptação
    const apiResponse = await apiClient.get<ApiResponse<{ multas: any[]; total: number; }>>(`${this.baseUrl}/multas`, filters);
    
    if (apiResponse.success && apiResponse.data?.multas) {
      apiResponse.data.multas = fineAdapter.normalizeArray(apiResponse.data.multas);
      // ✅ Renomear o 'data' para 'data.multas' para o hook consumir corretamente
      (apiResponse.data as any) = apiResponse.data.multas; // Sobrescreve o objeto data com o array de multas
      apiResponse.count = apiResponse.data.total; // Atualiza o count
    } else {
      apiResponse.data = []; // Garante que data seja um array vazio se não houver multas
      apiResponse.count = 0;
    }
    return (apiResponse as ApiResponse<Fine[]>); // Retorna com o tipo corrigido
  }

  // ✅ NOVO: Método para obter detalhes de uma multa específica
  async getFineDetails(multaId: string): Promise<ApiResponse<Fine>> {
    const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/multas/${multaId}`);
    
    if (response.success && response.data) {
      response.data = fineAdapter.normalize(response.data);
    }
    
    return response;
  }

  // ✅ NOVO: Método para obter estatísticas rápidas
  async getQuickStats(filters?: {
    dataInicio?: string;
    dataFim?: string;
  }): Promise<ApiResponse<any>> {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/multas/estatisticas`, {
      dataInicio: filters?.dataInicio || primeiroDiaDoMes.toISOString().split('T')[0],
      dataFim: filters?.dataFim || ultimoDiaDoMes.toISOString().split('T')[0]
    });
    
    return response;
  }

  // ✅ NOVO: Método para exportar dados
  async exportFines(filters?: FineFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await apiClient.get<Blob>(`${this.baseUrl}/multas/export`, {
      ...filters,
      format
    }, {
      responseType: 'blob'
    });
    
    return response;
  }

  // ✅ Métodos existentes mantidos para compatibilidade
  // (getFines, getCompleteFines, getFinesByVehicle, getOverdueFines, getGroupedFines, getPeriodsComparison)
  // Recomendo consolidá-los e usar getAnalyticsData ou getFinesWithPagination com os filtros adequados.
  // Por simplicidade, vou manter getFines aqui mas ela será muito similar a getFinesWithPagination
  async getFines(filters?: FineFilters): Promise<ApiResponse<Fine[]>> {
    return this.getFinesWithPagination(filters);
  }

  async getCompleteFines(filters?: FineFilters): Promise<ApiResponse<Fine[]>> {
    return this.getAnalyticsData(filters);
  }

  // Estes métodos podem ser removidos ou adaptados para usar os mais genéricos acima,
  // pois o backend agora parece ter uma rota única para multas com filtros.
  async getFinesByVehicle(prefixo: string, limite?: number): Promise<ApiResponse<Fine[]>> {
    return this.getFinesWithPagination({ prefixoVeiculo: prefixo, limite });
  }

  async getOverdueFines(limite?: number): Promise<ApiResponse<Fine[]>> {
    return this.getFinesWithPagination({ statusMulta: 'VENCIDA', limite });
  }

  async getGroupedFines(params: { // Este endpoint ainda aponta para o dashboard principal
    agruparPor: 'mes' | 'ano' | 'garagem' | 'gravidade' | 'status';
    dataInicio?: string;
    dataFim?: string;
    ano?: string;
    garagem?: string;
  }): Promise<ApiResponse<any[]>> {
    // ✅ Usar o endpoint de analytics que existe
    const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/analytics/dashboard`, {
      periodo: params.dataInicio && params.dataFim ? 'PERSONALIZADO' : 'MES',
      garagem: params.garagem,
    });
    // ✅ Se o backend retorna rankings ou tendencias aqui, você precisaria adaptar.
    // Por enquanto, vou retornar a resposta bruta.
    return response;
  }

  async getPeriodsComparison(params: { // Este endpoint ainda aponta para o dashboard principal
    periodos: string;
    metrica?: 'quantidade' | 'valor';
    garagem?: string;
  }): Promise<ApiResponse<any[]>> {
    // ✅ Usar o endpoint de analytics que existe
    const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/analytics/dashboard`, {
      periodo: 'COMPARACAO',
      garagem: params.garagem,
    });
    // ✅ Se o backend retorna rankings ou tendencias aqui, você precisaria adaptar.
    // Por enquanto, vou retornar a resposta bruta.
    return response;
  }

  async getCacheInfo(): Promise<CacheInfo> {
    try {
      const response = await apiClient.get<CacheInfo>(`${this.baseUrl}/cache/info`);
      return response;
    } catch (error) {
      console.warn('Cache info não disponível:', error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        message: 'Cache info não disponível',
        cache: {
          status: 'INDISPONÍVEL',
          tipo: 'UNKNOWN',
          campos: 'N/A',
          estrutura: {
            camposBasicos: 0,
            camposCompletos: 0,
            totalCampos: 0,
            incluiAgentes: false,
          },
          performance: {
            tempoMedioConsulta: 'N/A',
            economiaCache: 'N/A',
            hitRate: 'N/A',
          },
          totalRegistros: 0,
          ultimaAtualizacao: null,
          erro: 'Endpoint não disponível',
        },
        executionTime: '0ms',
      };
    }
  }

  // Utilitários
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  getStatusColor(status: string): string {
    const colors = {
      'PAGA': 'text-green-400',
      'VENCIDA': 'text-red-400',
      'PENDENTE': 'text-yellow-400',
      'VENCENDO_30_DIAS': 'text-orange-400',
      'ATIVO': 'text-blue-400',
      'CONCLUIDO': 'text-green-400',
      'SUSPENSO': 'text-red-400'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400';
  }

  getPriorityColor(priority: string): string {
    const colors = {
      'URGENTE': 'text-red-400',
      'ALTA': 'text-orange-400',
      'NORMAL': 'text-yellow-400',
      'QUITADA': 'text-green-400'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-400';
  }

  getGravityColor(gravity: string): string {
    const colors = {
      'LEVE': 'text-green-400',
      'MEDIA': 'text-yellow-400',
      'GRAVE': 'text-orange-400',
      'GRAVISSIMA': 'text-red-400'
    };
    return colors[gravity as keyof typeof colors] || 'text-gray-400';
  }
}

export const legalService = new LegalService();