// src/modules/departamentos/operacoes/controllers/dashboard.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { DashboardOperacoesService } from '../services/dashboard.service';
import { DashboardOperacoesDto } from '../dto/dashboard-operacoes.dto';

@ApiTags('Operações - Dashboard')
@Controller('departamentos/operacoes/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardOperacoesController {
  constructor(
    private readonly dashboardService: DashboardOperacoesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard completo de operações' })
  @ApiResponse({ status: 200, description: 'Dashboard completo' })
  async obterDashboardCompleto(@Query() filtros: DashboardOperacoesDto) {
    return await this.dashboardService.gerarDashboardCompleto(filtros);
  }

  @Get('executivo')
  @ApiOperation({ summary: 'Relatório executivo de operações' })
  @ApiQuery({ name: 'ano', required: false, type: Number })
  @ApiQuery({ name: 'mes', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Relatório executivo' })
  async obterRelatorioExecutivo(
    @Query('ano') ano?: number,
    @Query('mes') mes?: number,
  ) {
    return await this.dashboardService.gerarRelatorioExecutivo(ano, mes);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Histórico de estatísticas' })
  @ApiQuery({ name: 'ano', required: false, type: Number })
  @ApiQuery({ name: 'mes', required: false, type: Number })
  @ApiQuery({ name: 'garagem', required: false, type: String })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Histórico de estatísticas' })
  async obterHistorico(
    @Query('ano') ano?: number,
    @Query('mes') mes?: number,
    @Query('garagem') garagem?: string,
    @Query('limite') limite?: number,
  ) {
    return await this.dashboardService.obterHistoricoEstatisticas(ano, mes, garagem, limite);
  }

  @Get('comparativo-mensal')
  @ApiOperation({ summary: 'Comparativo mensal do ano' })
  @ApiQuery({ name: 'ano', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Comparativo mensal' })
  async obterComparativoMensal(@Query('ano') ano: number) {
    return await this.dashboardService.obterComparativoMensal(ano);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs principais de operações' })
  @ApiResponse({ status: 200, description: 'KPIs de operações' })
  async obterKPIs(@Query() filtros: DashboardOperacoesDto) {
    const dashboard = await this.dashboardService.gerarDashboardCompleto(filtros);
    return {
      kpis: dashboard.resumo.kpis,
      alertas: dashboard.alertas,
      timestamp: new Date(),
    };
  }

  @Get('tempo-real')
  @ApiOperation({ summary: 'Dados em tempo real' })
  @ApiResponse({ status: 200, description: 'Dados atualizados' })
  async obterDadosTempoReal() {
    const dashboard = await this.dashboardService.gerarDashboardCompleto();
    
    return {
      resumo: dashboard.resumo,
      alertasUrgentes: dashboard.alertas.veiculosRisco.length + 
                      dashboard.alertas.garagensProblematicas.length,
      ultimaAtualizacao: dashboard.timestamp,
      status: 'OPERACIONAL',
    };
  }
}