// apps/frontend/src/services/departments/pessoal/types/funcionario.types.ts
export interface FuncionarioBasico {
  codfunc: number;
  nomefunc: string;
  cpf: string;
  situacao: string;
  dataadmissao: string;
  datademissao?: string;
  cargo: string;
  departamento: string;
  salario?: number;
  empresa: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FuncionarioCompleto extends FuncionarioBasico {
  cracha: string;
  rg: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  nascimento: string;
  sexo: string;
  estadocivil: string;
  escolaridade: string;
  ctps: string;
  pis: string;
  banco: string;
  agencia: string;
  conta: string;
  salariobase: number;
  salariofamilia: number;
  valeTransporte: number;
  valeRefeicao: number;
  planoSaude: number;
  outrosBeneficios: number;
  totalProventos: number;
  inss: number;
  irrf: number;
  outrosDescontos: number;
  totalDescontos: number;
  salarioLiquido: number;
  horasExtras: number;
  faltas: number;
  atrasos: number;
  observacoes: string;
  centroCusto: string;
  area: string;
  setor: string;
  turno: string;
  supervisor: string;
  tempoEmpresa: string;
  proximasFerias: string;
  ultimasFerias: string;
  saldoFerias: number;
  dependentes: number;
  foto?: string;
}

export interface PessoalDashboardData {
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosAfastados: number;
  funcionariosDemitidos: number;
  novasAdmissoes: number;
  demissoesRecentes: number;
  aniversariantes: FuncionarioBasico[];
  proximasFerias: FuncionarioBasico[];
  estatisticasPorDepartamento: DepartamentoStats[];
  evolucaoMensal: EvolucaoMensal[];
  distribuicaoSalarial: DistribuicaoSalarial[];
  indicadoresRH: IndicadoresRH;
}

export interface DepartamentoStats {
  departamento: string;
  total: number;
  ativos: number;
  afastados: number;
  percentual: number;
}

export interface EvolucaoMensal {
  mes: string;
  admissoes: number;
  demissoes: number;
  saldoLiquido: number;
}

export interface DistribuicaoSalarial {
  faixa: string;
  quantidade: number;
  percentual: number;
  salarioMedio: number;
}

export interface IndicadoresRH {
  turnover: number;
  absenteismo: number;
  satisfacao: number;
  produtividade: number;
  custoMedioPorFuncionario: number;
  tempoMedioEmpresa: number;
}

export interface SyncStatus {
  status: 'success' | 'error' | 'running' | 'idle';
  message: string;
  lastSync?: string;
  recordsProcessed?: number;
  errors?: string[];
  duration?: number;
}

export interface CacheStatus {
  totalRecords: number;
  lastUpdate: string;
  expiresAt: string;
  hitRate: number;
  size: string;
}

export interface BuscaAvancadaCriterios {
  nome?: string;
  cpf?: string;
  departamento?: string;
  cargo?: string;
  situacao?: string;
  salarioMin?: number;
  salarioMax?: number;
  dataAdmissaoInicio?: string;
  dataAdmissaoFim?: string;
  cidade?: string;
  estado?: string;
  idade?: {
    min?: number;
    max?: number;
  };
  tempoEmpresa?: {
    min?: number;
    max?: number;
  };
  escolaridade?: string;
  sexo?: string;
  estadoCivil?: string;
}

export interface AgrupamentoResult {
  tipo: string;
  grupos: {
    nome: string;
    quantidade: number;
    percentual: number;
    salarioMedio: number;
    funcionarios: FuncionarioCompleto[];
  }[];
  total: number;
  estatisticas: {
    maiorGrupo: string;
    menorGrupo: string;
    mediaGeral: number;
    desviopadrao: number;
  };
}