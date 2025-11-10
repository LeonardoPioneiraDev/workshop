// src/modules/departamentos/operacoes/controllers/operacoes.controller.ts
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { FrotaService } from '../services/frota.service';
import { AcidentesService } from '../services/acidentes.service';

@ApiTags('Operações')
@Controller('departamentos/operacoes')
@UseGuards(JwtAuthGuard)
export class OperacoesController {
  constructor(
    private readonly frotaService: FrotaService,
    private readonly acidentesService: AcidentesService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Status geral do departamento de operações' })
  @ApiResponse({ status: 200, description: 'Status das operações' })
  async obterStatus() {
    const [frotaStats, acidentesStats] = await Promise.all([
      this.frotaService.obterEstatisticasFrota(),
      this.acidentesService.obterEstatisticasAcidentes(),
    ]);

    return {
      departamento: 'Operações',
      frota: frotaStats,
      acidentes: acidentesStats.resumo,
      timestamp: new Date(),
    };
  }

  @Post('sincronizar-tudo')
  @ApiOperation({ summary: 'Sincronizar frota e acidentes com progresso' })
  @ApiResponse({ status: 200, description: 'Sincronização completa realizada' })
  async sincronizarTudo(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('forcarSincronizacao') forcarSincronizacao?: boolean,
  ) {
    try {
      const [frotaResult, acidentesResult] = await Promise.all([
        this.frotaService.sincronizarFrota(),
        this.acidentesService.sincronizarAcidentes(dataInicio, dataFim),
      ]);

      return {
        sucesso: true,
        frota: frotaResult,
        acidentes: acidentesResult,
        resumo: {
          totalVeiculos: frotaResult.total,
          veiculosSincronizados: frotaResult.sincronizados,
          totalAcidentes: acidentesResult.total,
          acidentesSincronizados: acidentesResult.sincronizados,
          tempoExecucao: 'Concluído com sucesso'
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get('resumo-executivo')
  @ApiOperation({ summary: 'Resumo executivo das operações' })
  @ApiResponse({ status: 200, description: 'Resumo executivo' })
  async obterResumoExecutivo() {
    const [
      frotaStats,
      acidentesStats,
      mudancasRecentes,
      topVeiculosAcidentes,
    ] = await Promise.all([
      this.frotaService.obterEstatisticasFrota(),
      this.acidentesService.obterEstatisticasAcidentes(),
      this.frotaService.obterMudancasRecentes(7),
      this.acidentesService.obterTopVeiculosAcidentes(5),
    ]);

    return {
      kpis: {
        veiculosAtivos: frotaStats.ativos,
        percentualAtivos: frotaStats.percentualAtivos,
        totalAcidentes: acidentesStats.resumo.total,
        acidentesComVitimas: acidentesStats.resumo.comVitimas,
        indiceSinistralidade: frotaStats.ativos > 0 ? 
          (acidentesStats.resumo.total / frotaStats.ativos) * 100 : 0,
      },
      alertas: {
        mudancasRecentes: mudancasRecentes.length,
        veiculosProblematicos: topVeiculosAcidentes.length,
      },
      timestamp: new Date(),
    };
  }
}