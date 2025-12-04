// src/services/departments/pessoal/pessoalService.ts
import { apiClient } from '../../api/client';
import type { 
  FuncionarioCompleto, 
  DashboardPessoal, 
  FiltrosPessoal, 
  StatusCache,
  ApiResponse,
  DashboardFuncionariosCompletos
} from '../../../types/departments/pessoal';

const BASE_URL = '/departamentos/pessoal';

export class PessoalService {
  // Dashboard principal (antigo, que retorna apenas o dashboard)
  static async getDashboard(mesReferencia?: string, forcar?: boolean): Promise<DashboardPessoal> {
    const params = new URLSearchParams();
    if (mesReferencia) params.append('mesReferencia', mesReferencia);
    if (forcar) params.append('forcar', 'true');
    
    const response = await apiClient.get<ApiResponse<DashboardPessoal>>(
      `${BASE_URL}/dashboard?${params.toString()}`
    );
    return response.data.data;
  }

  // Dashboard comparativo
  static async getDashboardComparativo(dataReferencia?: string, forcar?: boolean): Promise<any> {
    const params = new URLSearchParams();
    if (dataReferencia) params.append('dataReferencia', dataReferencia);
    if (forcar) params.append('forcar', 'true');
    
    const response = await apiClient.get<ApiResponse<any>>(
      `${BASE_URL}/dashboard-comparativo?${params.toString()}`
    );
    return response.data.data;
  }

  // ✅ CORRIGIDO: Dashboard de funcionários completos - RETORNA ESTRUTURA COMPLETA
  static async getDashboardFuncionariosCompletos(mesReferencia?: string): Promise<ApiResponse<DashboardFuncionariosCompletos>> {
    try {
      const params = new URLSearchParams();
      if (mesReferencia) params.append('mesReferencia', mesReferencia);
      
      console.log('🌐 Fazendo requisição para dashboard:', `${BASE_URL}/funcionarios-completos/dashboard?${params.toString()}`);
      
      const response = await apiClient.get<ApiResponse<DashboardFuncionariosCompletos>>(
        `${BASE_URL}/funcionarios-completos/dashboard?${params.toString()}`
      );
      
      console.log('📡 Resposta recebida do servidor:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      // ✅ RETORNA A ESTRUTURA COMPLETA response.data (que já é ApiResponse)
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no serviço getDashboardFuncionariosCompletos:', error);
      
      // Retornar uma estrutura de erro padronizada
      return {
        success: false,
        message: error.message || 'Erro ao buscar dashboard de funcionários',
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ✅ CORRIGIDO: Funcionários completos com filtros - RETORNA ESTRUTURA COMPLETA
  static async getFuncionariosCompletos(filtros: FiltrosPessoal = {}): Promise<ApiResponse<FuncionarioCompleto[]>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      console.log('🌐 Fazendo requisição para funcionários completos:', `${BASE_URL}/funcionarios-completos?${params.toString()}`);

      const response = await apiClient.get<ApiResponse<FuncionarioCompleto[]>>(
        `${BASE_URL}/funcionarios-completos?${params.toString()}`
      );
      
      console.log('📡 Resposta recebida para funcionários completos:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      // ✅ RETORNA A ESTRUTURA COMPLETA response.data (que já é ApiResponse)
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no serviço getFuncionariosCompletos:', error);
      
      return {
        success: false,
        message: error.message || 'Erro ao buscar funcionários completos',
        data: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Busca avançada
  static async buscaAvancada(filtros: FiltrosPessoal): Promise<ApiResponse<FuncionarioCompleto[]>> {
    try {
      console.log('🔍 Fazendo busca avançada com filtros:', filtros);
      
      const response = await apiClient.post<ApiResponse<FuncionarioCompleto[]>>(
        `${BASE_URL}/funcionarios-completos/busca-avancada`,
        filtros
      );
      
      console.log('📡 Resposta da busca avançada:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro na busca avançada:', error);
      
      return {
        success: false,
        message: error.message || 'Erro na busca avançada',
        data: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Agrupamentos
  static async getAgrupamentos(
    tipo: 'departamento' | 'area' | 'cidade' | 'situacao' | 'faixaSalarial', 
    mesReferencia?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (mesReferencia) params.append('mesReferencia', mesReferencia);
      
      console.log('📊 Fazendo requisição para agrupamentos:', tipo);
      
      const response = await apiClient.get<ApiResponse<any>>(
        `${BASE_URL}/funcionarios-completos/agrupamentos/${tipo}?${params.toString()}`
      );
      
      console.log('📡 Resposta dos agrupamentos:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar agrupamentos:', error);
      throw error;
    }
  }

  // Status do cache
  static async getStatusCache(): Promise<ApiResponse<{ detalhes: StatusCache[] }>> {
    try {
      console.log('🗄️ Fazendo requisição para status do cache');
      
      const response = await apiClient.get<ApiResponse<{ detalhes: StatusCache[] }>>(
        `${BASE_URL}/status-cache`
      );
      
      console.log('�� Resposta do status do cache:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar status do cache:', error);
      
      return {
        success: false,
        message: error.message || 'Erro ao buscar status do cache',
        data: { detalhes: [] },
        timestamp: new Date().toISOString()
      };
    }
  }

  // Sincronizar dados
  static async sincronizar(mesReferencia?: string, forcar?: boolean): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (mesReferencia) params.append('mesReferencia', mesReferencia);
      if (forcar) params.append('forcar', 'true');
      
      console.log('🔄 Iniciando sincronização de dados');
      
      const response = await apiClient.post<ApiResponse<any>>(
        `${BASE_URL}/funcionarios-completos/sincronizar?${params.toString()}`
      );
      
      console.log('📡 Resposta da sincronização:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      
      return {
        success: false,
        message: error.message || 'Erro na sincronização',
        data: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Funcionário por crachá
  static async getFuncionarioPorCracha(cracha: number, mesReferencia?: string): Promise<ApiResponse<FuncionarioCompleto>> {
    try {
      const params = new URLSearchParams();
      if (mesReferencia) params.append('mesReferencia', mesReferencia);
      
      console.log('👤 Buscando funcionário por crachá:', cracha);
      
      const response = await apiClient.get<ApiResponse<FuncionarioCompleto>>(
        `${BASE_URL}/funcionarios-completos/cracha/${cracha}?${params.toString()}`
      );
      
      console.log('📊 Resposta do funcionário por crachá:', response.data);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar funcionário por crachá:', error);
      
      return {
        success: false,
        message: error.message || 'Funcionário não encontrado',
        data: null as any,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Métodos auxiliares permanecem iguais...
  static validateMesReferencia(mesReferencia: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(mesReferencia);
  }

  static getCurrentMesReferencia(): string {
    return new Date().toISOString().slice(0, 7);
  }

  static formatMesReferencia(date: Date): string {
    return date.toISOString().slice(0, 7);
  }

  static cleanFilters(filtros: FiltrosPessoal): FiltrosPessoal {
    const cleanedFilters: FiltrosPessoal = {};
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanedFilters[key as keyof FiltrosPessoal] = value;
      }
    });
    
    return cleanedFilters;
  }

  static buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.append(key, String(value));
      }
    });
    
    const queryString = urlParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  static async checkConnection(): Promise<boolean> {
    try {
      const response = await apiClient.get(`${BASE_URL}/status-cache`);
      return response.status === 200;
    } catch (error) {
      console.error('❌ Erro ao verificar conectividade:', error);
      return false;
    }
  }

  static async getEstatisticasRapidas(mesReferencia?: string): Promise<{
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosInativos: number;
    percentualAtivos: number;
  }> {
    try {
      const dashboard = await this.getDashboardFuncionariosCompletos(mesReferencia);
      
      if (dashboard.success && dashboard.data?.resumo) {
        const { totalFuncionarios, ativos } = dashboard.data.resumo;
        const inativos = totalFuncionarios - ativos;
        const percentualAtivos = totalFuncionarios > 0 ? (ativos / totalFuncionarios) * 100 : 0;
        
        return {
          totalFuncionarios,
          funcionariosAtivos: ativos,
          funcionariosInativos: inativos,
          percentualAtivos: Math.round(percentualAtivos * 100) / 100
        };
      }
      
      return {
        totalFuncionarios: 0,
        funcionariosAtivos: 0,
        funcionariosInativos: 0,
        percentualAtivos: 0
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas rápidas:', error);
      return {
        totalFuncionarios: 0,
        funcionariosAtivos: 0,
        funcionariosInativos: 0,
        percentualAtivos: 0
      };
    }
  }
}