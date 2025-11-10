// apps/backend/src/users/controllers/login-logs.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LoginLogService, LoginLogFilters } from '../services/login-log.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { LoginEventType } from '../entities/login-log.entity';

@ApiTags('Login Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users/logs')
export class LoginLogsController {
  constructor(private readonly loginLogService: LoginLogService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DIRETOR)
  @ApiOperation({ 
    summary: 'Listar logs de login com filtros',
    description: 'Retorna logs de atividade dos usuários com filtros avançados - Apenas para admins e diretores'
  })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'ID do usuário' })
  @ApiQuery({ name: 'username', required: false, type: String, description: 'Nome do usuário' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Email do usuário' })
  @ApiQuery({ name: 'eventType', required: false, enum: LoginEventType, description: 'Tipo de evento' })
  @ApiQuery({ name: 'success', required: false, type: Boolean, description: 'Se o evento foi bem-sucedido' })
  @ApiQuery({ name: 'ipAddress', required: false, type: String, description: 'Endereço IP' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ status: 200, description: 'Lista de logs de login' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findLogs(@Query() filters: LoginLogFilters) {
    try {
      if (filters.dateFrom) {
        filters.dateFrom = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        filters.dateTo = new Date(filters.dateTo);
      }

      const result = await this.loginLogService.findLogs(filters);

      return {
        success: true,
        message: `Encontrados ${result.total} logs de login`,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        },
        filters,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.DIRETOR)
  @ApiOperation({ 
    summary: 'Obter estatísticas de logs de login',
    description: 'Retorna estatísticas detalhadas dos logs de atividade - Apenas para admins e diretores'
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos logs' })
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    try {
      const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
      const dateToObj = dateTo ? new Date(dateTo) : undefined;

      const stats = await this.loginLogService.getLoginStats(dateFromObj, dateToObj);

      return {
        success: true,
        message: 'Estatísticas de logs geradas com sucesso',
        data: stats,
        period: {
          from: dateFromObj?.toISOString() || 'Início dos registros',
          to: dateToObj?.toISOString() || 'Agora'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao gerar estatísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.DIRETOR)
  @ApiOperation({ 
    summary: 'Obter logs de um usuário específico',
    description: 'Retorna os logs de atividade de um usuário - Apenas para admins e diretores'
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID do usuário' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de registros (padrão: 20)' })
  @ApiResponse({ status: 200, description: 'Logs do usuário' })
  async getUserLogs(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number
  ) {
    try {
      const logs = await this.loginLogService.getUserLogs(userId, limit || 20);

      return {
        success: true,
        message: `Encontrados ${logs.length} logs para o usuário ${userId}`,
        data: logs,
        userId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar logs do usuário: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('cleanup')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Limpar logs antigos',
    description: 'Remove logs mais antigos que o período especificado - Apenas para admins'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Dias para manter (padrão: 90)' })
  @ApiResponse({ status: 200, description: 'Limpeza realizada' })
  async cleanupLogs(@Query('days') days?: number) {
    try {
      const daysToKeep = days || 90;
      const deletedCount = await this.loginLogService.cleanupOldLogs(daysToKeep);

      return {
        success: true,
        message: `Limpeza concluída: ${deletedCount} logs removidos`,
        data: {
          deletedCount,
          daysToKeep,
          cutoffDate: new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro na limpeza de logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('suspicious/:userId')
  @Roles(Role.ADMIN, Role.DIRETOR)
  @ApiOperation({ 
    summary: 'Analisar atividade suspeita de um usuário',
    description: 'Detecta padrões suspeitos na atividade do usuário - Apenas para admins e diretores'
  })
  @ApiParam({ name: 'userId', type: Number, description: 'ID do usuário' })
  @ApiQuery({ name: 'ipAddress', required: false, type: String, description: 'IP para análise' })
  @ApiResponse({ status: 200, description: 'Análise de atividade suspeita' })
  async analyzeSuspiciousActivity(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('ipAddress') ipAddress?: string
  ) {
    try {
      const analysis = await this.loginLogService.detectSuspiciousActivity(
        userId, 
        ipAddress || 'unknown'
      );

      return {
        success: true,
        message: analysis.isSuspicious ? 
          'Atividade suspeita detectada' : 
          'Nenhuma atividade suspeita detectada',
        data: analysis,
        userId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro na análise de atividade suspeita: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}