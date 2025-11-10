// src/modules/departamentos/juridico/controllers/alerta.controller.ts
import { 
  Controller, 
  Get, 
  Post,
  Patch,
  Query, 
  Param,
  Body,
  HttpCode, 
  HttpStatus, 
  Logger,
  BadRequestException,
  UseGuards,
  ValidationPipe,
  UsePipes,
  ParseIntPipe, // ✅ Importado para validação
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'; // ✅ Importações do Swagger
import { IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator'; // ✅ Validações
import { AlertaService, CriarAlertaDto, FiltrosAlerta } from '../services/alerta.service'; // ✅ Importar interfaces
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard'; // ✅ Guards
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum'; // ✅ Enum de roles

// ✅ DTOs PARA VALIDAÇÃO
export class AlertaFiltersDto implements FiltrosAlerta {
  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsEnum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA', 'URGENTE'])
  prioridade?: string;

  @IsOptional()
  @IsEnum(['ATIVO', 'RESOLVIDO', 'IGNORADO', 'EXPIRADO'])
  status?: 'ATIVO' | 'RESOLVIDO' | 'IGNORADO' | 'EXPIRADO';

  @IsOptional()
  @IsString()
  entidadeTipo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class ResolverAlertaDto {
  @IsNotEmpty({ message: 'usuarioResponsavel é obrigatório' })
  @IsString()
  usuarioResponsavel: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class IgnorarAlertaDto {
  @IsNotEmpty({ message: 'usuarioResponsavel é obrigatório' })
  @IsString()
  usuarioResponsavel: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

@ApiTags('Alertas - Sistema Jurídico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departamentos/juridico/alertas')
export class AlertaController {
  private readonly logger = new Logger(AlertaController.name);

  constructor(
    private readonly alertaService: AlertaService
  ) {}

  /**
   * 🚨 LISTAR ALERTAS ATIVOS
   */
  @Get()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Listar alertas ativos',
    description: 'Retorna lista de alertas ativos com filtros opcionais'
  })
  @ApiQuery({ name: 'severidade', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Filtrar por severidade' })
  @ApiQuery({ name: 'tipo', required: false, type: String, description: 'Filtrar por tipo de alerta' })
  @ApiQuery({ name: 'categoria', required: false, type: String, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'prioridade', required: false, enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA', 'URGENTE'], description: 'Filtrar por prioridade' })
  @ApiQuery({ name: 'status', required: false, enum: ['ATIVO', 'RESOLVIDO', 'IGNORADO', 'EXPIRADO'], description: 'Filtrar por status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de alertas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array', items: { type: 'object' } },
        count: { type: 'number' },
        executionTime: { type: 'string' },
        timestamp: { type: 'string' },
        filters: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAlertasAtivos(
    @Query('severidade') severidade?: string,
    @Query('tipo') tipo?: string,
    @Query() filters?: AlertaFiltersDto
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('🚨 Requisição para alertas ativos');

      let alertas;
      
      if (severidade) {
        const severidadesValidas = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (!severidadesValidas.includes(severidade.toUpperCase())) {
          throw new BadRequestException(`Severidade deve ser: ${severidadesValidas.join(', ')}`);
        }
        alertas = await this.alertaService.obterAlertasPorSeveridade(severidade.toUpperCase());
      } else if (filters && Object.keys(filters).length > 0) {
        // ✅ Usar filtros avançados se fornecidos
        const resultado = await this.alertaService.listarAlertas(filters);
        alertas = resultado.data || resultado; // Adaptar conforme retorno do service
      } else {
        alertas = await this.alertaService.obterAlertasAtivos();
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: alertas,
        count: Array.isArray(alertas) ? alertas.length : 0,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        filters: { severidade, tipo, ...filters },
        meta: {
          examples: {
            todos: '/departamentos/juridico/alertas',
            criticos: '/departamentos/juridico/alertas?severidade=CRITICAL',
            altos: '/departamentos/juridico/alertas?severidade=HIGH',
            medios: '/departamentos/juridico/alertas?severidade=MEDIUM'
          }
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao listar alertas: ${error.message}`);
      throw new BadRequestException(`Erro ao listar alertas: ${error.message}`);
    }
  }

  /**
   * 📊 ESTATÍSTICAS DOS ALERTAS
   */
  @Get('estatisticas')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Estatísticas dos alertas',
    description: 'Retorna estatísticas consolidadas dos alertas do sistema'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            resumo: { type: 'object' },
            distribuicao: { type: 'object' },
            tendencias: { type: 'object' }
          }
        },
        executionTime: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  async getEstatisticasAlertas(): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log('📊 Requisição para estatísticas de alertas');

      const estatisticas = await this.alertaService.obterEstatisticasAlertas();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: estatisticas,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        meta: {
          geradoEm: new Date(),
          versao: '1.0'
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw new BadRequestException(`Erro ao obter estatísticas: ${error.message}`);
    }
  }

  /**
   * ✅ RESOLVER ALERTA
   */
  @Patch(':id/resolver')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Resolver alerta',
    description: 'Marca um alerta como resolvido'
  })
  @ApiParam({ 
    name: 'id', 
    type: String, // ✅ Mudado para String
    description: 'ID do alerta',
    example: 'ALT_1640995200000_abc123def'
  })
  @ApiBody({
    type: ResolverAlertaDto,
    description: 'Dados para resolução do alerta',
    examples: {
      exemplo1: {
        summary: 'Resolução simples',
        value: {
          usuarioResponsavel: 'leonardo.silva',
          observacoes: 'Problema resolvido após verificação manual'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerta resolvido com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        executionTime: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Alerta não encontrado' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async resolverAlerta(
    @Param('id') id: string, // ✅ Mantido como string
    @Body() body: ResolverAlertaDto
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`✅ Resolvendo alerta ${id}`);

      if (!id || id.trim().length === 0) {
        throw new BadRequestException('ID do alerta é obrigatório');
      }

      // ✅ PASSAR ID COMO STRING DIRETAMENTE
      await this.alertaService.resolverAlerta(
        id.trim(), // ✅ Passar como string
        body.usuarioResponsavel, 
        body.observacoes
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        message: `Alerta ${id} resolvido com sucesso`,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        data: {
          alertaId: id,
          usuarioResponsavel: body.usuarioResponsavel,
          observacoes: body.observacoes,
          dataResolucao: new Date()
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao resolver alerta: ${error.message}`);
      
      if (error.message.includes('não encontrado')) {
        throw new BadRequestException(`Alerta ${id} não encontrado`);
      }
      
      throw new BadRequestException(`Erro ao resolver alerta: ${error.message}`);
    }
  }

  /**
   * ⚠️ IGNORAR ALERTA
   */
  @Patch(':id/ignorar')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Ignorar alerta',
    description: 'Marca um alerta como ignorado'
  })
  @ApiParam({ 
    name: 'id', 
    type: String, // ✅ Mudado para String
    description: 'ID do alerta',
    example: 'ALT_1640995200000_abc123def'
  })
  @ApiBody({
    type: IgnorarAlertaDto,
    description: 'Dados para ignorar o alerta',
    examples: {
      exemplo1: {
        summary: 'Ignorar com motivo',
        value: {
          usuarioResponsavel: 'leonardo.silva',
          observacoes: 'Falso positivo - sistema funcionando normalmente'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerta ignorado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        executionTime: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Alerta não encontrado' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async ignorarAlerta(
    @Param('id') id: string, // ✅ Mantido como string
    @Body() body: IgnorarAlertaDto
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`⚠️ Ignorando alerta ${id}`);

      if (!id || id.trim().length === 0) {
        throw new BadRequestException('ID do alerta é obrigatório');
      }

      // ✅ PASSAR ID COMO STRING DIRETAMENTE
      await this.alertaService.ignorarAlerta(
        id.trim(), // ✅ Passar como string
        body.usuarioResponsavel, 
        body.observacoes
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        message: `Alerta ${id} ignorado com sucesso`,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        data: {
          alertaId: id,
          usuarioResponsavel: body.usuarioResponsavel,
          observacoes: body.observacoes,
          dataIgnorado: new Date()
        }
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao ignorar alerta: ${error.message}`);
      
      if (error.message.includes('não encontrado')) {
        throw new BadRequestException(`Alerta ${id} não encontrado`);
      }
      
      throw new BadRequestException(`Erro ao ignorar alerta: ${error.message}`);
    }
  }

  /**
   * 🚨 CRIAR ALERTA MANUAL
   */
  @Post()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Criar alerta manual',
    description: 'Cria um novo alerta manualmente'
  })
  @ApiBody({
    description: 'Dados do alerta a ser criado',
    schema: {
      type: 'object',
      required: ['tipo', 'titulo', 'descricao', 'categoria'],
      properties: {
        tipo: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'CRITICAL'] },
        titulo: { type: 'string', maxLength: 200 },
        descricao: { type: 'string' },
        categoria: { type: 'string', enum: ['SISTEMA', 'FINANCEIRO', 'OPERACIONAL', 'JURIDICO', 'MULTAS', 'AGENTES', 'VEICULOS'] },
        prioridade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA', 'URGENTE'] },
        entidadeTipo: { type: 'string' },
        entidadeId: { type: 'string' },
        valorReferencia: { type: 'number' },
        acaoRecomendada: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Alerta criado com sucesso'
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async criarAlerta(@Body() dadosAlerta: CriarAlertaDto): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🚨 Criando alerta manual: ${dadosAlerta.titulo}`);

      const alerta = await this.alertaService.criarAlerta(dadosAlerta);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        message: 'Alerta criado com sucesso',
        data: alerta,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao criar alerta: ${error.message}`);
      throw new BadRequestException(`Erro ao criar alerta: ${error.message}`);
    }
  }

  /**
   * 📋 BUSCAR ALERTA POR ID
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Buscar alerta por ID',
    description: 'Retorna detalhes de um alerta específico'
  })
  @ApiParam({ 
    name: 'id', 
    type: String,
    description: 'ID do alerta',
    example: 'ALT_1640995200000_abc123def'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerta encontrado com sucesso'
  })
  @ApiResponse({ status: 404, description: 'Alerta não encontrado' })
  async buscarAlerta(@Param('id') id: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔍 Buscando alerta ${id}`);

      if (!id || id.trim().length === 0) {
        throw new BadRequestException('ID do alerta é obrigatório');
      }

      // ✅ IMPLEMENTAR BUSCA POR ID NO SERVICE
      // const alerta = await this.alertaService.buscarPorId(id.trim());
      
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          // alerta,
          message: 'Implementar método buscarPorId no AlertaService'
        },
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro ao buscar alerta: ${error.message}`);
      
      if (error.message.includes('não encontrado')) {
        throw new BadRequestException(`Alerta ${id} não encontrado`);
      }
      
      throw new BadRequestException(`Erro ao buscar alerta: ${error.message}`);
    }
  }
}