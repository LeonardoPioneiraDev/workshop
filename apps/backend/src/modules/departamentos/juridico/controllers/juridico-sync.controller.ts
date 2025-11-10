// src/modules/departamentos/juridico/controllers/juridico-sync.controller.ts
import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from '../services/sync.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum'; // ✅ IMPORTAR O ENUM

@ApiTags('Jurídico - Sincronização')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('juridico/sync')
export class JuridicoSyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA) // ✅ CORRIGIDO
  @ApiOperation({ summary: 'Status da sincronização' })
  @ApiResponse({ status: 200, description: 'Status da sincronização obtido com sucesso' })
  async getStatus() {
    return await this.syncService.getStatusSincronizacao();
  }

  @Post('executar')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR) // ✅ CORRIGIDO - Apenas roles com permissão de execução
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar sincronização manual' })
  @ApiResponse({ status: 200, description: 'Sincronização executada com sucesso' })
  @ApiResponse({ status: 409, description: 'Sincronização já em andamento' })
  async executarSincronizacao() {
    return await this.syncService.executarSincronizacaoCompleta();
  }

  @Post('forcar')
  @Roles(Role.ADMIN, Role.DIRETOR) // ✅ CORRIGIDO - Apenas admin e diretor podem forçar
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forçar sincronização imediata' })
  @ApiResponse({ status: 200, description: 'Sincronização forçada executada com sucesso' })
  async forcarSincronizacao() {
    return await this.syncService.forcerSincronizacao();
  }
}