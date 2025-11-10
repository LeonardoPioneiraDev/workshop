// src/modules/departamentos/juridico/controllers/analytics.controller.ts
import { 
  Controller, 
  Get, 
  Query, 
  HttpCode, 
  HttpStatus, 
  Logger,
  BadRequestException
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';

@Controller('departamentos/juridico/analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService
  ) {}

  /**
   * 📊 DASHBOARD EXECUTIVO
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboardExecutivo(
    @Query('periodo') periodo?: string,
    @Query('garagem') garagem?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('📊 Requisição para dashboard executivo');

      // Validações
      const periodosValidos = ['HOJE', 'SEMANA', 'MES', 'TRIMESTRE', 'ANO'];
      if (periodo && !periodosValidos.includes(periodo.toUpperCase())) {
        throw new BadRequestException(`Período deve ser: ${periodosValidos.join(', ')}`);
      }

      if (garagem && ![31, 124, 239, 240].includes(parseInt(garagem))) {
        throw new BadRequestException('Garagem deve ser: 31, 124, 239 ou 240');
      }

      const resultado = await this.analyticsService.getDashboardExecutivo(periodo, garagem);
      const executionTime = Date.now() - startTime;

      return {
        ...resultado,
        executionTime: `${executionTime}ms`,
        examples: {
          hoje: '/departamentos/juridico/analytics/dashboard?periodo=HOJE',
          semana: '/departamentos/juridico/analytics/dashboard?periodo=SEMANA',
          mes: '/departamentos/juridico/analytics/dashboard?periodo=MES',
          porGaragem: '/departamentos/juridico/analytics/dashboard?periodo=MES&garagem=31'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro no dashboard executivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🏆 RANKINGS DE PERFORMANCE
   */
  @Get('rankings')
  @HttpCode(HttpStatus.OK)
  async getRankings(
    @Query('tipo') tipo: string,
    @Query('periodo') periodo?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`�� Requisição para ranking: ${tipo}`);

      if (!tipo) {
        throw new BadRequestException('Parâmetro "tipo" é obrigatório');
      }

      const tiposValidos = ['agentes', 'garagens', 'infracoes'];
      if (!tiposValidos.includes(tipo.toLowerCase())) {
        throw new BadRequestException(`Tipo deve ser: ${tiposValidos.join(', ')}`);
      }

      const resultado = await this.analyticsService.getRankings(tipo, periodo);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        ...resultado,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        examples: {
          agentes: '/departamentos/juridico/analytics/rankings?tipo=agentes',
          garagens: '/departamentos/juridico/analytics/rankings?tipo=garagens&periodo=MES',
          infracoes: '/departamentos/juridico/analytics/rankings?tipo=infracoes&periodo=TRIMESTRE'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao gerar ranking: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📈 ANÁLISE DE TENDÊNCIAS
   */
  @Get('tendencias')
  @HttpCode(HttpStatus.OK)
  async getTendencias(
    @Query('tipo') tipo: string,
    @Query('categoria') categoria?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`📈 Requisição para tendências: ${tipo}`);

      if (!tipo) {
        throw new BadRequestException('Parâmetro "tipo" é obrigatório');
      }

      const tiposValidos = ['mensal', 'trimestral', 'anual'];
      if (!tiposValidos.includes(tipo.toLowerCase())) {
        throw new BadRequestException(`Tipo deve ser: ${tiposValidos.join(', ')}`);
      }

      const resultado = await this.analyticsService.getTendencias(tipo, categoria);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        ...resultado,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        examples: {
          mensal: '/departamentos/juridico/analytics/tendencias?tipo=mensal',
          trimestral: '/departamentos/juridico/analytics/tendencias?tipo=trimestral',
          anual: '/departamentos/juridico/analytics/tendencias?tipo=anual&categoria=VELOCIDADE'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao analisar tendências: ${error.message}`);
      throw error;
    }
  }
}