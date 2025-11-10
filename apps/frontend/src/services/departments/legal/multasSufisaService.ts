// src/services/departments/legal/multasSufisaService.ts
import { api } from '@/services/api/client';

export interface MultaSufisa {
  numeroAiMulta: string;
  prefixoVeic: string;
  agenteCodigo: string;
  agenteDescricao?: string;
  dataHoraMulta: string;
  localMulta?: string;
  descricaoInfra?: string;
  codigoInfracao?: string;
  valorMulta: number;
  pontuacaoInfracao?: number;
  grupoInfracao?: string;
  cidadeMulta?: string;
  placaVeiculo?: string;
  categoriaVeiculo?: string;
  dataVectoMulta?: string;
  dataPagtoMulta?: string;
  valorPago?: number;
  condicaoRecursoMulta?: string;
  setorAtual?: string;
}

export interface MultasSufisaFilters {
  ano?: string;
  mes?: string;
  cidade?: string;
  agenteCodigo?: string;
  dataInicio?: string;
  dataFim?: string;
  numeroMulta?: string;
  prefixoVeiculo?: string;
  localMulta?: string;
  valorMin?: string;
  valorMax?: string;
}

export interface MultasSufisaResponse {
  success: boolean;
  data: MultaSufisa[];
  message?: string;
  total?: number;
}

export interface SufisaStats {
  totalMultas: number;
  totalValor: number;
  agentesUnicos: number;
  veiculosUnicos: number;
  locaisUnicos: number;
  valorMedio: number;
  multasPorMes: Record<string, number>;
  multasPorCidade: Record<string, number>;
  multasPorAgente: Record<string, { quantidade: number; valor: number; descricao: string }>;
}

class MultasSufisaService {
  private baseUrl = '/juridico/multas-completas';

  // Função para identificar se é multa SUFISA (mesmo critério do SEMOB)
  private isMultaSufisa(multa: any): boolean {
    const temAgente = multa.agenteCodigo && multa.agenteCodigo.trim() !== '';
    const temPontos = multa.pontuacaoInfracao && multa.pontuacaoInfracao > 0;
    const temGrupo = multa.grupoInfracao && multa.grupoInfracao.trim() !== '';
    
    // Se tem agente E não tem pontos E não tem grupo, é SUFISA
    if (temAgente && !temPontos && !temGrupo) {
      return true;
    }
    
    // Se tem agente mas também tem pontos/grupo, é trânsito
    if (temAgente && (temPontos || temGrupo)) {
      return false;
    }
    
    // Default: se tem agente, considera SUFISA
    return temAgente;
  }

  async buscarMultasSufisa(filters: MultasSufisaFilters = {}): Promise<MultasSufisaResponse> {
    try {
      const params = new URLSearchParams({
        limit: '10000',
        orderBy: 'dataHoraMulta',
        orderDirection: 'DESC'
      });

      // Adicionar filtros válidos
      if (filters.numeroMulta) params.append('numeroAiMulta', filters.numeroMulta);
      if (filters.prefixoVeiculo) params.append('prefixoVeic', filters.prefixoVeiculo);
      if (filters.localMulta) params.append('localMulta', filters.localMulta);
      if (filters.agenteCodigo) params.append('agenteCodigo', filters.agenteCodigo);

      const response = await api.get(`${this.baseUrl}?${params}`);
      
      if (response.data.success) {
        // Filtrar apenas multas SUFISA
        let multasSufisa = response.data.data.filter(this.isMultaSufisa);
        
        // Aplicar filtros localmente
        if (filters.dataInicio) {
          const dataInicio = new Date(filters.dataInicio);
          multasSufisa = multasSufisa.filter(m => new Date(m.dataHoraMulta) >= dataInicio);
        }
        
        if (filters.dataFim) {
          const dataFim = new Date(filters.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          multasSufisa = multasSufisa.filter(m => new Date(m.dataHoraMulta) <= dataFim);
        }
        
        if (filters.ano) {
          multasSufisa = multasSufisa.filter(m => 
            new Date(m.dataHoraMulta).getFullYear().toString() === filters.ano
          );
        }
        
        if (filters.mes) {
          multasSufisa = multasSufisa.filter(m => 
            (new Date(m.dataHoraMulta).getMonth() + 1).toString().padStart(2, '0') === filters.mes
          );
        }
        
        if (filters.cidade) {
          multasSufisa = multasSufisa.filter(m => 
            m.cidadeMulta?.toUpperCase().includes(filters.cidade.toUpperCase())
          );
        }
        
        if (filters.valorMin) {
          multasSufisa = multasSufisa.filter(m => 
            parseFloat(m.valorMulta || 0) >= parseFloat(filters.valorMin)
          );
        }
        
        if (filters.valorMax) {
          multasSufisa = multasSufisa.filter(m => 
            parseFloat(m.valorMulta || 0) <= parseFloat(filters.valorMax)
          );
        }
        
        return {
          success: true,
          data: multasSufisa,
          total: multasSufisa.length
        };
      } else {
        throw new Error(response.data.message || 'Erro ao buscar multas SUFISA');
      }
    } catch (error) {
      console.error('Erro no serviço de multas SUFISA:', error);
      throw error;
    }
  }

  async obterEstatisticasSufisa(filters: MultasSufisaFilters = {}): Promise<SufisaStats> {
    try {
      const response = await this.buscarMultasSufisa(filters);
      const multas = response.data;

      const totalValor = multas.reduce((sum, multa) => sum + parseFloat(multa.valorMulta || 0), 0);
      const agentesUnicos = new Set(multas.map(m => m.agenteCodigo)).size;
      const veiculosUnicos = new Set(multas.map(m => m.prefixoVeic)).size;
      const locaisUnicos = new Set(multas.map(m => m.localMulta)).size;

      // Multas por mês
      const multasPorMes: Record<string, number> = {};
      multas.forEach(multa => {
        const data = new Date(multa.dataHoraMulta);
        const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        multasPorMes[mesAno] = (multasPorMes[mesAno] || 0) + 1;
      });

      // Multas por cidade
      const multasPorCidade: Record<string, number> = {};
      multas.forEach(multa => {
        const cidade = multa.cidadeMulta || 'Não Informado';
        multasPorCidade[cidade] = (multasPorCidade[cidade] || 0) + 1;
      });

      // Multas por agente
      const multasPorAgente: Record<string, { quantidade: number; valor: number; descricao: string }> = {};
      multas.forEach(multa => {
        const agente = multa.agenteCodigo || 'Não Informado';
        if (!multasPorAgente[agente]) {
          multasPorAgente[agente] = {
            quantidade: 0,
            valor: 0,
            descricao: multa.agenteDescricao || 'Sem descrição'
          };
        }
        multasPorAgente[agente].quantidade += 1;
        multasPorAgente[agente].valor += parseFloat(multa.valorMulta || 0);
      });

      return {
        totalMultas: multas.length,
        totalValor,
        agentesUnicos,
        veiculosUnicos,
        locaisUnicos,
        valorMedio: multas.length > 0 ? totalValor / multas.length : 0,
        multasPorMes,
        multasPorCidade,
        multasPorAgente
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas SUFISA:', error);
      throw error;
    }
  }

  async buscarAgentesSufisa(): Promise<Array<{ codigo: string; descricao: string; total: number; valorTotal: number }>> {
    try {
      const response = await this.buscarMultasSufisa();
      const multas = response.data;

      const agentesMap: Record<string, { codigo: string; descricao: string; total: number; valorTotal: number }> = {};

      multas.forEach(multa => {
        const codigo = multa.agenteCodigo || 'Não Informado';
        if (!agentesMap[codigo]) {
          agentesMap[codigo] = {
            codigo,
            descricao: multa.agenteDescricao || 'Sem descrição',
            total: 0,
            valorTotal: 0
          };
        }
        agentesMap[codigo].total += 1;
        agentesMap[codigo].valorTotal += parseFloat(multa.valorMulta || 0);
      });

      return Object.values(agentesMap).sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Erro ao buscar agentes SUFISA:', error);
      throw error;
    }
  }

  async exportarDadosSufisa(filters: MultasSufisaFilters = {}, formato: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<Blob> {
    try {
      const response = await this.buscarMultasSufisa(filters);
      const multas = response.data;

      if (formato === 'excel') {
        // Implementar exportação Excel específica para SUFISA
        const XLSX = await import('xlsx');
        
        const dadosExcel = multas.map(multa => ({
          'Número da Multa': multa.numeroAiMulta,
          'Prefixo do Veículo': multa.prefixoVeic,
          'Agente SUFISA': multa.agenteCodigo,
          'Descrição do Agente': multa.agenteDescricao || 'Não informado',
          'Data/Hora da Infração': new Date(multa.dataHoraMulta).toLocaleString('pt-BR'),
          'Local da Multa': multa.localMulta || 'Não informado',
          'Descrição da Infração': multa.descricaoInfra || 'Não informado',
          'Código da Infração': multa.codigoInfracao || 'Não informado',
          'Valor da Multa (R$)': parseFloat(multa.valorMulta || 0),
          'Cidade': multa.cidadeMulta || 'Não informado',
          'Status': multa.dataPagtoMulta ? 'Pago' : 'Pendente',
          'Tipo': 'Multa SUFISA'
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Multas SUFISA');
        
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }

      throw new Error(`Formato ${formato} não implementado`);
    } catch (error) {
      console.error('Erro ao exportar dados SUFISA:', error);
      throw error;
    }
  }
}

export const multasSufisaService = new MultasSufisaService();
export default multasSufisaService;