// src/modules/departamentos/manutencao/controllers/manutencao.controller.ts
import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { ManutencaoService } from '../services/manutencao.service';

@ApiTags('Manutenção')
@Controller('departamentos/manutencao')
@UseGuards(JwtAuthGuard)
export class ManutencaoController {
  constructor(private readonly manutencaoService: ManutencaoService) {}

  /**
   * ✅ NOVO: Buscar OS do mês atual (para dashboard)
   */
  @Get('os-mes-atual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar OS do mês atual (para dashboard)' })
  @ApiResponse({ status: 200, description: 'OS do mês atual carregadas' })
  async buscarOSMesAtual() {
    try {
      return await this.manutencaoService.buscarOSMesAtual();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao buscar OS do mês atual',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ✅ NOVO: Buscar todas as OS (para análises)
   */
  @Get('os-todas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar todas as OS com filtros (para análises)' })
  @ApiResponse({ status: 200, description: 'Todas as OS carregadas' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'origens', required: false, description: 'Códigos de origem separados por vírgula' })
  @ApiQuery({ name: 'garagens', required: false, description: 'Códigos de garagem separados por vírgula' })
  @ApiQuery({ name: 'setor_codigo', required: false, description: 'Código do setor' })
  @ApiQuery({ name: 'setor', required: false, description: 'Nome do setor/garagem' })
  @ApiQuery({ name: 'garagem', required: false, description: 'Nome da garagem' })
  @ApiQuery({ name: 'prefixo', required: false, description: 'Prefixo do veículo' })
  @ApiQuery({ name: 'numeroOS', required: false, description: 'Número da OS' })
  @ApiQuery({ name: 'placa', required: false, description: 'Placa do veículo' })
  @ApiQuery({ name: 'tipoOS', required: false, description: 'Tipo de OS (C=Corretiva, P=Preventiva)' })
  @ApiQuery({ name: 'condicaoOS', required: false, description: 'Condição da OS (A=Aberta, FC=Fechada)' })
  @ApiQuery({ name: 'statusOS', required: false, description: 'Status da OS (A=Aberta, FC=Fechada)' })
  @ApiQuery({ name: 'tipoProblema', required: false, description: 'Tipo de problema (QUEBRA, DEFEITO)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de registros por página' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  async buscarTodasOS(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origens') origens?: string,
    @Query('garagens') garagens?: string,
    @Query('setor_codigo') setor_codigo?: string,
    @Query('setor') setor?: string,
    @Query('garagem') garagem?: string,
    @Query('prefixo') prefixo?: string,
    @Query('numeroOS') numeroOS?: string,
    @Query('placa') placa?: string,
    @Query('tipoOS') tipoOS?: string,
    @Query('condicaoOS') condicaoOS?: string,
    @Query('statusOS') statusOS?: 'A' | 'FC',
    @Query('tipoProblema') tipoProblema?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    try {
      const filtros = {
        startDate,
        endDate,
        origens: origens ? origens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        garagens: garagens ? garagens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        setor_codigo: setor_codigo ? parseInt(setor_codigo) : undefined,
        setor,
        garagem,
        prefixo,
        numeroOS,
        placa,
        tipoOS,
        condicaoOS,
        statusOS,
        tipoProblema,
        limit: limit ? parseInt(limit) : undefined,
        page: page ? parseInt(page) : undefined,
      };

      return await this.manutencaoService.buscarTodasOS(filtros);
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao buscar todas as OS',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ✅ NOVO: Sincronizar do Globus (manual)
   */
  @Post('sincronizar-globus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar OS do Globus (Oracle) manualmente' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'origens', required: false, description: 'Códigos de origem separados por vírgula' })
  @ApiQuery({ name: 'garagens', required: false, description: 'Códigos de garagem separados por vírgula' })
  @ApiQuery({ name: 'setor_codigo', required: false, description: 'Código do setor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de registros' })
  async sincronizarDoGlobus(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origens') origens?: string,
    @Query('garagens') garagens?: string,
    @Query('setor_codigo') setor_codigo?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const params = {
        startDate,
        endDate,
        origens: origens ? origens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        garagens: garagens ? garagens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        setor_codigo: setor_codigo ? parseInt(setor_codigo) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      return await this.manutencaoService.sincronizarDoGlobus(params);
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro na sincronização do Globus',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ✅ NOVO: Estatísticas rápidas
   */
  @Get('estatisticas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas rápidas' })
  @ApiResponse({ status: 200, description: 'Estatísticas calculadas' })
  async obterEstatisticas() {
    try {
      return await this.manutencaoService.obterEstatisticasRapidas();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao calcular estatísticas',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ✅ LEGADO: Manter compatibilidade com endpoint antigo
   */
  @Get('os-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar OS (compatibilidade)' })
  async buscarOSData(
    @Query('mesAtual') mesAtual?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origens') origens?: string,
    @Query('garagens') garagens?: string,
    @Query('setor_codigo') setor_codigo?: string,
    @Query('setor') setor?: string,
    @Query('garagem') garagem?: string,
    @Query('prefixo') prefixo?: string,
    @Query('numeroOS') numeroOS?: string,
    @Query('placa') placa?: string,
    @Query('tipoOS') tipoOS?: string,
    @Query('condicaoOS') condicaoOS?: string,
    @Query('statusOS') statusOS?: 'A' | 'FC',
    @Query('tipoProblema') tipoProblema?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    try {
      // Se mesAtual=true, buscar apenas do mês atual
      if (mesAtual === 'true') {
        return await this.manutencaoService.buscarOSMesAtual();
      }

      // Senão, buscar todas com filtros
      const filtros = {
        startDate,
        endDate,
        origens: origens ? origens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        garagens: garagens ? garagens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        setor_codigo: setor_codigo ? parseInt(setor_codigo) : undefined,
        setor,
        garagem,
        prefixo,
        numeroOS,
        placa,
        tipoOS,
        condicaoOS,
        statusOS,
        tipoProblema,
        limit: limit ? parseInt(limit) : undefined,
        page: page ? parseInt(page) : undefined,
      };

      return await this.manutencaoService.buscarTodasOS(filtros);
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao buscar OS',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * ✅ LEGADO: Manter compatibilidade
   */
  @Get('sincronizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar (compatibilidade)' })
  async sincronizar(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origens') origens?: string,
    @Query('garagens') garagens?: string,
    @Query('setor_codigo') setor_codigo?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const params = {
        startDate,
        endDate,
        origens: origens ? origens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        garagens: garagens ? garagens.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
        setor_codigo: setor_codigo ? parseInt(setor_codigo) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      return await this.manutencaoService.sincronizarDoGlobus(params);
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro na sincronização',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Status do departamento de manutenção' })
  async obterStatus() {
    return {
      departamento: 'Manutenção',
      status: 'Operacional',
      timestamp: new Date(),
    };
  }
}