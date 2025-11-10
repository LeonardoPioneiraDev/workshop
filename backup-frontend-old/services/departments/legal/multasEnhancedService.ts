// apps/frontend/src/services/departments/legal/multasEnhancedService.ts
import { apiClient } from '../../api/client';

export interface MultaEnhancedFilter {
  dataInicio?: string;
  dataFim?: string;
  tipoMulta?: 'TODOS' | 'TRANSITO' | 'SEMOB';
  responsavelMulta?: 'F' | 'E' | 'TODOS';
  // ✅ CORRIGIDO: Usar grupoInfracao em vez de gravidadeMulta
  grupoInfracao?: 'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA' | 'TODOS';
  codAreaCompetencia?: string;
  codResponsavelNotificacao?: string;
  agenteCodigo?: string;
  prefixoVeic?: string;
  numeroAiMulta?: string;
  observacaoRealMotivo?: string;
  // ✅ NOVO FILTRO ADICIONADO
  realMotivo?: string; // Filtro específico para o campo observacao_real_motivo
  alertaDefesa?: boolean;
  // ✅ CORRIGIDOS: Novos filtros para setores
  setorCodigo?: number; // ✅ CORRIGIDO: era string, agora number
  setorNome?: string;
  setorMudou?: boolean;
  apenasComMudanca?: boolean;
  // ✅ CORRIGIDO: Usar statusPagamento em vez de statusPagamento
  statusPagamento?: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'RECURSO' | 'TODOS';
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  includeAnalytics?: boolean;
  includeHistoricoSetor?: boolean;
  groupBy?: 'agente' | 'area' | 'responsavel' | 'gravidade' | 'tipo' | 'mes' | 'horario' | 'setor' | 'realMotivo';

  buscaAvancada?: {
       texto: string;
    campos: string[];
    operador: 'AND' | 'OR';
  };
  // ✅ FILTROS ADICIONAIS PARA REAL MOTIVO
  apenasComRealMotivo?: boolean; // Apenas multas que têm observacao_real_motivo preenchido
  semRealMotivo?: boolean; // Apenas multas que NÃO têm observacao_real_motivo
  categoriaRealMotivo?: string; // Filtro por categoria específica
  valorMinimo?: number;
  valorMaximo?: number;
}

// Interface estendida com dados de histórico de setores
export interface MultaEnhanced {
  numeroAiMulta: string;
  descricaoInfra: string;
  prefixoVeic: string;
  codIntFunc?: string;
  codigoVeic?: string;
  codigoInfra?: string;
  codigoUf?: string;
  codMunic?: string;
  codigoOrg?: string;
  dataEmissaoMulta?: string;
  localMulta?: string;
  numeroLocalMulta?: string;
  dataHoraMulta?: string;
  dataVectoMulta?: string;
  valorMulta?: number;
  totalParcelasMulta?: number;
  valorTotalMulta?: number;
  dataPagtoMulta?: string;
  responsavelMulta?: string;
  numeroRecursoMulta?: string;
  dataRecursoMulta?: string;
  condicaoRecursoMulta?: string;
  valorPago?: number;
  dataAutorizado?: string;
  autorizado?: string;
  declImpressoMulta?: string;
  documento?: string;
  dataPagamentoPrev?: string;
  vlrAcrescimo?: number;
  vlrDesconto?: number;
  valorPagamento?: number;
  codigoForn?: string;
  codLanca?: string;
  idPrest2?: string;
  codDocTocpg?: string;
  codIntProaut?: string;
  observacao?: string;
  dataLimiteCondutor?: string;
  numeroRecursoMulta2?: string;
  dataRecursoMulta2?: string;
  condicaoRecursoMulta2?: string;
  codMotivoNotificacao?: string;
  codAreaCompetencia?: string;
  codResponsavelNotificacao?: string;
  codAgenteAutuador?: string;
  codIntLinha?: string;
  numeroRecursoMulta3?: string;
  dataRecursoMulta3?: string;
  condicaoRecursoMulta3?: string;
  flgPrimParcelaPaga?: string;
  entradaVencimento?: string;
  entradaPagamento?: string;
  autoDeInfracao?: string;
  autoDeInfracaoEmissao?: string;
  autoDeInfracaoRecebimento?: string;
  autoDeInfracaoConsiderado?: string;
  autoDeInfracaoValorDoDoc?: number;
  autoDeInfracaoValorConsiderado?: number;
  notificacao1?: string;
  notificacao1Emissao?: string;
  notificacao1Recebimento?: string;
  notificacao1Considerado?: string;
  notificacao1ValorDoDoc?: number;
  notificacao1ValorConsiderado?: number;
  notificacao2?: string;
  notificacao2Emissao?: string;
  notificacao2Recebimento?: string;
  notificacao2Considerado?: string;
  notificacao2ValorDoDoc?: number;
  notificacao2ValorConsiderado?: number;
  notificacao3?: string;
  notificacao3Emissao?: string;
  notificacao3Recebimento?: string;
  notificacao3Considerado?: string;
  notificacao3ValorDoDoc?: number;
  notificacao3ValorConsiderado?: number;
  valorAtualizado?: number;
  pgtoIntempData?: string;
  pgtoIntempValor?: number;
  depJudData?: string;
  depJudValor?: number;
  depJudDtRecup?: string;
  depJudVlrRecup?: number;
  numeroProcesso?: string;
  parcValor?: number;
  parcTotalParcelas?: number;
  parcValorParcelas?: number;
  entVencimento?: string;
  entPagamento?: string;
  entValor?: number;
  parVencimento?: string;
  parPagamento?: string;
  parValor?: number;
  ultParVencimento?: string;
  ultParPagamento?: string;
  ultParValor?: number;
  totalPago?: number;
  recuso?: string;
  anistia?: string;
  instanciaEnvio1?: string;
  instanciaPublicacaoDo1?: string;
  instanciaEnvio2?: string;
  instanciaPublicacaoDo2?: string;
  instanciaEnvio3?: string;
  instanciaPublicacaoDo3?: string;
  integrouPorVencimento?: string;
  valorJulgado?: number;
  codigoRecuperacao?: string;
  nProcessoNotificacao?: string;
  autoDeInfracaoPrazo?: string;
  notificacao1Prazo?: string;
  notificacao2Prazo?: string;
  notificacao3Prazo?: string;
  pgtoIntempVenc?: string;
  depJudVenc?: string;
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
  // ✅ CAMPO PRINCIPAL PARA O FILTRO
  observacaoRealMotivo?: string;
  tipoTratamentoMulta?: string;
  executor?: string;
  executorCnpjCpf?: string;
  ultAlteracao?: string;
  ocorrencia?: string;
  codigoRessarc?: string;
  flgSmartec?: string;
  dataImpSmartec?: string;
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
  createdAt?: string;
  updatedAt?: string;
  sincronizadoEm?: string;

  // Campos enriched pelo backend
  tipoMulta?: 'SEMOB' | 'TRANSITO';
  tipoResponsavel?: 'FUNCIONARIO' | 'EMPRESA' | 'INDEFINIDO';
  gravidadeValor?: string;
  areaCompetenciaDesc?: string;
  responsavelNotificacaoDesc?: string;
  alertaDefesa?: boolean;
  horarioInfracao?: number;
  temProcessoNotificacao?: boolean;
  // ✅ NOVO CAMPO ENRICHED
  temObservacaoRealMotivo?: boolean; // Indica se tem observacao_real_motivo preenchido
  temCodigoLinha?: boolean;
  dataRecebimentoEmpresa?: string;
  ultimaAlteracao?: string;
  statusMulta?: string; // PAGA, VENCIDA, RECURSO, PENDENTE
  diasParaDefesa?: number;
  // ✅ CAMPOS ADICIONAIS PARA REAL MOTIVO
  realMotivoResumo?: string; // Resumo do real motivo (primeiras palavras)
  realMotivoCategoria?: string; // Categoria inferida do real motivo
  realMotivoTamanho?: number; // Tamanho do texto do real motivo
  realMotivoFormatado?: string; // Texto formatado para exibição

  // Novos campos de histórico de setores
  setorNaDataInfracao?: {
    prefixoVeiculo: string;
    codigoGaragem: number;
    nomeGaragem: string;
    dataInicio: string;
    dataFim: string | null;
    periodoAtivo: boolean;
  };
  setorAtual?: {
    codigoGaragem: number;
    nomeGaragem: string;
  };
  setorMudou?: boolean;
  setorEncontrado?: boolean;
  tempoNoSetor?: string;
  statusPagamentoCalculado?: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'RECURSO';
  diasParaVencimento?: number;
  valorFormatado?: string;
  dataInfracaoFormatada?: string;
  dataVencimentoFormatada?: string;
}

export interface MultaEnhancedResponse {
  success: boolean;
  message: string;
  data: MultaEnhanced[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  resumo: {
    totalMultas: number;
    valorTotal: number;
    multasSemob: number;
    multasTransito: number;
    alertasDefesa: number;
    multasFuncionario: number;
    multasEmpresa: number;
    // Novos campos de resumo por setor
    multasComSetor?: number;
    multasSemSetor?: number;
    multasComMudancaSetor?: number;
    percentualMapeamento?: number;
    percentualMudancas?: number;
    // ✅ NOVOS CAMPOS DE RESUMO PARA REAL MOTIVO
    multasComRealMotivo?: number;
    multasSemRealMotivo?: number;
    percentualComRealMotivo?: number;
  };
  analytics?: AnalyticsEnhanced;
  // Novas estatísticas por setor
  estatisticasPorSetor?: Array<{
    setor: {
      codigo: number;
      nome: string;
    };
    totalMultas: number;
    valorTotal: number;
    multasComMudanca: number;
    percentualDoTotal: number;
  }>;
  // ✅ NOVAS ESTATÍSTICAS POR REAL MOTIVO
  estatisticasPorRealMotivo?: Array<{
    categoria: string;
    total: number;
    valor: number;
    percentual: number;
    exemplos: string[];
  }>;
  groups?: any[];
  filters?: MultaEnhancedFilter;
  timestamp: string;
  executionTime: string;
  endpoint: string;
}

export interface AnalyticsEnhanced {
  distribuicaoPorTipo: Array<{
    tipo: string;
    total: number;
    valor: number;
    percentual: number;
  }>;
  distribuicaoPorGravidade: Array<{
    gravidade: string;
    total: number;
    valor: number;
    percentual: number;
  }>;
  distribuicaoPorArea: Array<{
    codigo: string;
    descricao: string;
    total: number;
    valor: number;
  }>;
  distribuicaoPorResponsavel: Array<{
    codigo: string;
    descricao: string;
    total: number;
    valor: number;
  }>;
  distribuicaoPorHorario: Array<{
    hora: number;
    total: number;
    periodo: string;
  }>;
  // Nova distribuição por setor
  distribuicaoPorSetor?: Array<{
    codigo: number;
    nome: string;
    total: number;
    valor: number;
    percentual: number;
    multasComMudanca: number;
  }>;
  // ✅ NOVA DISTRIBUIÇÃO POR REAL MOTIVO
  distribuicaoPorRealMotivo?: Array<{
    categoria: string;
    total: number;
    valor: number;
    percentual: number;
    palavrasChave: string[];
  }>;
  topAgentes: Array<{
    codigo: string;
    nome: string;
    matricula?: string;
    total: number;
    valor: number;
  }>;
  topLocais: Array<{
    local: string;
    total: number;
    valor: number;
  }>;
  topCausasReais: Array<{
    motivo: string;
    total: number;
    valor: number;
  }>;
  // ✅ NOVO TOP REAL MOTIVOS
  topRealMotivos?: Array<{
    categoria: string;
    total: number;
    valor: number;
    percentual: number;
    exemplos: string[];
  }>;
  alertasDefesa: number;
  evolucaoMensal: Array<{
    mes: string;
    totalTransito: number;
    totalSemob: number;
    valorTransito: number;
    valorSemob: number;
  }>;
  estatisticasHorario: {
    horarioPico: number | null;
    horarioMenor: number | null;
    mediaHoraria: number;
    distribuicaoPorPeriodo: {
      manha: number;
      tarde: number;
      noite: number;
      madrugada: number;
    };
  };
  // Novas estatísticas de mudanças de setor
  estatisticasMudancasSetor?: {
    totalMudancas: number;
    impactoFinanceiro: number;
    setoresMaisAfetados: Array<{
      setor: string;
      impacto: number;
    }>;
  };
  // ✅ NOVAS ESTATÍSTICAS DE REAL MOTIVO
  estatisticasRealMotivo?: {
    totalComMotivo: number;
    totalSemMotivo: number;
    percentualPreenchimento: number;
    categoriasMaisFrequentes: Array<{
      categoria: string;
      frequencia: number;
    }>;
    tamanhoMedioTexto: number;
    palavrasMaisComuns: Array<{
      palavra: string;
      frequencia: number;
    }>;
  };
}

export interface DashboardExecutivoResponse {
  success: boolean;
  message: string;
  data: {
    kpis: any;
    analytics: AnalyticsEnhanced;
    alertas: {
      defesaVencendo: number;
      semProcessoNotificacao: number;
      semObservacaoMotivo: number;
    };
    alertasDetalhados: MultaEnhanced[];
  };
  timestamp: string;
  endpoint: string;
}

export interface AdvancedSearchCriterios {
  textoLivre?: string;
  campos?: string[];
  operador?: 'AND' | 'OR';
}

export interface HistoricoMulta {
  data: string;
  usuario: string;
  acao: string;
  detalhes: string;
  valorAnterior?: any;
  valorNovo?: any;
}

export interface MultaValidationResult {
  valido: boolean;
  erros: string[];
  warnings: string[];
  sugestoes: string[];
}

class MultasEnhancedService {
  private baseUrl = '/juridico/multas-enhanced';
  private historicoSetorUrl = '/juridico/historico-setores';

  async buscarMultasEnhanced(filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Buscando multas enhanced com filtros detalhados:', {
      // ✅ LOGS CORRIGIDOS COM NOMES CORRETOS
      prefixoVeic: filters.prefixoVeic,
      numeroAiMulta: filters.numeroAiMulta,
      tipoMulta: filters.tipoMulta,
      responsavelMulta: filters.responsavelMulta,
      statusPagamento: filters.statusPagamento, // ✅ CORRIGIDO
      grupoInfracao: filters.grupoInfracao, // ✅ CORRIGIDO
      setorCodigo: filters.setorCodigo, // ✅ CORRIGIDO
      observacaoRealMotivo: filters.observacaoRealMotivo,
      alertaDefesa: filters.alertaDefesa,
      setorMudou: filters.setorMudou,
      dataInicio: filters.dataInicio, // ✅ CORRIGIDO
      dataFim: filters.dataFim, // ✅ CORRIGIDO
      page: filters.page,
      limit: filters.limit,
      includeHistoricoSetor: filters.includeHistoricoSetor
    });
    
    try {
      const queryParams: Record<string, any> = {};
      Object.entries(filters).forEach(([key, value]) => {
        // ✅ CORREÇÃO: Preservar valores falsy válidos
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'buscaAvancada' && typeof value === 'object') {
            // Não adicionamos buscaAvancada diretamente como query param para GET
            // Será tratado no método buscaAvancada
          } else if (Array.isArray(value)) {
            queryParams[key] = value.join(',');
          } else {
            queryParams[key] = value;
          }
        }
        // ✅ ESPECIAL: Preservar boolean false explicitamente
        else if (value === false) {
          queryParams[key] = value;
        }
        // ✅ ESPECIAL: Preservar número 0 explicitamente
        else if (value === 0) {
          queryParams[key] = value;
        }
      });

      console.log('🔍 [Service] Query params finais:', queryParams);

      // Se incluir histórico de setor, fazer chamada combinada
      if (filters.includeHistoricoSetor) {
        return this.buscarMultasComHistoricoSetor(filters);
      }

      const response = await apiClient.get<MultaEnhancedResponse>(this.baseUrl, queryParams);
      
      // Enriquecer dados para melhor exibição
      if (response.data) {
        response.data = response.data.map(multa => this.enriquecerMulta(multa));
      }
      
      return response;
    } catch (error) {
      console.error('❌ [Service] Erro ao buscar multas enhanced:', error);
      // Retornar resposta vazia em caso de erro
      return this.gerarRespostaVazia();
    }
  }

  // Novo método para buscar multas com histórico de setores integrado
  async buscarMultasComHistoricoSetor(filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Buscando multas enhanced com histórico de setores:', filters);
    
    try {
      // Buscar dados de histórico de setores
      const historicoResponse = await apiClient.get<any>(
        `${this.historicoSetorUrl}/multas-historico`,
        filters
      );
      
      // Validar se a resposta tem dados
      if (!historicoResponse || !historicoResponse.data) {
        console.warn('⚠️ [Service] Resposta do histórico de setores vazia');
        return this.gerarRespostaVazia();
      }

      // Garantir que data é um array
      const multasData = Array.isArray(historicoResponse.data) ? historicoResponse.data : [];
      
      // Transformar para formato MultaEnhancedResponse
      const response: MultaEnhancedResponse = {
        success: historicoResponse.success || true,
        message: historicoResponse.message || `Encontradas ${multasData.length} multas`,
        data: multasData.map((multa: any) => this.enriquecerMultaComHistorico(multa)),
        pagination: historicoResponse.pagination || {
          total: multasData.length,
          page: filters.page || 1,
          limit: filters.limit || 1000,
          totalPages: Math.ceil(multasData.length / (filters.limit || 1000))
        },
        resumo: {
          totalMultas: historicoResponse.resumo?.totalMultas || multasData.length,
          valorTotal: this.calcularValorTotal(multasData),
          multasSemob: this.contarPorTipo(multasData, 'SEMOB'),
          multasTransito: this.contarPorTipo(multasData, 'TRANSITO'),
          alertasDefesa: this.contarAlertasDefesa(multasData),
          multasFuncionario: this.contarPorResponsavel(multasData, 'F'),
          multasEmpresa: this.contarPorResponsavel(multasData, 'E'),
          multasComSetor: historicoResponse.resumo?.multasComSetor || 0,
          multasSemSetor: historicoResponse.resumo?.multasSemSetor || 0,
          multasComMudancaSetor: historicoResponse.resumo?.multasComMudancaSetor || 0,
          percentualMapeamento: historicoResponse.resumo?.percentualMapeamento || 0,
          percentualMudancas: historicoResponse.resumo?.percentualMudancas || 0,
          // ✅ NOVOS CAMPOS PARA REAL MOTIVO
          multasComRealMotivo: this.contarComRealMotivo(multasData),
          multasSemRealMotivo: this.contarSemRealMotivo(multasData),
          percentualComRealMotivo: this.calcularPercentualComRealMotivo(multasData),
        },
        estatisticasPorSetor: this.processarEstatisticasPorSetor(historicoResponse.estatisticasPorSetor || []),
        // ✅ NOVAS ESTATÍSTICAS POR REAL MOTIVO
        estatisticasPorRealMotivo: this.processarEstatisticasPorRealMotivo(multasData),
        analytics: this.gerarAnalyticsComSetor(multasData),
        timestamp: historicoResponse.timestamp || new Date().toISOString(),
        executionTime: historicoResponse.executionTime || '0ms',
        endpoint: historicoResponse.endpoint || this.historicoSetorUrl
      };
      
      return response;
    } catch (error) {
      console.error('❌ [Service] Erro ao buscar multas com histórico de setores:', error);
      return this.gerarRespostaVazia();
    }
  }

  // ✅ NOVOS MÉTODOS PARA FILTROS DE REAL MOTIVO

  // Buscar multas apenas com real motivo preenchido
  async buscarMultasComRealMotivo(filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Buscando multas com real motivo:', filters);
    
    const filtrosComRealMotivo: MultaEnhancedFilter = {
      ...filters,
      apenasComRealMotivo: true
    };
    
    return this.buscarMultasEnhanced(filtrosComRealMotivo);
  }

  // Buscar multas sem real motivo
  async buscarMultasSemRealMotivo(filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Buscando multas sem real motivo:', filters);
    
    const filtrosSemRealMotivo: MultaEnhancedFilter = {
      ...filters,
      semRealMotivo: true
    };
    
    return this.buscarMultasEnhanced(filtrosSemRealMotivo);
  }

  // Buscar por texto específico no real motivo
  async buscarPorRealMotivo(textoRealMotivo: string, filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Buscando por real motivo:', textoRealMotivo);
    
    const filtrosRealMotivo: MultaEnhancedFilter = {
      ...filters,
      realMotivo: textoRealMotivo
    };
    
    return this.buscarMultasEnhanced(filtrosRealMotivo);
  }

  // Buscar por categoria de real motivo
  async buscarPorCategoriaRealMotivo(categoria: string, filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Buscando por categoria de real motivo:', categoria);
    
    const filtrosCategoria: MultaEnhancedFilter = {
      ...filters,
      categoriaRealMotivo: categoria
    };
    
    return this.buscarMultasEnhanced(filtrosCategoria);
  }

  // Obter estatísticas de real motivo
  async obterEstatisticasRealMotivo(filters: MultaEnhancedFilter = {}): Promise<{
    success: boolean;
    data: {
      totalComMotivo: number;
      totalSemMotivo: number;
      percentualPreenchimento: number;
      categorias: Array<{
        categoria: string;
        total: number;
        valor: number;
        percentual: number;
        exemplos: string[];
      }>;
      palavrasChave: Array<{
        palavra: string;
        frequencia: number;
      }>;
    };
  }> {
    console.log('📊 [Service] Obtendo estatísticas de real motivo:', filters);
    
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/analytics/real-motivo`, filters);
      return response;
    } catch (error) {
      console.error('❌ [Service] Erro ao obter estatísticas de real motivo:', error);
      return {
        success: false,
        data: {
          totalComMotivo: 0,
          totalSemMotivo: 0,
          percentualPreenchimento: 0,
          categorias: [],
          palavrasChave: []
        }
      };
    }
  }

  async obterAnalytics(filters: MultaEnhancedFilter = {}): Promise<{ success: boolean; data: AnalyticsEnhanced; }> {
    console.log('📊 [Service] Obtendo analytics enhanced:', filters);
    
    try {
      if (filters.includeHistoricoSetor) {
        // Buscar analytics com dados de setor
        const response = await this.buscarMultasComHistoricoSetor({ ...filters, includeAnalytics: true });
        return {
          success: true,
          data: response.analytics || this.gerarAnalyticsVazio()
        };
      }
      
      const response = await apiClient.get<{ success: boolean; data: AnalyticsEnhanced; }>(`${this.baseUrl}/analytics`, filters);
      return response;
    } catch (error) {
      console.error('❌ [Service] Erro ao obter analytics:', error);
      return {
        success: false,
        data: this.gerarAnalyticsVazio()
      };
    }
  }

  async obterAlertasDefesa(): Promise<{ success: boolean; data: MultaEnhanced[]; resumo: any; }> {
    console.log('🚨 [Service] Obtendo alertas de defesa...');
    try {
      const response = await apiClient.get<{ success: boolean; data: MultaEnhanced[]; resumo: any; }>(`${this.baseUrl}/alertas-defesa`);
      return response;
    } catch (error) {
      console.error('❌ [Service] Erro ao obter alertas de defesa:', error);
      return {
        success: false,
        data: [],
        resumo: { totalAlertas: 0 }
      };
    }
  }

  async obterDashboardExecutivo(filters: MultaEnhancedFilter = {}): Promise<DashboardExecutivoResponse> {
    console.log('📈 [Service] Obtendo dashboard executivo:', filters);
    const response = await apiClient.get<DashboardExecutivoResponse>(`${this.baseUrl}/dashboard-executivo`, filters);
    return response;
  }

  async buscarPorNumero(numeroAiMulta: string): Promise<{ success: boolean; data: MultaEnhanced; classificacoes: any; alertas: any; }> {
    console.log('🔍 [Service] Buscando multa enhanced por número:', numeroAiMulta);
    const response = await apiClient.get<{ success: boolean; data: MultaEnhanced; classificacoes: any; alertas: any; }>(`${this.baseUrl}/numero/${numeroAiMulta}`);
    return response;
  }

  async sincronizarManual(dataInicio?: string, dataFim?: string): Promise<{ success: boolean; data: any; }> {
    console.log('🔄 [Service] Iniciando sincronização manual enhanced:', { dataInicio, dataFim });
    const params: any = {};
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    const response = await apiClient.post<{ success: boolean; data: any; }>(`${this.baseUrl}/sincronizar`, {}, params);
    return response;
  }

  async buscaAvancada(criterios: MultaEnhancedFilter): Promise<MultaEnhancedResponse> {
    console.log('🔍 [Service] Executando busca avançada:', criterios);
    
    try {
      if (criterios.includeHistoricoSetor) {
        return this.buscarMultasComHistoricoSetor(criterios);
      }
      
      const response = await apiClient.post<MultaEnhancedResponse>(`${this.baseUrl}/busca-avancada`, criterios);
      return response;
    } catch (error) {
      console.error('❌ [Service] Erro na busca avançada:', error);
      return this.gerarRespostaVazia();
    }
  }

  async obterAgrupamentos(tipo: 'agente' | 'area' | 'responsavel' | 'gravidade' | 'tipo' | 'mes' | 'horario' | 'setor' | 'realMotivo', filters: MultaEnhancedFilter = {}): Promise<{ success: boolean; data: any[]; resumo: any; tipo: string; }> {
    console.log(`📊 [Service] Obtendo agrupamentos por ${tipo}:`, filters);
    
    try {
      if (tipo === 'setor' || filters.includeHistoricoSetor) {
        // Usar endpoint de histórico de setores para agrupamentos por setor
        const response = await apiClient.get<any>(`${this.historicoSetorUrl}/agrupamentos/${tipo}`, filters);
        return response;
      }
      
      const response = await apiClient.get<{ success: boolean; data: any[]; resumo: any; tipo: string; }>(`${this.baseUrl}/agrupamentos/${tipo}`, filters);
      return response;
    } catch (error) {
      console.error(`❌ [Service] Erro ao obter agrupamentos por ${tipo}:`, error);
      return {
        success: false,
        data: [],
        resumo: {},
        tipo
      };
    }
  }

  async validarDados(numeroAiMulta: string): Promise<{ success: boolean; data: MultaValidationResult }> {
    console.log('🔍 [Service] Validando dados da multa:', numeroAiMulta);
    const response = await apiClient.post<{ success: boolean; data: MultaValidationResult }>(`${this.baseUrl}/validar/${numeroAiMulta}`);
    return response;
  }

  async obterHistorico(numeroAiMulta: string): Promise<{ success: boolean; data: HistoricoMulta[] }> {
    console.log('📜 [Service] Obtendo histórico da multa:', numeroAiMulta);
    const response = await apiClient.get<{ success: boolean; data: HistoricoMulta[] }>(`${this.baseUrl}/historico/${numeroAiMulta}`);
    return response;
  }

  // ✅ MÉTODOS PRIVADOS CORRIGIDOS COM VALIDAÇÕES

  // Método para enriquecer dados da multa
  private enriquecerMulta(multa: MultaEnhanced): MultaEnhanced {
    try {
      const agora = new Date();
      const dataVencimento = multa.dataVectoMulta ? new Date(multa.dataVectoMulta) : null;
      const dataInfracao = multa.dataHoraMulta ? new Date(multa.dataHoraMulta) : null;
      
      // Status de pagamento
      let statusPagamentoCalculado: 'PAGO' | 'PENDENTE' | 'VENCIDO' | 'RECURSO' = 'PENDENTE';
      
      if (multa.dataPagtoMulta) {
        statusPagamentoCalculado = 'PAGO';
      } else if (multa.numeroRecursoMulta) {
        statusPagamentoCalculado = 'RECURSO';
      } else if (dataVencimento && dataVencimento < agora) {
        statusPagamentoCalculado = 'VENCIDO';
      }

      // Dias para vencimento
      let diasParaVencimento = 0;
      if (dataVencimento && statusPagamentoCalculado === 'PENDENTE') {
        diasParaVencimento = Math.ceil((dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Alerta de defesa (15 dias antes do vencimento)
      const alertaDefesa = diasParaVencimento > 0 && diasParaVencimento <= 15;

      // ✅ ENRIQUECIMENTO PARA REAL MOTIVO
      const temObservacaoRealMotivo = !!(multa.observacaoRealMotivo && multa.observacaoRealMotivo.trim().length > 0);
      
      let realMotivoResumo = '';
      let realMotivoCategoria = '';
      let realMotivoTamanho = 0;
      let realMotivoFormatado = '';
      
      if (temObservacaoRealMotivo && multa.observacaoRealMotivo) {
        realMotivoTamanho = multa.observacaoRealMotivo.length;
        realMotivoResumo = multa.observacaoRealMotivo.length > 50 
          ? multa.observacaoRealMotivo.substring(0, 50) + '...'
          : multa.observacaoRealMotivo;
        
        // Categorizar automaticamente baseado em palavras-chave
        realMotivoCategoria = this.categorizarRealMotivo(multa.observacaoRealMotivo);
        
        // Formatar para exibição
        realMotivoFormatado = this.formatarRealMotivo(multa.observacaoRealMotivo);
      }

      return {
        ...multa,
        statusPagamentoCalculado,
        diasParaVencimento,
        valorFormatado: this.formatCurrency(multa.valorMulta),
        dataInfracaoFormatada: this.formatDate(multa.dataHoraMulta),
        dataVencimentoFormatada: this.formatDate(multa.dataVectoMulta),
        alertaDefesa,
        // ✅ NOVOS CAMPOS ENRICHED PARA REAL MOTIVO
        temObservacaoRealMotivo,
        realMotivoResumo,
        realMotivoCategoria,
        realMotivoTamanho,
        realMotivoFormatado
      };
    } catch (error) {
      console.error('❌ [Service] Erro ao enriquecer multa:', error);
      return multa; // Retorna a multa original em caso de erro
    }
  }

  // Método para enriquecer dados da multa com histórico de setor
  private enriquecerMultaComHistorico(multa: any): MultaEnhanced {
    try {
      const multaEnriquecida = this.enriquecerMulta(multa);
      
      // Calcular tempo no setor
      let tempoNoSetor = '';
      if (multa.setorNaDataInfracao?.dataInicio) {
        try {
          const dataInicio = new Date(multa.setorNaDataInfracao.dataInicio);
          const dataFim = multa.setorNaDataInfracao.dataFim ? 
            new Date(multa.setorNaDataInfracao.dataFim) : new Date();
          
          const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 365) {
            tempoNoSetor = `${Math.floor(diffDays / 365)} ano(s)`;
          } else if (diffDays > 30) {
            tempoNoSetor = `${Math.floor(diffDays / 30)} mês(es)`;
          } else {
            tempoNoSetor = `${diffDays} dia(s)`;
          }
        } catch (error) {
          console.error('❌ [Service] Erro ao calcular tempo no setor:', error);
          tempoNoSetor = 'N/A';
        }
      }
    
      return {
        ...multaEnriquecida,
        tempoNoSetor
      };
    } catch (error) {
      console.error('❌ [Service] Erro ao enriquecer multa com histórico:', error);
      return this.enriquecerMulta(multa);
    }
  }

  // ✅ NOVO MÉTODO PARA CATEGORIZAR REAL MOTIVO

  private categorizarRealMotivo(observacao: string): string {
    if (!observacao || typeof observacao !== 'string') return 'INDEFINIDO';
    
    const texto = observacao.toLowerCase().trim();
    
    // Categorias baseadas em palavras-chave comuns
    const categorias = {
      'VELOCIDADE': ['velocidade', 'excesso', 'radar', 'limite', 'km/h', 'kmh', 'acima', 'permitido'],
      'ESTACIONAMENTO': ['estacionamento', 'parado', 'estacionar', 'vaga', 'proibido estacionar', 'zona azul'],
      'SEMAFORO': ['semáforo', 'sinal', 'vermelho', 'amarelo', 'avanço', 'sinaleiro'],
      'CONVERSAO': ['conversão', 'curva', 'virar', 'retorno', 'proibida', 'u-turn'],
      'CELULAR': ['celular', 'telefone', 'dirigindo', 'mão', 'aparelho'],
      'CINTO': ['cinto', 'segurança', 'sem cinto'],
      'CAPACETE': ['capacete', 'sem capacete', 'motocicleta', 'moto'],
      'DOCUMENTACAO': ['documento', 'cnh', 'habilitação', 'licenciamento', 'carteira'],
      'ULTRAPASSAGEM': ['ultrapassagem', 'ultrapassar', 'faixa contínua', 'linha amarela'],
      'PREFERENCIAL': ['preferencial', 'pare', 'dê a vez', 'stop'],
      'TRANSPORTE_PUBLICO': ['ônibus', 'faixa exclusiva', 'corredor', 'brt'],
      'PARADA_OBRIGATORIA': ['pare', 'parada obrigatória', 'stop', 'placa'],
      'FAIXA_PEDESTRES': ['faixa de pedestres', 'pedestre', 'travessia'],
      'ALCOOL': ['álcool', 'embriaguez', 'bafômetro', 'bebida'],
      'OUTROS': []
    };
    
    // Verificar cada categoria
    for (const [categoria, palavrasChave] of Object.entries(categorias)) {
      if (categoria === 'OUTROS') continue;
      
      for (const palavra of palavrasChave) {
        if (texto.includes(palavra)) {
          return categoria;
        }
      }
    }
    
    return 'OUTROS';
  }

  // ✅ NOVO MÉTODO PARA FORMATAR REAL MOTIVO

  private formatarRealMotivo(observacao: string): string {
    if (!observacao || typeof observacao !== 'string') return '';
    
    // Capitalizar primeira letra de cada frase
    return observacao
      .split('.')
      .map(frase => {
        const trimmed = frase.trim();
        if (trimmed.length === 0) return '';
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      })
      .filter(frase => frase.length > 0)
      .join('. ') + (observacao.endsWith('.') ? '' : '.');
  }

  // ✅ NOVOS MÉTODOS AUXILIARES PARA REAL MOTIVO

  private contarComRealMotivo(multas: any[]): number {
    if (!Array.isArray(multas)) return 0;
    return multas.filter(multa => 
      multa.observacaoRealMotivo && 
      multa.observacaoRealMotivo.trim().length > 0
    ).length;
  }

  private contarSemRealMotivo(multas: any[]): number {
    if (!Array.isArray(multas)) return 0;
    return multas.filter(multa => 
      !multa.observacaoRealMotivo || 
      multa.observacaoRealMotivo.trim().length === 0
    ).length;
  }

  private calcularPercentualComRealMotivo(multas: any[]): number {
    if (!Array.isArray(multas) || multas.length === 0) return 0;
    const comMotivo = this.contarComRealMotivo(multas);
    return (comMotivo / multas.length) * 100;
  }

  private processarEstatisticasPorRealMotivo(multas: any[]): Array<{
    categoria: string;
    total: number;
    valor: number;
    percentual: number;
    exemplos: string[];
  }> {
    if (!Array.isArray(multas)) return [];
    
    const categoriaMap = multas.reduce((acc: any, multa) => {
      if (!multa.observacaoRealMotivo || multa.observacaoRealMotivo.trim().length === 0) {
        return acc;
      }
      
      const categoria = this.categorizarRealMotivo(multa.observacaoRealMotivo);
      
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          total: 0,
          valor: 0,
          percentual: 0,
          exemplos: []
        };
      }
      
      acc[categoria].total++;
      acc[categoria].valor += parseFloat(multa.valorMulta) || 0;
      
      // Adicionar exemplo se ainda não temos 3
      if (acc[categoria].exemplos.length < 3) {
        const exemplo = multa.observacaoRealMotivo.length > 100 
          ? multa.observacaoRealMotivo.substring(0, 100) + '...'
          : multa.observacaoRealMotivo;
        acc[categoria].exemplos.push(exemplo);
      }
      
      return acc;
    }, {});
    
    const total = multas.length;
    
    return Object.values(categoriaMap).map((item: any) => ({
      ...item,
      percentual: total > 0 ? (item.total / total) * 100 : 0
    })).sort((a: any, b: any) => b.total - a.total);
  }

  // Métodos auxiliares para cálculos (CORRIGIDOS)
  private calcularValorTotal(multas: any[]): number {
    if (!Array.isArray(multas)) return 0;
    return multas.reduce((total, multa) => {
      const valor = parseFloat(multa.valorMulta) || 0;
      return total + valor;
    }, 0);
  }

  private contarPorTipo(multas: any[], tipo: string): number {
    if (!Array.isArray(multas)) return 0;
    return multas.filter(multa => {
      if (tipo === 'SEMOB') return multa.codigoOrg === '16';
      if (tipo === 'TRANSITO') return multa.codigoOrg !== '16';
      return false;
    }).length;
  }

  private contarPorResponsavel(multas: any[], responsavel: string): number {
    if (!Array.isArray(multas)) return 0;
    return multas.filter(multa => multa.responsavelMulta === responsavel).length;
  }

  private contarAlertasDefesa(multas: any[]): number {
    if (!Array.isArray(multas)) return 0;
        const agora = new Date();
    return multas.filter(multa => {
      try {
        if (multa.dataPagtoMulta || multa.numeroRecursoMulta) return false;
        const dataVencimento = multa.dataVectoMulta ? new Date(multa.dataVectoMulta) : null;
        if (!dataVencimento) return false;
        const diasParaVencimento = Math.ceil((dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
        return diasParaVencimento > 0 && diasParaVencimento <= 15;
      } catch (error) {
        return false;
      }
    }).length;
  }

  // Processar estatísticas por setor (EXISTENTE)
  private processarEstatisticasPorSetor(estatisticas: any[]): Array<{
    setor: { codigo: number; nome: string; };
    totalMultas: number;
    valorTotal: number;
    multasComMudanca: number;
    percentualDoTotal: number;
  }> {
    if (!Array.isArray(estatisticas)) return [];
    
    return estatisticas.map(stat => ({
      setor: {
        codigo: stat.setor?.codigo || 0,
        nome: stat.setor?.nome || 'Setor Desconhecido'
      },
      totalMultas: stat.totalMultas || 0,
      valorTotal: stat.valorTotal || 0,
      multasComMudanca: stat.multasComMudanca || 0,
      percentualDoTotal: stat.percentualDoTotal || 0
    }));
  }

  // ✅ MÉTODO ATUALIZADO PARA GERAR ANALYTICS COM REAL MOTIVO

  // Gerar analytics com dados de setor (ATUALIZADO)
  private gerarAnalyticsComSetor(multas: any[]): AnalyticsEnhanced {
    if (!Array.isArray(multas) || multas.length === 0) {
      return this.gerarAnalyticsVazio();
    }
  
    try {
      // Distribuição por setor
      const setores = multas.reduce((acc: any, multa) => {
        if (multa.setorNaDataInfracao) {
          const codigo = multa.setorNaDataInfracao.codigoGaragem;
          const nome = multa.setorNaDataInfracao.nomeGaragem;
          
          if (!acc[codigo]) {
            acc[codigo] = {
              codigo,
              nome,
              total: 0,
              valor: 0,
              percentual: 0,
              multasComMudanca: 0
            };
          }
          
          acc[codigo].total++;
          acc[codigo].valor += parseFloat(multa.valorMulta) || 0;
          if (multa.setorMudou) {
            acc[codigo].multasComMudanca++;
          }
        }
        return acc;
      }, {});
    
      const distribuicaoPorSetor = Object.values(setores).map((setor: any) => ({
        ...setor,
        percentual: multas.length > 0 ? (setor.total / multas.length) * 100 : 0
      }));
    
      // Distribuição por tipo (CORRIGIDA)
      const tipoSemob = this.contarPorTipo(multas, 'SEMOB');
      const tipoTransito = this.contarPorTipo(multas, 'TRANSITO');
      const totalTipos = tipoSemob + tipoTransito;
    
      const distribuicaoPorTipo = [
        {
          tipo: 'SEMOB',
          total: tipoSemob,
          valor: multas
            .filter(m => m.codigoOrg === '16')
            .reduce((sum, m) => sum + (parseFloat(m.valorMulta) || 0), 0),
          percentual: totalTipos > 0 ? (tipoSemob / totalTipos) * 100 : 0
        },
        {
          tipo: 'TRANSITO',
          total: tipoTransito,
          valor: multas
            .filter(m => m.codigoOrg !== '16')
            .reduce((sum, m) => sum + (parseFloat(m.valorMulta) || 0), 0),
          percentual: totalTipos > 0 ? (tipoTransito / totalTipos) * 100 : 0
        }
      ];
    
      // Distribuição por gravidade (CORRIGIDA)
      const gravidadeMap = multas.reduce((acc: any, multa) => {
        const gravidade = multa.grupoInfracao || 'INDEFINIDO';
        if (!acc[gravidade]) {
          acc[gravidade] = { total: 0, valor: 0 };
        }
        acc[gravidade].total++;
        acc[gravidade].valor += parseFloat(multa.valorMulta) || 0;
        return acc;
      }, {});
    
      const distribuicaoPorGravidade = Object.entries(gravidadeMap).map(([gravidade, data]: [string, any]) => ({
        gravidade,
        total: data.total,
        valor: data.valor,
        percentual: multas.length > 0 ? (data.total / multas.length) * 100 : 0
      }));

      // ✅ NOVA DISTRIBUIÇÃO POR REAL MOTIVO
      const realMotivoMap = multas.reduce((acc: any, multa) => {
        const categoria = multa.realMotivoCategoria || this.categorizarRealMotivo(multa.observacaoRealMotivo) || 'SEM_MOTIVO';
        
        if (!acc[categoria]) {
          acc[categoria] = {
            categoria,
            total: 0,
            valor: 0,
            percentual: 0,
            palavrasChave: new Set()
          };
        }
        
        acc[categoria].total++;
        acc[categoria].valor += parseFloat(multa.valorMulta) || 0;
        
        // Extrair palavras-chave do real motivo
        if (multa.observacaoRealMotivo) {
          const palavras = multa.observacaoRealMotivo
            .toLowerCase()
            .split(/\s+/)
            .filter(palavra => palavra.length > 3)
            .slice(0, 3); // Primeiras 3 palavras significativas
          
          palavras.forEach(palavra => acc[categoria].palavrasChave.add(palavra));
        }
        
        return acc;
      }, {});
      
      const distribuicaoPorRealMotivo = Object.values(realMotivoMap).map((item: any) => ({
        categoria: item.categoria,
        total: item.total,
        valor: item.valor,
        percentual: multas.length > 0 ? (item.total / multas.length) * 100 : 0,
        palavrasChave: Array.from(item.palavrasChave).slice(0, 5) // Top 5 palavras-chave
      })).sort((a: any, b: any) => b.total - a.total);
    
      // Distribuição por horário (CORRIGIDA)
      const horarioMap = multas.reduce((acc: any, multa) => {
        if (multa.dataHoraMulta) {
          try {
            const hora = new Date(multa.dataHoraMulta).getHours();
            if (!isNaN(hora) && hora >= 0 && hora <= 23) {
              if (!acc[hora]) {
                acc[hora] = { total: 0 };
              }
              acc[hora].total++;
            }
          } catch (error) {
            // Ignorar erros de data inválida
          }
        }
        return acc;
      }, {});
    
      const distribuicaoPorHorario = Array.from({ length: 24 }, (_, hora) => ({
        hora,
        total: horarioMap[hora]?.total || 0,
        periodo: this.obterPeriodoDia(hora)
      }));
    
      // Top agentes (CORRIGIDO)
      const agentesMap = multas.reduce((acc: any, multa) => {
        if (multa.agenteDescricao || multa.agenteCodigo) {
          const codigo = multa.agenteCodigo || 'SEM_CODIGO';
          const nome = multa.agenteDescricao || 'SEM_NOME';
          
          if (!acc[codigo]) {
            acc[codigo] = {
              codigo,
              nome,
              matricula: multa.agenteMatriculaFiscal,
              total: 0,
              valor: 0
            };
          }
          acc[codigo].total++;
          acc[codigo].valor += parseFloat(multa.valorMulta) || 0;
        }
        return acc;
      }, {});
    
      const topAgentes = Object.values(agentesMap)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);

      // Top locais (CORRIGIDO)
      const locaisMap = multas.reduce((acc: any, multa) => {
        if (multa.localMulta) {
          const local = multa.localMulta;
          if (!acc[local]) {
            acc[local] = { local, total: 0, valor: 0 };
          }
          acc[local].total++;
          acc[local].valor += parseFloat(multa.valorMulta) || 0;
        }
        return acc;
      }, {});

      const topLocais = Object.values(locaisMap)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);

      // ✅ TOP REAL MOTIVOS
      const topRealMotivos = distribuicaoPorRealMotivo
        .filter((item: any) => item.categoria !== 'SEM_MOTIVO')
        .slice(0, 10)
        .map((item: any) => ({
          categoria: item.categoria,
          total: item.total,
          valor: item.valor,
          percentual: item.percentual,
          exemplos: multas
            .filter(m => (m.realMotivoCategoria || this.categorizarRealMotivo(m.observacaoRealMotivo)) === item.categoria)
            .slice(0, 3)
            .map(m => m.realMotivoResumo || m.observacaoRealMotivo?.substring(0, 50) + '...')
            .filter(Boolean)
        }));

      // ✅ ESTATÍSTICAS DE REAL MOTIVO
      const totalComMotivo = multas.filter(m => m.temObservacaoRealMotivo || (m.observacaoRealMotivo && m.observacaoRealMotivo.trim().length > 0)).length;
      const totalSemMotivo = multas.length - totalComMotivo;
      const percentualPreenchimento = multas.length > 0 ? (totalComMotivo / multas.length) * 100 : 0;
      
      const categoriasMaisFrequentes = distribuicaoPorRealMotivo
        .filter((item: any) => item.categoria !== 'SEM_MOTIVO')
        .slice(0, 5)
        .map((item: any) => ({
          categoria: item.categoria,
          frequencia: item.total
        }));

      const tamanhoMedioTexto = totalComMotivo > 0 
        ? multas
            .filter(m => m.observacaoRealMotivo)
            .reduce((sum, m) => sum + (m.observacaoRealMotivo?.length || 0), 0) / totalComMotivo
        : 0;

      // Palavras mais comuns
      const palavrasMap = new Map<string, number>();
      multas
        .filter(m => m.observacaoRealMotivo)
        .forEach(m => {
          const palavras = m.observacaoRealMotivo
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(palavra => palavra.length > 3);
          
          palavras.forEach(palavra => {
            palavrasMap.set(palavra, (palavrasMap.get(palavra) || 0) + 1);
          });
        });

      const palavrasMaisComuns = Array.from(palavrasMap.entries())
        .map(([palavra, frequencia]) => ({ palavra, frequencia }))
        .sort((a, b) => b.frequencia - a.frequencia)
        .slice(0, 20);

      return {
        distribuicaoPorTipo,
        distribuicaoPorGravidade,
        distribuicaoPorArea: [],
        distribuicaoPorResponsavel: [],
        distribuicaoPorHorario,
        distribuicaoPorSetor,
        distribuicaoPorRealMotivo,
        topAgentes,
        topLocais,
        topCausasReais: [],
        topRealMotivos,
        alertasDefesa: this.contarAlertasDefesa(multas),
        evolucaoMensal: [],
        estatisticasHorario: {
          horarioPico: this.calcularHorarioPico(distribuicaoPorHorario),
          horarioMenor: this.calcularHorarioMenor(distribuicaoPorHorario),
          mediaHoraria: multas.length > 0 ? multas.length / 24 : 0,
          distribuicaoPorPeriodo: this.calcularDistribuicaoPorPeriodo(distribuicaoPorHorario)
        },
        estatisticasMudancasSetor: {
          totalMudancas: multas.filter(m => m.setorMudou).length,
          impactoFinanceiro: multas
            .filter(m => m.setorMudou)
            .reduce((total, m) => total + (parseFloat(m.valorMulta) || 0), 0),
          setoresMaisAfetados: []
        },
        estatisticasRealMotivo: {
          totalComMotivo,
          totalSemMotivo,
          percentualPreenchimento,
          categoriasMaisFrequentes,
          tamanhoMedioTexto,
          palavrasMaisComuns
        }
      };
    } catch (error) {
      console.error('❌ [Service] Erro ao gerar analytics com real motivo:', error);
      return this.gerarAnalyticsVazio();
    }
  }

  // Métodos auxiliares adicionais (CORRIGIDOS)
  private obterPeriodoDia(hora: number): string {
    if (hora >= 6 && hora < 12) return 'Manhã';
    if (hora >= 12 && hora < 18) return 'Tarde';
    if (hora >= 18 && hora < 24) return 'Noite';
    return 'Madrugada';
  }

  private calcularHorarioPico(distribuicao: any[]): number | null {
    if (!Array.isArray(distribuicao) || distribuicao.length === 0) return null;
    try {
      const pico = distribuicao.reduce((max, current) => 
        (current.total || 0) > (max.total || 0) ? current : max
      );
      return pico.hora;
    } catch (error) {
      return null;
    }
  }

  private calcularHorarioMenor(distribuicao: any[]): number | null {
    if (!Array.isArray(distribuicao) || distribuicao.length === 0) return null;
    try {
      const menor = distribuicao.reduce((min, current) => 
        (current.total || 0) < (min.total || 0) ? current : min
      );
      return menor.hora;
    } catch (error) {
      return null;
    }
  }

  private calcularDistribuicaoPorPeriodo(distribuicao: any[]): any {
    if (!Array.isArray(distribuicao)) {
      return { manha: 0, tarde: 0, noite: 0, madrugada: 0 };
    }
    
    try {
      return {
        manha: distribuicao.filter(d => d.hora >= 6 && d.hora < 12).reduce((sum, d) => sum + (d.total || 0), 0),
        tarde: distribuicao.filter(d => d.hora >= 12 && d.hora < 18).reduce((sum, d) => sum + (d.total || 0), 0),
        noite: distribuicao.filter(d => d.hora >= 18 && d.hora < 24).reduce((sum, d) => sum + (d.total || 0), 0),
        madrugada: distribuicao.filter(d => d.hora >= 0 && d.hora < 6).reduce((sum, d) => sum + (d.total || 0), 0)
      };
    } catch (error) {
      return { manha: 0, tarde: 0, noite: 0, madrugada: 0 };
    }
  }

  // ✅ MÉTODO ATUALIZADO PARA GERAR RESPOSTA VAZIA COM REAL MOTIVO

  // Gerar resposta vazia (ATUALIZADO)
  private gerarRespostaVazia(): MultaEnhancedResponse {
    return {
      success: false,
      message: 'Nenhuma multa encontrada',
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      },
      resumo: {
        totalMultas: 0,
        valorTotal: 0,
        multasSemob: 0,
        multasTransito: 0,
        alertasDefesa: 0,
        multasFuncionario: 0,
        multasEmpresa: 0,
        multasComSetor: 0,
        multasSemSetor: 0,
        multasComMudancaSetor: 0,
        percentualMapeamento: 0,
        percentualMudancas: 0,
        // ✅ NOVOS CAMPOS PARA REAL MOTIVO
        multasComRealMotivo: 0,
        multasSemRealMotivo: 0,
        percentualComRealMotivo: 0,
      },
      estatisticasPorSetor: [],
      // ✅ NOVAS ESTATÍSTICAS POR REAL MOTIVO
      estatisticasPorRealMotivo: [],
      analytics: this.gerarAnalyticsVazio(),
      timestamp: new Date().toISOString(),
      executionTime: '0ms',
      endpoint: 'error'
    };
  }

  // ✅ MÉTODO ATUALIZADO PARA GERAR ANALYTICS VAZIO COM REAL MOTIVO

  private gerarAnalyticsVazio(): AnalyticsEnhanced {
    return {
      distribuicaoPorTipo: [],
      distribuicaoPorGravidade: [],
      distribuicaoPorArea: [],
      distribuicaoPorResponsavel: [],
      distribuicaoPorHorario: [],
      distribuicaoPorSetor: [],
      // ✅ NOVOS CAMPOS PARA REAL MOTIVO
      distribuicaoPorRealMotivo: [],
      topAgentes: [],
      topLocais: [],
      topCausasReais: [],
      topRealMotivos: [],
      alertasDefesa: 0,
      evolucaoMensal: [],
      estatisticasHorario: {
        horarioPico: null,
        horarioMenor: null,
        mediaHoraria: 0,
        distribuicaoPorPeriodo: {
          manha: 0,
          tarde: 0,
          noite: 0,
          madrugada: 0
        }
      },
      estatisticasRealMotivo: {
        totalComMotivo: 0,
        totalSemMotivo: 0,
        percentualPreenchimento: 0,
        categoriasMaisFrequentes: [],
        tamanhoMedioTexto: 0,
        palavrasMaisComuns: []
      }
    };
  }

  // ✅ UTILITÁRIOS PÚBLICOS CORRIGIDOS

  // Utilitários para display
  formatCurrency(value: number | string | undefined): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return 'Data Inválida';
    }
  }

  formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('pt-BR');
    }
    catch {
      return 'Data Inválida';
    }
  }

  obterCorPorTipo(tipo: string | undefined): string {
    const cores: { [key: string]: string } = {
      'SEMOB': '#3B82F6',      // Azul
      'TRANSITO': '#EF4444',   // Vermelho
      'FUNCIONARIO': '#10B981', // Verde - Mapeia tipoResponsavel
      'EMPRESA': '#F59E0B',     // Amarelo - Mapeia tipoResponsavel
      'INDEFINIDO': '#6B7280',  // Cinza
    };
    return cores[tipo || 'INDEFINIDO'] || '#6B7280';
  }

  obterCorPorGravidade(gravidade: string | undefined): string {
    const cores: { [key: string]: string } = {
      'A - LEVE': '#10B981',  // Verde
      'B - MÉDIA': '#F59E0B',  // Amarelo
      'C - GRAVE/REINCIDÊNCIA': '#EF4444',  // Vermelho
      'LEVE': '#10B981',
      'MEDIA': '#F59E0B',
      'GRAVE': '#F97316',
      'GRAVISSIMA': '#EF4444',
      'INDEFINIDO': '#6B7280',
    };
    return cores[gravidade || 'INDEFINIDO'] || '#6B7280';
  }

  obterCorPorStatusMulta(status: string | undefined): string {
    const cores: { [key: string]: string } = {
      'PAGA': '#10B981',       // Verde
      'PAGO': '#10B981',       // Verde
      'VENCIDA': '#EF4444',    // Vermelho
      'VENCIDO': '#EF4444',    // Vermelho
      'RECURSO': '#F59E0B',    // Amarelo
      'PENDENTE': '#3B82F6',   // Azul
      'CANCELADA': '#6B7280',  // Cinza
    };
    return cores[status || 'INDEFINIDO'] || '#6B7280';
  }

  obterCorPorSetor(codigoSetor: number | undefined): string {
    if (!codigoSetor) return '#6B7280';
    const cores: { [key: number]: string } = {
      31: '#3B82F6',   // PARANOÁ - Azul
      124: '#10B981',  // SANTA MARIA - Verde
      239: '#F59E0B',  // SÃO SEBASTIÃO - Amarelo
      240: '#EF4444',  // GAMA - Vermelho
    };
    return cores[codigoSetor] || '#6B7280';
  }

  obterNomeSetor(codigoSetor: number | undefined): string {
    if (!codigoSetor) return 'Setor Desconhecido';
    const nomes: { [key: number]: string } = {
      31: 'PARANOÁ',
      124: 'SANTA MARIA',
      239: 'SÃO SEBASTIÃO',
      240: 'GAMA',
    };
    return nomes[codigoSetor] || `Setor ${codigoSetor}`;
  }

  obterIconeSetor(codigoSetor: number | undefined): string {
    if (!codigoSetor) return '🏢';
    const icones: { [key: number]: string } = {
      31: '🏢',   // PARANOÁ
      124: '🏛️',  // SANTA MARIA
      239: '🏗️',  // SÃO SEBASTIÃO
      240: '🏭',   // GAMA
    };
    return icones[codigoSetor] || '🏢';
  }

  obterIconePorStatus(status: string | undefined): string {
    const icones: { [key: string]: string } = {
      'PAGO': '✅',
      'PAGA': '✅',
      'PENDENTE': '⏳',
      'VENCIDO': '❌',
      'VENCIDA': '❌',
      'RECURSO': '⚖️',
    };
    return icones[status || 'PENDENTE'] || '❓';
  }

  obterDescricaoStatus(status: string | undefined): string {
    const descricoes: { [key: string]: string } = {
      'PAGO': 'Multa quitada',
      'PAGA': 'Multa quitada',
      'PENDENTE': 'Aguardando pagamento',
      'VENCIDO': 'Prazo de pagamento vencido',
      'VENCIDA': 'Prazo de pagamento vencido',
      'RECURSO': 'Em processo de recurso',
    };
    return descricoes[status || 'PENDENTE'] || 'Status indefinido';
  }

  // ✅ NOVOS UTILITÁRIOS PARA REAL MOTIVO

  // Obter cor por categoria de real motivo
  obterCorPorCategoriaRealMotivo(categoria: string | undefined): string {
    const cores: { [key: string]: string } = {
      'VELOCIDADE': '#EF4444',        // Vermelho
      'ESTACIONAMENTO': '#F59E0B',    // Amarelo
      'SEMAFORO': '#DC2626',          // Vermelho escuro
      'CONVERSAO': '#F97316',         // Laranja
      'CELULAR': '#8B5CF6',           // Roxo
      'CINTO': '#10B981',             // Verde
      'CAPACETE': '#059669',          // Verde escuro
      'DOCUMENTACAO': '#3B82F6',      // Azul
      'ULTRAPASSAGEM': '#EC4899',     // Rosa
      'PREFERENCIAL': '#6366F1',      // Índigo
      'TRANSPORTE_PUBLICO': '#14B8A6', // Teal
      'PARADA_OBRIGATORIA': '#DC2626', // Vermelho
      'FAIXA_PEDESTRES': '#7C3AED',   // Violeta
      'ALCOOL': '#B91C1C',            // Vermelho escuro
      'OUTROS': '#6B7280',            // Cinza
      'SEM_MOTIVO': '#9CA3AF',        // Cinza claro
      'INDEFINIDO': '#6B7280',        // Cinza
    };
    return cores[categoria || 'INDEFINIDO'] || '#6B7280';
  }

  // Obter ícone por categoria de real motivo
  obterIconePorCategoriaRealMotivo(categoria: string | undefined): string {
    const icones: { [key: string]: string } = {
      'VELOCIDADE': '⚡',
      'ESTACIONAMENTO': '🚗',
      'SEMAFORO': '🚦',
      'CONVERSAO': '↩️',
      'CELULAR': '📱',
      'CINTO': '🔒',
      'CAPACETE': '🪖',
      'DOCUMENTACAO': '📄',
      'ULTRAPASSAGEM': '🏃',
      'PREFERENCIAL': '⚠️',
      'TRANSPORTE_PUBLICO': '🚌',
      'PARADA_OBRIGATORIA': '🛑',
      'FAIXA_PEDESTRES': '🚶',
      'ALCOOL': '🍺',
      'OUTROS': '📋',
      'SEM_MOTIVO': '❓',
      'INDEFINIDO': '❓',
    };
    return icones[categoria || 'INDEFINIDO'] || '❓';
  }

  // Obter descrição amigável da categoria
  obterDescricaoCategoriaRealMotivo(categoria: string | undefined): string {
    const descricoes: { [key: string]: string } = {
      'VELOCIDADE': 'Excesso de velocidade',
      'ESTACIONAMENTO': 'Estacionamento irregular',
      'SEMAFORO': 'Desrespeito ao semáforo',
      'CONVERSAO': 'Conversão proibida',
      'CELULAR': 'Uso de celular ao dirigir',
      'CINTO': 'Não uso do cinto de segurança',
      'CAPACETE': 'Não uso de capacete',
      'DOCUMENTACAO': 'Problemas de documentação',
      'ULTRAPASSAGEM': 'Ultrapassagem irregular',
      'PREFERENCIAL': 'Desrespeito à via preferencial',
      'TRANSPORTE_PUBLICO': 'Uso indevido de faixa exclusiva',
      'PARADA_OBRIGATORIA': 'Desrespeito à placa de PARE',
      'FAIXA_PEDESTRES': 'Desrespeito à faixa de pedestres',
      'ALCOOL': 'Dirigir sob influência de álcool',
      'OUTROS': 'Outras infrações',
      'SEM_MOTIVO': 'Sem observação de motivo',
      'INDEFINIDO': 'Categoria indefinida',
    };
    return descricoes[categoria || 'INDEFINIDO'] || 'Categoria não identificada';
  }

  // ✅ MÉTODOS AUXILIARES PARA VALIDAÇÃO E SEGURANÇA

  // Validar se um valor é um número válido
  private isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  // Validar se uma data é válida
  private isValidDate(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  // Sanitizar valor numérico
  private sanitizeNumber(value: any, defaultValue: number = 0): number {
    if (this.isValidNumber(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return this.isValidNumber(parsed) ? parsed : defaultValue;
    }
    return defaultValue;
  }

  // Sanitizar string
  private sanitizeString(value: any, defaultValue: string = ''): string {
    if (typeof value === 'string') return value;
    if (value !== null && value !== undefined) return String(value);
    return defaultValue;
  }

  // Validar estrutura de resposta da API
  private validateApiResponse(response: any): boolean {
    return (
      response &&
      typeof response === 'object' &&
      typeof response.success === 'boolean' &&
      typeof response.message === 'string'
    );
  }

  // ✅ MÉTODOS DE DEBUGGING E LOGGING

  // Log de performance
  private logPerformance(operation: string, startTime: number): void {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`⏱️ [Service] ${operation} executado em ${duration}ms`);
  }

  // Log de erro detalhado
  private logError(operation: string, error: any, context?: any): void {
    console.error(`❌ [Service] Erro em ${operation}:`, {
      error: error.message || error,
      stack: error.stack,
      context
    });
  }

  // ✅ MÉTODOS DE CACHE E OTIMIZAÇÃO

  // Cache simples em memória para requests recentes
  private cache = new Map<string, { data: any; timestamp: number; }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Gerar chave de cache
  private generateCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  // Verificar cache
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      console.log(`💾 [Service] Cache hit para: ${key}`);
      return cached.data;
    }
    return null;
  }

  // Salvar no cache
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limpar cache antigo
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Limpar cache
  public limparCache(): void {
    this.cache.clear();
    console.log('🧹 [Service] Cache limpo');
  }

  // Obter estatísticas do cache
  public obterEstatisticasCache(): {
    tamanho: number;
    chaves: string[];
    ultimaLimpeza: string;
  } {
    return {
      tamanho: this.cache.size,
      chaves: Array.from(this.cache.keys()),
      ultimaLimpeza: new Date().toISOString()
    };
  }
}

export const multasEnhancedService = new MultasEnhancedService();
export default multasEnhancedService;