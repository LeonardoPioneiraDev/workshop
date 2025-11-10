// apps/frontend/src/services/departments/legal/multasHistoricoSetorService.ts - VERSÃO CORRIGIDA
import { apiClient } from '../../api/client';

export interface SetorInfo {
  prefixoVeiculo: string;
  codigoGaragem: number;
  nomeGaragem: string;
  dataInicio: string;
  dataFim: string | null;
  periodoAtivo: boolean;
}

export interface MultaComHistoricoSetor {
  // Dados principais da multa
  numeroAiMulta: string;
  descricaoInfra: string;
  prefixoVeic: string;
  codIntFunc?: string;
  codigoVeic?: string;
  codigoInfra?: string;
  dataEmissaoMulta?: string;
  localMulta?: string;
  dataHoraMulta?: string;
  dataVectoMulta?: string;
  valorMulta?: string;
  valorTotalMulta?: string;
  dataPagtoMulta?: string;
  responsavelMulta?: string;
  numeroRecursoMulta?: string;
  dataRecursoMulta?: string;
  condicaoRecursoMulta?: string;
  valorPago?: string;
  pontuacaoInfracao?: number;
  grupoInfracao?: string;
  agenteCodigo?: string;
  agenteDescricao?: string;
  agenteMatriculaFiscal?: string;
  codigoEmpresa?: number;
  createdAt?: string;
  updatedAt?: string;
  sincronizadoEm?: string;

  // Informações de setor com histórico
  setorNaDataInfracao?: SetorInfo | null;
  setorAtual?: {
    codigoGaragem: number;
    nomeGaragem: string;
  } | null;
  setorMudou?: boolean;
  setorEncontrado?: boolean;

  // Campos calculados para melhor exibição
  statusPagamento?: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'RECURSO';
  diasParaVencimento?: number;
  valorFormatado?: string;
  dataInfracaoFormatada?: string;
  dataVencimentoFormatada?: string;
  tempoNoSetor?: string;
  alertaDefesa?: boolean;
}

export interface MultasHistoricoSetorFilter {
  setorCodigo?: number;
  setorNome?: string;
  dataInicio?: string;
  dataFim?: string;
  prefixoVeic?: string;
  numeroAiMulta?: string;
  responsavelMulta?: 'F' | 'E' | 'TODOS';
  statusPagamento?: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'RECURSO' | 'TODOS';
  setorMudou?: boolean;
  apenasComMudanca?: boolean;
  grupoInfracao?: 'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA' | 'TODOS';
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface MultasHistoricoSetorResponse {
  success: boolean;
  message: string;
  data: MultaComHistoricoSetor[];
  resumo: {
    totalMultas: number;
    multasComSetor: number;
    multasSemSetor: number;
    multasComMudancaSetor: number;
    percentualMapeamento: number;
    percentualMudancas: number;
  };
  estatisticasPorSetor: Array<{
    setor: {
      codigo: number;
      nome: string;
    };
    totalMultas: number;
    valorTotal: number;
    multasComMudanca: number;
    percentualDoTotal: number;
  }>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
  executionTime: string;
  endpoint: string;
}

export interface EstatisticasHistoricoSetor {
  veiculosComHistorico: number;
  totalMudancasRegistradas: number;
  setoresAtivos: number;
  ultimaSincronizacao: string;
  coberturaMapeamento: number;
}

class MultasHistoricoSetorService {
  private baseUrl = '/juridico/historico-setores';

  async buscarMultasComHistorico(filters: MultasHistoricoSetorFilter = {}): Promise<MultasHistoricoSetorResponse> {
    console.log('🔍 Buscando multas com histórico de setores:', filters);
    
    try {
      const queryParams: Record<string, any> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams[key] = value;
        }
      });

      const response = await apiClient.get<MultasHistoricoSetorResponse>(
        `${this.baseUrl}/multas-historico`, 
        queryParams
      );
      
      // ✅ VALIDAÇÃO MELHORADA DA RESPOSTA
      if (!response || typeof response !== 'object') {
        throw new Error('Resposta inválida do servidor');
      }

      // ✅ VALIDAÇÃO DOS DADOS
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('⚠️ Dados de setores não encontrados ou inválidos:', response);
        return {
          success: false,
          message: 'Dados de setores não encontrados',
          data: [],
          resumo: {
            totalMultas: 0,
            multasComSetor: 0,
            multasSemSetor: 0,
            multasComMudancaSetor: 0,
            percentualMapeamento: 0,
            percentualMudancas: 0
          },
          estatisticasPorSetor: [],
          timestamp: new Date().toISOString(),
          executionTime: '0ms',
          endpoint: this.baseUrl
        };
      }

      // ✅ ENRIQUECER DADOS COM VALIDAÇÃO SEGURA
      const dadosEnriquecidos = response.data.map(multa => {
        try {
          return this.enriquecerMulta(multa);
        } catch (error) {
          console.warn('⚠️ Erro ao enriquecer multa:', multa.numeroAiMulta, error);
          // Retornar multa original em caso de erro
          return {
            ...multa,
            statusPagamento: 'PENDENTE' as const,
            diasParaVencimento: 0,
            valorFormatado: this.formatCurrency(parseFloat(multa.valorMulta || '0')),
            dataInfracaoFormatada: this.formatDate(multa.dataHoraMulta),
            dataVencimentoFormatada: this.formatDate(multa.dataVectoMulta),
            tempoNoSetor: 'N/A',
            alertaDefesa: false
          };
        }
      });

      return {
        ...response,
        data: dadosEnriquecidos
      };
    } catch (error) {
      console.error('❌ Erro ao buscar multas com histórico de setores:', error);
      throw error;
    }
  }

  async obterEstatisticas(): Promise<{ success: boolean; data: EstatisticasHistoricoSetor }> {
    console.log('📊 Obtendo estatísticas de histórico de setores...');
    try {
      const response = await apiClient.get<{ success: boolean; data: EstatisticasHistoricoSetor }>(
        `${this.baseUrl}/estatisticas`
      );
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        success: false,
        data: {
          veiculosComHistorico: 0,
          totalMudancasRegistradas: 0,
          setoresAtivos: 0,
          ultimaSincronizacao: new Date().toISOString(),
          coberturaMapeamento: 0
        }
      };
    }
  }

  async obterHistoricoVeiculo(prefixo: string): Promise<{ success: boolean; data: SetorInfo[] }> {
    console.log('🚗 Obtendo histórico do veículo:', prefixo);
    try {
      const response = await apiClient.get<{ success: boolean; data: SetorInfo[] }>(
        `${this.baseUrl}/veiculo/${prefixo}`
      );
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter histórico do veículo:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  async obterRelatorioMudancas(filters: MultasHistoricoSetorFilter = {}): Promise<{
    success: boolean;
    data: {
      mudancasRecentes: Array<{
        prefixoVeiculo: string;
        setorAnterior: string;
        setorNovo: string;
        dataMudanca: string;
        multasAfetadas: number;
      }>;
      impactoFinanceiro: {
        valorTotalAfetado: number;
        multasReclassificadas: number;
      };
    };
  }> {
    console.log('📋 Obtendo relatório de mudanças:', filters);
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/relatorio-mudancas`,
        filters
      );
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter relatório de mudanças:', error);
      return {
        success: false,
        data: {
          mudancasRecentes: [],
          impactoFinanceiro: {
            valorTotalAfetado: 0,
            multasReclassificadas: 0
          }
        }
      };
    }
  }

  // ✅ MÉTODO ENRIQUECER MULTA CORRIGIDO COM VALIDAÇÕES ROBUSTAS
  private enriquecerMulta(multa: MultaComHistoricoSetor): MultaComHistoricoSetor {
    try {
      const agora = new Date();
      
      // ✅ VALIDAÇÃO SEGURA DA DATA DE VENCIMENTO
      let dataVencimento: Date | null = null;
      if (multa.dataVectoMulta) {
        try {
          dataVencimento = new Date(multa.dataVectoMulta);
          if (isNaN(dataVencimento.getTime())) {
            dataVencimento = null;
          }
        } catch {
          dataVencimento = null;
        }
      }

      // ✅ VALIDAÇÃO SEGURA DA DATA DE INFRAÇÃO
      let dataInfracao: Date | null = null;
      if (multa.dataHoraMulta) {
        try {
          dataInfracao = new Date(multa.dataHoraMulta);
          if (isNaN(dataInfracao.getTime())) {
            dataInfracao = null;
          }
        } catch {
          dataInfracao = null;
        }
      }
      
      // Status de pagamento
      let statusPagamento: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'RECURSO' = 'PENDENTE';
      
      if (multa.dataPagtoMulta) {
        statusPagamento = 'PAGO';
      } else if (multa.numeroRecursoMulta) {
        statusPagamento = 'RECURSO';
      } else if (dataVencimento && dataVencimento < agora) {
        statusPagamento = 'VENCIDO';
      }

      // Dias para vencimento
      let diasParaVencimento = 0;
      if (dataVencimento && statusPagamento === 'PENDENTE') {
        diasParaVencimento = Math.ceil((dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Alerta de defesa (15 dias antes do vencimento)
      const alertaDefesa = diasParaVencimento > 0 && diasParaVencimento <= 15;

      // ✅ CÁLCULO SEGURO DO TEMPO NO SETOR
      let tempoNoSetor = 'N/A';
      
      // Verificar se setorNaDataInfracao existe e tem as propriedades necessárias
      if (multa.setorNaDataInfracao && 
          multa.setorNaDataInfracao.dataInicio && 
          typeof multa.setorNaDataInfracao.dataInicio === 'string') {
        
        try {
          const dataInicio = new Date(multa.setorNaDataInfracao.dataInicio);
          
          if (!isNaN(dataInicio.getTime())) {
            const dataFim = multa.setorNaDataInfracao.dataFim ? 
              new Date(multa.setorNaDataInfracao.dataFim) : agora;
            
            if (!isNaN(dataFim.getTime())) {
              const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays > 365) {
                tempoNoSetor = `${Math.floor(diffDays / 365)} ano(s)`;
              } else if (diffDays > 30) {
                tempoNoSetor = `${Math.floor(diffDays / 30)} mês(es)`;
              } else {
                tempoNoSetor = `${diffDays} dia(s)`;
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao calcular tempo no setor para multa:', multa.numeroAiMulta, error);
          tempoNoSetor = 'Erro no cálculo';
        }
      }

      return {
        ...multa,
        statusPagamento,
        diasParaVencimento,
        valorFormatado: this.formatCurrency(parseFloat(multa.valorMulta || '0')),
        dataInfracaoFormatada: this.formatDate(multa.dataHoraMulta),
        dataVencimentoFormatada: this.formatDate(multa.dataVectoMulta),
        tempoNoSetor,
        alertaDefesa
      };
    } catch (error) {
      console.error('❌ Erro crítico ao enriquecer multa:', multa.numeroAiMulta, error);
      
      // ✅ FALLBACK SEGURO EM CASO DE ERRO
      return {
        ...multa,
        statusPagamento: 'PENDENTE',
        diasParaVencimento: 0,
        valorFormatado: this.formatCurrency(parseFloat(multa.valorMulta || '0')),
        dataInfracaoFormatada: this.formatDate(multa.dataHoraMulta),
        dataVencimentoFormatada: this.formatDate(multa.dataVectoMulta),
        tempoNoSetor: 'N/A',
        alertaDefesa: false
      };
    }
  }

  // ✅ UTILITÁRIOS COM VALIDAÇÃO MELHORADA
  formatCurrency(value: number): string {
    try {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'R$ 0,00';
      }
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } catch {
      return 'R$ 0,00';
    }
  }

  formatDate(date: string | undefined): string {
    if (!date || typeof date !== 'string') return 'N/A';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Data Inválida';
      return parsedDate.toLocaleDateString('pt-BR');
    } catch {
      return 'Data Inválida';
    }
  }

  formatDateTime(date: string | undefined): string {
    if (!date || typeof date !== 'string') return 'N/A';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Data Inválida';
      return parsedDate.toLocaleString('pt-BR');
    } catch {
      return 'Data Inválida';
    }
  }

  // ✅ MÉTODOS DE UTILIDADE MANTIDOS
  obterCorPorSetor(codigoSetor: number): string {
    const cores: { [key: number]: string } = {
      31: '#3B82F6',   // PARANOÁ - Azul
      124: '#10B981',  // SANTA MARIA - Verde
      239: '#F59E0B',  // SÃO SEBASTIÃO - Amarelo
      240: '#EF4444',  // GAMA - Vermelho
    };
    return cores[codigoSetor] || '#6B7280';
  }

  obterCorPorStatus(status: string): string {
    const cores: { [key: string]: string } = {
      'PAGO': '#10B981',      // Verde
      'PENDENTE': '#3B82F6',  // Azul
      'VENCIDO': '#EF4444',   // Vermelho
      'RECURSO': '#F59E0B',   // Amarelo
    };
    return cores[status] || '#6B7280';
  }

  obterCorPorGravidade(gravidade: string): string {
    const cores: { [key: string]: string } = {
      'LEVE': '#10B981',        // Verde
      'MEDIA': '#F59E0B',       // Amarelo
      'GRAVE': '#F97316',       // Laranja
      'GRAVISSIMA': '#EF4444',  // Vermelho
    };
    return cores[gravidade] || '#6B7280';
  }

  obterIconePorStatus(status: string): string {
    const icones: { [key: string]: string } = {
      'PAGO': '✅',
      'PENDENTE': '⏳',
      'VENCIDO': '❌',
      'RECURSO': '⚖️',
    };
    return icones[status] || '❓';
  }

  obterDescricaoStatus(status: string): string {
    const descricoes: { [key: string]: string } = {
      'PAGO': 'Multa quitada',
      'PENDENTE': 'Aguardando pagamento',
      'VENCIDO': 'Prazo de pagamento vencido',
      'RECURSO': 'Em processo de recurso',
    };
    return descricoes[status] || 'Status indefinido';
  }
}

export const multasHistoricoSetorService = new MultasHistoricoSetorService();
export default multasHistoricoSetorService;