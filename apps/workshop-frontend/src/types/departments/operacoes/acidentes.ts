// src/types/departments/operacoes/acidentes.ts
export interface Acidente {
  id: number;
  numeroOcorrencia?: string;
  dataAcidente: string;
  horaAcidente: string;
  condicaoTempo: string;
  visibilidade: string;
  grauAcidente: string;
  statusProcesso: string;
  ocorrencia: string;
  tipoAcidenteGeral: string;
  bairro: string;
  municipio: string;
  tipoMonta: string;
  tipoAcidenteDetalhe: string;
  valorTotalDano: number;
  valorAcordo: number;
  turno: string;
  punicoesAplicadas: string;
  numeroLinha: string;
  descricaoLinha: string;
  garagemLinhaNome: string;
  prefixoVeiculo: string;
  placaVeiculo: string;
  garagemVeiculoNome: string;
  mesAno: string;
  ano: number;
  mes: number;
  periodoDia: string;
  // Campos adicionais detalhados
  endereco?: string;
  cep?: string;
  pontoReferencia?: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  condicoesPista?: 'SECA' | 'MOLHADA' | 'ESCORREGADIA' | 'EM_OBRAS' | 'BURACO';
  sinalizacao?: 'ADEQUADA' | 'INADEQUADA' | 'AUSENTE' | 'DANIFICADA';
  iluminacao?: 'BOA' | 'REGULAR' | 'RUIM' | 'AUSENTE';
  fluxoTransito?: 'LIVRE' | 'LENTO' | 'CONGESTIONADO' | 'PARADO';
  velocidadePermitida?: number;
  velocidadeEstimada?: number;
  nomeMotorista?: string;
  cpfMotorista?: string;
  cnhMotorista?: string;
  idadeMotorista?: number;
  tempoEmpresa?: number; // em meses
  experienciaFuncao?: number; // em anos
  testeBafometro?: 'NEGATIVO' | 'POSITIVO' | 'RECUSOU' | 'NAO_REALIZADO';
  resultadoBafometro?: number;
  usoCinto?: boolean;
  velocimetroMarcava?: number;
  danosMateriais?: DanoMaterial[];
  vitimas?: Vitima[];
  terceirosEnvolvidos?: TerceiroEnvolvido[];
  testemunhas?: Testemunha[];
  autoridades?: AutoridadePresente[];
  laudosPericia?: LaudoPericia[];
  fotos?: FotoAcidente[];
  videos?: VideoAcidente[];
  documentos?: DocumentoAcidente[];
  seguradora?: string;
  numeroSinistro?: string;
  valorFranquia?: number;
  valorIndenizacao?: number;
  tempoParadaVeiculo?: number; // em horas
  custoReparo?: number;
  custoReboque?: number;
  custoHospitalar?: number;
  custoJudicial?: number;
  responsabilidade?: 'EMPRESA' | 'TERCEIRO' | 'COMPARTILHADA' | 'INDETERMINADA';
  percentualCulpa?: number;
  medidaPreventiva?: string[];
  observacoesGerais?: string;
  dataRegistro?: string;
  usuarioRegistro?: string;
  dataUltimaAtualizacao?: string;
  usuarioUltimaAtualizacao?: string;
  statusInvestigacao?: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ARQUIVADA';
  prazoInvestigacao?: string;
  responsavelInvestigacao?: string;
  conclusaoInvestigacao?: string;
  recomendacoes?: string[];
  acoesTomadas?: AcaoTomada[];
  impactoOperacional?: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  repercussaoMidia?: boolean;
  linkNoticias?: string[];
  classificacaoRisco?: 'BAIXO' | 'MEDIO' | 'ALTO' | 'EXTREMO';
  recorrencia?: boolean;
  acidentesSimilares?: number;
  fatoresContribuintes?: string[];
  condicaoClimatica?: {
    temperatura: number;
    umidade: number;
    vento: number;
    precipitacao: number;
  };
}

export interface DanoMaterial {
  id: number;
  tipo: 'VEICULO_EMPRESA' | 'VEICULO_TERCEIRO' | 'PROPRIEDADE_PUBLICA' | 'PROPRIEDADE_PRIVADA';
  descricao: string;
  valor: number;
  fotos?: string[];
  reparado: boolean;
  dataReparo?: string;
  fornecedorReparo?: string;
  garantiaReparo?: number; // em meses
}

export interface Vitima {
  id: number;
  nome: string;
  cpf?: string;
  idade: number;
  sexo: 'M' | 'F';
  tipo: 'MOTORISTA' | 'PASSAGEIRO' | 'PEDESTRE' | 'CICLISTA' | 'MOTOCICLISTA';
  gravidade: 'ILESO' | 'FERIMENTO_LEVE' | 'FERIMENTO_GRAVE' | 'FATAL';
  descricaoFerimentos?: string;
  hospitalAtendimento?: string;
  custoTratamento?: number;
  tempoAfastamento?: number; // em dias
  sequelas?: string;
  indenizacao?: number;
  statusProcesso?: 'ABERTO' | 'EM_NEGOCIACAO' | 'ACORDO' | 'JUDICIAL' | 'ENCERRADO';
  advogado?: string;
  numeroProcesso?: string;
  observacoes?: string;
}

export interface TerceiroEnvolvido {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  tipoVeiculo?: string;
  placaVeiculo?: string;
  seguradora?: string;
  numeroApolice?: string;
  culpado: boolean;
  percentualCulpa?: number;
  valorDanos?: number;
  statusNegociacao?: 'PENDENTE' | 'EM_ANDAMENTO' | 'ACORDO' | 'JUDICIAL';
}

export interface Testemunha {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  relato: string;
  depoimentoFormal: boolean;
  dataDepoimento?: string;
  observacoes?: string;
}

export interface AutoridadePresente {
  id: number;
  orgao: 'POLICIA_MILITAR' | 'POLICIA_CIVIL' | 'BOMBEIROS' | 'SAMU' | 'TRANSITO' | 'OUTROS';
  nome?: string;
  numeroIdentificacao?: string;
  telefone?: string;
  numeroOcorrencia?: string;
  relatorio?: string;
  observacoes?: string;
}

export interface LaudoPericia {
  id: number;
  tipo: 'TECNICO' | 'MEDICO' | 'CRIMINAL' | 'CIVIL';
  numeroLaudo: string;
  perito: string;
  orgao: string;
  dataEmissao: string;
  conclusao: string;
  anexo?: string;
  valor?: number;
  observacoes?: string;
}

export interface FotoAcidente {
  id: number;
  descricao: string;
  url: string;
  dataHora: string;
  autor?: string;
  tipo: 'LOCAL' | 'VEICULO' | 'VITIMA' | 'DOCUMENTO' | 'OUTROS';
  qualidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  geolocalizacao?: {
    latitude: number;
    longitude: number;
  };
}

export interface VideoAcidente {
  id: number;
  descricao: string;
  url: string;
  duracao: number; // em segundos
  dataHora: string;
  autor?: string;
  tipo: 'CAMERA_VEICULO' | 'CAMERA_SEGURANCA' | 'CELULAR' | 'OUTROS';
  qualidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  audio: boolean;
}

export interface DocumentoAcidente {
  id: number;
  tipo: 'BOLETIM_OCORRENCIA' | 'LAUDO_PERICIA' | 'RELATORIO_MEDICO' | 'ORCAMENTO' | 'NOTA_FISCAL' | 'OUTROS';
  nome: string;
  url: string;
  dataEmissao: string;
  orgaoEmissor?: string;
  numeroDocumento?: string;
  observacoes?: string;
}

export interface AcaoTomada {
  id: number;
  tipo: 'TREINAMENTO' | 'MANUTENCAO' | 'MUDANCA_ROTA' | 'MUDANCA_HORARIO' | 'SUBSTITUICAO_MOTORISTA' | 'OUTROS';
  descricao: string;
  dataImplementacao: string;
  responsavel: string;
  prazo?: string;
  status: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  efetividade?: 'BAIXA' | 'MEDIA' | 'ALTA';
  custoImplementacao?: number;
  observacoes?: string;
}

export interface FiltrosAcidentes {
  dataInicio?: string;
  dataFim?: string;
  grauAcidente?: 'COM_VITIMAS' | 'SEM_VITIMAS' | 'TODOS';
  statusProcesso?: 'ABERTO' | 'FECHADO' | 'EM_ANDAMENTO' | 'TODOS';
  garagem?: string;
  prefixoVeiculo?: string;
  placaVeiculo?: string;
  municipio?: string;
  bairro?: string;
  turno?: string;
  ano?: number;
  mes?: number;
  condicaoTempo?: string;
  tipoAcidente?: string;
  responsabilidade?: string;
  valorMinimoAcidente?: number;
  valorMaximoAcidente?: number;
  temVitimas?: boolean;
  temTerceiros?: boolean;
  comProcessoJudicial?: boolean;
  motorista?: string;
  linha?: string;
  statusInvestigacao?: string;
  classificacaoRisco?: string;
  impactoOperacional?: string;
  recorrencia?: boolean;
  repercussaoMidia?: boolean;
  forcarSincronizacao?: boolean;
  incluirDetalhes?: boolean;
  incluirAnexos?: boolean;
  ordenarPor?: 'data' | 'valor' | 'gravidade' | 'status';
  direcaoOrdenacao?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ResultadoAcidentes {
  data: Acidente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filtros: FiltrosAcidentes;
  estatisticas: EstatisticasAcidentes;
}

export interface EstatisticasAcidentes {
  resumo: {
    total: number;
    comVitimas: number;
    semVitimas: number;
    valorTotalDanos: number;
    percentualComVitimas: number;
    custoMedioAcidente: number;
    indiceSinistralidade: number;
  };
  distribuicao: {
    porGaragem: DistribuicaoAcidentes[];
    porMes: DistribuicaoMensal[];
    porTurno: DistribuicaoTurno[];
    porTipo: DistribuicaoTipo[];
    porMunicipio: DistribuicaoMunicipio[];
    porCondicaoTempo: DistribuicaoCondicaoTempo[];
    porDiaSemana: DistribuicaoDiaSemana[];
    porHorario: DistribuicaoHorario[];
  };
  rankings: {
    veiculosMaisAcidentes: VeiculoAcidente[];
    motoristasMaisAcidentes: MotoristaAcidente[];
    rotasMaisAcidentes: RotaAcidente[];
    garagensMaisAcidentes: DistribuicaoAcidentes[];
  };
  tendencias: {
    ultimosSeisMeses: TendenciaMensal[];
    comparativoAnoAnterior: ComparativoAnual;
    projecaoProximoMes: ProjecaoAcidentes;
  };
  indicadores: {
    tempoMedioResolucao: number; // em dias
    percentualComTerceiros: number;
    percentualComProcessoJudicial: number;
    custoMedioVitima: number;
    tempoMedioAfastamento: number; // em dias
    percentualRecorrencia: number;
    efetividadeAcoes: number; // percentual
  };
  filtros: FiltrosAcidentes;
  ultimaAtualizacao: string;
}

export interface DistribuicaoMunicipio {
  municipio: string;
  total: number;
  comVitimas: number;
  valorTotal: number;
  percentual: number;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO';
}

export interface DistribuicaoCondicaoTempo {
  condicao: string;
  total: number;
  percentual: number;
  gravidade: 'BAIXA' | 'MEDIA' | 'ALTA';
}

export interface DistribuicaoDiaSemana {
  diaSemana: string;
  total: number;
  comVitimas: number;
  percentual: number;
  valorMedio: number;
}

export interface DistribuicaoHorario {
  faixaHorario: string;
  total: number;
  comVitimas: number;
  percentual: number;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO';
}

export interface MotoristaAcidente {
  nome: string;
  cpf: string;
  totalAcidentes: number;
  valorTotalDanos: number;
  comVitimas: number;
  tempoEmpresa: number;
  ultimoAcidente: string;
  classificacao: 'BAIXO_RISCO' | 'MEDIO_RISCO' | 'ALTO_RISCO';
}

export interface RotaAcidente {
  numero: string;
  descricao: string;
  totalAcidentes: number;
  valorTotalDanos: number;
  comVitimas: number;
  extensao: number;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO';
  pontosRisco: PontoRisco[];
}

export interface PontoRisco {
  endereco: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  totalAcidentes: number;
  ultimoAcidente: string;
  fatoresRisco: string[];
}

export interface TendenciaMensal {
  mesAno: string;
  total: number;
  comVitimas: number;
  valorTotal: number;
  variacao: number; // percentual em relação ao mês anterior
  tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL';
}

export interface ComparativoAnual {
  anoAtual: {
    ano: number;
    total: number;
    comVitimas: number;
    valorTotal: number;
  };
  anoAnterior: {
    ano: number;
    total: number;
    comVitimas: number;
    valorTotal: number;
  };
  variacao: {
    total: number;
    comVitimas: number;
    valorTotal: number;
    tendencia: 'MELHORA' | 'PIORA' | 'ESTAVEL';
  };
}

export interface ProjecaoAcidentes {
  mes: number;
  ano: number;
  totalEstimado: number;
  comVitimasEstimado: number;
  valorEstimado: number;
  confiabilidade: number; // percentual
  fatoresConsiderados: string[];
}

export interface SincronizacaoAcidentes {
  total: number;
  sincronizados: number;
  atualizados: number;
  inseridos: number;
  erros: number;
  periodo: string;
  tempoExecucao: number;
  dataInicio: string;
  dataFim: string;
  detalhesErros: DetalhesErroAcidente[];
  estatisticasAntes: ResumoEstatisticas;
  estatisticasDepois: ResumoEstatisticas;
  alertasGerados: AlertaSincronizacao[];
}

export interface DetalhesErroAcidente {
  numeroOcorrencia?: string;
  prefixo?: string;
  erro: string;
  detalhes: string;
  tentativas: number;
  dataHora: string;
}

export interface ResumoEstatisticas {
  total: number;
  comVitimas: number;
  valorTotal: number;
  indiceSinistralidade: number;
}

export interface AlertaSincronizacao {
  tipo: 'NOVO_ACIDENTE_GRAVE' | 'AUMENTO_ACIDENTES' | 'VEICULO_RECORRENTE' | 'META_ULTRAPASSADA';
  mensagem: string;
  severidade: 'INFO' | 'WARNING' | 'ERROR';
  dados: any;
  dataGeracao: string;
}

export interface ValoresFiltros {
  garagens: string[];
  municipios: string[];
  bairros: string[];
  turnos: string[];
  grausAcidente: string[];
  statusProcesso: string[];
  tiposAcidente: string[];
  condicoesTempo: string[];
  responsabilidades: string[];
  statusInvestigacao: string[];
  classificacoesRisco: string[];
  impactosOperacionais: string[];
  anos: number[];
  meses: OpcoesSelect[];
}

export interface RelatorioAcidentes {
  id: string;
  nome: string;
  tipo: 'RESUMO' | 'DETALHADO' | 'ESTATISTICO' | 'COMPARATIVO' | 'INVESTIGACAO';
  periodo: {
    inicio: string;
    fim: string;
  };
  filtros: FiltrosAcidentes;
  dados: {
    acidentes: Acidente[];
    estatisticas: EstatisticasAcidentes;
    graficos: ConfiguracaoGrafico[];
    conclusoes: string[];
    recomendacoes: string[];
  };
  configuracao: {
    incluirFotos: boolean;
    incluirDocumentos: boolean;
    incluirVitimas: boolean;
    incluirTerceiros: boolean;
    incluirCustos: boolean;
    incluirMapas: boolean;
    formato: 'PDF' | 'EXCEL' | 'WORD';
    idioma: 'PT' | 'EN' | 'ES';
  };
  metadados: {
    geradoEm: string;
    geradoPor: string;
    versao: string;
    confidencialidade: 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL';
    validade: string;
    observacoes?: string;
  };
}

export interface AnaliseAcidentes {
  id: string;
  nome: string;
  tipo: 'CAUSA_RAIZ' | 'TENDENCIA' | 'CORRELACAO' | 'PREVISAO' | 'BENCHMARKING';
  periodo: {
    inicio: string;
    fim: string;
  };
  parametros: {
    variaveis: string[];
    metodos: string[];
    configuracoes: any;
  };
  resultados: {
    principais: ResultadoPrincipal[];
    secundarios: ResultadoSecundario[];
    graficos: ConfiguracaoGrafico[];
    tabelas: any[];
    mapas?: any[];
  };
  interpretacao: {
    resumo: string;
    causasPrincipais: string[];
    fatoresContribuintes: string[];
    padroes: string[];
    anomalias: string[];
    correlacoes: CorrelacaoEncontrada[];
  };
  recomendacoes: {
    imediatas: RecomendacaoImediata[];
    curtoPrazo: RecomendacaoCurtoPrazo[];
    longoPrazo: RecomendacaoLongoPrazo[];
    investimentos: RecomendacaoInvestimento[];
  };
  validacao: {
    confiabilidade: number;
    limitacoes: string[];
    premissas: string[];
    fontesDados: string[];
  };
  metadados: {
    analista: string;
    dataAnalise: string;
    versao: string;
    revisadoPor?: string;
    aprovadoPor?: string;
    status: 'RASCUNHO' | 'REVISAO' | 'APROVADO' | 'PUBLICADO';
  };
}

export interface ResultadoPrincipal {
  indicador: string;
  valor: number;
  unidade: string;
  interpretacao: string;
  significancia: 'BAIXA' | 'MEDIA' | 'ALTA';
}

export interface ResultadoSecundario {
  indicador: string;
  valor: number;
  contexto: string;
  relevancia: 'BAIXA' | 'MEDIA' | 'ALTA';
}

export interface CorrelacaoEncontrada {
  variavel1: string;
  variavel2: string;
  coeficiente: number;
  significancia: number;
  interpretacao: string;
}

export interface RecomendacaoImediata {
  titulo: string;
  descricao: string;
  prazo: string; // em dias
  responsavel: string;
  custo: number;
  impacto: 'BAIXO' | 'MEDIO' | 'ALTO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
}

export interface RecomendacaoCurtoPrazo {
  titulo: string;
  descricao: string;
  prazo: string; // em meses
  recursos: string[];
  custo: number;
  roi: number; // retorno sobre investimento
  riscos: string[];
}

export interface RecomendacaoLongoPrazo {
  titulo: string;
  descricao: string;
  prazo: string; // em anos
  investimento: number;
  beneficios: string[];
  indicadores: string[];
  marcos: string[];
}

export interface RecomendacaoInvestimento {
  area: string;
  descricao: string;
  valor: number;
  justificativa: string;
  retorno: string;
  prazoRetorno: number; // em meses
}

// Tipos para integração com sistemas externos
export interface IntegracaoAcidentes {
  sistemaOrigem: 'DETRAN' | 'POLICIA_CIVIL' | 'SEGURADORA' | 'HOSPITAL' | 'INTERNO';
  configuracao: ConfiguracaoIntegracaoAcidente;
  ultimaSincronizacao: string;
  proximaSincronizacao: string;
  status: 'ATIVA' | 'INATIVA' | 'ERRO';
  estatisticas: EstatisticasIntegracao;
}

export interface ConfiguracaoIntegracaoAcidente {
  endpoint: string;
  autenticacao: {
    tipo: 'API_KEY' | 'OAUTH' | 'BASIC';
    credenciais: any;
  };
  mapeamentoCampos: MapeamentoCampo[];
  filtros: any;
  frequencia: 'TEMPO_REAL' | 'HORARIA' | 'DIARIA';
  formatoDados: 'JSON' | 'XML' | 'CSV';
}

export interface MapeamentoCampo {
  campoOrigem: string;
  campoDestino: string;
  transformacao?: string;
  obrigatorio: boolean;
  validacao?: string;
}

export interface EstatisticasIntegracao {
  totalSincronizacoes: number;
  sucessos: number;
  erros: number;
  ultimoErro?: string;
  tempoMedioSincronizacao: number;
  registrosMediosPorSincronizacao: number;
}

// Tipos para notificações e alertas
export interface NotificacaoAcidente {
  id: string;
  tipo: 'NOVO_ACIDENTE' | 'ACIDENTE_GRAVE' | 'VEICULO_RECORRENTE' | 'META_ULTRAPASSADA';
  titulo: string;
  mensagem: string;
  severidade: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  dados: any;
  destinatarios: string[];
  canais: ('EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP')[];
  dataGeracao: string;
  dataEnvio?: string;
  status: 'PENDENTE' | 'ENVIADO' | 'ERRO' | 'CANCELADO';
  tentativas: number;
  respostas?: RespostaNotificacao[];
}

export interface RespostaNotificacao {
  destinatario: string;
  canal: string;
  status: 'ENTREGUE' | 'LIDO' | 'ERRO';
  dataResposta: string;
  detalhes?: string;
}

// Tipos para auditoria e logs
export interface LogAcidente {
  id: string;
  acidenteId: number;
  usuario: string;
  acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'VISUALIZACAO' | 'EXPORTACAO';
  detalhes: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  ip: string;
  userAgent: string;
  dataHora: string;
  modulo: string;
  funcionalidade: string;
}

export interface AuditoriaAcidente {
  periodo: {
    inicio: string;
    fim: string;
  };
  logs: LogAcidente[];
  estatisticas: {
    totalAcoes: number;
    usuariosAtivos: number;
    acoesPopulares: { acao: string; total: number }[];
    horariosAtividade: { hora: number; total: number }[];
  };
  alertas: {
    acessosIndevidos: number;
    tentativasExportacao: number;
    modificacoesSuspeitas: number;
  };
}