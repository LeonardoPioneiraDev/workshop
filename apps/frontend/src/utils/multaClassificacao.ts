// apps/frontend/src/utils/multaClassificacao.ts
import { MultaCompleta, MultaClassificada, TipoMulta, StatusPrazo } from '../types/multa-completa';

export class MultaClassificador {
  // ✅ MAPEAMENTO DE CÓDIGOS
  static readonly AREAS_COMPETENCIA = {
    1: 'Administração',
    2: 'Manutenção', 
    3: 'Operação',
    4: 'Cancelamento',
    5: 'Portaria',
    6: 'Eletricista',
    7: 'PCQC/Portaria'
  };

  static readonly RESPONSAVEIS_NOTIFICACAO = {
    1: 'Operação',
    2: 'Manutenção',
    3: 'Administração', 
    4: 'Portaria',
    5: 'Eletricista',
    6: 'PCQC/Portaria'
  };

  static readonly DIAS_SEMANA = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  // ✅ CLASSIFICAR TIPO POR VALOR
  static classificarTipo(valor: number): TipoMulta {
    if (valor === 495) return 'A';
    if (valor === 990) return 'B';
    if (valor === 1980) return 'C'; // GRAVE reincidência
    
    // Fallback para valores próximos
    if (valor <= 500) return 'A';
    if (valor <= 1000) return 'B';
    return 'C';
  }

  // ✅ CALCULAR STATUS DO PRAZO
  static calcularStatusPrazo(dataLimite?: Date | string): { status: StatusPrazo; dias: number } {
    if (!dataLimite) return { status: 'OK', dias: 999 };
    
    const limite = new Date(dataLimite);
    const hoje = new Date();
    const diffTime = limite.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'VENCIDO', dias: diffDays };
    if (diffDays <= 1) return { status: 'CRITICO', dias: diffDays };
    if (diffDays <= 3) return { status: 'ATENCAO', dias: diffDays };
    if (diffDays <= 7) return { status: 'ATENCAO', dias: diffDays };
    
    return { status: 'OK', dias: diffDays };
  }

  // ✅ EXTRAIR HORA DA INFRAÇÃO
  static extrairHora(dataHora?: Date | string): number {
    if (!dataHora) return 0;
    const data = new Date(dataHora);
    return data.getHours();
  }

  // ✅ EXTRAIR DIA DA SEMANA
  static extrairDiaSemana(dataHora?: Date | string): string {
    if (!dataHora) return 'N/A';
    const data = new Date(dataHora);
    return this.DIAS_SEMANA[data.getDay()];
  }

  // ✅ VERIFICAR SE É SEMOB
  static isSemob(codigoOrg?: number, agenteCodigo?: string): boolean {
    return codigoOrg === 16 || !!agenteCodigo;
  }

  // ✅ CLASSIFICAR MULTA COMPLETA
  static classificar(multa: MultaCompleta): MultaClassificada {
    const prazo = this.calcularStatusPrazo(multa.dataLimiteCondutor);
    
    return {
      ...multa,
      tipoMulta: this.classificarTipo(multa.valorMulta),
      statusPrazo: prazo.status,
      diasParaVencimento: prazo.dias,
      nomeAreaCompetencia: this.AREAS_COMPETENCIA[multa.codAreaCompetencia as keyof typeof this.AREAS_COMPETENCIA] || 'N/A',
      nomeResponsavelNotificacao: this.RESPONSAVEIS_NOTIFICACAO[multa.codResponsavelNotificacao as keyof typeof this.RESPONSAVEIS_NOTIFICACAO] || 'N/A',
      horaInfracao: this.extrairHora(multa.dataHoraMulta),
      diaSemanaInfracao: this.extrairDiaSemana(multa.dataHoraMulta),
      isSemob: this.isSemob(multa.codigoOrg, multa.agenteCodigo)
    };
  }

  // ✅ CLASSIFICAR ARRAY DE MULTAS
  static classificarArray(multas: MultaCompleta[]): MultaClassificada[] {
    return multas.map(multa => this.classificar(multa));
  }

  // ✅ GERAR ALERTAS DE PRAZO
  static gerarAlertas(multas: MultaClassificada[]): any[] {
    return multas
      .filter(m => m.statusPrazo !== 'OK' && m.dataLimiteCondutor)
      .map(m => ({
        id: m.numeroAiMulta,
        numeroAiMulta: m.numeroAiMulta,
        prefixoVeic: m.prefixoVeic,
        dataLimiteCondutor: new Date(m.dataLimiteCondutor!),
        diasRestantes: m.diasParaVencimento,
        criticidade: this.mapearCriticidade(m.statusPrazo),
        valorMulta: m.valorMulta,
        tipoMulta: m.tipoMulta,
        responsavelMulta: m.responsavelMulta,
        observacaoRealMotivo: m.observacaoRealMotivo
      }))
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }

  private static mapearCriticidade(status: StatusPrazo): 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
    switch (status) {
      case 'VENCIDO': return 'CRITICA';
      case 'CRITICO': return 'CRITICA';
      case 'ATENCAO': return 'ALTA';
      default: return 'BAIXA';
    }
  }

  // ✅ ANALISAR HORÁRIOS
  static analisarHorarios(multas: MultaClassificada[]): any[] {
    const analise = Array.from({ length: 24 }, (_, hora) => ({
      hora,
      totalMultas: 0,
      valorTotal: 0,
      percentual: 0,
      tiposPredominantes: [] as TipoMulta[]
    }));

    const totalGeral = multas.length;

    multas.forEach(multa => {
      const hora = multa.horaInfracao;
      if (hora >= 0 && hora <= 23) {
        analise[hora].totalMultas++;
        analise[hora].valorTotal += multa.valorMulta;
      }
    });

    // Calcular percentuais
    analise.forEach(item => {
      item.percentual = totalGeral > 0 ? (item.totalMultas / totalGeral) * 100 : 0;
    });

    return analise.sort((a, b) => b.totalMultas - a.totalMultas);
  }

  // ✅ ANALISAR POR SETOR
  static analisarSetores(multas: MultaClassificada[]): any[] {
    const setores = new Map();

    multas.forEach(multa => {
      const codigo = multa.codAreaCompetencia || 0;
      const nome = multa.nomeAreaCompetencia;

      if (!setores.has(codigo)) {
        setores.set(codigo, {
          codigo,
          nome,
          totalMultas: 0,
          valorTotal: 0,
          multasVencendo: 0,
          tipoA: 0,
          tipoB: 0,
          tipoC: 0,
          funcionario: 0,
          empresa: 0
        });
      }

      const setor = setores.get(codigo);
      setor.totalMultas++;
      setor.valorTotal += multa.valorMulta;

      if (multa.statusPrazo === 'ATENCAO' || multa.statusPrazo === 'CRITICO') {
        setor.multasVencendo++;
      }

      // Contar por tipo
      if (multa.tipoMulta === 'A') setor.tipoA++;
      else if (multa.tipoMulta === 'B') setor.tipoB++;
      else if (multa.tipoMulta === 'C') setor.tipoC++;

      // Contar por responsável
      if (multa.responsavelMulta === 'F') setor.funcionario++;
      else if (multa.responsavelMulta === 'E') setor.empresa++;
    });

    return Array.from(setores.values()).sort((a, b) => b.totalMultas - a.totalMultas);
  }
}

// ✅ UTILITÁRIOS DE FORMATAÇÃO
export const formatarStatusPrazo = (status: StatusPrazo): { texto: string; cor: string; icone: string } => {
  switch (status) {
    case 'OK':
      return { texto: 'No Prazo', cor: 'text-green-400', icone: '✅' };
    case 'ATENCAO':
      return { texto: 'Atenção', cor: 'text-yellow-400', icone: '⚠️' };
    case 'CRITICO':
      return { texto: 'Crítico', cor: 'text-red-400', icone: '🚨' };
    case 'VENCIDO':
      return { texto: 'Vencido', cor: 'text-red-600', icone: '❌' };
    default:
      return { texto: 'N/A', cor: 'text-gray-400', icone: '❓' };
  }
};

export const formatarTipoMulta = (tipo: TipoMulta): { texto: string; cor: string; descricao: string } => {
  switch (tipo) {
    case 'A':
      return { texto: 'Tipo A', cor: 'bg-green-500', descricao: 'R$ 495 - Leve' };
    case 'B':
      return { texto: 'Tipo B', cor: 'bg-yellow-500', descricao: 'R$ 990 - Média' };
    case 'C':
      return { texto: 'Tipo C', cor: 'bg-red-500', descricao: 'R$ 1.980 - GRAVE Reincidência' };
    default:
      return { texto: 'N/A', cor: 'bg-gray-500', descricao: 'Não classificado' };
  }
};

export const formatarResponsavel = (responsavel: ResponsavelMulta): { texto: string; cor: string; icone: string } => {
  switch (responsavel) {
    case 'F':
      return { texto: 'Funcionário', cor: 'text-blue-400', icone: '👤' };
    case 'E':
      return { texto: 'Empresa', cor: 'text-purple-400', icone: '🏢' };
    default:
      return { texto: 'N/A', cor: 'text-gray-400', icone: '❓' };
  }
};