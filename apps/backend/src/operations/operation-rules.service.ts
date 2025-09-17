import { Injectable } from '@nestjs/common';
import { parse, differenceInMinutes } from 'date-fns';

@Injectable()
export class OperationRulesService {
  private logBuffer: string[] = [];
  private logInterval: NodeJS.Timeout;

  constructor() {
    // Inicializa o processamento de logs a cada 2 segundos
    this.logInterval = setInterval(() => this.processLogs(), 2000);
  }

  private addToLogBuffer(message: string) {
    this.logBuffer.push(message);
  }

  private processLogs() {
    if (this.logBuffer.length > 0) {
     // console.log(this.logBuffer.join('\n'));
      this.logBuffer = [];
    }
  }

  private logDetalhe(tipo: string, viagem: any, diff: number) {
   // const message = `[${tipo}] Viagem ${viagem.Viagem} na Linha ${viagem.NomeLinha} (Carro ${viagem.PrefixoRealizado}, Motorista: ${viagem.NomeMotorista || 'Não informado'}) - Previsto: ${viagem.InicioPrevisto}, Realizado: ${viagem.InicioRealizado || 'Não informado'}, Diferença: ${diff} minutos.`;
   // this.addToLogBuffer(message);
  }

  buscarViagensPorLinha(viagens: any[], idLinha: number): any[] {
    return viagens.filter(viagem => viagem.IdLinha === idLinha);
  }

  buscarViagensPorPrefixo(viagens: any[], prefixo: string): any[] {
    return viagens.filter(viagem => viagem.PrefixoRealizado === prefixo);
  }

  verificarAtrasoInicio(inicioPrevisto: string, inicioRealizado: string, viagem: any): boolean {
    if (!inicioRealizado) return false;
    const previsto = parse(inicioPrevisto, 'dd/MM/yyyy HH:mm:ss', new Date());
    const realizado = parse(inicioRealizado, 'dd/MM/yyyy HH:mm:ss', new Date());
    const diff = differenceInMinutes(realizado, previsto);
    if (diff > 3) {
      this.logDetalhe('ATRASO', viagem, diff);
      return true;
    }
    return false;
  }
//const thresholdInSeconds = 9 * 60 + 30;
  verificarAtraso(inicioPrevisto: string, inicioRealizado: string, viagem: any): boolean {
    if (!inicioRealizado) return false;
    const previsto = parse(inicioPrevisto, 'dd/MM/yyyy HH:mm:ss', new Date());
    const realizado = parse(inicioRealizado, 'dd/MM/yyyy HH:mm:ss', new Date());
    const diffInMilliseconds = realizado.getTime() - previsto.getTime();
    const diffInSeconds = diffInMilliseconds / 1000;
    const thresholdInSeconds = 3 * 60 + 0;

    if (diffInSeconds > thresholdInSeconds) {
      this.logDetalhe('ATRASO', viagem, diffInSeconds / 60);
      return true;
    }
    return false;
  }

  // const thresholdInSeconds = 16 * 60 + 0;
  verificarAdiantado(inicioPrevisto: string, inicioRealizado: string, viagem: any): boolean {
    if (!inicioRealizado) return false;
    const previsto = parse(inicioPrevisto, 'dd/MM/yyyy HH:mm:ss', new Date());
    const realizado = parse(inicioRealizado, 'dd/MM/yyyy HH:mm:ss', new Date());
    const diffInMilliseconds = realizado.getTime() - previsto.getTime();
    const diffInSeconds = diffInMilliseconds / 1000;
    const thresholdInSeconds = 3 * 60 + 0;

    if (diffInSeconds > thresholdInSeconds) {
      this.logDetalhe('ADIANTAMENTO', viagem, diffInSeconds / 60);
      return true;
    }
    return false;
  }

  verificarFuroHorario(
    inicioPrevisto: string, 
    inicioRealizado: string, 
    viagem: any
  ): boolean {
    if (!inicioRealizado) {
      const previsto = parse(inicioPrevisto, 'dd/MM/yyyy HH:mm:ss', new Date());
      const agora = new Date();
      const diff = differenceInMinutes(agora, previsto);
      if (diff > 15) {
        const tipo = 'FURO DE HORÁRIO';
       // const message = `[${tipo}] Viagem ${viagem.Viagem} na Linha ${viagem.NomeLinha} (Carro ${viagem.PrefixoRealizado}, Motorista: ${viagem.NomeMotorista || 'Não informado'}) - Previsto: ${viagem.InicioPrevisto}, Realizado: ${viagem.InicioRealizado || 'Não informado'}, Diferença: ${diff} minutos.`;
      // console.log(message);
        // Se quiser manter o buffer, descomente a linha abaixo:
      //  this.addToLogBuffer(message);
        return true;
      }
    }
    return false;
  }

  verificarLinhaErrada(IdLinhaEsperada: number, IdLinha: number): boolean {
    return IdLinhaEsperada !== IdLinha;
  }

  verificarFuroDeViagem(IdLinhaEsperada: number, IdLinha: number): boolean {
    return IdLinhaEsperada !== IdLinha;
  }

  aplicarRegras(viagem: any): any {
    const atrasoInicio = this.verificarAtrasoInicio(viagem.InicioPrevisto, viagem.InicioRealizado, viagem);
    const atraso = this.verificarAtraso(viagem.InicioPrevisto, viagem.InicioRealizado, viagem);
    const adiantado = this.verificarAdiantado(viagem.InicioPrevisto, viagem.InicioRealizado, viagem);
    const furoHorario = this.verificarFuroHorario(viagem.InicioPrevisto, viagem.InicioRealizado, viagem);
    const linhaErrada = this.verificarLinhaErrada(viagem.IdLinhaEsperada, viagem.IdLinha);
    const furoDeViagem = this.verificarFuroDeViagem(viagem.IdLinhaEsperada, viagem.IdLinha);

    return {
      ...viagem,
      regras: {
        atrasoInicio,
        atraso,
        adiantado,
        furoHorario,
        linhaErrada,
        furoDeViagem,
      },
    };
  }
}