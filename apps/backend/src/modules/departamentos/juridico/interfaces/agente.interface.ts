// src/modules/departamentos/juridico/interfaces/agente.interface.ts
export interface PerformanceAgente {
  agente: {
    id: number;
    codigo: string;
    nome: string;
    status: string;
  };
  totalMultas: number;
  valorTotal: number;
  meta: number;
  multasPorDia: number;
  valorMedio: number;
  eficiencia: number;
  classificacao: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
}