// src/modules/departamentos/juridico/interfaces/configuracao.interface.ts
export interface ConfiguracaoSistema {
  sistema: {
    versao: string;
    ambiente: string;
    debug: boolean;
  };
  alertas: {
    evitarDuplicatas: boolean;
    diasManterAlertas: number;
    notificacoesPorEmail: boolean;
    limitePorHora: number;
  };
  multas: {
    valorMinimoUFIR: number;
    diasVencimento: number;
    jurosAtraso: number;
  };
  agentes: {
    metaPadrao: number;
    bonusProdutividade: boolean;
  };
  relatorios: {
    formatoPadrao: string;
    incluirGraficos: boolean;
  };
}