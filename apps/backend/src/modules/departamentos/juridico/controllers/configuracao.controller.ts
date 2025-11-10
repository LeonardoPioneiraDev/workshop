// src/modules/departamentos/juridico/controllers/configuracao.controller.ts
import { 
  Controller, 
  Get, 
  Put,
  Query, 
  Param,
  Body,
  HttpCode, 
  HttpStatus, 
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ConfiguracaoService } from '../services/configuracao.service';

@Controller('departamentos/juridico/configuracoes')
export class ConfiguracaoController {
  private readonly logger = new Logger(ConfiguracaoController.name);

  constructor(
    private readonly configuracaoService: ConfiguracaoService
  ) {}

  /**
   * 📋 LISTAR TODAS AS CONFIGURAÇÕES
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getTodasConfiguracoes(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('📋 Requisição para todas as configurações');

      const configuracoes = await this.configuracaoService.obterTodasConfiguracoes();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        configuracoes,
        categorias: Object.keys(configuracoes),
        // src/modules/departamentos/juridico/controllers/configuracao.controller.ts
        // Linha 44 - Corrigir o tipo do reduce
        total: Object.values(configuracoes).reduce((sum: number, cat: any[]) => sum + cat.length, 0)
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao listar configurações: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🏷️ CONFIGURAÇÕES POR CATEGORIA
   */
  @Get('categoria/:categoria')
  @HttpCode(HttpStatus.OK)
  async getConfiguracoesPorCategoria(
    @Param('categoria') categoria: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🏷️ Requisição para configurações da categoria: ${categoria}`);

      const categoriasValidas = ['CACHE', 'SYNC', 'ALERTS', 'REPORTS', 'PERFORMANCE', 'DASHBOARD', 'NOTIFICATIONS', 'KPIS'];
      
      if (!categoriasValidas.includes(categoria.toUpperCase())) {
        throw new BadRequestException(`Categoria deve ser: ${categoriasValidas.join(', ')}`);
      }

      const configuracoes = await this.configuracaoService.obterPorCategoria(categoria.toUpperCase());
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        categoria: categoria.toUpperCase(),
        configuracoes,
        count: configuracoes.length
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao obter configurações da categoria: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔧 OBTER CONFIGURAÇÃO ESPECÍFICA
   */
  @Get('chave/:chave')
  @HttpCode(HttpStatus.OK)
  async getConfiguracaoEspecifica(
    @Param('chave') chave: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`�� Requisição para configuração: ${chave}`);

      const valor = await this.configuracaoService.obterValor(chave);
      const executionTime = Date.now() - startTime;

      if (valor === undefined) {
        throw new BadRequestException(`Configuração ${chave} não encontrada`);
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        chave,
        valor
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao obter configuração ${chave}: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✏️ ATUALIZAR CONFIGURAÇÃO
   */
  @Put('chave/:chave')
  @HttpCode(HttpStatus.OK)
  async atualizarConfiguracao(
    @Param('chave') chave: string,
    @Body() body: { valor: string; usuario?: string }
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`✏️ Atualizando configuração: ${chave}`);

      if (!body.valor && body.valor !== '') {
        throw new BadRequestException('Valor é obrigatório');
      }

      await this.configuracaoService.atualizarValor(chave, body.valor);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        message: `Configuração ${chave} atualizada com sucesso`,
        chave,
        novoValor: body.valor,
        usuario: body.usuario || 'sistema'
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao atualizar configuração ${chave}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 RECARREGAR CONFIGURAÇÕES
   */
  @Put('recarregar')
  @HttpCode(HttpStatus.OK)
  async recarregarConfiguracoes(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('🔄 Recarregando configurações');

      // Forçar recarregamento das configurações
      await this.configuracaoService.onModuleInit();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        message: 'Configurações recarregadas com sucesso'
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao recarregar configurações: ${error.message}`);
      throw error;
    }
  }
}