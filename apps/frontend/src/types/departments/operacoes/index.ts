// src/types/departments/operacoes/index.ts
export * from './frota';
export * from './acidentes';

// =================== TIPOS GERAIS DE OPERAÇÕES ===================

export interface OperacoesStatus {
  departamento: string;
  status: 'OPERACIONAL' | 'ATENÇÃO' | 'CRÍTICO';
  frota: StatusFrota;
  acidentes: StatusAcidentes;
  kpis: KPIsOperacionais;
  sincronizacoes: UltimasSincronizacoes;
  alertas: AlertasAtivos;
  timestamp: string;
}

export interface StatusFrota {
  total: number;
  ativos: number;
  inativos: number;
  percentualAtivos: number;
  ultimaAtualizacao: string;
  status: 'OPERACIONAL' | 'CRÍTICO';
}

export interface StatusAcidentes {
  total: number;
  comVitimas: number;
  semVitimas: number;
  valorTotalDanos: number;
  percentualComVitimas: number;
  ultimaAtualizacao: string;
  status: 'BOM' | 'ATENÇÃO' | 'CRÍTICO';
}

export interface KPIsOperacionais {
  disponibilidadeFrota: number;
  indiceSinistralidade: number;
  custoMedioAcidente: number;
  eficienciaOperacional: number;
  scoreGeral: number;
  veiculosDisponiveis?: number;
  totalVeiculos?: number;
  metaDisponibilidade?: number;
  metaSinistralidade?: number;
  metaCustoMedio?: number;
  metaEficiencia?: number;
}

export interface UltimasSincronizacoes {
  frota: SincronizacaoHistorico[];
  acidentes: SincronizacaoHistorico[];
}

export interface SincronizacaoHistorico {
  data: string;
  total: number;
  sucesso: boolean;
  duracao?: number;
  erros?: string[];
}

export interface AlertasAtivos {
  mudancasRecentes: number;
  veiculosRisco: number;
  garagensProblematicas: number;
  nivel: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
  detalhes: AlertaDetalhe[];
}

export interface AlertaDetalhe {
  tipo: 'VEICULO_RISCO' | 'GARAGEM_PROBLEMATICA' | 'MUDANCA_CRITICA' | 'META_NAO_ATINGIDA';
  titulo: string;
  descricao: string;
  severidade: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  dataDeteccao: string;
  acao?: string;
  resolvido: boolean;
}

// =================== DASHBOARD OPERAÇÕES ===================

export interface DashboardOperacoes {
  resumo: {
    frota: StatusFrota;
    acidentes: StatusAcidentes;
    kpis: KPIsOperacionais;
  };
  distribuicoes: {
    frotaPorGaragem: DistribuicaoGaragem[];
    acidentesPorGaragem: DistribuicaoAcidentes[];
    acidentesPorMes: DistribuicaoMensal[];
    acidentesPorTurno: DistribuicaoTurno[];
    acidentesPorTipo: DistribuicaoTipo[];
    frotaPorTipo: DistribuicaoTipoVeiculo[];
  };
  rankings: {
    topVeiculosAcidentes: VeiculoAcidente[];
    garagensMaisAcidentes: DistribuicaoAcidentes[];
    topMotoristas: MotoristaRanking[];
    topRotas: RotaRanking[];
  };
  alertas: AlertasOperacionais;
  tendencias: TendenciasOperacionais;
  comparativos: ComparativosOperacionais;
  timestamp: string;
}

export interface DistribuicaoGaragem {
  garagem: string;
  total: number;
  ativos: number;
  inativos: number;
  percentualAtivos: number;
  capacidadeTotal?: number;
  utilizacao?: number;
}

export interface DistribuicaoAcidentes {
  garagem: string;
  total: number;
  comVitimas: number;
  semVitimas: number;
  valorTotal: number;
  percentualComVitimas: number;
  indiceSinistralidade: number;
}

export interface DistribuicaoMensal {
  mesAno: string;
  mes: number;
  ano: number;
  total: number;
  comVitimas: number;
  valorTotal: number;
  mediaMovel?: number;
  tendencia?: 'CRESCENTE' | 'DECRESCENTE' | 'ESTÁVEL';
}

export interface DistribuicaoTurno {
  turno: string;
  total: number;
  comVitimas: number;
  percentual: number;
  horarioInicio?: string;
  horarioFim?: string;
}

export interface DistribuicaoTipo {
  tipo: string;
  total: number;
  percentual: number;
  valorMedio: number;
  gravidade: 'BAIXA' | 'MÉDIA' | 'ALTA';
}

export interface DistribuicaoTipoVeiculo {
  tipo: string;
  total: number;
  ativos: number;
  percentualAtivos: number;
  idadeMedia?: number;
  quilometragemMedia?: number;
}

export interface VeiculoAcidente {
  prefixo: string;
  placa: string;
  garagem: string;
  totalAcidentes: number;
  valorTotalDanos: number;
  comVitimas: number;
  ultimoAcidente?: string;
  risco: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
}

export interface MotoristaRanking {
  nome: string;
  cpf?: string;
  totalAcidentes: number;
  valorTotalDanos: number;
  tempoEmpresa: number;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM';
}

export interface RotaRanking {
  numero: string;
  descricao: string;
  totalAcidentes: number;
  valorTotalDanos: number;
  extensao?: number;
  complexidade: 'BAIXA' | 'MÉDIA' | 'ALTA';
}

// =================== ALERTAS OPERACIONAIS ===================

export interface AlertasOperacionais {
  mudancasRecentes: HistoricoMudanca[];
  veiculosRisco: VeiculoAcidente[];
  garagensProblematicas: DistribuicaoAcidentes[];
  metasNaoAtingidas: MetaNaoAtingida[];
  manutencoesPendentes?: ManutencaoPendente[];
  documentosVencidos?: DocumentoVencido[];
}

export interface MetaNaoAtingida {
  tipo: 'DISPONIBILIDADE' | 'SINISTRALIDADE' | 'CUSTO_MEDIO' | 'EFICIENCIA';
  valorAtual: number;
  valorMeta: number;
  diferenca: number;
  garagem?: string;
  periodo: string;
}

export interface ManutencaoPendente {
  prefixo: string;
  tipo: 'PREVENTIVA' | 'CORRETIVA' | 'EMERGENCIAL';
  dataVencimento: string;
  diasAtraso: number;
  prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
}

export interface DocumentoVencido {
  prefixo: string;
  documento: string;
  dataVencimento: string;
  diasVencido: number;
  status: 'VENCIDO' | 'VENCENDO' | 'RENOVADO';
}

// =================== TENDÊNCIAS OPERACIONAIS ===================

export interface TendenciasOperacionais {
  anoAtual: TendenciaAnual;
  anoAnterior: TendenciaAnual;
  variacoes: VariacoesTendencia;
  porMes: DistribuicaoMensal[];
  previsoes: PrevisaoTendencia[];
  sazonalidade: AnalisesSazonalidade;
}

export interface TendenciaAnual {
  ano: number;
  total: number;
  comVitimas: number;
  valorDanos: number;
  indiceSinistralidade: number;
  custoMedio: number;
}

export interface VariacoesTendencia {
  total: number;
  comVitimas: number;
  valorDanos: number;
  tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTÁVEL';
  confiabilidade: number;
}

export interface PrevisaoTendencia {
  mes: number;
  previsaoTotal: number;
  previsaoComVitimas: number;
  intervaloConfianca: {
    min: number;
    max: number;
  };
  probabilidade: number;
}

export interface AnalisesSazonalidade {
  mesesMaiorIncidencia: number[];
  mesesMenorIncidencia: number[];
  fatoresSazonais: FatorSazonal[];
  correlacoes: CorrelacaoSazonal[];
}

export interface FatorSazonal {
  periodo: string;
  fator: number;
  descricao: string;
  impacto: 'BAIXO' | 'MÉDIO' | 'ALTO';
}

export interface CorrelacaoSazonal {
  variavel: string;
  correlacao: number;
  significancia: number;
  descricao: string;
}

// =================== COMPARATIVOS OPERACIONAIS ===================

export interface ComparativosOperacionais {
  mesAnterior: ComparativoMensal;
  anoAnterior: ComparativoAnual;
  benchmarks: BenchmarkOperacional[];
  metas: MetasOperacionais;
}

export interface ComparativoMensal {
  mesAtual: DadosComparativos;
  mesAnterior: DadosComparativos;
  variacao: VariacaoComparativa;
}

export interface ComparativoAnual {
  anoAtual: DadosComparativos;
  anoAnterior: DadosComparativos;
  variacao: VariacaoComparativa;
}

export interface DadosComparativos {
  periodo: string;
  totalAcidentes: number;
  comVitimas: number;
  valorDanos: number;
  disponibilidadeFrota: number;
  indiceSinistralidade: number;
}

export interface VariacaoComparativa {
  totalAcidentes: number;
  comVitimas: number;
  valorDanos: number;
  disponibilidadeFrota: number;
  indiceSinistralidade: number;
  tendenciaGeral: 'MELHORA' | 'PIORA' | 'ESTÁVEL';
}

export interface BenchmarkOperacional {
  indicador: string;
  valorEmpresa: number;
  valorSetor: number;
  valorExcelencia: number;
  posicao: 'ACIMA' | 'DENTRO' | 'ABAIXO';
  fonte: string;
}

export interface MetasOperacionais {
  disponibilidadeFrota: MetaIndicador;
  indiceSinistralidade: MetaIndicador;
  custoMedioAcidente: MetaIndicador;
  eficienciaOperacional: MetaIndicador;
  satisfacaoCliente?: MetaIndicador;
}

export interface MetaIndicador {
  valor: number;
  valorAtual: number;
  percentualAtingido: number;
  status: 'ATINGIDA' | 'EM_ANDAMENTO' | 'NAO_ATINGIDA';
  prazo: string;
  responsavel?: string;
}

// =================== HISTÓRICO E MUDANÇAS ===================

export interface HistoricoMudanca {
  id: number;
  prefixo: string;
  tipoMudanca: 'STATUS' | 'GARAGEM' | 'MOTORISTA' | 'ROTA' | 'MANUTENCAO' | 'DOCUMENTO';
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  dataMudanca: string;
  usuarioResponsavel?: string;
  motivo?: string;
  observacoes?: string;
  impacto: 'BAIXO' | 'MÉDIO' | 'ALTO';
}

export interface HistoricoOperacional {
  veiculo: VeiculoOperacional;
  mudancas: HistoricoMudanca[];
  acidentes: Acidente[];
  manutencoes: HistoricoManutencao[];
  documentos: HistoricoDocumento[];
}

export interface HistoricoManutencao {
  id: number;
  prefixo: string;
  tipo: 'PREVENTIVA' | 'CORRETIVA' | 'EMERGENCIAL';
  dataManutencao: string;
  quilometragem: number;
  descricao: string;
  valor: number;
  fornecedor?: string;
  garantia?: number;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
}

export interface HistoricoDocumento {
  id: number;
  prefixo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  orgaoEmissor: string;
  status: 'VIGENTE' | 'VENCIDO' | 'RENOVADO' | 'CANCELADO';
  valor?: number;
}

// =================== COMPONENTES E UI ===================

export interface ComponenteOperacoesProps {
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
  showHeader?: boolean;
  showActions?: boolean;
}

export interface FiltrosAvancados extends FiltrosFrota, FiltrosAcidentes {
  incluirHistorico?: boolean;
  incluirTendencias?: boolean;
  incluirComparativos?: boolean;
  formatoExportacao?: 'pdf' | 'excel' | 'csv' | 'json';
  agrupamento?: 'DIA' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'ANO';
  ordenacao?: 'ASC' | 'DESC';
  campoOrdenacao?: string;
}

export interface ConfiguracaoGrafico {
  id: string;
  tipo: 'bar' | 'pie' | 'line' | 'area' | 'scatter' | 'heatmap';
  titulo: string;
  subtitulo?: string;
  dados: any[];
  altura?: number;
  largura?: number;
  cores?: string[];
  chaves?: string[];
  eixoX?: ConfiguracaoEixo;
  eixoY?: ConfiguracaoEixo;
  legenda?: ConfiguracaoLegenda;
  tooltip?: ConfiguracaoTooltip;
  animacao?: boolean;
  responsivo?: boolean;
}

export interface ConfiguracaoEixo {
  titulo?: string;
  tipo?: 'categoria' | 'numero' | 'data';
  formato?: string;
  minimo?: number;
  maximo?: number;
  intervalo?: number;
  mostrarGrid?: boolean;
}

export interface ConfiguracaoLegenda {
  mostrar: boolean;
  posicao: 'top' | 'bottom' | 'left' | 'right';
  alinhamento: 'start' | 'center' | 'end';
}

export interface ConfiguracaoTooltip {
  mostrar: boolean;
  formato?: string;
  campos?: string[];
}

// =================== RELATÓRIOS ===================

export interface RelatorioOperacoes {
  id: string;
  nome: string;
  tipo: 'executivo' | 'frota' | 'acidentes' | 'comparativo' | 'tendencias' | 'personalizado';
  categoria: 'OPERACIONAL' | 'GERENCIAL' | 'ESTRATÉGICO';
  periodo: {
    inicio: string;
    fim: string;
    tipo: 'DIA' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'ANO' | 'PERSONALIZADO';
  };
  filtros: FiltrosAvancados;
  dados: any;
  configuracao: ConfiguracaoRelatorio;
  metadados: MetadadosRelatorio;
  geradoEm: string;
  geradoPor: string;
  versao: string;
}

export interface ConfiguracaoRelatorio {
  graficos: ConfiguracaoGrafico[];
  tabelas: ConfiguracaoTabela[];
  kpis: ConfiguracaoKPI[];
  layout: ConfiguracaoLayout;
  exportacao: ConfiguracaoExportacao;
}

export interface ConfiguracaoTabela {
  id: string;
  titulo: string;
  dados: any[];
  colunas: ConfiguracaoColuna[];
  paginacao?: ConfiguracaoPaginacao;
  ordenacao?: ConfiguracaoOrdenacao;
  filtros?: ConfiguracaoFiltroTabela[];
}

export interface ConfiguracaoColuna {
  campo: string;
  titulo: string;
  tipo: 'texto' | 'numero' | 'data' | 'moeda' | 'percentual' | 'badge';
  largura?: number;
  alinhamento?: 'left' | 'center' | 'right';
  formato?: string;
  ordenavel?: boolean;
  filtravel?: boolean;
}

export interface ConfiguracaoPaginacao {
  tamanhoPagina: number;
  mostrarInfo: boolean;
  mostrarNavegacao: boolean;
}

export interface ConfiguracaoOrdenacao {
  campo: string;
  direcao: 'ASC' | 'DESC';
  multipla?: boolean;
}

export interface ConfiguracaoFiltroTabela {
  campo: string;
  tipo: 'texto' | 'numero' | 'data' | 'select' | 'multiselect';
  opcoes?: OpcoesSelect[];
}

export interface OpcoesSelect {
  valor: any;
  label: string;
}

export interface ConfiguracaoKPI {
  id: string;
  titulo: string;
  valor: number;
  formato: 'numero' | 'percentual' | 'moeda';
  meta?: number;
  tendencia?: {
    valor: number;
    periodo: string;
  };
  cor?: string;
  icone?: string;
}

export interface ConfiguracaoLayout {
  colunas: number;
  espacamento: number;
  margens: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  cabecalho: ConfiguracaoCabecalho;
  rodape: ConfiguracaoRodape;
}

export interface ConfiguracaoCabecalho {
  mostrar: boolean;
  titulo?: string;
  subtitulo?: string;
  logo?: string;
  informacoes?: string[];
}

export interface ConfiguracaoRodape {
  mostrar: boolean;
  texto?: string;
  numeracao?: boolean;
  dataGeracao?: boolean;
}

export interface ConfiguracaoExportacao {
  formatos: ('pdf' | 'excel' | 'csv' | 'png' | 'json')[];
  qualidade?: 'baixa' | 'media' | 'alta';
  orientacao?: 'retrato' | 'paisagem';
  tamanho?: 'A4' | 'A3' | 'carta' | 'personalizado';
  compressao?: boolean;
}

export interface MetadadosRelatorio {
  descricao?: string;
  tags?: string[];
  categoria?: string;
  departamento?: string;
  confidencialidade: 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRITO';
  validade?: string;
  fonte?: string;
  metodologia?: string;
  observacoes?: string[];
}

// =================== ANÁLISES AVANÇADAS ===================

export interface AnaliseOperacional {
  id: string;
  tipo: 'CORRELACAO' | 'REGRESSAO' | 'CLUSTERING' | 'ANOMALIA' | 'PREVISAO';
  nome: string;
  descricao: string;
  parametros: ParametrosAnalise;
  resultados: ResultadosAnalise;
  interpretacao: InterpretacaoAnalise;
  recomendacoes: RecomendacaoAnalise[];
  confiabilidade: number;
  dataAnalise: string;
}

export interface ParametrosAnalise {
  variaveis: string[];
  periodo: {
    inicio: string;
    fim: string;
  };
  filtros: any;
  algoritmo?: string;
  configuracoes?: any;
}

export interface ResultadosAnalise {
  dados: any;
  metricas: MetricasAnalise;
  graficos: ConfiguracaoGrafico[];
  tabelas: any[];
}

export interface MetricasAnalise {
  [key: string]: number | string;
}

export interface InterpretacaoAnalise {
  resumo: string;
  pontosChave: string[];
  limitacoes: string[];
  significancia: number;
}

export interface RecomendacaoAnalise {
  titulo: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
  prazo: string;
  responsavel?: string;
  recursos?: string[];
  impactoEstimado: string;
}

// =================== INTEGRAÇÃO E APIs ===================

export interface ConfiguracaoIntegracao {
  sistemaOrigem: string;
  endpoint: string;
  frequencia: 'TEMPO_REAL' | 'HORARIA' | 'DIARIA' | 'SEMANAL' | 'MENSAL';
  ultimaSincronizacao?: string;
  proximaSincronizacao?: string;
  status: 'ATIVA' | 'INATIVA' | 'ERRO' | 'MANUTENCAO';
  configuracoes: any;
}

export interface LogIntegracao {
  id: string;
  sistema: string;
  operacao: 'SINCRONIZACAO' | 'EXPORTACAO' | 'IMPORTACAO';
  dataInicio: string;
  dataFim?: string;
  status: 'SUCESSO' | 'ERRO' | 'EM_ANDAMENTO' | 'CANCELADO';
  registrosProcessados: number;
  registrosComErro: number;
  detalhesErro?: string[];
  tempoExecucao?: number;
}

// =================== PERMISSÕES E SEGURANÇA ===================

export interface PermissaoOperacoes {
  modulo: 'FROTA' | 'ACIDENTES' | 'RELATORIOS' | 'DASHBOARD' | 'CONFIGURACOES';
  acao: 'VISUALIZAR' | 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'EXPORTAR' | 'ADMINISTRAR';
  escopo: 'PROPRIO' | 'GARAGEM' | 'DEPARTAMENTO' | 'EMPRESA';
  restricoes?: RestricaoPermissao[];
}

export interface RestricaoPermissao {
  campo: string;
  valores: any[];
  tipo: 'INCLUIR' | 'EXCLUIR';
}

export interface AuditoriaOperacoes {
  id: string;
  usuario: string;
  acao: string;
  modulo: string;
  recurso: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  ip: string;
  userAgent: string;
  dataHora: string;
  sucesso: boolean;
  detalhes?: string;
}

// =================== CONFIGURAÇÕES DO SISTEMA ===================

export interface ConfiguracaoSistema {
  geral: ConfiguracaoGeral;
  alertas: ConfiguracaoAlertas;
  relatorios: ConfiguracaoRelatoriosGlobal;
  integracao: ConfiguracaoIntegracao[];
  backup: ConfiguracaoBackup;
  performance: ConfiguracaoPerformance;
}

export interface ConfiguracaoGeral {
  nomeEmpresa: string;
  timezone: string;
  idioma: string;
  moeda: string;
  formatoData: string;
  formatoHora: string;
  logoEmpresa?: string;
}

export interface ConfiguracaoAlertas {
  email: ConfiguracaoEmailAlertas;
  sms: ConfiguracaoSMSAlertas;
  push: ConfiguracaoPushAlertas;
  niveis: ConfiguracaoNiveisAlerta;
}

export interface ConfiguracaoEmailAlertas {
  ativo: boolean;
  servidor: string;
  porta: number;
  usuario: string;
  senha: string;
  remetente: string;
  destinatarios: string[];
}

export interface ConfiguracaoSMSAlertas {
  ativo: boolean;
  provedor: string;
  apiKey: string;
  numeroOrigem: string;
  destinatarios: string[];
}

export interface ConfiguracaoPushAlertas {
  ativo: boolean;
  servicoNotificacao: string;
  chaveApi: string;
  topicos: string[];
}

export interface ConfiguracaoNiveisAlerta {
  baixo: ConfiguracaoNivelAlerta;
  medio: ConfiguracaoNivelAlerta;
  alto: ConfiguracaoNivelAlerta;
  critico: ConfiguracaoNivelAlerta;
}

export interface ConfiguracaoNivelAlerta {
  cor: string;
  icone: string;
  som?: string;
  notificacaoEmail: boolean;
  notificacaoSMS: boolean;
  notificacaoPush: boolean;
  escalacao?: ConfiguracaoEscalacao;
}

export interface ConfiguracaoEscalacao {
  tempoEspera: number; // em minutos
  proximoNivel: string[];
  tentativasMaximas: number;
}

export interface ConfiguracaoRelatoriosGlobal {
  diretorioExportacao: string;
  formatoPadrao: 'pdf' | 'excel' | 'csv';
  retencaoDias: number;
  compressaoAutomatica: boolean;
  marcaDagua: boolean;
  assinaturaDigital: boolean;
}

export interface ConfiguracaoBackup {
  ativo: boolean;
  frequencia: 'DIARIO' | 'SEMANAL' | 'MENSAL';
  horario: string;
  destino: string;
  retencao: number; // em dias
  compressao: boolean;
  criptografia: boolean;
}

export interface ConfiguracaoPerformance {
  cacheAtivo: boolean;
  tempoCache: number; // em minutos
  limitePaginacao: number;
  timeoutConsulta: number; // em segundos
  indexacaoAutomatica: boolean;
  otimizacaoConsultas: boolean;
}

// =================== TIPOS UTILITÁRIOS ===================

export type StatusOperacao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ERRO' | 'CANCELADO';

export type TipoNotificacao = 'INFO' | 'SUCESSO' | 'AVISO' | 'ERRO';

export type PrioridadeOperacao = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type NivelAcesso = 'LEITURA' | 'ESCRITA' | 'ADMIN' | 'SUPER_ADMIN';

export interface ResponsePadrao<T = any> {
  sucesso: boolean;
  dados?: T;
  mensagem?: string;
  erros?: string[];
  metadados?: {
    total?: number;
    pagina?: number;
    limite?: number;
    tempoExecucao?: number;
  };
}

export interface PaginacaoRequest {
  pagina: number;
  limite: number;
  ordenacao?: {
    campo: string;
    direcao: 'ASC' | 'DESC';
  };
}

export interface PaginacaoResponse<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  temAnterior: boolean;
  temProximo: boolean;
}

// =================== VALIDAÇÕES E REGRAS ===================

export interface RegraValidacao {
  campo: string;
  tipo: 'OBRIGATORIO' | 'FORMATO' | 'TAMANHO' | 'VALOR' | 'CUSTOMIZADO';
  parametros: any;
  mensagem: string;
  ativo: boolean;
}

export interface ResultadoValidacao {
  valido: boolean;
  erros: ErroValidacao[];
}

export interface ErroValidacao {
  campo: string;
  regra: string;
  mensagem: string;
  valorInformado: any;
}

// =================== CACHE E PERFORMANCE ===================

export interface ConfiguracaoCache {
  chave: string;
  ttl: number; // tempo de vida em segundos
  dados: any;
  dataExpiracao: string;
  tags: string[];
}

export interface EstatisticasPerformance {
  tempoMedioResposta: number;
  totalConsultas: number;
  consultasCache: number;
  percentualCache: number;
  consultasLentas: number;
  errosConexao: number;
  ultimaAtualizacao: string;
}

// =================== WEBHOOKS E EVENTOS ===================

export interface ConfiguracaoWebhook {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  ativo: boolean;
  segredo?: string;
  tentativasMaximas: number;
  timeoutSegundos: number;
  cabecalhos?: { [key: string]: string };
}

export interface EventoSistema {
  id: string;
  tipo: string;
  dados: any;
  origem: string;
  dataHora: string;
  processado: boolean;
  tentativas: number;
}

// =================== EXPORTAÇÃO FINAL ===================

export default {
  // Re-exportar todos os tipos para facilitar importação
  OperacoesStatus,
  DashboardOperacoes,
  KPIsOperacionais,
  AlertasOperacionais,
  TendenciasOperacionais,
  RelatorioOperacoes,
  AnaliseOperacional,
  ConfiguracaoSistema,
  // ... todos os outros tipos
};