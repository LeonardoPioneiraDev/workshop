// apps/backend/src/modules/departamentos/juridico/types/multa-completa.types.ts

export interface SyncResult {
  total: number;
  novos: number;
  atualizados: number;
  periodo: { inicio: string; fim: string };
  fonte: 'oracle' | 'cache';
  tempoExecucao?: string;
  erros?: string[];
}

export interface MultaCompletaResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: MultaResumo;
  groups?: AgrupamentoResult[];
}

export interface MultaResumo {
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
  // Campos específicos de analytics
  multasTransito?: number;
  multasSemob?: number;
  valorMedioTransito?: number;
  valorMedioSemob?: number;
  totalAgentes?: number;
  totalVeiculos?: number;
  pontosTotal?: number;
}

// Interfaces para agrupamentos
export interface AgrupamentoBase {
  total: number;
  valorTotal?: number;
  valorMedio?: number;
}

export interface AgrupamentoPorAgente extends AgrupamentoBase {
  codigo: string;
  descricao: string;
}

export interface AgrupamentoPorVeiculo extends AgrupamentoBase {
  codigo: string;
  prefixo: string;
}

export interface AgrupamentoPorInfracao extends AgrupamentoBase {
  codigo: string;
  descricao: string;
  grupo: string;
}

export interface AgrupamentoPorPeriodo extends AgrupamentoBase {
  periodo: string;
}

export type AgrupamentoResult = 
  | AgrupamentoPorAgente 
  | AgrupamentoPorVeiculo 
  | AgrupamentoPorInfracao 
  | AgrupamentoPorPeriodo;

// Interfaces para analytics
export interface DistribuicaoPorTipo {
  tipo: 'TRANSITO' | 'SEMOB';
  total: number;
  valor: number;
  percentual: number;
}

export interface DistribuicaoPorGravidade {
  gravidade: string;
  total: number;
  valor: number;
  pontos: number;
  percentual: number;
}

export interface TopAgente {
  codigo: string;
  nome: string;
  total: number;
  valor: number;
}

export interface TopLocal {
  local: string;
  total: number;
  valor: number;
}

export interface Analytics {
  distribuicaoPorTipo: DistribuicaoPorTipo[];
  distribuicaoPorGravidade: DistribuicaoPorGravidade[];
  topAgentes: TopAgente[];
  topLocais: TopLocal[];
  evolucaoMensal: any[];
}

// Interface para dados internos de cálculo
export interface GravidadeData {
  total: number;
  valor: number;
  pontos: number;
}

export interface AgenteData {
  codigo: string;
  nome: string;
  total: number;
  valor: number;
}

export interface LocalData {
  total: number;
  valor: number;
}