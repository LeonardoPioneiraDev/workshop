// src/modules/departamentos/juridico/controllers/dashboard.controller.ts
import { 
  Controller, 
  Get, 
  Query, 
  HttpCode, 
  HttpStatus, 
  Logger,
  BadRequestException
} from '@nestjs/common';
import { DashboardRealtimeService } from '../services/dashboard-realtime.service';
import { JobService } from '../services/job.service';

@Controller('departamentos/juridico/dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly dashboardService: DashboardRealtimeService,
    private readonly jobService: JobService
  ) {}

  /**
   * 📊 DASHBOARD PRINCIPAL COMPLETO
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getDashboardPrincipal(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('📊 Requisição para dashboard principal');

      const dashboard = await this.dashboardService.getDashboardCompleto();
      const executionTime = Date.now() - startTime;

      return {
        ...dashboard,
        executionTime: `${executionTime}ms`,
        endpoints: {
          tempoReal: '/departamentos/juridico/dashboard/tempo-real',
          kpis: '/departamentos/juridico/dashboard/kpis',
          jobs: '/departamentos/juridico/dashboard/jobs',
          sistema: '/departamentos/juridico/dashboard/sistema'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro no dashboard principal: ${error.message}`);
      throw error;
    }
  }

  /**
   * ⚡ MÉTRICAS EM TEMPO REAL
   */
  @Get('tempo-real')
  @HttpCode(HttpStatus.OK)
  async getMetricasTempoReal(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('⚡ Requisição para métricas tempo real');

      const metricas = await this.dashboardService.getMetricasTempoReal();
      const executionTime = Date.now() - startTime;

      return {
        ...metricas,
        executionTime: `${executionTime}ms`,
        atualizacao: 'Tempo real',
        proximaAtualizacao: new Date(Date.now() + 60000).toISOString() // +1 minuto
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro nas métricas tempo real: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📈 INDICADORES KPI
   */
  @Get('kpis')
  @HttpCode(HttpStatus.OK)
  async getIndicadoresKPI(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('📈 Requisição para indicadores KPI');

      const kpis = await this.dashboardService.getIndicadoresKPI();
      const executionTime = Date.now() - startTime;

      return {
        ...kpis,
        executionTime: `${executionTime}ms`,
        definicoes: {
          taxaPagamento: 'Percentual de multas pagas em relação ao total',
          variacao: 'Comparação com período anterior',
          tendencia: 'Direção da evolução dos dados'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro nos KPIs: ${error.message}`);
      throw error;
    }
  }

  /**
   * ⚙️ STATUS DOS JOBS
   */
  @Get('jobs')
  @HttpCode(HttpStatus.OK)
  async getStatusJobs(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('⚙️ Requisição para status dos jobs');

      const status = await this.jobService.getStatusJobs();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        ...status,
        descricoes: {
          matinal: 'Preparação dos dados para o dia',
          noturno: 'Consolidação e limpeza',
          semanal: 'Análises e relatórios semanais',
          mensal: 'Fechamento mensal e relatórios',
          sincronizacao: 'Sincronização inteligente com Oracle'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro no status dos jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🖥️ STATUS DO SISTEMA
   */
  @Get('sistema')
  @HttpCode(HttpStatus.OK)
  async getStatusSistema(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('🖥️ Requisição para status do sistema');

      const status = {
        timestamp: new Date().toISOString(),
        uptime: {
          segundos: process.uptime(),
          formatado: this.formatarUptime(process.uptime())
        },
        memoria: this.formatarMemoria(process.memoryUsage()),
        cpu: {
          arquitetura: process.arch,
          plataforma: process.platform,
          versaoNode: process.version
        },
        ambiente: {
          nodeEnv: process.env.NODE_ENV || 'development',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: 'pt-BR'
        },
        estatisticas: {
          pid: process.pid,
          versao: '1.0.0',
          iniciadoEm: new Date(Date.now() - process.uptime() * 1000).toISOString()
        }
      };

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        executionTime: `${executionTime}ms`,
        sistema: status
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro no status do sistema: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 WIDGET ESPECÍFICO
   */
  @Get('widget/:tipo')
  @HttpCode(HttpStatus.OK)
  async getWidget(
    @Query('tipo') tipo: string,
    @Query('periodo') periodo?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`�� Requisição para widget: ${tipo}`);

      const tiposValidos = ['multas', 'valores', 'alertas', 'performance', 'tendencias'];
      
      if (!tiposValidos.includes(tipo)) {
        throw new BadRequestException(`Tipo de widget deve ser: ${tiposValidos.join(', ')}`);
      }

      const widget = await this.gerarWidget(tipo, periodo);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        tipo,
        periodo: periodo || 'hoje',
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        widget
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro no widget ${tipo}: ${error.message}`);
      throw error;
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private async gerarWidget(tipo: string, periodo?: string): Promise<any> {
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
        throw new BadRequestException(`Widget ${tipo} não implementado`);
    }
  }

  private async gerarWidgetMultas(periodo?: string): Promise<any> {
    const metricas = await this.dashboardService.getMetricasTempoReal();
    
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
    const metricas = await this.dashboardService.getMetricasTempoReal();
    
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
    // Implementar widget de alertas
    return {
      titulo: 'Alertas Ativos',
      valor: 5,
      subtitulo: 'Requerem atenção',
      tendencia: 'ATENCAO',
      detalhes: {
        criticos: 2,
        altos: 3,
        medios: 0
      }
    };
  }

  private async gerarWidgetPerformance(periodo?: string): Promise<any> {
    const kpis = await this.dashboardService.getIndicadoresKPI();
    
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
    // Implementar widget de tendências
    return {
      titulo: 'Tendências',
      valor: 'ESTÁVEL',
      subtitulo: 'Últimos 7 dias',
      tendencia: 'ESTAVEL',
      detalhes: {
        variacao: '+2.5%',
        previsao: 'Crescimento moderado'
      }
    };
  }

  private formatarUptime(segundos: number): string {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    return `${dias}d ${horas}h ${minutos}m`;
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
}