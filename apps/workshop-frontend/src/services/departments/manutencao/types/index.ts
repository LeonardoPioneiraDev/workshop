// src/services/departments/manutencao/types/index.ts

export interface OrdemServico {
  codigoInternoOS: number;
  numeroOS: string;
  codigoVeiculo: number;
  codigoGaragem: number;
  prefixoVeiculo?: string;
  placaVeiculo?: string;
  condicaoVeiculo?: string;
  dataAbertura?: string;
  dataFechamento?: string;
  horaAbertura?: string;
  tipoOSDescricao?: string;
  tipoOS?: string;
  condicaoOSDescricao?: string;
  condicaoOS?: string;
  codigoOrigemOS?: number;
  usuarioAbertura?: string;
  descricaoOrigem?: string;
  descricaoServico?: string;
  codigoSetor?: number;
  codigoGrupoServico?: number;
  grupoServico?: string;
  garagem?: string;
  tipoProblema?: string;
  diasEmAndamento?: number;
  kmExecucao?: number;
  valorMaoObraTerceiros?: number;
  valorPecasTerceiros?: number;
  ehSocorro?: string;
  dataSincronizacao?: string;
  createdAt?: string;
}

export interface FiltrosOS {
  startDate?: string;
  endDate?: string;
  data_inicio?: string;
  data_fim?: string;
  origens?: number[];
  garagens?: number[];
  setor_codigo?: number;
  setor?: string;
  garagem?: string;
  prefixo?: string;
  numeroOS?: string;
  numero_os?: string;
  placa?: string;
  tipoOS?: string;
  condicaoOS?: string;
  // ✅ ADICIONADO: Campo statusOS para filtrar abertas/fechadas corretamente
  statusOS?: 'A' | 'FC'; // ✅ ADICIONADO
  tipoProblema?: string;
  limit?: number;
  page?: number;
  forcarSincronizacao?: boolean;
}

export interface EstatisticasOS {
  resumo: {
    totalRegistros: number;
    osAbertas: number;
    osFechadas: number;
    quebras: number;
    defeitos: number;
    socorros: number;
  };
  distribuicoes: {
    tiposOS: Record<string, number>;
    statusOS: Record<string, number>;
    garagens: Record<string, number>;
    tiposProblema: Record<string, number>;
  };
  indicadores: {
    totalValorTerceiros: string;
    percentualAbertas: string;
    percentualFechadas: string;
  };
}

export interface RespostaOSData {
  success: boolean;
  timestamp: string;
  message: string;
  filters: FiltrosOS;
  data: OrdemServico[];
  count: number;
  totalRegistros?: number;
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  statistics?: EstatisticasOS;
  fonte?: string;
}

export interface RespostaSincronizacao {
  success: boolean;
  timestamp: string;
  message: string;
  executionTime: string;
  total: number;
  sincronizados: number;
  atualizados: number;
}

export type StatusOS = 'A' | 'FC';
export type TipoOS = 'C' | 'P';
export type TipoProblema = 'QUEBRA' | 'DEFEITO';

export const STATUS_OS_LABELS: Record<StatusOS, string> = {
  'A': 'Aberta',
  'FC': 'Fechada'
};

export const TIPO_OS_LABELS: Record<TipoOS, string> = {
  'C': 'Corretiva',
  'P': 'Preventiva'
};

export const TIPO_PROBLEMA_LABELS: Record<TipoProblema, string> = {
  'QUEBRA': 'Quebra',
  'DEFEITO': 'Defeito'
};

export const GARAGENS = [
  { codigo: 31, nome: 'PARANOÁ' },
  { codigo: 124, nome: 'SANTA MARIA' },
  { codigo: 239, nome: 'SÃO SEBASTIÃO' },
  { codigo: 240, nome: 'GAMA' }
];

export const ORIGENS = [
  { codigo: 23, nome: 'QUEBRA' },
  { codigo: 24, nome: 'DEFEITO' }
];