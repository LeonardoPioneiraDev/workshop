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