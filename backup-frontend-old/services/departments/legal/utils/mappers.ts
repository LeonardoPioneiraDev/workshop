// apps/frontend/src/services/departments/legal/utils/mappers.ts

import { 
  Multa, 
  StatusMulta, 
  TipoMulta, 
  GravidadeInfracao,
  ResponsavelMulta,
  SetorInfo,
  SetorHistorico,
  Agente
} from '../types';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime,
  calculateDaysToExpiry,
  calculateTimeInSector,
  formatVehiclePrefix,
  formatVehiclePlate,
  formatMultaNumber,
  sanitizeNumber,
  sanitizeString
} from './formatters';

// =========================================================================
// MAPEADORES PRINCIPAIS
// =========================================================================

/**
 * Mapeia dados brutos do backend para interface Multa unificada
 * Consolida MultaCompleta, MultaEnhanced, Fine em uma única função
 */
export const mapToMulta = (rawData: any): Multa => {
  if (!rawData) {
    throw new Error('Dados inválidos para mapeamento de multa');
  }

  // ✅ Campos obrigatórios com fallbacks seguros
  const numeroAiMulta = sanitizeString(
    rawData.numeroAiMulta || 
    rawData.numero_ait || 
    rawData.numeroAIT ||
    rawData.numero_ai_multa
  );

  const prefixoVeic = sanitizeString(
    rawData.prefixoVeic || 
    rawData.prefixo_veiculo || 
    rawData.prefixoVeiculo ||
    rawData.prefixo_veic
  );

  const valorMulta = sanitizeNumber(
    rawData.valorMulta || 
    rawData.valor_multa || 
    rawData.valorTotalMulta ||
    rawData.valor_total_multa
  );

  if (!numeroAiMulta) {
    throw new Error('Número da multa é obrigatório');
  }

  // ✅ Mapeamento unificado
  const multa: Multa = {
    // Campos obrigatórios
    numeroAiMulta,
    prefixoVeic,
    valorMulta,

    // Campos essenciais
    descricaoInfra: sanitizeString(
      rawData.descricaoInfra || 
      rawData.descricao_infracao || 
      rawData.descricaoInfracao
    ),
    
    dataEmissaoMulta: sanitizeString(
      rawData.dataEmissaoMulta || 
      rawData.data_emissao || 
      rawData.dataEmissao ||
      rawData.data_emissao_multa
    ),
    
    dataVencimentoMulta: sanitizeString(
      rawData.dataVectoMulta || 
      rawData.data_vencimento || 
      rawData.dataVencimento ||
      rawData.data_vecto_multa
    ),
    
    localMulta: sanitizeString(
      rawData.localMulta || 
      rawData.local_infracao || 
      rawData.localInfracao ||
      rawData.local_multa
    ),

    // Campos de identificação
    codigoVeic: sanitizeString(
      rawData.codigoVeic || 
      rawData.codigo_veiculo || 
      rawData.codigoVeiculo
    ),
    
    codigoInfra: sanitizeString(
      rawData.codigoInfra || 
      rawData.codigo_infracao || 
      rawData.codigoInfracao
    ),
    
    placaVeiculo: sanitizeString(
      rawData.placaVeiculo || 
      rawData.placa_veiculo || 
      rawData.placa_veiculo
    ),

    // Campos de valor
    valorTotalMulta: sanitizeNumber(
      rawData.valorTotalMulta || 
      rawData.valor_total_multa ||
      rawData.totalParcelasMulta
    ),
    
    valorPago: sanitizeNumber(
      rawData.valorPago || 
      rawData.valor_pago ||
      rawData.totalPago
    ),
    
    valorAtualizado: sanitizeNumber(
      rawData.valorAtualizado || 
      rawData.valor_atualizado
    ),

    // Campos de data
    dataPagamentoMulta: sanitizeString(
      rawData.dataPagtoMulta || 
      rawData.data_pagamento || 
      rawData.dataPagamento ||
      rawData.data_pagto_multa
    ),
    
    dataRecursoMulta: sanitizeString(
      rawData.dataRecursoMulta || 
      rawData.data_recurso || 
      rawData.dataRecurso ||
      rawData.data_recurso_multa
    ),

    // Campos de responsabilidade
    responsavelMulta: mapResponsavelMulta(
      rawData.responsavelMulta || 
      rawData.responsavel_multa
    ),

    // Campos de infração
    pontuacaoInfracao: sanitizeNumber(
      rawData.pontuacaoInfracao || 
      rawData.pontuacao_infracao
    ),
    
    grupoInfracao: mapGrupoInfracao(
      rawData.grupoInfracao || 
      rawData.grupo_infracao ||
      rawData.gravidadeInfracao ||
      rawData.gravidade_infracao
    ),
    
    gravidadeInfracao: mapGravidadeInfracao(
      rawData.gravidadeInfracao || 
      rawData.gravidade_infracao ||
      rawData.grupoInfracao ||
      rawData.grupo_infracao
    ),

    // Campos de recurso
    numeroRecursoMulta: sanitizeString(
      rawData.numeroRecursoMulta || 
      rawData.numero_recurso || 
      rawData.numeroRecurso ||
      rawData.numero_recurso_multa
    ),
    
    condicaoRecursoMulta: sanitizeString(
      rawData.condicaoRecursoMulta || 
      rawData.condicao_recurso || 
      rawData.condicaoRecurso ||
      rawData.condicao_recurso_multa
    ),

    // Campos de observação
    observacao: sanitizeString(
      rawData.observacao || 
      rawData.observacoes
    ),
    
    observacaoRealMotivo: sanitizeString(
      rawData.observacaoRealMotivo || 
      rawData.observacao_real_motivo ||
      rawData.realMotivo
    ),

    // Campos de agente (SEMOB)
    agenteCodigo: sanitizeString(
      rawData.agenteCodigo || 
      rawData.codAgenteAutuador || 
      rawData.cod_agente_autuador ||
      rawData.codigo_agente
    ),
    
    agenteDescricao: sanitizeString(
      rawData.agenteDescricao || 
      rawData.desc_agente_autuador || 
      rawData.nome_agente ||
      rawData.nomeAgente
    ),
    
    agenteMatriculaFiscal: sanitizeString(
      rawData.agenteMatriculaFiscal || 
      rawData.matriculafiscal || 
      rawData.matricula_fiscal ||
      rawData.matriculaAgente
    ),

    // Campos de controle
    createdAt: sanitizeString(
      rawData.createdAt || 
      rawData.created_at ||
      rawData.data_criacao
    ),
    
    updatedAt: sanitizeString(
      rawData.updatedAt || 
      rawData.updated_at ||
      rawData.data_atualizacao
    ),
    
    sincronizadoEm: sanitizeString(
      rawData.sincronizadoEm || 
      rawData.sincronizado_em ||
      rawData.data_sincronizacao
    )
  };

  // ✅ Mapear setor se disponível
  if (rawData.setorAtual || rawData.setor_atual) {
    multa.setorAtual = mapSetorInfo(rawData.setorAtual || rawData.setor_atual);
  }

  if (rawData.setorNaDataInfracao || rawData.setor_na_data_infracao) {
    multa.setorNaDataInfracao = mapSetorHistorico(
      rawData.setorNaDataInfracao || rawData.setor_na_data_infracao
    );
  }

  if (rawData.setorMudou !== undefined) {
    multa.setorMudou = Boolean(rawData.setorMudou || rawData.setor_mudou);
  }

  // ✅ Calcular campos derivados
  multa.tipoMulta = calculateTipoMulta(multa);
  multa.statusMulta = calculateStatusMulta(multa);
  multa.diasParaVencimento = calculateDaysToExpiry(multa.dataVencimentoMulta);
  multa.alertaDefesa = multa.diasParaVencimento > 0 && multa.diasParaVencimento <= 15;
  multa.valorSaldo = calculateValorSaldo(multa);

  // ✅ Formatar campos para exibição
  multa.valorFormatado = formatCurrency(multa.valorMulta);
  multa.dataFormatada = formatDate(multa.dataEmissaoMulta);
  
  if (multa.setorNaDataInfracao) {
    multa.tempoNoSetor = calculateTimeInSector(
      multa.setorNaDataInfracao.dataInicio,
      multa.setorNaDataInfracao.dataFim
    );
  }

  return multa;
};

/**
 * Mapeia array de dados brutos para array de Multa
 */
export const mapToMultaArray = (rawDataArray: any[]): Multa[] => {
  if (!Array.isArray(rawDataArray)) {
    console.warn('Dados não são um array, retornando array vazio');
    return [];
  }

  return rawDataArray
    .map((item, index) => {
      try {
        return mapToMulta(item);
      } catch (error) {
        console.error(`Erro ao mapear multa no índice ${index}:`, error, item);
        return null;
      }
    })
    .filter((multa): multa is Multa => multa !== null);
};

// =========================================================================
// MAPEADORES ESPECÍFICOS
// =========================================================================

/**
 * Mapeia informações de setor
 */
export const mapSetorInfo = (rawSetor: any): SetorInfo | undefined => {
  if (!rawSetor) return undefined;

  return {
    codigoGaragem: sanitizeNumber(
      rawSetor.codigoGaragem || 
      rawSetor.codigo_garagem ||
      rawSetor.codigo
    ),
    nomeGaragem: sanitizeString(
      rawSetor.nomeGaragem || 
      rawSetor.nome_garagem ||
      rawSetor.nome ||
      `Setor ${rawSetor.codigoGaragem || rawSetor.codigo_garagem || 'Desconhecido'}`
    )
  };
};

/**
 * Mapeia histórico de setor
 */
export const mapSetorHistorico = (rawHistorico: any): SetorHistorico | undefined => {
  if (!rawHistorico) return undefined;

  const setorInfo = mapSetorInfo(rawHistorico);
  if (!setorInfo) return undefined;

  return {
    ...setorInfo,
    prefixoVeiculo: sanitizeString(
      rawHistorico.prefixoVeiculo || 
      rawHistorico.prefixo_veiculo ||
      rawHistorico.prefixo
    ),
    dataInicio: sanitizeString(
      rawHistorico.dataInicio || 
      rawHistorico.data_inicio
    ),
    dataFim: sanitizeString(
      rawHistorico.dataFim || 
      rawHistorico.data_fim
    ) || null,
    periodoAtivo: Boolean(
      rawHistorico.periodoAtivo || 
      rawHistorico.periodo_ativo ||
      !rawHistorico.dataFim
    )
  };
};

/**
 * Mapeia dados de agente
 */
export const mapAgente = (rawAgente: any): Agente => {
  if (!rawAgente) {
    throw new Error('Dados de agente inválidos');
  }

  return {
    codigo: sanitizeString(
      rawAgente.cod_agente_autuador || 
      rawAgente.codigo || 
      rawAgente.agenteCodigo
    ),
    descricao: sanitizeString(
      rawAgente.desc_agente_autuador || 
      rawAgente.descricao || 
      rawAgente.nome ||
      rawAgente.agenteDescricao
    ),
    matriculaFiscal: sanitizeString(
      rawAgente.matriculafiscal || 
      rawAgente.matricula_fiscal ||
      rawAgente.matricula
    ),
    totalMultas: sanitizeNumber(
      rawAgente.totalMultas || 
      rawAgente.total_multas
    ),
    valorTotalMultas: sanitizeNumber(
      rawAgente.valorTotalMultas || 
      rawAgente.valor_total_multas
    ),
    ultimaMulta: sanitizeString(
      rawAgente.ultimaMulta || 
      rawAgente.ultima_multa
    ),
    ativo: Boolean(
      rawAgente.ativo !== undefined ? rawAgente.ativo : true
    )
  };
};

// =========================================================================
// MAPEADORES DE ENUMS
// =========================================================================

/**
 * Mapeia responsável da multa
 */
export const mapResponsavelMulta = (value: any): ResponsavelMulta | undefined => {
  if (!value) return undefined;

  const normalized = String(value).toUpperCase();
  
  switch (normalized) {
    case 'F':
    case 'FUNCIONARIO':
    case 'FUNCIONÁRIO':
      return 'F';
    case 'E':
    case 'EMPRESA':
      return 'E';
    default:
      return undefined;
  }
};

/**
 * Mapeia grupo de infração
 */
export const mapGrupoInfracao = (value: any): GrupoInfracao | undefined => {
  if (!value) return undefined;

  const normalized = String(value).toUpperCase().replace(/[^A-Z]/g, '');
  
  switch (normalized) {
    case 'LEVE':
    case 'A':
      return 'LEVE';
    case 'MEDIA':
    case 'MÉDIA':
    case 'B':
      return 'MEDIA';
    case 'GRAVE':
    case 'C':
      return 'GRAVE';
    case 'GRAVISSIMA':
    case 'GRAVÍSSIMA':
    case 'D':
      return 'GRAVISSIMA';
    default:
      return undefined;
  }
};

/**
 * Mapeia gravidade de infração
 */
export const mapGravidadeInfracao = (value: any): GravidadeInfracao | undefined => {
  if (!value) return undefined;

  const normalized = String(value).toUpperCase().replace(/[^A-ZÍ]/g, '');
  
  switch (normalized) {
    case 'LEVE':
    case 'A':
      return 'LEVE';
    case 'MEDIA':
    case 'MÉDIA':
    case 'B':
      return 'MÉDIA';
    case 'GRAVE':
    case 'C':
      return 'GRAVE';
    case 'GRAVISSIMA':
    case 'GRAVÍSSIMA':
    case 'D':
      return 'GRAVÍSSIMA';
    default:
      return undefined;
  }
};

// =========================================================================
// CALCULADORES
// =========================================================================

/**
 * Calcula tipo da multa baseado nos dados
 */
export const calculateTipoMulta = (multa: Multa): TipoMulta => {
  // Se tem agente e descrição, é SEMOB
  if (multa.agenteCodigo && multa.agenteDescricao) {
    return 'SEMOB';
  }
  
  // Se tem pontuação, é TRÂNSITO
  if (multa.pontuacaoInfracao && multa.pontuacaoInfracao > 0) {
    return 'TRANSITO';
  }
  
  // Se código de infração começa com 6, 7 ou 5, é TRÂNSITO
  if (multa.codigoInfra) {
    const firstDigit = multa.codigoInfra.charAt(0);
    if (['5', '6', '7'].includes(firstDigit)) {
      return 'TRANSITO';
    }
  }
  
  // Default para TRÂNSITO se não conseguir determinar
  return 'TRANSITO';
};

/**
 * Calcula status da multa baseado nos dados
 */
export const calculateStatusMulta = (multa: Multa): StatusMulta => {
  // Se tem data de pagamento, está paga
  if (multa.dataPagamentoMulta) {
    return 'PAGA';
  }
  
  // Se tem recurso, está em recurso
  if (multa.numeroRecursoMulta) {
    return 'RECURSO';
  }
  
  // Se tem data de vencimento e já venceu, está vencida
  if (multa.dataVencimentoMulta) {
    const diasParaVencimento = calculateDaysToExpiry(multa.dataVencimentoMulta);
    if (diasParaVencimento < 0) {
      return 'VENCIDA';
    }
  }
  
  // Default para pendente
  return 'PENDENTE';
};

/**
 * Calcula valor saldo da multa
 */
export const calculateValorSaldo = (multa: Multa): number => {
  const valorTotal = multa.valorAtualizado || multa.valorTotalMulta || multa.valorMulta;
  const valorPago = multa.valorPago || 0;
  
  return Math.max(0, valorTotal - valorPago);
};

// =========================================================================
// MAPEADORES REVERSOS (PARA ENVIO AO BACKEND)
// =========================================================================

/**
 * Mapeia filtros do frontend para formato do backend
 */
export const mapFiltrosToBackend = (filtros: any): Record<string, any> => {
  const backendFilters: Record<string, any> = {};

  // Mapeamento de campos com nomes diferentes
  const fieldMapping: Record<string, string> = {
    'agenteSemob': 'agenteCodigo',
    'tipoInfracao': 'grupoInfracao',
    'limite': 'limit',
    'prefixoVeiculo': 'prefixoVeic',
    'placaVeiculo': 'placaVeiculo'
  };

  Object.entries(filtros).forEach(([key, value]) => {
    // Pular valores vazios, mas preservar false e 0
    if (value === '' || value === null || value === undefined) {
      return;
    }

    // Mapear nome do campo se necessário
    const backendKey = fieldMapping[key] || key;
    backendFilters[backendKey] = value;
  });

  return backendFilters;
};

/**
 * Mapeia dados de multa para envio ao backend
 */
export const mapMultaToBackend = (multa: Partial<Multa>): Record<string, any> => {
  return {
    numeroAiMulta: multa.numeroAiMulta,
    prefixoVeic: multa.prefixoVeic,
    valorMulta: multa.valorMulta,
    descricaoInfra: multa.descricaoInfra,
    dataEmissaoMulta: multa.dataEmissaoMulta,
    dataVectoMulta: multa.dataVencimentoMulta,
    localMulta: multa.localMulta,
    codigoVeic: multa.codigoVeic,
    codigoInfra: multa.codigoInfra,
    responsavelMulta: multa.responsavelMulta,
    observacao: multa.observacao,
    observacaoRealMotivo: multa.observacaoRealMotivo,
    agenteCodigo: multa.agenteCodigo,
    agenteDescricao: multa.agenteDescricao,
    agenteMatriculaFiscal: multa.agenteMatriculaFiscal
  };
};

// =========================================================================
// VALIDADORES
// =========================================================================

/**
 * Valida se os dados da multa são válidos
 */
export const validateMultaData = (rawData: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validações obrigatórias
  if (!rawData.numeroAiMulta && !rawData.numero_ait && !rawData.numeroAIT) {
    errors.push('Número da multa é obrigatório');
  }

  if (!rawData.prefixoVeic && !rawData.prefixo_veiculo && !rawData.prefixoVeiculo) {
    errors.push('Prefixo do veículo é obrigatório');
  }

  if (!rawData.valorMulta && !rawData.valor_multa && !rawData.valorTotalMulta) {
    errors.push('Valor da multa é obrigatório');
  }

  // Validações de formato
  if (rawData.valorMulta && isNaN(Number(rawData.valorMulta))) {
    errors.push('Valor da multa deve ser um número válido');
  }

  if (rawData.dataEmissaoMulta && !isValidDate(rawData.dataEmissaoMulta)) {
    errors.push('Data de emissão inválida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida se uma data é válida
 */
const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

// =========================================================================
// UTILITÁRIOS DE TRANSFORMAÇÃO
// =========================================================================

/**
 * Normaliza dados de resposta da API
 */
export const normalizeApiResponse = (response: any): any => {
  if (!response) return null;

  // Se a resposta tem uma estrutura aninhada, extrair os dados principais
  if (response.data && typeof response.data === 'object') {
    // Se data.data existe (resposta aninhada), usar isso
    if (response.data.data) {
      return {
        ...response,
        data: response.data.data,
        // Preservar metadados importantes
        pagination: response.data.pagination || response.pagination,
        resumo: response.data.resumo || response.resumo,
        analytics: response.data.analytics || response.analytics,
        cache: response.data.cache || response.cache
      };
    }
  }

  return response;
};

/**
 * Extrai metadados de resposta
 */
export const extractResponseMetadata = (response: any): {
  pagination?: any;
  resumo?: any;
  analytics?: any;
  cache?: any;
  executionTime?: string;
} => {
  return {
    pagination: response.pagination,
    resumo: response.resumo || response.summary,
    analytics: response.analytics,
    cache: response.cache,
    executionTime: response.executionTime || response.execution_time
  };
};