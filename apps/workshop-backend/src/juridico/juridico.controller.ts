import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JuridicoService } from './juridico.service';
import { SyncMultasDto } from './dto/sync-multas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Juridico')
@UseGuards(JwtAuthGuard)
@Controller('juridico')
export class JuridicoController {
    constructor(private readonly juridicoService: JuridicoService) { }

    @Post('sync')
    @ApiOperation({ summary: 'Sincronizar multas do Globus' })
    @ApiResponse({ status: 201, description: 'Sincronização iniciada com sucesso' })
    async syncMultas(@Body() dto: SyncMultasDto) {
        return this.juridicoService.syncMultas(dto);
    }

    @Get('semob-fines-sync')
    @ApiOperation({ summary: 'Obter multas SEMOB, sincronizando se necessário' })
    @ApiResponse({ status: 200, description: 'Multas SEMOB retornadas com sucesso' })
    async getSemobFinesWithSync(@Query('force') force?: string) {
        const forceSync = (force || '').toLowerCase() === 'true';
        if (forceSync) {
            return this.juridicoService.forceSyncSemobFinesAndFetch();
        }
        return this.juridicoService.getOrSyncSemobFines();
    }

    @Get('semob-fines')
    @ApiOperation({ summary: 'Listar multas SEMOB (SUFISA) com filtros' })
    @ApiResponse({ status: 200, description: 'Lista de multas filtrada' })
    async findSemobFines(
        @Query('prefixoVeiculo') prefixoVeiculo?: string,
        @Query('agenteCodigo') agenteCodigo?: string,
        @Query('cidade') cidade?: string, // ainda não suportado server-side
        @Query('localMulta') localMulta?: string,
        @Query('descricaoInfra') descricaoInfra?: string,
        @Query('codigoInfracao') codigoInfracao?: string,
        @Query('codigoLinha') codigoLinha?: string,
        @Query('setorPrincipalLinha') setorPrincipalLinha?: string,
        @Query('ano') ano?: string,
        @Query('mes') mes?: string,
        @Query('classificacao') classificacao?: string,
        @Query('dataInicio') dataInicio?: string,
        @Query('dataFim') dataFim?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('orderBy') orderBy?: string,
        @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
        @Query('force') force?: string,
    ) {
        // Garante dados sincronizados ao menos uma vez por dia ou quando requisitado
        const forceSync = (force || '').toLowerCase() === 'true';
        if (forceSync) {
            await this.juridicoService.forceSyncSemobFinesAndFetch();
        } else {
            // dispara sincronização condicional (se ainda não houve sync válido hoje)
            await this.juridicoService.getOrSyncSemobFines();
        }
        return this.juridicoService.findSemobWithFilters({
            prefixoVeiculo,
            agenteCodigo,
            cidade,
            localMulta,
            descricaoInfra,
            codigoInfracao,
            codigoLinha,
            setorPrincipalLinha,
            ano,
            mes,
            classificacao,
            dataInicio,
            dataFim,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            orderBy,
            orderDirection,
        });
    }

    @Post('semob/sync')
    @ApiOperation({ summary: 'Forçar sincronização SEMOB e retornar estatísticas' })
    @ApiResponse({ status: 201, description: 'Sincronização SEMOB executada' })
    async forceSemobSync() {
        return this.juridicoService.syncSemobFines();
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Obter dados do dashboard de multas' })
    @ApiResponse({ status: 200, description: 'Dados do dashboard retornados com sucesso' })
    async getDashboardData() {
        return this.juridicoService.getDashboardData();
    }
}
