// src/modules/departamentos/juridico/services/dashboard-realtime.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AlertaService } from './alerta.service';
import { MetricasRepository } from '../repositories/metricas.repository';
import { MultaCacheRepository } from '../repositories/multa-cache.repository';
import { AgenteRepository } from '../repositories/agente.repository';
import { VeiculoRepository } from '../repositories/veiculo.repository';

@Injectable()
export class DashboardRealtimeService {
  private readonly logger = new Logger(DashboardRealtimeService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly alertaService: AlertaService,
    private readonly metricasRepository: MetricasRepository,
    private readonly multaCacheRepository: MultaCacheRepository,
    private readonly agenteRepository: AgenteRepository,
    private readonly veiculoRepository: VeiculoRepository
  ) {}

  /**
   * 📊 DASHBOARD COMPLETO EM TEMPO REAL
   */
  async getDashboardCompleto(): Promise<any> {
    try {
      this.logger.log('📊 Gerando dashboard completo em tempo real');

      const [
        resumoHoje,
        alertasAtivos,
        tendenciasRecentes,
        rankingAtual,
        metricas24h,
        statusSistema
      ] = await Promise.all([
        this.obterResumoHoje(),
        this.obterAlertasResumo(),
        this.obterTendenciasRecentes(),
        this.obterRankingAtual(),
        this.obterMetricas24h(),
        this.obterStatusSistema()
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        dashboard: {
          resumoHoje,
          alertas: alertasAtivos,
          tendencias: tendenciasRecentes,
          rankings: rankingAtual,
          metricas24h,
          sistema: statusSistema,
          widgets: this.gerarWidgets(resumoHoje, alertasAtivos, metricas24h)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * ⚡ MÉTRICAS EM TEMPO REAL
   */
  async getMetricasTempoReal(): Promise<any> {
    try {
      const agora = new Date();
      const inicio24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      const multas24h = await this.multaCacheRepository.buscarPorPeriodo(inicio24h, agora);

      // Agrupar por hora
      const multasPorHora = new Array(24).fill(0);
      const valorPorHora = new Array(24).fill(0);

      multas24h.forEach(multa => {
        // ✅ CORRIGIDO: usar data_emissao
        const horaMulta = new Date(multa.data_emissao).getHours();
        const horaAtual = agora.getHours();
        const horaIndex = (horaMulta - horaAtual + 24) % 24;
        
        multasPorHora[horaIndex]++;
        // ✅ CORRIGIDO: usar valor_multa
        valorPorHora[horaIndex] += multa.valor_multa || 0;
      });

      return {
        success: true,
        timestamp: new Date().toISOString(),
        periodo: '24 horas',
        dados: {
          multasPorHora,
          valorPorHora,
          total24h: multas24h.length,
          // ✅ CORRIGIDO: usar valor_multa
          valorTotal24h: multas24h.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
          mediaHoraria: (multas24h.length / 24).toFixed(1),
          horaAtual: agora.getHours()
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter métricas tempo real: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📈 INDICADORES KPI
   */
  async getIndicadoresKPI(): Promise<any> {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);
      
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      
      const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        multasHoje,
        multasOntem,
        multasSemana
      ] = await Promise.all([
        this.multaCacheRepository.buscarPorPeriodo(hoje, amanha),
        this.multaCacheRepository.buscarPorPeriodo(ontem, hoje),
        this.multaCacheRepository.buscarPorPeriodo(semanaPassada, amanha)
      ]);

      const kpis = {
        multasHoje: {
          valor: multasHoje.length,
          variacao: this.calcularVariacao(multasHoje.length, multasOntem.length),
          tendencia: multasHoje.length > multasOntem.length ? 'CRESCENTE' : 'DECRESCENTE'
        },
        valorHoje: {
          // ✅ CORRIGIDO: usar valor_multa
          valor: multasHoje.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
          variacao: this.calcularVariacao(
            multasHoje.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
            multasOntem.reduce((sum, m) => sum + (m.valor_multa || 0), 0)
          ),
          tendencia: 'ESTAVEL'
        },
        taxaPagamento: {
          valor: this.calcularTaxaPagamento(multasSemana),
          meta: 80,
          status: this.calcularTaxaPagamento(multasSemana) >= 80 ? 'BOM' : 'ATENCAO'
        },
        multasVencidas: {
          // ✅ CORRIGIDO: usar status_multa
          valor: multasSemana.filter(m => m.status_multa === 'VENCIDA').length,
          total: multasSemana.length,
          percentual: this.calcularPercentual(
            multasSemana.filter(m => m.status_multa === 'VENCIDA').length,
            multasSemana.length
          )
        }
      };

      return {
        success: true,
        timestamp: new Date().toISOString(),
        kpis,
        alertas: this.gerarAlertasKPI(kpis)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao calcular KPIs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 WIDGET ESPECÍFICO
   */
  async gerarWidget(tipo: string, periodo?: string): Promise<any> {
    switch (tipo) {
      case 'multas':
        return await this.gerarWidgetMultas(periodo);
      case 'valores':
        return await this.gerarWidgetValores(periodo);
      case 'alertas':
        return await this.gerarWidgetAlertas();
      case 'performance':
        return await this.gerarWidgetPerformance(periodo);
      case 'tendencias':
        return await this.gerarWidgetTendencias(periodo);
      default:
        throw new Error(`Widget ${tipo} não implementado`);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async obterResumoHoje(): Promise<any> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const multasHoje = await this.multaCacheRepository.buscarPorPeriodo(hoje, amanha);

    return {
      totalMultas: multasHoje.length,
      // ✅ CORRIGIDO: usar valor_multa
      valorTotal: multasHoje.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
      // ✅ CORRIGIDO: usar status_multa
      multasPagas: multasHoje.filter(m => m.status_multa === 'PAGA').length,
      multasVencidas: multasHoje.filter(m => m.status_multa === 'VENCIDA').length,
      valorMedio: multasHoje.length > 0 ? 
        // ✅ CORRIGIDO: usar valor_multa
        (multasHoje.reduce((sum, m) => sum + (m.valor_multa || 0), 0) / multasHoje.length).toFixed(2) : 0
    };
  }

  private async obterAlertasResumo(): Promise<any> {
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.alertaService.obterEstatisticasAlertas === 'function') {
        const estatisticas = await this.alertaService.obterEstatisticasAlertas();
        return estatisticas;
      } else {
        // ✅ FALLBACK SE O MÉTODO NÃO EXISTIR
        this.logger.warn('⚠️ Método obterEstatisticasAlertas não encontrado no AlertaService');
        return { total: 0, ativos: 0, criticos: 0 };
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter alertas: ${error.message}`);
      return { total: 0, ativos: 0, criticos: 0 };
    }
  }

  private async obterTendenciasRecentes(): Promise<any> {
    const ultimos7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.metricasRepository.obterMetricasPorPeriodo === 'function') {
        const metricas = await this.metricasRepository.obterMetricasPorPeriodo(ultimos7Dias, new Date());

        return {
          periodo: '7 dias',
          dados: metricas.map(m => ({
            data: m.dataReferencia,
            multas: m.totalMultas,
            valor: m.valorTotal
          })),
          tendencia: this.analisarTendencia(metricas)
        };
      } else {
        // ✅ FALLBACK USANDO DADOS DO CACHE
        const dados = await this.multaCacheRepository.buscarPorPeriodo(ultimos7Dias, new Date());
        
        // ✅ AGRUPAR POR DIA
        const dadosPorDia = new Map();
        dados.forEach(multa => {
          const dia = multa.data_emissao.toISOString().split('T')[0];
          if (!dadosPorDia.has(dia)) {
            dadosPorDia.set(dia, { totalMultas: 0, valorTotal: 0 });
          }
          const item = dadosPorDia.get(dia);
          item.totalMultas++;
          item.valorTotal += multa.valor_multa || 0;
        });

        const metricasSimuladas = Array.from(dadosPorDia.entries()).map(([dia, dados]) => ({
          dataReferencia: dia,
          totalMultas: dados.totalMultas,
          valorTotal: dados.valorTotal
        }));

        return {
          periodo: '7 dias',
          dados: metricasSimuladas.map(m => ({
            data: m.dataReferencia,
            multas: m.totalMultas,
            valor: m.valorTotal
          })),
          tendencia: this.analisarTendencia(metricasSimuladas)
        };
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter tendências: ${error.message}`);
      return {
        periodo: '7 dias',
        dados: [],
        tendencia: 'INDISPONIVEL'
      };
    }
  }

  private async obterRankingAtual(): Promise<any> {
    try {
      const [agentes, garagens] = await Promise.all([
        // ✅ VERIFICAR SE OS MÉTODOS EXISTEM
        this.obterRankingAgentesSimplificado(),
        this.obterRankingGaragensSimplificado()
      ]);

      return {
        agentes: agentes.slice(0, 5),
        garagens: garagens.slice(0, 5)
      };
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter rankings: ${error.message}`);
      return {
        agentes: [],
        garagens: []
      };
    }
  }

  private async obterRankingAgentesSimplificado(): Promise<any[]> {
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.agenteRepository.getRankingProdutividade === 'function') {
        return await this.agenteRepository.getRankingProdutividade(5);
      } else {
        // ✅ FALLBACK: BUSCAR DADOS DO CACHE E PROCESSAR
        const ultimos30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dados = await this.multaCacheRepository.buscarPorPeriodo(ultimos30Dias, new Date());
        
        const agentesMap = new Map();
        dados.forEach(multa => {
          const agente = multa.nome_agente || 'Não informado';
          if (!agentesMap.has(agente)) {
            agentesMap.set(agente, { nome: agente, totalMultas: 0, valorTotal: 0 });
          }
          const item = agentesMap.get(agente);
          item.totalMultas++;
          item.valorTotal += multa.valor_multa || 0;
        });

        return Array.from(agentesMap.values())
          .sort((a, b) => b.totalMultas - a.totalMultas)
          .slice(0, 5);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter ranking de agentes: ${error.message}`);
      return [];
    }
  }

  private async obterRankingGaragensSimplificado(): Promise<any[]> {
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.veiculoRepository.obterEstatisticasPorGaragem === 'function') {
        return await this.veiculoRepository.obterEstatisticasPorGaragem();
      } else {
        // ✅ FALLBACK: BUSCAR DADOS DO CACHE E PROCESSAR
        const ultimos30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dados = await this.multaCacheRepository.buscarPorPeriodo(ultimos30Dias, new Date());
        
        const garagensMap = new Map();
        dados.forEach(multa => {
          const garagem = multa.nome_garagem || 'Não informado';
          if (!garagensMap.has(garagem)) {
            garagensMap.set(garagem, { nome: garagem, totalMultas: 0, valorTotal: 0 });
          }
          const item = garagensMap.get(garagem);
          item.totalMultas++;
          item.valorTotal += multa.valor_multa || 0;
        });

        return Array.from(garagensMap.values())
          .sort((a, b) => b.totalMultas - a.totalMultas)
          .slice(0, 5);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter ranking de garagens: ${error.message}`);
      return [];
    }
  }

  private async obterMetricas24h(): Promise<any> {
    const inicio24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const multas = await this.multaCacheRepository.buscarPorPeriodo(inicio24h, new Date());

    return {
      total: multas.length,
      porGravidade: this.agruparPorGravidade(multas),
      porGaragem: this.agruparPorGaragem(multas),
      evolucaoHoraria: this.calcularEvolucaoHoraria(multas)
    };
  }

  private async obterStatusSistema(): Promise<any> {
    return {
      uptime: process.uptime(),
      memoria: this.formatarMemoria(process.memoryUsage()),
      cache: await this.obterStatusCache(),
      ultimaAtualizacao: new Date().toISOString()
    };
  }

  private async obterStatusCache(): Promise<any> {
    try {
      const estatisticas = await this.multaCacheRepository.obterEstatisticasCache();
      return { 
        status: 'OPERACIONAL', 
        totalRegistros: estatisticas.totalRegistros,
        ultimaAtualizacao: estatisticas.datas.ultimaAtualizacao
      };
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter status do cache: ${error.message}`);
      return { status: 'ERRO', totalRegistros: 0 };
    }
  }

  private gerarWidgets(resumo: any, alertas: any, metricas: any): any[] {
    return [
      {
        id: 'multas-hoje',
        tipo: 'contador',
        titulo: 'Multas Hoje',
        valor: resumo.totalMultas,
        icone: '🚨',
        cor: 'blue'
      },
      {
        id: 'valor-total',
        tipo: 'valor',
        titulo: 'Valor Total Hoje',
        valor: `R$ ${resumo.valorTotal.toFixed(2)}`,
        icone: '��',
        cor: 'green'
      },
      {
        id: 'alertas-criticos',
        tipo: 'alerta',
        titulo: 'Alertas Críticos',
        valor: alertas.criticos || 0,
        icone: '⚠️',
        cor: alertas.criticos > 0 ? 'red' : 'gray'
      },
      {
        id: 'taxa-pagamento',
        tipo: 'percentual',
        titulo: 'Taxa de Pagamento',
        valor: this.calcularTaxaPagamento(metricas),
        icone: '��',
        cor: 'purple'
      }
    ];
  }

  private async gerarWidgetMultas(periodo?: string): Promise<any> {
    const metricas = await this.getMetricasTempoReal();
    
    return {
      titulo: 'Multas em Tempo Real',
      valor: metricas.dados.total24h,
      subtitulo: 'Últimas 24 horas',
      tendencia: 'CRESCENTE',
      detalhes: {
        mediaHoraria: metricas.dados.mediaHoraria,
        horaAtual: metricas.dados.horaAtual
      }
    };
  }

  private async gerarWidgetValores(periodo?: string): Promise<any> {
    const metricas = await this.getMetricasTempoReal();
    
    return {
      titulo: 'Valores Arrecadados',
      valor: `R$ ${metricas.dados.valorTotal24h.toFixed(2)}`,
      subtitulo: 'Últimas 24 horas',
      tendencia: 'ESTAVEL',
      detalhes: {
        valorMedio: (metricas.dados.valorTotal24h / metricas.dados.total24h).toFixed(2)
      }
    };
  }

  private async gerarWidgetAlertas(): Promise<any> {
    const alertas = await this.obterAlertasResumo();
    
    return {
      titulo: 'Alertas Ativos',
      valor: alertas.ativos || 0,
      subtitulo: 'Requerem atenção',
      tendencia: alertas.criticos > 0 ? 'CRITICO' : 'NORMAL',
      detalhes: {
        criticos: alertas.criticos || 0,
        total: alertas.total || 0
      }
    };
  }

  private async gerarWidgetPerformance(periodo?: string): Promise<any> {
    const kpis = await this.getIndicadoresKPI();
    
    return {
      titulo: 'Performance Geral',
      valor: `${kpis.kpis.taxaPagamento.valor.toFixed(1)}%`,
      subtitulo: 'Taxa de pagamento',
      tendencia: kpis.kpis.taxaPagamento.status === 'BOM' ? 'CRESCENTE' : 'ATENCAO',
      detalhes: {
        meta: `${kpis.kpis.taxaPagamento.meta}%`,
        status: kpis.kpis.taxaPagamento.status
      }
    };
  }

  private async gerarWidgetTendencias(periodo?: string): Promise<any> {
    const tendencias = await this.obterTendenciasRecentes();
    
    return {
      titulo: 'Tendências',
      valor: tendencias.tendencia,
      subtitulo: 'Últimos 7 dias',
      tendencia: tendencias.tendencia,
      detalhes: {
        periodo: tendencias.periodo,
        pontos: tendencias.dados.length
      }
    };
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private calcularVariacao(valorAtual: number, valorAnterior: number): string {
    if (valorAnterior === 0) return '0%';
    const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    return `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%`;
  }

  private calcularTaxaPagamento(multas: any[]): number {
    if (multas.length === 0) return 0;
    // ✅ CORRIGIDO: usar status_multa
    const pagas = multas.filter(m => m.status_multa === 'PAGA').length;
    return ((pagas / multas.length) * 100);
  }

  private calcularPercentual(parte: number, total: number): number {
    return total > 0 ? ((parte / total) * 100) : 0;
  }

  private agruparPorGravidade(multas: any[]): any {
    const grupos = { LEVE: 0, MEDIA: 0, GRAVE: 0, GRAVISSIMA: 0 };
    multas.forEach(m => {
      // ✅ CORRIGIDO: usar gravidade_infracao
      const gravidade = m.gravidade_infracao || 'MEDIA';
      if (grupos.hasOwnProperty(gravidade)) {
        grupos[gravidade]++;
      }
    });
    return grupos;
  }

  private agruparPorGaragem(multas: any[]): any {
    const grupos = {};
    multas.forEach(m => {
      // ✅ CORRIGIDO: usar nome_garagem
      const garagem = m.nome_garagem || 'NAO_INFORMADO';
      grupos[garagem] = (grupos[garagem] || 0) + 1;
    });
    return grupos;
  }

  private calcularEvolucaoHoraria(multas: any[]): any[] {
    const evolucao = new Array(24).fill(0);
    
    multas.forEach(multa => {
      // ✅ CORRIGIDO: usar data_emissao
      const horaMulta = new Date(multa.data_emissao).getHours();
      evolucao[horaMulta]++;
    });

    return evolucao.map((quantidade, hora) => ({
      hora: `${hora.toString().padStart(2, '0')}:00`,
      quantidade
    }));
  }

  private analisarTendencia(metricas: any[]): string {
    if (metricas.length < 2) return 'INSUFICIENTE';
    
    const primeiro = metricas[0].totalMultas;
    const ultimo = metricas[metricas.length - 1].totalMultas;
    
    if (ultimo > primeiro * 1.1) return 'CRESCENTE';
    if (ultimo < primeiro * 0.9) return 'DECRESCENTE';
    return 'ESTAVEL';
  }

  private formatarMemoria(memoria: NodeJS.MemoryUsage): any {
    return {
      rss: `${Math.round(memoria.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoria.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoria.heapTotal / 1024 / 1024)} MB`,
      external: `${Math.round(memoria.external / 1024 / 1024)} MB`,
      percentualUso: `${((memoria.heapUsed / memoria.heapTotal) * 100).toFixed(1)}%`
    };
  }

  private gerarAlertasKPI(kpis: any): string[] {
    const alertas = [];

    if (kpis.taxaPagamento.valor < 70) {
      alertas.push('🔴 Taxa de pagamento abaixo de 70%');
    }

    if (kpis.multasVencidas.percentual > 30) {
      alertas.push('⚠️ Mais de 30% das multas estão vencidas');
    }

    return alertas;
  }
}