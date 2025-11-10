// src/modules/departamentos/operacoes/controllers/frota.controller.ts
import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { FrotaService } from '../services/frota.service';
import { FiltrosFrotaDto } from '../dto/filtros-frota.dto';

@ApiTags('Operações - Frota')
@Controller('departamentos/operacoes/frota')
@UseGuards(JwtAuthGuard)
export class FrotaController {
  constructor(private readonly frotaService: FrotaService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar frota com filtros e cache inteligente' })
  @ApiResponse({ status: 200, description: 'Lista de veículos com paginação' })
  async buscarFrota(@Query() filtros: FiltrosFrotaDto) {
    return await this.frotaService.buscarFrota(filtros);
  }

  @Post('sincronizar')
  @ApiOperation({ summary: 'Forçar sincronização da frota' })
  @ApiQuery({ name: 'data', required: false, description: 'Data específica (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
  async sincronizarFrota(@Query('data') data?: string) {
    return await this.frotaService.sincronizarFrota(data);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas da frota' })
  @ApiResponse({ status: 200, description: 'Estatísticas da frota' })
  async obterEstatisticas() {
    return await this.frotaService.obterEstatisticasFrota();
  }

  @Get('por-garagem')
  @ApiOperation({ summary: 'Obter veículos agrupados por garagem' })
  @ApiResponse({ status: 200, description: 'Veículos por garagem' })
  async obterVeiculosPorGaragem() {
    return await this.frotaService.obterVeiculosPorGaragem();
  }

  @Get('historico/:prefixo')
  @ApiOperation({ summary: 'Obter histórico de mudanças de um veículo' })
  @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Limite de registros' })
  @ApiResponse({ status: 200, description: 'Histórico do veículo' })
  async obterHistoricoVeiculo(
    @Param('prefixo') prefixo: string,
    @Query('limite') limite?: number,
  ) {
    return await this.frotaService.obterHistoricoVeiculo(prefixo, limite);
  }

  @Get('mudancas-recentes')
  @ApiOperation({ summary: 'Obter mudanças recentes na frota' })
  @ApiQuery({ name: 'dias', required: false, type: Number, description: 'Número de dias (padrão: 7)' })
  @ApiResponse({ status: 200, description: 'Mudanças recentes' })
  async obterMudancasRecentes(@Query('dias') dias?: number) {
    return await this.frotaService.obterMudancasRecentes(dias);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard da frota operacional' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })
  async obterDashboard() {
    const [estatisticas, porGaragem, mudancasRecentes] = await Promise.all([
      this.frotaService.obterEstatisticasFrota(),
      this.frotaService.obterVeiculosPorGaragem(),
      this.frotaService.obterMudancasRecentes(7),
    ]);

    return {
      estatisticas,
      distribuicaoGaragem: porGaragem,
      mudancasRecentes: mudancasRecentes.slice(0, 10), // Últimas 10 mudanças
      timestamp: new Date(),
    };
  }
}