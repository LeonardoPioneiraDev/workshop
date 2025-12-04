import { api } from '../../api';

export interface FuncionarioCompleto {
  id: number;
  valeRefeicao: string;
  dataTransferencia: string | null;
  empresa: number;
  codintFunc: number;
  cracha: number;
  chapa: string;
  nome: string;
  mae: string | null;
  cpf: string;
  funcao: string;
  departamento: string;
  area: string;
  secao: string | null;
  setor: string | null;
  endereco: string | null;
  casa: string | null;
  bairro: string | null;
  cidade: string;
  foneFunc: string | null;
  fone2Func: string | null;
  dataAdmissao: string;
  situacao: string;
  situacaoDescricao: string;
  salBase: string;
  salAux1: string;
  salAux2: string;
  salarioTotal: string;
  dtCompetQuita: string | null;
  idQuita: number | null;
  dtDesligQuita: string | null;
  idade: number;
  tempoEmpresaDias: number;
  tempoEmpresaAnos: string;
  temQuitacao: boolean;
  ativo: boolean;
  mesReferencia: string;
  createdAt: string;
  updatedAt: string;
  sincronizadoEm: string;
}

export interface FuncionariosCompletosResponse {
  success: boolean;
  message: string;
  data: FuncionarioCompleto[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FuncionariosCompletosFilters {
  situacao?: string;
  departamento?: string;
  funcao?: string;
  ativo?: boolean;
  dataAdmissaoInicio?: string;
  dataAdmissaoFim?: string;
  page?: number;
  limit?: number;
  search?: string;
}

class FuncionariosCompletosService {
  private baseUrl = '/departamentos/pessoal/funcionarios-completos';

  async getFuncionariosCompletos(filters?: FuncionariosCompletosFilters): Promise<FuncionariosCompletosResponse> {
    try {
      console.log('🌐 Buscando funcionários completos com filtros:', filters);
      
      const response = await api.get<FuncionariosCompletosResponse>(this.baseUrl, filters);
      
      console.log('📡 Resposta recebida:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários completos:', error);
      throw error;
    }
  }

  async getFuncionarioById(id: number): Promise<FuncionarioCompleto> {
    try {
      const response = await api.get<{ success: boolean; data: FuncionarioCompleto }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar funcionário:', error);
      throw error;
    }
  }

  async exportFuncionarios(filters?: FuncionariosCompletosFilters, format: 'excel' | 'pdf' = 'excel') {
    try {
      const params = { ...filters, export: format };
      const base = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:3333';
      const baseClean = String(base).replace(/\/$/, '');
      const qs = new URLSearchParams(params as any).toString();
      const url = `${baseClean}${this.baseUrl}/export?${qs}`;
      console.debug('[FuncionariosCompletosService] Export URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `funcionarios-completos.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Erro ao exportar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao exportar funcionários:', error);
      throw error;
    }
  }
}

export const funcionariosCompletosService = new FuncionariosCompletosService();
