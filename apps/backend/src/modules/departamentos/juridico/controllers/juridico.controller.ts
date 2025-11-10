// src/modules/departamentos/juridico/controllers/juridico.controller.ts
import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

// ✅ Service
import { JuridicoService } from '../services/juridico.service';

@ApiTags('Jurídico')
@Controller('departamentos/juridico')
export class JuridicoController {
  private readonly logger = new Logger(JuridicoController.name);

  constructor(
    private readonly juridicoService: JuridicoService
  ) {}

  /**
   * 📊 DASHBOARD EXECUTIVO
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard executivo do departamento jurídico' })
  @ApiResponse({ status: 200, description: 'Dashboard obtido com sucesso' })
  async getDashboard(): Promise<any> {
    try {
      this.logger.log('📊 Requisição para dashboard jurídico');
      return await this.juridicoService.obterDashboard();
    } catch (error: any) {
      this.logger.error(`❌ Erro no dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * ⚖️ PROCESSOS JURÍDICOS
   */
  @Get('processos')
  @ApiOperation({ summary: 'Listar processos jurídicos' })
  @ApiQuery({ name: 'limite', required: false, description: 'Limite de registros' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiResponse({ status: 200, description: 'Processos obtidos com sucesso' })
  async getProcessos(
    @Query('limite') limite?: number,
    @Query('status') status?: string
  ): Promise<any> {
    try {
      this.logger.log('⚖️ Requisição para processos jurídicos');
      
      const filtros = {
        limite: limite || 10,
        ...(status && { status })
      };

      return await this.juridicoService.obterProcessos(filtros);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter processos: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📄 CONTRATOS ATIVOS
   */
  @Get('contratos')
  @ApiOperation({ summary: 'Listar contratos ativos' })
  @ApiQuery({ name: 'limite', required: false, description: 'Limite de registros' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiResponse({ status: 200, description: 'Contratos obtidos com sucesso' })
  async getContratos(
    @Query('limite') limite?: number,
    @Query('status') status?: string
  ): Promise<any> {
    try {
      this.logger.log('📄 Requisição para contratos ativos');
      
      const filtros = {
        limite: limite || 10,
        ...(status && { status })
      };

      return await this.juridicoService.obterContratos(filtros);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter contratos: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🚨 MULTAS E INFRAÇÕES
   */
  @Get('multas')
  @ApiOperation({ summary: 'Listar multas e infrações' })
  @ApiQuery({ name: 'limite', required: false, description: 'Limite de registros' })
  @ApiQuery({ name: 'forcarAtualizacao', required: false, description: 'Forçar busca no Oracle' })
  @ApiResponse({ status: 200, description: 'Multas obtidas com sucesso' })
  async getMultas(
    @Query('limite') limite?: number,
    @Query('forcarAtualizacao') forcarAtualizacao?: boolean
  ): Promise<any> {
    try {
      this.logger.log('🎯 Requisição para multas completas (com cache)');
      
      const filtros = {
        limite: limite || 50,
        forcarAtualizacao: forcarAtualizacao === true
      };

      return await this.juridicoService.obterMultasCompletas(filtros);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter multas: ${error.message}`);
      throw error;
    }
  }

  /**
   * 💾 INFORMAÇÕES DO CACHE
   */
  @Get('cache/info')
  @ApiOperation({ summary: 'Informações do cache de multas' })
  @ApiResponse({ status: 200, description: 'Informações do cache obtidas com sucesso' })
  async getCacheInfo(): Promise<any> {
    try {
      this.logger.log('📊 Requisição para informações do cache');
      return await this.juridicoService.obterInformacoesCache();
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter info do cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 INFORMAÇÕES DO SISTEMA
   */
  @Get('info')
  @ApiOperation({ summary: 'Informações gerais do sistema jurídico' })
  @ApiResponse({ status: 200, description: 'Informações obtidas com sucesso' })
  async getInfo(): Promise<any> {
    try {
      this.logger.log('📋 Requisição para informações do sistema');
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        sistema: {
          nome: 'Sistema Jurídico Workshop',
          versao: '2.0.0',
          modulos: ['Processos', 'Contratos', 'Multas', 'Analytics'],
          status: 'OPERACIONAL'
        },
        integracao: {
          oracle: 'ATIVO',
          cache: 'PERMANENTE',
          endpoints: [
            '/departamentos/juridico/dashboard',
            '/departamentos/juridico/processos',
            '/departamentos/juridico/contratos',
            '/departamentos/juridico/multas',
            '/departamentos/juridico/cache/info'
          ]
        },
        desenvolvedor: {
          nome: 'Workshop Team',
          contato: 'suporte@workshop.com',
          documentacao: 'http://localhost:3333/api'
        }
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter informações: ${error.message}`);
      throw error;
    }
  }
}