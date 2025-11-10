// src/modules/departamentos/operacoes/controllers/acidentes.controller.ts
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { AcidentesService } from '../services/acidentes.service';
import { FiltrosAcidentesDto } from '../dto/filtros-acidentes.dto';

@ApiTags('Operações - Acidentes')
@Controller('departamentos/operacoes/acidentes')
@UseGuards(JwtAuthGuard)
export class AcidentesController {
  constructor(private readonly acidentesService: AcidentesService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar acidentes com filtros e cache inteligente' })
  @ApiResponse({ status: 200, description: 'Lista de acidentes com paginação' })
  async buscarAcidentes(@Query() filtros: FiltrosAcidentesDto) {
    return await this.acidentesService.buscarAcidentes(filtros);
  }

  @Post('sincronizar')
  @ApiOperation({ summary: 'Forçar sincronização de acidentes' })
  @ApiQuery({ name: 'dataInicio', required: false, description: 'Data início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, description: 'Data fim (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
  async sincronizarAcidentes(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return await this.acidentesService.sincronizarAcidentes(dataInicio, dataFim);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de acidentes com filtros' })
  @ApiResponse({ status: 200, description: 'Estatísticas de acidentes' })
  async obterEstatisticas(@Query() filtros: FiltrosAcidentesDto) {
    return await this.acidentesService.obterEstatisticasAcidentes(filtros);
  }

  @Get('top-veiculos')
  @ApiOperation({ summary: 'Top veículos com mais acidentes' })
  @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Limite de resultados (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Top veículos com acidentes' })
  async obterTopVeiculos(
    @Query('limite') limite?: number,
    @Query() filtros?: FiltrosAcidentesDto,
  ) {
    return await this.acidentesService.obterTopVeiculosAcidentes(limite || 10, filtros);
  }

  @Get('valores-filtros')
  @ApiOperation({ summary: 'Obter valores distintos para filtros' })
  @ApiResponse({ status: 200, description: 'Valores disponíveis para filtros' })
  async obterValoresFiltros() {
    return await this.acidentesService.obterValoresDistintos();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard de acidentes com filtros' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard de acidentes' })
  async obterDashboard(@Query() filtros: FiltrosAcidentesDto) {
    const [estatisticas, topVeiculos] = await Promise.all([
      this.acidentesService.obterEstatisticasAcidentes(filtros),
      this.acidentesService.obterTopVeiculosAcidentes(5, filtros),
    ]);

    return {
      estatisticas,
      topVeiculos,
      filtros: filtros,
      timestamp: new Date(),
    };
  }

  @Get('verificar-oracle')
  @ApiOperation({ summary: '🔍 Verificar dados no Oracle (DEBUG)' })
  @ApiResponse({ status: 200, description: 'Informações sobre dados no Oracle' })
  async verificarOracle() {
    return await this.acidentesService.verificarDadosOracle();
  }

  @Post('criar-dados-teste')
  @ApiOperation({ summary: '🧪 Criar dados de teste (DESENVOLVIMENTO)' })
  @ApiQuery({ name: 'quantidade', required: false, type: Number, description: 'Quantidade de registros (padrão: 50)' })
  @ApiResponse({ status: 200, description: 'Dados de teste criados' })
  async criarDadosTeste(@Query('quantidade') quantidade?: number) {
    return await this.acidentesService.criarDadosTeste(quantidade || 50);
  }
}
