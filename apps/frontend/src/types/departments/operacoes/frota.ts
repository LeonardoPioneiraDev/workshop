// src/types/departments/operacoes/frota.ts
export interface VeiculoOperacional {
  id: number;
  codigoVeiculo: string;
  prefixo: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO' | 'RESERVA';
  garagem: string;
  garagemNome: string;
  setor: string;
  tipoVeiculo: 'ONIBUS' | 'MICROONIBUS' | 'VAN' | 'UTILITARIO' | 'ADMINISTRATIVO';
  capacidadePassageiros: number;
  combustivel: 'DIESEL' | 'GASOLINA' | 'ETANOL' | 'GNV' | 'ELETRICO' | 'HIBRIDO';
  quilometragem: number;
  motoristaAtual: string;
  rotaAtual: string;
  observacoes: string;
  dataUltimaAtualizacao: string;
  dataSincronizacao: string;
  dataAquisicao?: string;
  valorAquisicao?: number;
  numeroPatrimonio?: string;
  chassi?: string;
  renavam?: string;
  cor?: string;
  numeroMotor?: string;
  potenciaMotor?: number;
  categoria?: string;
  proprietario?: string;
  financiado?: boolean;
  seguradora?: string;
  numeroApolice?: string;
  dataVencimentoSeguro?: string;
  dataProximaRevisao?: string;
  quilometragemProximaRevisao?: number;
  statusDocumentacao?: 'REGULAR' | 'PENDENTE' | 'VENCIDO';
  statusManutencao?: 'EM_DIA' | 'ATRASADA' | 'AGENDADA';
  nivelCombustivel?: number;
  temperaturaMotor?: number;
  pressaoPneus?: number[];
  alertasAtivos?: string[];
  localizacaoAtual?: {
    latitude: number;
    longitude: number;
    endereco?: string;
    dataHora: string;
  };
  consumoMedio?: number;
  custoManutencao?: number;
  disponibilidadePercentual?: number;
  horasOperacao?: number;
  distanciaPercorrida?: number;
  velocidadeMedia?: number;
  emissoesCO2?: number;
  classificacaoAmbiental?: string;
  certificadoInspecao?: {
    numero: string;
    dataEmissao: string;
    dataVencimento: string;
    status: 'VIGENTE' | 'VENCIDO' | 'PENDENTE';
  };
}

export interface FiltrosFrota {
  status?: 'ATIVO' | 'INATIVO' | 'MANUTENCAO' | 'RESERVA' | 'TODOS';
  garagem?: string;
  prefixo?: string;
  placa?: string;
  tipoVeiculo?: string;
  combustivel?: string;
  marca?: string;
  modelo?: string;
  anoInicio?: number;
  anoFim?: number;
  motoristaAtual?: string;
  rotaAtual?: string;
  dataSincronizacao?: string;
  dataUltimaAtualizacao?: string;
  quilometragemMinima?: number;
  quilometragemMaxima?: number;
  statusDocumentacao?: string;
  statusManutencao?: string;
  temAlertas?: boolean;
  forcarSincronizacao?: boolean;
  incluirInativos?: boolean;
  incluirReserva?: boolean;
  ordenarPor?: 'prefixo' | 'placa' | 'modelo' | 'ano' | 'quilometragem' | 'dataAtualizacao';
  direcaoOrdenacao?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface ResultadoFrota {
  data: VeiculoOperacional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filtros: FiltrosFrota;
  estatisticas: EstatisticasFrota;
}

export interface EstatisticasFrota {
  total: number;
  ativos: number;
  inativos: number;
  manutencao: number;
  reserva: number;
  percentualAtivos: number;
  percentualInativos: number;
  percentualManutencao: number;
  percentualReserva: number;
  idadeMediaFrota: number;
  quilometragemMedia: number;
  consumoMedioGeral: number;
  custoMedioManutencao: number;
  disponibilidadeMedia: number;
  distribuicaoPorTipo: DistribuicaoTipoVeiculo[];
  distribuicaoPorGaragem: DistribuicaoGaragem[];
  distribuicaoPorIdade: DistribuicaoIdade[];
  distribuicaoPorCombustivel: DistribuicaoCombustivel[];
  alertasAtivos: number;
  documentosVencidos: number;
  manutencoesPendentes: number;
  ultimaAtualizacao: string;
}

export interface DistribuicaoIdade {
  faixaIdade: string;
  quantidade: number;
  percentual: number;
  idadeMinima: number;
  idadeMaxima: number;
}

export interface DistribuicaoCombustivel {
  combustivel: string;
  quantidade: number;
  percentual: number;
  consumoMedio: number;
  custoMedio: number;
}

export interface SincronizacaoFrota {
  total: number;
  ativos: number;
  inativos: number;
  sincronizados: number;
  atualizados: number;
  inseridos: number;
  erros: number;
  mudancasDetectadas: number;
  tempoExecucao: number;
  dataInicio: string;
  dataFim: string;
  detalhesErros: DetalhesErro[];
  mudancasRelevantes: MudancaRelevante[];
  estatisticasAntes: EstatisticasFrota;
  estatisticasDepois: EstatisticasFrota;
}

export interface DetalhesErro {
  prefixo: string;
  erro: string;
  detalhes: string;
  tentativas: number;
}

export interface MudancaRelevante {
  prefixo: string;
  tipo: 'STATUS' | 'GARAGEM' | 'MOTORISTA' | 'ROTA';
  valorAnterior: string;
  valorNovo: string;
  impacto: 'BAIXO' | 'MÉDIO' | 'ALTO';
}

export interface ManutencaoVeiculo {
  id: number;
  prefixo: string;
  tipo: 'PREVENTIVA' | 'CORRETIVA' | 'EMERGENCIAL' | 'PREDITIVA';
  descricao: string;
  dataAgendada: string;
  dataRealizada?: string;
  quilometragemRealizada?: number;
  valor: number;
  fornecedor: string;
  pecasUtilizadas: PecaManutencao[];
  servicosRealizados: ServicoManutencao[];
  observacoes?: string;
  garantia?: number; // em meses
  proximaManutencao?: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'ADIADA';
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  tempoParada?: number; // em horas
  responsavelTecnico?: string;
  numeroOrdemServico?: string;
  anexos?: AnexoManutencao[];
}

export interface PecaManutencao {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  fornecedor: string;
  numeroNota?: string;
  garantia?: number;
}

export interface ServicoManutencao {
  codigo: string;
  descricao: string;
  tempoExecucao: number; // em horas
  valorMaoObra: number;
  responsavel: string;
  observacoes?: string;
}

export interface AnexoManutencao {
  id: string;
  nome: string;
  tipo: 'FOTO' | 'DOCUMENTO' | 'RELATORIO' | 'NOTA_FISCAL';
  url: string;
  tamanho: number;
  dataUpload: string;
}

export interface DocumentoVeiculo {
  id: number;
  prefixo: string;
  tipoDocumento: 'CRLV' | 'SEGURO' | 'IPVA' | 'LICENCIAMENTO' | 'INSPECAO' | 'TACOGRAFO' | 'OUTROS';
  numeroDocumento: string;
  orgaoEmissor: string;
  dataEmissao: string;
  dataVencimento: string;
  valor?: number;
  status: 'VIGENTE' | 'VENCIDO' | 'VENCENDO' | 'RENOVADO' | 'CANCELADO';
  diasParaVencimento?: number;
  observacoes?: string;
  anexos?: AnexoDocumento[];
  renovacaoAutomatica?: boolean;
  alertaAntecedencia?: number; // dias antes do vencimento
}

export interface AnexoDocumento {
  id: string;
  nome: string;
  url: string;
  tipo: 'PDF' | 'IMAGEM' | 'OUTROS';
  tamanho: number;
  dataUpload: string;
}

export interface RotaVeiculo {
  id: number;
  numero: string;
  descricao: string;
  origem: string;
  destino: string;
  distancia: number; // em km
  tempoMedio: number; // em minutos
  pontos: PontoRota[];
  horarios: HorarioRota[];
  tipo: 'URBANA' | 'INTERMUNICIPAL' | 'ESPECIAL' | 'ESCOLAR';
  status: 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'MANUTENCAO';
  tarifa?: number;
  observacoes?: string;
  garagemResponsavel: string;
  veiculosAutorizados: string[];
  frequencia: 'DIARIA' | 'SEMANAL' | 'ESPECIAL';
  diasOperacao: string[];
  feriados: boolean;
  acessibilidade: boolean;
  ar_condicionado: boolean;
  wifi: boolean;
  gps: boolean;
  cameras: boolean;
}

export interface PontoRota {
  sequencia: number;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  tipo: 'PARADA' | 'TERMINAL' | 'PONTO_CONTROLE';
  tempoParada?: number; // em minutos
  acessibilidade: boolean;
  cobertura: boolean;
  iluminacao: boolean;
}

export interface HorarioRota {
  id: number;
  diaSemana: string;
  horarioSaida: string;
  horarioChegada: string;
  intervalo?: number; // em minutos
  observacoes?: string;
}

export interface MotoristaVeiculo {
  id: number;
  nome: string;
  cpf: string;
  cnh: string;
  categoriaCNH: string;
  dataVencimentoCNH: string;
  telefone: string;
  email?: string;
  endereco?: string;
  dataAdmissao: string;
  status: 'ATIVO' | 'INATIVO' | 'AFASTADO' | 'FERIAS' | 'LICENCA';
  veiculoAtual?: string;
  rotaAtual?: string;
  garagemLotacao: string;
  turno: 'MANHA' | 'TARDE' | 'NOITE' | 'MADRUGADA' | 'REVEZAMENTO';
  experiencia: number; // em anos
  cursos: CursoMotorista[];
  infrações: InfracaoMotorista[];
  avaliacoes: AvaliacaoMotorista[];
  observacoes?: string;
  foto?: string;
  documentos: DocumentoMotorista[];
}

export interface CursoMotorista {
  nome: string;
  instituicao: string;
  dataRealizacao: string;
  dataVencimento?: string;
  certificado: string;
  cargaHoraria: number;
}

export interface InfracaoMotorista {
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  pontos: number;
  status: 'PENDENTE' | 'PAGA' | 'CONTESTADA' | 'CANCELADA';
}

export interface AvaliacaoMotorista {
  data: string;
  avaliador: string;
  nota: number;
  criterios: CriterioAvaliacao[];
  observacoes?: string;
}

export interface CriterioAvaliacao {
  nome: string;
  nota: number;
  peso: number;
}

export interface DocumentoMotorista {
  tipo: 'CNH' | 'CPF' | 'RG' | 'COMPROVANTE_RESIDENCIA' | 'ATESTADO_MEDICO' | 'OUTROS';
  numero: string;
  dataEmissao: string;
  dataVencimento?: string;
  orgaoEmissor: string;
  anexo?: string;
}