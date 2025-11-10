// src/types/departments/pessoal/index.ts

// Adicione esta interface que está faltando:
export interface DashboardFuncionariosCompletos {
  resumo: {
    totalFuncionarios: number;
    ativos: number;
    inativos: number;
    afastados: number;
    demitidos: number;
    novasAdmissoes: number;
    demissoes: number;
    salarioMedio: number;
    percentualAtivos: number;
    percentualInativos: number;
  };
  distribuicao: {
    porDepartamento: Array<{ departamento: string; total: number; percentual: number }>;
    porArea: Array<{ area: string; total: number; percentual: number }>;
    porCidade: Array<{ cidade: string; total: number; percentual: number }>;
    porSituacao: Array<{ situacao: string; total: number; percentual: number }>;
    porFaixaSalarial: Array<{ faixa: string; total: number; percentual: number }>;
  };
  estatisticas: {
    idadeMedia: number;
    tempoMedioEmpresa: number;
    salarioMedio: number;
    salarioMinimo: number;
    salarioMaximo: number;
    funcionarioMaisAntigo: string;
    funcionarioMaisNovo: string;
  };
  mesReferencia: string;
  ultimaAtualizacao: string;
}