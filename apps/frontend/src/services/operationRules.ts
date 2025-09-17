// services/operationRules.ts
import { parse, differenceInMinutes, differenceInSeconds } from 'date-fns';

export interface ViagemData {
  Viagem: string;
  IdLinha: number;
  IdLinhaEsperada?: number;
  NomeLinha: string;
  PrefixoRealizado: string;
  NomeMotorista?: string;
  InicioPrevisto: string;
  InicioRealizado?: string;
}

export interface RegrasResult {
  atrasoInicio: boolean;
  atraso: boolean;
  adiantado: boolean;
  furoHorario: boolean;
  linhaErrada: boolean;
  furoDeViagem: boolean;
}

export interface ViagemComRegras extends ViagemData {
  regras: RegrasResult;
}

export class OperationRulesService {
  private parseDate(dateString: string): Date {
    return parse(dateString, 'dd/MM/yyyy HH:mm:ss', new Date());
  }

  verificarAtrasoInicio(inicioPrevisto: string, inicioRealizado?: string): boolean {
    if (!inicioRealizado) return false;
    
    const previsto = this.parseDate(inicioPrevisto);
    const realizado = this.parseDate(inicioRealizado);
    const diff = differenceInMinutes(realizado, previsto);
    
    return diff > 3;
  }

  verificarAtraso(inicioPrevisto: string, inicioRealizado?: string): boolean {
    if (!inicioRealizado) return false;
    
    const previsto = this.parseDate(inicioPrevisto);
    const realizado = this.parseDate(inicioRealizado);
    const diffInMilliseconds = realizado.getTime() - previsto.getTime();
    const diffInSeconds = diffInMilliseconds / 1000;
    const thresholdInSeconds = 3 * 60; // 3 minutos
    
    return diffInSeconds > thresholdInSeconds;
  }

  verificarAdiantado(inicioPrevisto: string, inicioRealizado?: string): boolean {
    if (!inicioRealizado) return false;
    
    const previsto = this.parseDate(inicioPrevisto);
    const realizado = this.parseDate(inicioRealizado);
    const diffInMilliseconds = realizado.getTime() - previsto.getTime();
    const diffInSeconds = diffInMilliseconds / 1000;
    const thresholdInSeconds = 3 * 60; // 3 minutos
    
    // Corrigindo a lógica: adiantado é quando a diferença é NEGATIVA (menor que -threshold)
    return diffInSeconds < -thresholdInSeconds;
  }

  verificarFuroHorario(inicioPrevisto: string, inicioRealizado?: string): boolean {
    if (inicioRealizado) return false; // Se tem início realizado, não é furo
    
    const previsto = this.parseDate(inicioPrevisto);
    const agora = new Date();
    const diff = differenceInMinutes(agora, previsto);
    
    return diff > 15;
  }

  verificarLinhaErrada(idLinhaEsperada?: number, idLinha?: number): boolean {
    if (!idLinhaEsperada || !idLinha) return false;
    return idLinhaEsperada !== idLinha;
  }

  verificarFuroDeViagem(idLinhaEsperada?: number, idLinha?: number): boolean {
    return this.verificarLinhaErrada(idLinhaEsperada, idLinha);
  }

  aplicarRegras(viagem: ViagemData): ViagemComRegras {
    const regras: RegrasResult = {
      atrasoInicio: this.verificarAtrasoInicio(viagem.InicioPrevisto, viagem.InicioRealizado),
      atraso: this.verificarAtraso(viagem.InicioPrevisto, viagem.InicioRealizado),
      adiantado: this.verificarAdiantado(viagem.InicioPrevisto, viagem.InicioRealizado),
      furoHorario: this.verificarFuroHorario(viagem.InicioPrevisto, viagem.InicioRealizado),
      linhaErrada: this.verificarLinhaErrada(viagem.IdLinhaEsperada, viagem.IdLinha),
      furoDeViagem: this.verificarFuroDeViagem(viagem.IdLinhaEsperada, viagem.IdLinha),
    };

    return {
      ...viagem,
      regras,
    };
  }

  // Métodos para análise de dados
  buscarViagensPorLinha(viagens: ViagemData[], idLinha: number): ViagemData[] {
    return viagens.filter(viagem => viagem.IdLinha === idLinha);
  }

  buscarViagensPorPrefixo(viagens: ViagemData[], prefixo: string): ViagemData[] {
    return viagens.filter(viagem => viagem.PrefixoRealizado === prefixo);
  }

  // Métodos para geração de dados para gráficos
  calcularEstatisticasRegras(viagensComRegras: ViagemComRegras[]) {
    const total = viagensComRegras.length;
    if (total === 0) return null;

    const contadores = {
      atrasoInicio: 0,
      atraso: 0,
      adiantado: 0,
      furoHorario: 0,
      linhaErrada: 0,
      furoDeViagem: 0,
      pontual: 0,
    };

    viagensComRegras.forEach(viagem => {
      const { regras } = viagem;
      
      if (regras.atrasoInicio) contadores.atrasoInicio++;
      if (regras.atraso) contadores.atraso++;
      if (regras.adiantado) contadores.adiantado++;
      if (regras.furoHorario) contadores.furoHorario++;
      if (regras.linhaErrada) contadores.linhaErrada++;
      if (regras.furoDeViagem) contadores.furoDeViagem++;
      
      // Pontual: não tem nenhuma das regras ativas
      if (!Object.values(regras).some(regra => regra)) {
        contadores.pontual++;
      }
    });

    return {
      total,
      contadores,
      percentuais: {
        atrasoInicio: (contadores.atrasoInicio / total) * 100,
        atraso: (contadores.atraso / total) * 100,
        adiantado: (contadores.adiantado / total) * 100,
        furoHorario: (contadores.furoHorario / total) * 100,
        linhaErrada: (contadores.linhaErrada / total) * 100,
        furoDeViagem: (contadores.furoDeViagem / total) * 100,
        pontual: (contadores.pontual / total) * 100,
      },
    };
  }
}