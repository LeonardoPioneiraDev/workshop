// apps/frontend/src/services/departments/legal/multasCompletasService.ts - COMPLETO E AJUSTADO
import { apiClient } from '../../api/client';

// ✅ Mantendo suas interfaces originais com melhorias
export interface MultaCompleta {
  numeroAiMulta: string;
  descricaoInfra: string;
  prefixoVeic: string;
  codIntFunc?: string;
  codigoVeic?: string;
  codigoInfra?: string;
  codigoUf?: string;
  codMunic?: string;
  codigoOrg?: string;
  dataEmissaoMulta?: Date | string;
  localMulta?: string;
  numeroLocalMulta?: string;
  dataHoraMulta?: Date | string;
  dataVectoMulta?: Date | string;
  valorMulta?: number;
  totalParcelasMulta?: number;
  valorTotalMulta?: number;
  dataPagtoMulta?: Date | string;
  responsavelMulta?: string;
  numeroRecursoMulta?: string;
  dataRecursoMulta?: Date | string;
  condicaoRecursoMulta?: string;
  valorPago?: number;
  dataAutorizado?: Date | string;
  autorizado?: string;
  declImpressoMulta?: string;
  documento?: string;
  dataPagamentoPrev?: Date | string;
  vlrAcrescimo?: number;
  vlrDesconto?: number;
  valorPagamento?: number;
  codigoForn?: string;
  codLanca?: string;
  idPrest2?: string;
  codDocTocpg?: string;
  codIntProaut?: string;
  observacao?: string;
  dataLimiteCondutor?: Date | string;
  numeroRecursoMulta2?: string;
  dataRecursoMulta2?: Date | string;
  condicaoRecursoMulta2?: string;
  codMotivoNotificacao?: string;
  codAreaCompetencia?: string;
  codResponsavelNotificacao?: string;
  codAgenteAutuador?: string;
  codIntLinha?: string;
  numeroRecursoMulta3?: string;
  dataRecursoMulta3?: Date | string;
  condicaoRecursoMulta3?: string;
  flgPrimParcelaPaga?: string;
  entradaVencimento?: Date | string;
  entradaPagamento?: Date | string;
  autoDeInfracao?: string;
  autoDeInfracaoEmissao?: Date | string;
  autoDeInfracaoRecebimento?: Date | string;
  autoDeInfracaoConsiderado?: Date | string;
  autoDeInfracaoValorDoDoc?: number;
  autoDeInfracaoValorConsiderado?: number;
  notificacao1?: string;
  notificacao1Emissao?: Date | string;
  notificacao1Recebimento?: Date | string;
  notificacao1Considerado?: Date | string;
  notificacao1ValorDoDoc?: number;
  notificacao1ValorConsiderado?: number;
  notificacao2?: string;
  notificacao2Emissao?: Date | string;
  notificacao2Recebimento?: Date | string;
  notificacao2Considerado?: Date | string;
  notificacao2ValorDoDoc?: number;
  notificacao2ValorConsiderado?: number;
  notificacao3?: string;
  notificacao3Emissao?: Date | string;
  notificacao3Recebimento?: Date | string;
  notificacao3Considerado?: Date | string;
  notificacao3ValorDoDoc?: number;
  notificacao3ValorConsiderado?: number;
  valorAtualizado?: number;
  pgtoIntempData?: Date | string;
  pgtoIntempValor?: number;
  depJudData?: Date | string;
  depJudValor?: number;
  depJudDtRecup?: Date | string;
  depJudVlrRecup?: number;
  numeroProcesso?: string;
  parcValor?: number;
  parcTotalParcelas?: number;
  parcValorParcelas?: number;
  entVencimento?: Date | string;
  entPagamento?: Date | string;
  entValor?: number;
  parVencimento?: Date | string;
  parPagamento?: Date | string;
  parValor?: number;
  ultParVencimento?: Date | string;
  ultParPagamento?: Date | string;
  ultParValor?: number;
  totalPago?: number;
  recuso?: string;
  anistia?: string;
  instanciaEnvio1?: Date | string;
  instanciaPublicacaoDo1?: Date | string;
  instanciaEnvio2?: Date | string;
  instanciaPublicacaoDo2?: Date | string;
  instanciaEnvio3?: Date | string;
  instanciaPublicacaoDo3?: Date | string;
  integrouPorVencimento?: string;
  valorJulgado?: number;
  codigoRecuperacao?: string;
  nProcessoNotificacao?: string;
  autoDeInfracaoPrazo?: string;
  notificacao1Prazo?: string;
  notificacao2Prazo?: string;
  notificacao3Prazo?: string;
  pgtoIntempVenc?: Date | string;
  depJudVenc?: Date | string;
  codCausaPrincipal?: string;
  envPenalidade?: string;
  revPenalidade?: string;
  obsNotificacao?: string;
  recuperada?: string;
  palavraChave?: string;
  tratamentoMulta?: string;
  importacaoOk?: string;
  tipoDeTrecho?: string;
  reembolsavel?: string;
  kmLocalMulta?: string;
  metrosLocalMulta?: string;
  sentidoLocalMulta?: string;
  bairroLocalMulta?: string;
  observacaoRealMotivo?: string; // ✅ Campo importante para análise de causas
  tipoTratamentoMulta?: string;
  executor?: string;
  executorCnpjCpf?: string;
  ultAlteracao?: Date | string;
  ocorrencia?: string;
  codigoRessarc?: string;
  flgSmartec?: string;
  dataImpSmartec?: Date | string;
  urlFormulario?: string;
  urlBoleto?: string;
  flgSmartecMulta?: string;
  reincidencia?: string;
  pontuacaoInfracao?: number;
  grupoInfracao?: string;
  codOrgOriginal?: string;
  aitOriginal?: string;
  agenteCodigo?: string;
  agenteDescricao?: string;
  agenteMatriculaFiscal?: string;
  codigoEmpresa?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  sincronizadoEm?: Date | string;
  
  // ✅ Campos adicionais para compatibilidade com outros componentes
  gravidadeInfracao?: 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA';
  statusMulta?: 'PAGA' | 'VENCIDA' | 'PENDENTE' | 'RECURSO';
}

export interface MultaCompletaFilter {
  // ✅ Filtros temporais
  dataInicio?: string;
  dataFim?: string;
  
  // ✅ Filtros específicos
  agenteSemob?: string;
  tipoInfracao?: string;
  prefixoVeic?: string;
  numeroAiMulta?: string;
  codigoVeic?: string;
  codigoInfra?: string;
  agenteCodigo?: string;
  agenteDescricao?: string;
  localMulta?: string;
  responsavelMulta?: string;
  situacao?: string; // 'paga', 'vencida', 'recurso', 'pendente'
  
  // ✅ Filtros de valor
  valorMinimo?: number;
  valorMaximo?: number;
  
  // ✅ Filtros de grupo
  gruposInfracao?: string[];
  gravidadeInfracao?: string;
  
  // ✅ Busca geral
  busca?: string;
  
  // ✅ Paginação e ordenação
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  
  // ✅ Agrupamento para analytics
  groupBy?: 'agente' | 'veiculo' | 'infracao' | 'mes' | 'dia' | 'local' | 'gravidade';
  
  // ✅ Campos específicos para análise
  observacaoRealMotivo?: string;
  includeAnalytics?: boolean; // Para solicitar dados de analytics do backend
}

export interface MultaCompletaResponse {
  success: boolean;
  message: string;
  data: MultaCompleta[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: {
    totalMultas: number;
    valorTotal: number;
    valorMedio: number;
    valorMinimo: number;
    valorMaximo: number;
    multasPagas: number;
    multasVencidas: number;
    multasComRecurso: number;
    percentualPagas: string;
    percentualVencidas: string;
    percentualComRecurso: string;
    valorArrecadado: number;
    // ✅ Campos adicionais para analytics
    multasTransito?: number;
    multasSemob?: number;
    valorMedioTransito?: number;
    valorMedioSemob?: number;
    totalAgentes?: number;
    totalVeiculos?: number;
    pontosTotal?: number;
  };
  groups?: Array<{
    codigo?: string;
    descricao?: string;
    prefixo?: string;
    periodo?: string;
    total: number;
    valorTotal: number;
    valorMedio: number;
  }>;
  // ✅ Analytics detalhado (se solicitado)
  analytics?: {
    distribuicaoPorTipo?: Array<{
      tipo: 'TRANSITO' | 'SEMOB';
      total: number;
      valor: number;
      percentual: number;
    }>;
    distribuicaoPorGravidade?: Array<{
      gravidade: string;
      total: number;
      valor: number;
      pontos: number;
      percentual: number;
    }>;
    topAgentes?: Array<{
      codigo: string;
      nome: string;
      total: number;
      valor: number;
    }>;
    topLocais?: Array<{
      local: string;
      total: number;
      valor: number;
    }>;
    topCausasReais?: Array<{
      motivo: string;
      total: number;
      valor: number;
    }>;
    evolucaoMensal?: Array<{
      mes: string;
      totalTransito: number;
      totalSemob: number;
      valorTransito: number;
      valorSemob: number;
    }>;
  };
}

export interface SyncResult {
  total: number;
  novos: number;
  atualizados: number;
  periodo: { inicio: string; fim: string };
  fonte: 'oracle' | 'cache';
  tempoExecucao?: string;
  erros?: string[];
}

export interface CacheStats {
  totalRegistros: number;
  dataMinima: string;
  dataMaxima: string;
  totalVeiculos: number;
  totalAgentes: number;
  totalInfracoes: number;
  tamanhoCache: string;
  ultimaAtualizacao: string;
  estatisticasPorMes: Array<{
    mes: string;
    quantidade: number;
    valor: number;
  }>;
}

// ✅ Interfaces para analytics específicos
export interface TopCausaMulta {
  motivo: string;
  total: number;
  valor: number;
}

export interface TopAgente {
  codigo: string;
  nome: string;
  matricula?: string;
  total: number;
  valor: number;
}

export interface TopLocal {
  local: string;
  total: number;
  valor: number;
}

export interface EvolucaoMensal {
  mes: string;
  totalTransito: number;
  totalSemob: number;
  valorTransito: number;
  valorSemob: number;
}

export interface DistribuicaoGravidade {
  gravidade: string;
  total: number;
  valor: number;
  pontos: number;
}

class MultasCompletasService {
  private baseUrl = '/juridico/multas-completas';

  /**
   * ✅ Função principal para buscar multas completas
   */
  async buscarMultasCompletas(filters: MultaCompletaFilter = {}): Promise<MultaCompletaResponse> {
    try {
      console.log('🔍 Buscando multas completas:', filters);
      
      // ✅ Preparar parâmetros de consulta
      const queryParams: Record<string, any> = {};
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // ✅ Tratamento especial para arrays
          if (Array.isArray(value)) {
            queryParams[key] = value.join(',');
          } else {
            queryParams[key] = value;
          }
        }
      });
      
      const response = await apiClient.get<MultaCompletaResponse>(this.baseUrl, queryParams);
      
      console.log('✅ Multas completas encontradas:', {
        total: response.data?.length || 0,
        pagination: response.pagination,
        summary: response.summary
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar multas completas:', error);
      throw new Error('Falha ao carregar dados das multas completas');
    }
  }

  /**
   * ✅ Função para obter analytics detalhado
   */
  async obterAnalytics(filters: MultaCompletaFilter = {}): Promise<MultaCompletaResponse> {
    try {
      console.log('📊 Obtendo analytics de multas:', filters);
      
      // ✅ Adicionar flag para incluir analytics
      const analyticsFilters = {
        ...filters,
        includeAnalytics: true,
        limit: 10000 // Garantir dados suficientes para análise
      };
      
      const response = await this.buscarMultasCompletas(analyticsFilters);
      
      console.log('✅ Analytics obtidos:', {
        totalRegistros: response.data?.length || 0,
        analytics: response.analytics ? 'Incluído' : 'Calculado no frontend'
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter analytics:', error);
      throw new Error('Falha ao carregar analytics das multas');
    }
  }

  /**
   * ✅ Buscar multa específica por número
   */
  async buscarPorNumero(numeroAiMulta: string): Promise<{ success: boolean; data: MultaCompleta }> {
    try {
      console.log('🔍 Buscando multa por número:', numeroAiMulta);
      
      const response = await apiClient.get<{ success: boolean; data: MultaCompleta }>(
        `${this.baseUrl}/numero/${numeroAiMulta}`
      );
      
      console.log('✅ Multa encontrada:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar multa por número:', error);
      throw new Error(`Falha ao buscar multa ${numeroAiMulta}`);
    }
  }

  /**
   * ✅ Sincronização manual com o Oracle
   */
  async sincronizarManual(dataInicio?: string, dataFim?: string): Promise<{ success: boolean; data: SyncResult }> {
    try {
      console.log('🔄 Iniciando sincronização manual:', { dataInicio, dataFim });
      
      const params: any = {};
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      
      const response = await apiClient.post<{ success: boolean; data: SyncResult }>(
        `${this.baseUrl}/sincronizar`,
        {},
        params
      );
      
      console.log('✅ Sincronização concluída:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw new Error('Falha na sincronização com o Oracle');
    }
  }

  /**
   * ✅ Obter estatísticas do cache
   */
  async obterEstatisticasCache(): Promise<{ success: boolean; data: CacheStats }> {
    try {
      console.log('📊 Obtendo estatísticas do cache...');
      
      const response = await apiClient.get<{ success: boolean; data: CacheStats }>(
        `${this.baseUrl}/estatisticas/cache`
      );
      
      console.log('✅ Estatísticas do cache obtidas:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do cache:', error);
      throw new Error('Falha ao carregar estatísticas do cache');
    }
  }

  /**
   * ✅ Dashboard resumo para visão executiva
   */
  async obterDashboardResumo(filters: MultaCompletaFilter = {}): Promise<{
    success: boolean;
    data: {
      resumoGeral: any;
      topAgentes: TopAgente[];
      topVeiculos: any[];
      topInfracoes: any[];
      topLocais: TopLocal[];
      evolucaoMensal: EvolucaoMensal[];
      distribuicaoGravidade: DistribuicaoGravidade[];
      topCausasReais: TopCausaMulta[];
    };
  }> {
    try {
      console.log('📊 Obtendo dashboard resumo:', filters);
      
      const response = await apiClient.get<{
        success: boolean;
        data: {
          resumoGeral: any;
          topAgentes: TopAgente[];
          topVeiculos: any[];
          topInfracoes: any[];
          topLocais: TopLocal[];
          evolucaoMensal: EvolucaoMensal[];
          distribuicaoGravidade: DistribuicaoGravidade[];
          topCausasReais: TopCausaMulta[];
        };
      }>(`${this.baseUrl}/dashboard/resumo`, filters);
      
      console.log('✅ Dashboard resumo obtido:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter dashboard resumo:', error);
      throw new Error('Falha ao carregar dashboard resumo');
    }
  }

  /**
   * ✅ Limpeza de cache antigo
   */
  async limparCacheAntigo(diasAntigos: number = 90): Promise<{ success: boolean; data: { removidos: number } }> {
    try {
      console.log('🧹 Limpando cache antigo:', diasAntigos, 'dias');
      
      const response = await apiClient.delete<{ success: boolean; data: { removidos: number } }>(
        `${this.baseUrl}/cache/limpar?diasAntigos=${diasAntigos}`
      );
      
      console.log('✅ Cache limpo:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      throw new Error('Falha ao limpar cache');
    }
  }

  /**
   * ✅ Exportar relatórios em múltiplos formatos
   */
  async exportarRelatorio(
    filters: MultaCompletaFilter = {}, 
    formato: 'xlsx' | 'csv' | 'pdf' | 'html' = 'xlsx'
  ): Promise<void> {
    try {
      console.log('📤 Exportando relatório:', { filters, formato });
      
      // ✅ Preparar parâmetros para exportação
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
      
      params.append('formato', formato);
      
      // ✅ Fazer requisição para exportação
      const response = await apiClient.get(`${this.baseUrl}/export?${params}`, {
        responseType: 'blob'
      });

      // ✅ Download automático do arquivo
      const blob = new Blob([response], {
        type: this.getMimeType(formato)
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `multas_completas_${timestamp}.${formato}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Relatório exportado com sucesso:', filename);
    } catch (error) {
      console.error('❌ Erro ao exportar relatório:', error);
      throw new Error(`Falha ao exportar relatório em formato ${formato}`);
    }
  }

  /**
   * ✅ Função auxiliar para determinar MIME type
   */
  private getMimeType(formato: string): string {
    const mimeTypes = {
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'pdf': 'application/pdf',
      'html': 'text/html'
    };
    
    return mimeTypes[formato as keyof typeof mimeTypes] || 'application/octet-stream';
  }

  /**
   * ✅ Buscar multas com agrupamento específico
   */
  async buscarComAgrupamento(
    filters: MultaCompletaFilter = {},
    groupBy: 'agente' | 'veiculo' | 'infracao' | 'mes' | 'dia' | 'local' | 'gravidade'
  ): Promise<MultaCompletaResponse> {
    try {
      console.log('📊 Buscando multas com agrupamento:', { filters, groupBy });
      
      const groupedFilters = {
        ...filters,
        groupBy
      };
      
      const response = await this.buscarMultasCompletas(groupedFilters);
      
      console.log('✅ Multas agrupadas obtidas:', {
        grupos: response.groups?.length || 0,
        agrupamento: groupBy
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar multas agrupadas:', error);
      throw new Error(`Falha ao agrupar multas por ${groupBy}`);
    }
  }

  /**
   * ✅ Validar dados de multa
   */
  async validarDados(numeroAiMulta: string): Promise<{
    success: boolean;
    data: {
      valido: boolean;
      erros: string[];
      warnings: string[];
      sugestoes: string[];
    };
  }> {
    try {
      console.log('🔍 Validando dados da multa:', numeroAiMulta);
      
      const response = await apiClient.post<{
        success: boolean;
        data: {
          valido: boolean;
          erros: string[];
          warnings: string[];
          sugestoes: string[];
        };
      }>(`${this.baseUrl}/validar/${numeroAiMulta}`);
      
      console.log('✅ Validação concluída:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      throw new Error('Falha na validação dos dados da multa');
    }
  }

  /**
   * ✅ Obter histórico de alterações
   */
  async obterHistorico(numeroAiMulta: string): Promise<{
    success: boolean;
    data: Array<{
      data: string;
      usuario: string;
      acao: string;
      detalhes: string;
      valorAnterior?: any;
      valorNovo?: any;
    }>;
  }> {
    try {
      console.log('📜 Obtendo histórico da multa:', numeroAiMulta);
      
      const response = await apiClient.get<{
        success: boolean;
        data: Array<{
          data: string;
          usuario: string;
          acao: string;
          detalhes: string;
          valorAnterior?: any;
          valorNovo?: any;
        }>;
      }>(`${this.baseUrl}/historico/${numeroAiMulta}`);
      
      console.log('✅ Histórico obtido:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      throw new Error('Falha ao carregar histórico da multa');
    }
  }
}

// ✅ Instância única do serviço
export const multasCompletasService = new MultasCompletasService();

// ✅ Exportações adicionais para compatibilidade
export default multasCompletasService;
export type { MultaCompleta, MultaCompletaFilter, MultaCompletaResponse, TopCausaMulta, TopAgente, TopLocal };