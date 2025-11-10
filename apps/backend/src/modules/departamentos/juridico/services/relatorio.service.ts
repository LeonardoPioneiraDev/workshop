// src/modules/departamentos/juridico/services/relatorio.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MetricasRepository } from '../repositories/metricas.repository';
import { AgenteRepository } from '../repositories/agente.repository';
import { VeiculoRepository } from '../repositories/veiculo.repository';

@Injectable()
export class RelatorioService {
  private readonly logger = new Logger(RelatorioService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly metricasRepository: MetricasRepository,
    private readonly agenteRepository: AgenteRepository,
    private readonly veiculoRepository: VeiculoRepository
  ) {}

  async gerarRelatorioExecutivo(periodo: string): Promise<any> {
    try {
      this.logger.log(`📋 Gerando relatório executivo: ${periodo}`);

      const [
        resumoGeral,
        rankingAgentes,
        rankingVeiculos,
        tendencias
        // ✅ Remover alertas do array de desestruturação
      ] = await Promise.all([
        this.analyticsService.getDashboardExecutivo(periodo),
        this.agenteRepository.getRankingProdutividade(10),
        this.veiculoRepository.getRankingMultas(10),
        this.analyticsService.getTendencias('mensal')
        // this.alertaService.obterEstatisticasAlertas() // Comentado
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        periodo,
        relatorio: {
          resumo: resumoGeral.resumo,
          performance: {
            agentes: rankingAgentes,
            veiculos: rankingVeiculos
          },
          tendencias,
          alertas: { total: 0 }, // ✅ Valor padrão direto
          recomendacoes: this.gerarRecomendacoes(resumoGeral, rankingAgentes)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório executivo: ${error.message}`);
      throw error;
    }
  }

  async gerarRelatorioOperacional(dataInicio: Date, dataFim: Date): Promise<any> {
    try {
      this.logger.log('📊 Gerando relatório operacional');

      const metricas = await this.metricasRepository.obterMetricasPorPeriodo(dataInicio, dataFim);
      
      const analise = {
        periodo: {
          inicio: dataInicio.toISOString().split('T')[0],
          fim: dataFim.toISOString().split('T')[0],
          dias: Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
        },
        totais: this.calcularTotais(metricas),
        porGaragem: this.analisarPorGaragem(metricas),
        evolucao: this.analisarEvolucao(metricas),
        indicadores: this.calcularIndicadores(metricas)
      };

      return {
        success: true,
        timestamp: new Date().toISOString(),
        ...analise
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório operacional: ${error.message}`);
      throw error;
    }
  }

  private gerarRecomendacoes(resumo: any, agentes: any[]): string[] {
    const recomendacoes = [];

    // Análise de performance
    if (resumo.resumo?.taxaArrecadacao < 70) { // ✅ Acessar resumo.resumo
      recomendacoes.push('🔴 Taxa de arrecadação baixa. Revisar processo de cobrança.');
    }

    // Análise de agentes
    const agentesAbaixoMeta = agentes.filter(a => a.percentualMeta && parseFloat(a.percentualMeta) < 80);
    if (agentesAbaixoMeta.length > 0) {
      recomendacoes.push(`⚠️ ${agentesAbaixoMeta.length} agente(s) abaixo de 80% da meta. Revisar treinamento.`);
    }

    // Recomendações gerais
    if (resumo.resumo?.multasVencidas > resumo.resumo?.multasPagas) { // ✅ Acessar resumo.resumo
      recomendacoes.push('📢 Implementar campanha de regularização de multas vencidas.');
    }

    return recomendacoes;
  }

  private calcularTotais(metricas: any[]): any {
    return metricas.reduce((acc, metrica) => ({
      totalMultas: acc.totalMultas + (metrica.totalMultas || 0),
      valorTotal: acc.valorTotal + (metrica.valorTotal || 0),
      multasPagas: acc.multasPagas + (metrica.multasPagas || 0),
      multasVencidas: acc.multasVencidas + (metrica.multasVencidas || 0),
      valorArrecadado: acc.valorArrecadado + (metrica.valorArrecadado || 0)
    }), {
      totalMultas: 0,
      valorTotal: 0,
      multasPagas: 0,
      multasVencidas: 0,
      valorArrecadado: 0
    });
  }

  private analisarPorGaragem(metricas: any[]): any[] {
    const garagensMap = new Map();
    
    metricas.forEach(metrica => {
      const garagem = metrica.nomeGaragem || 'NAO_INFORMADO';
      if (!garagensMap.has(garagem)) {
        garagensMap.set(garagem, {
          nome: garagem,
          codigo: metrica.codigoGaragem,
          totalMultas: 0,
          valorTotal: 0,
          taxaPagamentoMedia: 0,
          dias: 0
        });
      }
      
      const item = garagensMap.get(garagem);
      item.totalMultas += metrica.totalMultas || 0;
      item.valorTotal += metrica.valorTotal || 0;
      item.taxaPagamentoMedia += metrica.taxaPagamento || 0;
      item.dias++;
    });

    return Array.from(garagensMap.values()).map(item => ({
      ...item,
      taxaPagamentoMedia: item.dias > 0 ? (item.taxaPagamentoMedia / item.dias).toFixed(2) : 0,
      valorMedio: item.totalMultas > 0 ? (item.valorTotal / item.totalMultas).toFixed(2) : 0
    }));
  }

  private analisarEvolucao(metricas: any[]): any[] {
    return metricas
      .sort((a, b) => new Date(a.dataReferencia).getTime() - new Date(b.dataReferencia).getTime())
      .map((metrica, index, array) => {
        const anterior = index > 0 ? array[index - 1] : null;
        const variacao = anterior ? 
          ((metrica.totalMultas - anterior.totalMultas) / anterior.totalMultas * 100).toFixed(2) : 0;

        return {
          data: metrica.dataReferencia,
          totalMultas: metrica.totalMultas || 0,
          valorTotal: metrica.valorTotal || 0,
          variacao: `${variacao}%`
        };
      });
  }

  private calcularIndicadores(metricas: any[]): any {
    const totais = this.calcularTotais(metricas);
    const dias = metricas.length;

    return {
      multasPorDia: dias > 0 ? (totais.totalMultas / dias).toFixed(1) : 0,
      valorMedioPorDia: dias > 0 ? (totais.valorTotal / dias).toFixed(2) : 0,
      taxaArrecadacao: totais.totalMultas > 0 ? 
        ((totais.multasPagas / totais.totalMultas) * 100).toFixed(2) : 0,
      valorMedioPorMulta: totais.totalMultas > 0 ? 
        (totais.valorTotal / totais.totalMultas).toFixed(2) : 0
    };
  }

  // ✅ ==================== MÉTODOS ADICIONAIS ====================

  /**
   * 📊 RELATÓRIO MENSAL COMPLETO
   */
  async gerarRelatorioMensal(ano: number, mes: number): Promise<any> {
    try {
      this.logger.log(`📅 Gerando relatório mensal: ${mes}/${ano}`);

      const resumoMensal = await this.metricasRepository.obterResumoMensal(ano, mes);
      const rankingAgentes = await this.agenteRepository.getRankingProdutividade(10);
      const rankingVeiculos = await this.veiculoRepository.getRankingMultas(10);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        periodo: `${mes.toString().padStart(2, '0')}/${ano}`,
        relatorio: {
          resumo: resumoMensal,
          rankings: {
            agentes: rankingAgentes,
            veiculos: rankingVeiculos
          },
          recomendacoes: this.gerarRecomendacoesMensais(resumoMensal)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório mensal: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📈 RELATÓRIO DE TENDÊNCIAS
   */
  async gerarRelatorioTendencias(meses: number = 6): Promise<any> {
    try {
      this.logger.log(`📈 Gerando relatório de tendências: ${meses} meses`);

      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - meses);

      const metricas = await this.metricasRepository.obterMetricasPorPeriodo(dataInicio, new Date());
      
      const tendencias = {
        evolucaoMensal: this.calcularEvolucaoMensal(metricas),
        previsoes: this.calcularPrevisoes(metricas),
        anomalias: this.detectarAnomalias(metricas),
        sazonalidade: this.analisarSazonalidade(metricas)
      };

      return {
        success: true,
        timestamp: new Date().toISOString(),
        periodo: `${meses} meses`,
        tendencias
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório de tendências: ${error.message}`);
      throw error;
    }
  }

  // ==================== MÉTODOS AUXILIARES ADICIONAIS ====================

  private gerarRecomendacoesMensais(resumo: any): string[] {
    const recomendacoes = [];

    if (resumo.totalMultas > 1000) {
      recomendacoes.push('📊 Alto volume de multas. Considerar campanhas educativas.');
    }

    if (resumo.taxaPagamentoMedia < 75) {
      recomendacoes.push('💰 Taxa de pagamento baixa. Revisar estratégias de cobrança.');
    }

    return recomendacoes;
  }

  private calcularEvolucaoMensal(metricas: any[]): any[] {
    // Agrupar por mês
    const mesesMap = new Map();
    
    metricas.forEach(metrica => {
      const mesAno = new Date(metrica.dataReferencia).toISOString().substring(0, 7);
      if (!mesesMap.has(mesAno)) {
        mesesMap.set(mesAno, {
          periodo: mesAno,
          totalMultas: 0,
          valorTotal: 0
        });
      }
      
      const item = mesesMap.get(mesAno);
      item.totalMultas += metrica.totalMultas || 0;
      item.valorTotal += metrica.valorTotal || 0;
    });

    return Array.from(mesesMap.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private calcularPrevisoes(metricas: any[]): any {
    // Implementar previsão simples baseada em média móvel
    const evolucao = this.calcularEvolucaoMensal(metricas);
    
    if (evolucao.length < 3) {
      return { proximoMes: 'Dados insuficientes' };
    }

    const ultimos3 = evolucao.slice(-3);
    const mediaMultas = ultimos3.reduce((sum, item) => sum + item.totalMultas, 0) / 3;
    const mediaValor = ultimos3.reduce((sum, item) => sum + item.valorTotal, 0) / 3;

    return {
      proximoMes: {
        multasEstimadas: Math.round(mediaMultas),
        valorEstimado: parseFloat(mediaValor.toFixed(2)),
        confianca: 'BAIXA'
      }
    };
  }

  private detectarAnomalias(metricas: any[]): any[] {
    const anomalias = [];
    const evolucao = this.calcularEvolucaoMensal(metricas);

    for (let i = 1; i < evolucao.length; i++) {
      const atual = evolucao[i];
      const anterior = evolucao[i - 1];
      
      const variacao = anterior.totalMultas > 0 ? 
        ((atual.totalMultas - anterior.totalMultas) / anterior.totalMultas) * 100 : 0;

      if (Math.abs(variacao) > 50) { // Variação maior que 50%
        anomalias.push({
          periodo: atual.periodo,
          tipo: variacao > 0 ? 'PICO' : 'QUEDA',
          variacao: `${variacao.toFixed(1)}%`,
          valor: atual.totalMultas
        });
      }
    }

    return anomalias;
  }

  private analisarSazonalidade(metricas: any[]): any {
    const mesesMap = new Map();
    
    metricas.forEach(metrica => {
      const mes = new Date(metrica.dataReferencia).getMonth() + 1;
      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, { total: 0, count: 0 });
      }
      
      const item = mesesMap.get(mes);
      item.total += metrica.totalMultas || 0;
      item.count++;
    });

    const sazonalidade = Array.from(mesesMap.entries()).map(([mes, dados]) => ({
      mes,
      media: dados.count > 0 ? (dados.total / dados.count).toFixed(1) : 0
    }));

    return sazonalidade.sort((a, b) => a.mes - b.mes);
  }
}