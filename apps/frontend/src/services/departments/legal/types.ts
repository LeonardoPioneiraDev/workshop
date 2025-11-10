// apps/frontend/src/services/departments/legal/types.ts - COMPLETO ATUALIZADO
export interface LegalDashboardResponse {
  success: boolean;
  timestamp: string;
  message?: string;
  dashboard?: {
    processos: {
      total: number;
      dados: LegalProcess[];
    };
    contratos: {
      total: number;
      dados: LegalContract[];
    };
    multas: {
      total: number;
      estatisticas: FineStatistics;
      dados: Fine[];
      camposCompletos: string;
    };
  };
  // ✅ Suporte para formato direto do backend
  resumoExecutivo?: {
    totalMultas: number;
    valorTotal: number;
    multasPagas: number;
    multasPendentes: number;
    multasVencidas: number;
    taxaArrecadacao: number;
    crescimentoMensal: number;
  };
  alertasCriticos?: any[];
  rankingGaragens?: any[];
  rankingAgentes?: any[];
  rankingInfracoes?: any[];
  rankingVeiculos?: any[];
  kpis?: any;
  metas?: any;
  tendencias?: any;
  versao?: string;
  campos?: string;
  cache?: string;
}

// apps/frontend/src/types/multa.ts
export interface MultaCompleta {
  // ✅ Campos principais
  id?: string;
  numeroAiMulta: string;
  descricaoInfra: string;
  prefixoVeic: string;
  placaVeiculo?: string;
  
  // ✅ Datas
  dataEmissaoMulta?: string;
  dataVencimento?: string;
  dataPagamento?: string;
  
  // ✅ Valores
  valorMulta?: number;
  valorPago?: number;
  valorAtualizado?: number;
  valorSaldo?: number;
  
  // ✅ Localização
  localMulta?: string;
  numeroLocalMulta?: string;
  kmLocalMulta?: string;
  sentidoLocalMulta?: string;
  bairroLocalMulta?: string;
  
  // ✅ Classificação (TRÂNSITO)
  gravidade?: 'LEVE' | 'MÉDIA' | 'GRAVE' | 'GRAVÍSSIMA';
  pontuacaoInfracao?: number;
  codigoInfracao?: string;
  grupoInfracao?: string;
  
  // ✅ Agente (SEMOB)
  agenteCodigo?: string;
  agenteDescricao?: string;
  agenteMatriculaFiscal?: string;
  nomeAgente?: string;
  
  // ✅ Status e situação
  statusMulta?: 'PAGA' | 'VENCIDA' | 'PENDENTE' | 'CANCELADA' | 'RECURSO';
  situacaoMulta?: string;
  responsavelMulta?: string;
  
  // ✅ Tipo de multa
  tipoMulta: 'TRANSITO' | 'SEMOB';
  
  // ✅ Recursos e observações
  numeroRecursoMulta?: string;
  dataRecursoMulta?: string;
  condicaoRecursoMulta?: string;
  observacao?: string;
  
  // ✅ Campos de controle
  createdAt?: string;
  updatedAt?: string;
  sincronizadoEm?: string;
}

export interface AnalyticsData {
  // ✅ Resumo geral
  resumoGeral: {
    totalMultas: number;
    valorTotal: number;
    valorMedio: number;
    multasTransito: number;
    multasSemob: number;
    multasPagas: number;
    multasVencidas: number;
    multasPendentes: number;
    taxaArrecadacao: number;
    crescimentoMensal: number;
  };
  
  // ✅ Distribuições
  distribuicoes: {
    porTipo: Array<{
      tipo: 'TRANSITO' | 'SEMOB';
      total: number;
      valor: number;
      percentual: number;
      color: string;
    }>;
    
    porGravidade: Array<{
      gravidade: string;
      total: number;
      valor: number;
      pontos?: number;
      percentual: number;
      color: string;
    }>;
    
    porStatus: Array<{
      status: string;
      total: number;
      valor: number;
      percentual: number;
      color: string;
    }>;
  };
  
  // ✅ Rankings
  rankings: {
    agentes: Array<{
      codigo: string;
      nome: string;
      matricula?: string;
      total: number;
      valor: number;
      tipoMulta: 'SEMOB';
    }>;
    
    locais: Array<{
      local: string;
      total: number;
      valor: number;
      tipoMulta: 'TRANSITO' | 'SEMOB';
    }>;
    
    infracoes: Array<{
      codigo: string;
      descricao: string;
      grupo: string;
      total: number;
      valor: number;
      gravidade?: string;
      pontos?: number;
    }>;
    
    veiculos: Array<{
      prefixo: string;
      placa?: string;
      total: number;
      valor: number;
    }>;
  };
  
  // ✅ Evolução temporal
  evolucaoTemporal: {
    mensal: Array<{
      mes: string;
      totalTransito: number;
      totalSemob: number;
      valorTransito: number;
      valorSemob: number;
      crescimento: number;
    }>;
    
    diaria: Array<{
      data: string;
      total: number;
      valor: number;
    }>;
  };
  
  // ✅ Metas e KPIs
  kpis: {
    metaArrecadacao: number;
    percentualMeta: number;
    mediaMultasDia: number;
    tempoMedioVencimento: number;
    eficienciaCobranca: number;
  };
}

export interface FiltrosMulta {
  // ✅ Filtros temporais
  dataInicio?: string;
  dataFim?: string;
  
  // ✅ Filtros por tipo
  tipoMulta?: 'TODOS' | 'TRANSITO' | 'SEMOB';
  gravidade?: string;
  statusMulta?: string;
  
  // ✅ Filtros por agente/local
  agenteCodigo?: string;
  agenteNome?: string;
  localMulta?: string;
  
  // ✅ Filtros por veículo
  prefixoVeiculo?: string;
  placaVeiculo?: string;
  
  // ✅ Filtros por valor
  valorMinimo?: number;
  valorMaximo?: number;
  
  // ✅ Filtros de busca
  busca?: string;
  
  // ✅ Paginação e ordenação
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  
  // ✅ Agrupamento
  groupBy?: 'agente' | 'veiculo' | 'infracao' | 'mes' | 'dia' | 'local' | 'gravidade';
}
// ✅ Interface flexível para multas (suporta ambos os formatos após adaptação)
export interface Fine {
  id?: string;
  numero_ait?: string;
  prefixo_veiculo?: string;
  placa_veiculo?: string;
  descricao_infracao?: string;
  gravidade_infracao?: 'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA';
  valor_multa?: string; // Mantido como string para receber do backend
  status_multa?: 'PAGA' | 'VENCIDA' | 'PENDENTE' | 'CANCELADA';
  data_emissao?: string;
  data_vencimento?: string;
  local_infracao?: string;
  nome_agente?: string;
  nome_garagem?: string;
  // Outros campos do backend que são passados pelo adapter
  codigo_veiculo?: string;
  codigo_infracao?: string;
  pontuacao_infracao?: number;
  grupo_infracao?: string;
  valor_atualizado?: string;
  valor_pago?: string;
  data_pagamento?: string;
  data_recurso?: string;
  numero_local_multa?: string;
  km_local_multa?: string;
  sentido_local_multa?: string;
  bairro_local_multa?: string;
  codigo_agente_autuador?: string;
  matricula_agente?: string;
  codigo_empresa?: string;
  codigo_garagem?: string;
  numero_recurso?: string;
  condicao_recurso?: string;
  numero_processo?: string;
  auto_infracao?: string;
  notificacao1?: string;
  notificacao2?: string;
  notificacao3?: string;
  observacao?: string;
  responsavel_multa?: string;
  reincidencia?: string;
  dias_vencidos?: number;
  juros_calculados?: string;
  multa_vencimento?: string;
  prioridade_cobranca?: string;
  score_cobranca?: number;
  tags?: string;
  data_cache?: string;
  ultima_atualizacao?: string;
  fonte_dados?: string;
  hash_dados?: string;
  dados_completos?: boolean;
  dados_validados?: boolean;
  erros_validacao?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;

  // Propriedades do adapter
  codigoMulta?: string;
  numeroAIT?: string;
  dataEmissao?: string;
  dataEmissaoFormatada?: string;
  dataVencimento?: string;
  dataVencimentoFormatada?: string;
  valorMulta?: number; // Convertido para number pelo adapter
  valorPago?: number;
  valorSaldo?: number;
  localInfracao?: string;
  situacaoMulta?: string;
  descricaoInfracao?: string;
  pontuacaoInfracao?: number;
  gravidadeInfracao?: 'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA';
  codigoAgente?: string;
  nomeAgente?: string;
  matriculaAgente?: string;
  statusMulta?: 'PAGA' | 'VENCIDA' | 'PENDENTE' | 'VENCENDO_30_DIAS';
  diasVencimento?: number;
  prioridadeCobranca?: 'QUITADA' | 'URGENTE' | 'ALTA' | 'NORMAL';
  dadosCompletos?: FineCompleteData;
}

export interface FineCompleteData {
  organizacao?: {
    codIntFunc?: string;
    codigoUf?: string;
    codMunic?: string;
    codigoOrg?: string;
    codAreaCompetencia?: string;
    codOrgOriginal?: string;
  };
  localizacao?: {
    numeroLocalMulta?: string;
    dataHoraMulta?: string;
    kmLocalMulta?: number;
    metrosLocalMulta?: number;
    sentidoLocalMulta?: string;
    bairroLocalMulta?: string;
  };
  valores?: {
    totalParcelasMulta?: number;
    valorTotalMulta?: number;
    vlrAcrescimo?: number;
    vlrDesconto?: number;
    valorPagamento?: number;
    valorAtualizado?: number;
    valorJulgado?: number;
    totalPago?: number;
  };
}

export interface FineStatistics {
  resumo?: {
    totalMultas: number;
    valorTotal: string;
    valorMedio: string;
    multasPagas: number;
    multasVencidas: number;
    multasPendentes: number;
    percentualPagas: string;
  };
  distribuicoes?: {
    porStatus: Record<string, number>;
    porGravidade: Record<string, number>;
    porGaragem: Record<string, number>;
    porAgente: Record<string, number>;
  };
}

export interface FineFilters {
  dataInicio?: string;
  dataFim?: string;
  prefixoVeiculo?: string;
  codigoGaragem?: number;
  statusMulta?: string;
  gravidadeInfracao?: string;
  limite?: number;
  forcarAtualizacao?: boolean;
  offset?: number; // Adicionado para paginação
  orderBy?: string; // Adicionado para ordenação
  orderDirection?: 'ASC' | 'DESC'; // Adicionado para ordenação
  nomeAgente?: string; // Adicionado aos filtros
  busca?: string; // Adicionado aos filtros
}

export interface ProcessFilters {
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  limite?: number;
}

export interface ContractFilters {
  limite?: number;
}

// ✅ Interface para processos
export interface LegalProcess {
  id?: number;
  numeroProcesso?: string;
  tipo?: string;
  status?: string;
  titulo?: string;
  descricao?: string;
  valorCausa?: number;
  dataAbertura?: string;
  dataUltimaMovimentacao?: string;
  responsavel?: string;
  tribunal?: string;
  vara?: string;
  prioridade?: string;
  tags?: string[];
  
  // Propriedades do adapter
  numeroSequencial?: number;
  descricaoProcesso?: string;
  statusProcesso?: 'ATIVO' | 'PENDENTE' | 'CONCLUIDO' | 'SUSPENSO';
  tipoProcesso?: 'TRABALHISTA' | 'CIVIL' | 'ADMINISTRATIVO';
  dataAberturaFormatada?: string;
  responsavelAdvogado?: string;
}

// ✅ Interface para contratos
export interface LegalContract {
  id?: number;
  numeroContrato?: string;
  tipo?: string;
  status?: string;
  titulo?: string;
  descricao?: string;
  valorContrato?: number;
  dataInicio?: string;
  dataVencimento?: string;
  dataAssinatura?: string;
  fornecedor?: string;
  responsavel?: string;
  departamento?: string;
  renovacaoAutomatica?: boolean;
  prazoRenovacao?: number;
  observacoes?: string;
  anexos?: string[];
  
  // Propriedades do adapter
  codigoContrato?: string;
  descricaoContrato?: string;
  statusContrato?: 'ATIVO' | 'RENOVACAO' | 'VENCENDO';
  dataInicioFormatada?: string;
  dataVencimentoFormatada?: string;
  valor?: number;
  valorTotal?: number;
  valorMensal?: number;
  contratada?: string;
  objeto?: string;
  dataFim?: string;
}

// ✅ Estrutura de resposta da API com o campo `data` genérico para o conteúdo principal
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T; // O 'data' aqui pode ser um array, um objeto com 'processos', 'multas', etc.
  count?: number; // Para o total de registros (paginação)
  executionTime?: string;
  origem?: string;
  cache?: any;
  periodo?: {
    dataInicio: string;
    dataFim: string;
  };
  filters?: any;
  estatisticas?: FineStatistics;
}
// =========================================================================
// NOVAS INTERFACES ESPECÍFICAS PARA ANALYTICS DE MULTAS COMPLETAS
// =========================================================================

// Interface de resultado do serviço multasCompletasService
export interface MultaCompletaResponse {
  success: boolean;
  message: string;
  data: MultaCompleta[]; // Array de multas detalhadas
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: { // Resumo geral, como já é retornado pelo backend
    totalMultas: number;
    valorTotal: number;
    valorMedio: number;
    valorMinimo: number;
    valorMaximo: number;
    multasPagas: number;
    multasVencidas: number;
    multasComRecurso: number;
    valorArrecadado: number;
    percentualPagas: string;
    percentualVencidas: string;
    percentualComRecurso: string;
    multasTransito?: number; // Campos adicionados pelo analytics do backend
    multasSemob?: number;
    valorMedioTransito?: number;
    valorMedioSemob?: number;
    totalAgentes?: number;
    totalVeiculos?: number;
    pontosTotal?: number;
  };
  groups?: Array<any>; // Para agrupamentos do backend, se houver
  analytics?: { // Estrutura de analytics mais detalhada do backend
    distribuicaoPorTipo: Array<{
      tipo: 'TRANSITO' | 'SEMOB';
      total: number;
      valor: number;
      percentual: number;
    }>;
    distribuicaoPorGravidade: Array<{
      gravidade: string;
      total: number;
      valor: number;
      pontos: number;
      percentual: number;
    }>;
    topAgentes: Array<{
      codigo: string;
      nome: string;
      total: number;
      valor: number;
    }>;
    topLocais: Array<{
      local: string;
      total: number;
      valor: number;
    }>;
    evolucaoMensal: Array<any>;
  };
}

// Interface para MultaCompleta (conforme sua entidade e mapeamento do backend)
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
  observacao?: string; // ✅ Campo importante para "causas reais"
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
  observacaoRealMotivo?: string; // ✅ Campo da causa real da multa
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
}

export interface MultaCompletaFilter {
  dataInicio?: string;
  dataFim?: string;
  prefixoVeic?: string;
  numeroAiMulta?: string;
  codigoVeic?: string;
  codigoInfra?: string;
  agenteCodigo?: string;
  agenteDescricao?: string;
  localMulta?: string;
  responsavelMulta?: string;
  situacao?: string; // 'paga', 'vencida', 'recurso', 'pendente'
  valorMinimo?: number;
  valorMaximo?: number;
  gruposInfracao?: string[];
  busca?: string; // busca geral
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  groupBy?: 'agente' | 'veiculo' | 'infracao' | 'mes' | 'dia';
  // Campos de filtro específicos do frontend que são mapeados para o backend
  agenteSemob?: string; // Mapeado para agenteCodigo ou agenteDescricao
  tipoInfracao?: string; // Mapeado para grupoInfracao
  // Campo para o motivo real da multa
  observacaoRealMotivo?: string; 
}


// Interfaces para os dados de "Top Causas"
export interface TopCausaMulta {
  motivo: string;
  total: number;
  valor: number;
}

// Adicionar no final do arquivo:
export { multasCompletasService } from './multasCompletasService';

// Interfaces adicionais para melhorar o sistema
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