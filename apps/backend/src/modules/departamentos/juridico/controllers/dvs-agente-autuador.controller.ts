// src/modules/departamentos/juridico/controllers/dvs-agente-autuador.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

// ✅ IMPORTAÇÕES ATUALIZADAS COM CACHE
import { 
  DvsAgenteAutuadorService, 
  AgenteFilters, 
  AgenteStats, 
  TopAgentesFilters,
  CacheOptions,
  CacheResult
} from '../services/dvs-agente-autuador.service';

import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';

@ApiTags('DVS - Agentes Autuadores com Cache Inteligente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('juridico/agentes')
export class DvsAgenteAutuadorController {
  constructor(private readonly agenteService: DvsAgenteAutuadorService) {}

  // ✅ 1. LISTAR TODOS OS AGENTES COM CACHE - CORRIGIDO SEM DTO
  @Get()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Listar agentes autuadores com cache inteligente',
    description: 'Retorna lista paginada de agentes autuadores com filtros e cache híbrido'
  })
  @ApiQuery({ name: 'cod_agente_autuador', required: false, type: Number, description: 'Código do agente autuador' })
  @ApiQuery({ name: 'desc_agente_autuador', required: false, type: String, description: 'Descrição/nome do agente' })
  @ApiQuery({ name: 'matriculafiscal', required: false, type: String, description: 'Matrícula fiscal do agente' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID', 'CACHE_ONLY'], description: 'Estratégia de cache (padrão: HYBRID)' })
  @ApiQuery({ name: 'forcarOracle', required: false, type: Boolean, description: 'Forçar busca no Oracle (padrão: false)' })
  @ApiQuery({ name: 'ttlHoras', required: false, type: Number, description: 'TTL do cache em horas (padrão: 12)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de agentes retornada com sucesso'
  })
  async findAll(
    @Query('cod_agente_autuador') cod_agente_autuador?: string,
    @Query('desc_agente_autuador') desc_agente_autuador?: string,
    @Query('matriculafiscal') matriculafiscal?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID' | 'CACHE_ONLY',
    @Query('forcarOracle') forcarOracle?: string,
    @Query('ttlHoras') ttlHoras?: string
  ) {
    try {
      // ✅ CONVERTER PARÂMETROS MANUALMENTE
      const filters: AgenteFilters = {
        cod_agente_autuador: cod_agente_autuador ? parseInt(cod_agente_autuador) : undefined,
        desc_agente_autuador: desc_agente_autuador || undefined,
        matriculafiscal: matriculafiscal || undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        orderBy: orderBy || 'desc_agente_autuador',
        orderDirection: orderDirection || 'ASC'
      };

      const options: CacheOptions = {
        estrategia: estrategia || 'HYBRID',
        forcarOracle: forcarOracle === 'true',
        ttlHoras: ttlHoras ? parseInt(ttlHoras) : 12,
        salvarCache: true
      };

      const resultado = await this.agenteService.findAll(filters, options);
      
      return {
        success: true,
        ...resultado,
        cache: {
          fromCache: resultado.fromCache || false,
          fonte: resultado.cacheInfo?.fonte || 'UNKNOWN',
          tempoConsulta: resultado.cacheInfo?.tempoConsulta || 0
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar agentes: ${error.message}`);
    }
  }

  // ✅ 2. BUSCAR AGENTE POR CÓDIGO COM CACHE INTELIGENTE
  @Get('codigo/:cod_agente_autuador')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar agente por código com cache inteligente',
    description: 'Retorna detalhes completos de um agente específico usando cache híbrido'
  })
  @ApiParam({ 
    name: 'cod_agente_autuador', 
    type: Number,
    description: 'Código do agente autuador',
    example: 123
  })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID', 'CACHE_ONLY'], description: 'Estratégia de cache (padrão: HYBRID)' })
  @ApiQuery({ name: 'forcarOracle', required: false, type: Boolean, description: 'Forçar busca no Oracle (padrão: false)' })
  @ApiQuery({ name: 'ttlHoras', required: false, type: Number, description: 'TTL do cache em horas (padrão: 24)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agente encontrado com sucesso'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Agente não encontrado'
  })
  async findOne(
    @Param('cod_agente_autuador', ParseIntPipe) cod_agente_autuador: number,
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID' | 'CACHE_ONLY',
    @Query('forcarOracle') forcarOracle?: string,
    @Query('ttlHoras') ttlHoras?: string
  ) {
    try {
      const options: CacheOptions = {
        estrategia: estrategia || 'HYBRID',
        forcarOracle: forcarOracle === 'true',
        ttlHoras: ttlHoras ? parseInt(ttlHoras) : 24,
        salvarCache: true
      };

      const resultado = await this.agenteService.findOne(cod_agente_autuador, options);
      
      return {
        success: true,
        data: resultado.data,
        cache: {
          fromCache: resultado.fromCache,
          fonte: resultado.cacheInfo?.fonte,
          tempoConsulta: resultado.cacheInfo?.tempoConsulta,
          ttlRestante: resultado.cacheInfo?.ttlRestante,
          ultimaAtualizacao: resultado.cacheInfo?.ultimaAtualizacao
        },
        timestamp: new Date()
      };
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(`Erro ao buscar agente: ${error.message}`);
    }
  }

  // ✅ 3. BUSCAR AGENTE POR MATRÍCULA COM CACHE
  @Get('matricula/:matriculafiscal')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar agente por matrícula com cache',
    description: 'Retorna detalhes de um agente pela matrícula fiscal usando cache inteligente'
  })
  @ApiParam({ 
    name: 'matriculafiscal', 
    type: String,
    description: 'Matrícula fiscal do agente',
    example: 'MAT123456'
  })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID', 'CACHE_ONLY'], description: 'Estratégia de cache (padrão: HYBRID)' })
  @ApiQuery({ name: 'forcarOracle', required: false, type: Boolean, description: 'Forçar busca no Oracle (padrão: false)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agente encontrado com sucesso'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Agente não encontrado'
  })
  async findByMatricula(
    @Param('matriculafiscal') matriculafiscal: string,
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID' | 'CACHE_ONLY',
    @Query('forcarOracle') forcarOracle?: string
  ) {
    if (!matriculafiscal || matriculafiscal.trim().length === 0) {
      throw new BadRequestException('Matrícula fiscal é obrigatória');
    }

    try {
      const options: CacheOptions = {
        estrategia: estrategia || 'HYBRID',
        forcarOracle: forcarOracle === 'true',
        ttlHoras: 24,
        salvarCache: true
      };

      const resultado = await this.agenteService.findByMatricula(matriculafiscal.trim(), options);
      
      return {
        success: true,
        data: resultado.data,
        cache: {
          fromCache: resultado.fromCache,
          fonte: resultado.cacheInfo?.fonte,
          tempoConsulta: resultado.cacheInfo?.tempoConsulta
        },
        timestamp: new Date()
      };
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(`Erro ao buscar agente por matrícula: ${error.message}`);
    }
  }

  // ✅ 4. STATUS DO CACHE
  @Get('cache/status')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ 
    summary: 'Status do cache de agentes',
    description: 'Retorna informações detalhadas sobre o cache de agentes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status do cache retornado com sucesso'
  })
  async getCacheStatus() {
    try {
      const status = await this.agenteService.obterStatusCache();
      return {
        success: true,
        data: status,
        timestamp: new Date()
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao obter status do cache: ${error.message}`);
    }
  }

  // ✅ 5. SINCRONIZAÇÃO MANUAL
  @Post('cache/sincronizar')
  @Roles(Role.ADMIN, Role.DIRETOR)
  @ApiOperation({ 
    summary: 'Sincronizar cache com Oracle',
    description: 'Força sincronização do cache de agentes com dados do Oracle'
  })
  @ApiQuery({ 
    name: 'cod_agente_autuador', 
    required: false, 
    type: Number,
    description: 'Código específico do agente (opcional - se não informado, sincroniza todos)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sincronização executada com sucesso'
  })
  async sincronizarCache(@Query('cod_agente_autuador') cod_agente_autuador?: string) {
    try {
      const codigoAgente = cod_agente_autuador ? parseInt(cod_agente_autuador) : undefined;
      const resultado = await this.agenteService.sincronizarComOracle(codigoAgente);
      return {
        success: true,
        data: resultado,
        message: `Sincronização concluída: ${resultado.sincronizados} agentes sincronizados, ${resultado.erros} erros`,
        timestamp: new Date()
      };
    } catch (error) {
      throw new BadRequestException(`Erro na sincronização: ${error.message}`);
    }
  }

  // ✅ 6. LIMPEZA DE CACHE
  @Delete('cache/limpar')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Limpar cache expirado',
    description: 'Remove registros expirados do cache de agentes'
  })
  @ApiQuery({ 
    name: 'ttlHoras', 
    required: false, 
    type: Number,
    description: 'TTL em horas para considerar expirado (padrão: 168 = 7 dias)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache limpo com sucesso'
  })
  async limparCache(@Query('ttlHoras') ttlHoras?: string) {
    try {
      const ttl = ttlHoras ? parseInt(ttlHoras) : 168;
      const removidos = await this.agenteService.limparCacheExpirado(ttl);
      return {
        success: true,
        data: { removidos },
        message: `${removidos} registros removidos do cache`,
        timestamp: new Date()
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao limpar cache: ${error.message}`);
    }
  }

  // ✅ 7. TOP AGENTES COM CACHE
  @Get('stats/top-agentes')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Top agentes autuadores com cache',
    description: 'Retorna os agentes que mais emitiram multas usando dados atualizados'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (padrão: 10)',
    example: 10
  })
  @ApiQuery({ 
    name: 'dataInicio', 
    required: false, 
    type: String,
    description: 'Data início para análise (YYYY-MM-DD)'
  })
  @ApiQuery({ 
    name: 'dataFim', 
    required: false, 
    type: String,
    description: 'Data fim para análise (YYYY-MM-DD)'
  })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID'], description: 'Estratégia de cache (padrão: ORACLE_FIRST)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top agentes retornados com sucesso'
  })
  async getTopAgentes(
    @Query('limit') limit?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID'
  ) {
    const filters: TopAgentesFilters = { 
      limit: limit ? parseInt(limit) : 10 
    };
    
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      if (isNaN(inicio.getTime())) throw new BadRequestException('Data início inválida.');
      filters.dataInicio = inicio;
    }
    if (dataFim) {
      const fim = new Date(dataFim);
      if (isNaN(fim.getTime())) throw new BadRequestException('Data fim inválida.');
      filters.dataFim = fim;
    }
    
    try {
      const options: CacheOptions = {
        estrategia: estrategia || 'ORACLE_FIRST',
        salvarCache: true
      };

      const resultado = await this.agenteService.getTopAgentes(filters, options);
      
      return {
        success: true,
        data: resultado.data,
        meta: {
          total: resultado.data.length,
          criterio: 'totalMultas',
          periodo: filters.dataInicio && filters.dataFim 
            ? `De ${filters.dataInicio.toISOString().substring(0,10)} a ${filters.dataFim.toISOString().substring(0,10)}` 
            : 'Desde o início'
        },
        cache: {
          fromCache: resultado.fromCache,
          fonte: resultado.cacheInfo?.fonte,
          tempoConsulta: resultado.cacheInfo?.tempoConsulta
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar top agentes: ${error.message}`);
    }
  }

  // ✅ 8. ESTATÍSTICAS COM CACHE HÍBRIDO
  @Get('stats/geral')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Estatísticas gerais de agentes com cache híbrido',
    description: 'Retorna estatísticas consolidadas dos agentes autuadores usando cache inteligente'
  })
  @ApiQuery({ name: 'dataInicio', required: false, type: String, description: 'Data início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, type: String, description: 'Data fim (YYYY-MM-DD)' })
  @ApiQuery({ name: 'cod_agente_autuador', required: false, type: Number, description: 'Filtrar por código de agente' })
  @ApiQuery({ name: 'matriculafiscal', required: false, type: String, description: 'Filtrar por matrícula fiscal' })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID'], description: 'Estratégia de cache (padrão: HYBRID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas retornadas com sucesso'
  })
  async getStats(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('cod_agente_autuador') cod_agente_autuador?: string,
    @Query('matriculafiscal') matriculafiscal?: string,
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID'
  ) {
    const filtrosCompletos: Partial<AgenteFilters> = {};
    
    if (cod_agente_autuador) {
      filtrosCompletos.cod_agente_autuador = parseInt(cod_agente_autuador);
    }
    
    if (matriculafiscal) {
      filtrosCompletos.matriculafiscal = matriculafiscal;
    }
    
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      if (isNaN(inicio.getTime())) throw new BadRequestException('Data início inválida.');
      filtrosCompletos.dataInicio = inicio;
    }
    if (dataFim) {
      const fim = new Date(dataFim);
      if (isNaN(fim.getTime())) throw new BadRequestException('Data fim inválida.');
      filtrosCompletos.dataFim = fim;
    }
    
    try {
      const options: CacheOptions = {
        estrategia: estrategia || 'HYBRID',
        ttlHoras: 6 // Stats com TTL menor para maior precisão
      };

      const resultado = await this.agenteService.getStats(filtrosCompletos, options);
      
      return {
        success: true,
        data: resultado.data,
        meta: {
          filtros: filtrosCompletos,
          geradoEm: new Date()
        },
        cache: {
          fromCache: resultado.fromCache,
          fonte: resultado.cacheInfo?.fonte,
          tempoConsulta: resultado.cacheInfo?.tempoConsulta
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar estatísticas: ${error.message}`);
    }
  }

  // ✅ 9. BUSCA POR TEXTO COM CACHE
  @Get('busca/:texto')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar agentes por texto com cache',
    description: 'Busca agentes por nome ou matrícula fiscal usando cache inteligente'
  })
  @ApiParam({ 
    name: 'texto', 
    type: String,
    description: 'Texto para busca',
    example: 'João Silva'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (padrão: 20)',
    example: 20
  })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID'], description: 'Estratégia de cache (padrão: HYBRID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Busca realizada com sucesso'
  })
  async search(
    @Param('texto') texto: string,
    @Query('limit') limit?: string,
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID'
  ) {
    if (!texto || texto.trim().length < 2) {
      throw new BadRequestException('Texto de busca deve ter pelo menos 2 caracteres');
    }

    try {
      const options: CacheOptions = {
        estrategia: estrategia || 'HYBRID',
        ttlHoras: 12
      };

      const limiteParsed = limit ? parseInt(limit) : 20;
      const resultado = await this.agenteService.search(texto.trim(), limiteParsed, options);
      
      return {
        success: true,
        data: resultado.data,
        meta: {
          termoBusca: texto.trim(),
          total: resultado.data.length,
          limite: limiteParsed
        },
        cache: {
          fromCache: resultado.fromCache,
          fonte: resultado.cacheInfo?.fonte,
          tempoConsulta: resultado.cacheInfo?.tempoConsulta
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro na busca: ${error.message}`);
    }
  }

  // ✅ 10. RELATÓRIO DE PRODUTIVIDADE COM CACHE
  @Get(':cod_agente_autuador/produtividade')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Relatório de produtividade do agente com cache',
    description: 'Gera relatório detalhado de produtividade de um agente em período específico usando cache híbrido'
  })
  @ApiParam({ 
    name: 'cod_agente_autuador', 
    type: Number,
    description: 'Código do agente autuador',
    example: 123
  })
  @ApiQuery({ 
    name: 'dataInicio', 
    required: true,
    type: String,
    description: 'Data início (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @ApiQuery({ 
    name: 'dataFim', 
    required: true,
    type: String,
    description: 'Data fim (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @ApiQuery({ name: 'estrategia', required: false, enum: ['CACHE_FIRST', 'ORACLE_FIRST', 'HYBRID'], description: 'Estratégia de cache (padrão: HYBRID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Relatório de produtividade gerado com sucesso'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Período inválido'
  })
  async getRelatorioProdutividade(
    @Param('cod_agente_autuador', ParseIntPipe) cod_agente_autuador: number,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
    @Query('estrategia') estrategia?: 'CACHE_FIRST' | 'ORACLE_FIRST' | 'HYBRID'
  ) {
    if (!dataInicio || !dataFim) {
      throw new BadRequestException('Data início e data fim são obrigatórias');
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      throw new BadRequestException('Datas inválidas. Use o formato YYYY-MM-DD');
    }

    if (inicio > fim) {
      throw new BadRequestException('Data início deve ser anterior à data fim');
    }
    
    try {
      const options: CacheOptions = {
        estrategia: estrategia || 'HYBRID'
      };

      const relatorio = await this.agenteService.getRelatorioProdutividade(
        cod_agente_autuador, 
        inicio, 
        fim, 
        options
      );
      
      return {
        success: true,
        data: relatorio,
        meta: {
          periodo: { inicio, fim },
          geradoEm: new Date(),
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar relatório de produtividade: ${error.message}`);
    }
  }

  // ✅ 11. DASHBOARD AGENTES - ACESSO GERENCIAL
  @Get('dashboard/resumo')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Dashboard dos agentes',
    description: 'Retorna dados consolidados para dashboard dos agentes'
  })
  @ApiQuery({ 
    name: 'periodo', 
    required: false, 
    enum: ['mes_atual', 'trimestre', 'semestre', 'ano'],
    description: 'Período para análise (padrão: mes_atual)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard retornado com sucesso'
  })
  async getDashboardResumo(@Query('periodo') periodo: string = 'mes_atual') {
    const hoje = new Date();
    let inicioPeriodo: Date;
    let fimPeriodo: Date;

    switch (periodo) {
      case 'trimestre':
        const mesAtualTrimestre = hoje.getMonth();
        const inicioTrimestre = Math.floor(mesAtualTrimestre / 3) * 3;
        inicioPeriodo = new Date(hoje.getFullYear(), inicioTrimestre, 1);
        fimPeriodo = new Date(hoje.getFullYear(), inicioTrimestre + 3, 0);
        break;
      case 'semestre':
        const inicioSemestre = hoje.getMonth() < 6 ? 0 : 6;
        inicioPeriodo = new Date(hoje.getFullYear(), inicioSemestre, 1);
        fimPeriodo = new Date(hoje.getFullYear(), inicioSemestre + 6, 0);
        break;
      case 'ano':
        inicioPeriodo = new Date(hoje.getFullYear(), 0, 1);
        fimPeriodo = new Date(hoje.getFullYear(), 11, 31);
        break;
      default: // mes_atual
        inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fimPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }
    
    try {
      const [statsGeral, topAgentes] = await Promise.all([
        this.agenteService.getStats({ dataInicio: inicioPeriodo, dataFim: fimPeriodo }, { estrategia: 'HYBRID' }),
        this.agenteService.getTopAgentes({ limit: 5, dataInicio: inicioPeriodo, dataFim: fimPeriodo }, { estrategia: 'ORACLE_FIRST' })
      ]);

      // ✅ CALCULAR PRODUTIVIDADE DO PERÍODO
      const produtividadePeriodo = await Promise.all(
        topAgentes.data.slice(0, 3).map(async (agente) => {
          try {
            const relatorio = await this.agenteService.getRelatorioProdutividade(
              agente.cod_agente_autuador,
              inicioPeriodo,
              fimPeriodo,
              { estrategia: 'HYBRID' }
            );
            return {
              agente: agente.desc_agente_autuador,
              multasNoPeriodo: relatorio.resumo.totalMultas,
              valorNoPeriodo: relatorio.resumo.valorTotal,
              mediaMultasPorDia: relatorio.resumo.mediaMultasPorDia || 0,
            };
          } catch (error) {
            return {
              agente: agente.desc_agente_autuador,
              multasNoPeriodo: 0,
              valorNoPeriodo: 0,
              mediaMultasPorDia: 0,
              erro: 'Erro ao calcular produtividade',
            };
          }
        })
      );

      return {
        success: true,
        data: {
          estatisticas: statsGeral.data,
          topAgentes: topAgentes.data,
          produtividadePeriodo,
          periodo: {
            tipo: periodo,
            inicio: inicioPeriodo,
            fim: fimPeriodo,
          },
          alertas: {
            agentesInativos: statsGeral.data.agentesInativos,
            mediaMultasPorAgente: statsGeral.data.mediaMultasPorAgente || 0,
            agentesAbaixoMedia: statsGeral.data.agentesAbaixoMedia || 0,
          },
          indicadores: {
            eficienciaGeral: statsGeral.data.eficienciaGeral || 0,
            crescimentoPeriodo: statsGeral.data.crescimentoPeriodo || 0,
            produtividadeMedia: statsGeral.data.produtividadeMedia || 0,
          }
        },
        cache: {
          fonteStats: statsGeral.cacheInfo?.fonte,
          fonteTopAgentes: topAgentes.cacheInfo?.fonte,
          tempoTotal: (statsGeral.cacheInfo?.tempoConsulta || 0) + (topAgentes.cacheInfo?.tempoConsulta || 0)
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar dashboard: ${error.message}`);
    }
  }

  // ✅ 12. COMPARATIVO DE PRODUTIVIDADE
  @Get('comparativo/produtividade')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Comparativo de produtividade entre agentes',
    description: 'Compara a produtividade de múltiplos agentes em período específico'
  })
  @ApiQuery({ 
    name: 'agentes', 
    required: true,
    type: String,
    description: 'Códigos dos agentes separados por vírgula',
    example: '123,456,789'
  })
  @ApiQuery({ 
    name: 'dataInicio', 
    required: true,
    type: String,
    description: 'Data início (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @ApiQuery({ 
    name: 'dataFim', 
    required: true,
    type: String,
    description: 'Data fim (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Comparativo gerado com sucesso'
  })
  async getComparativoProdutividade(
    @Query('agentes') agentes: string,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string
  ) {
    if (!agentes || !dataInicio || !dataFim) {
      throw new BadRequestException('Agentes, data início e data fim são obrigatórios');
    }

    const codigosAgentes = agentes.split(',').map(cod => {
      const numero = parseInt(cod.trim());
      if (isNaN(numero)) {
        throw new BadRequestException(`Código de agente inválido: ${cod}`);
      }
      return numero;
    });

    if (codigosAgentes.length === 0) {
      throw new BadRequestException('Pelo menos um agente deve ser informado');
    }

    if (codigosAgentes.length > 10) {
      throw new BadRequestException('Máximo de 10 agentes por comparativo');
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      throw new BadRequestException('Datas inválidas. Use o formato YYYY-MM-DD');
    }

    if (inicio > fim) {
      throw new BadRequestException('Data início deve ser anterior à data fim');
    }

    try {
      const comparativo = await Promise.all(
        codigosAgentes.map(async (cod_agente_autuador) => {
          try {
            const relatorio = await this.agenteService.getRelatorioProdutividade(
              cod_agente_autuador,
              inicio,
              fim
            );
            return {
              agente: relatorio.agente,
              resumo: relatorio.resumo,
              multasPorMes: relatorio.multasPorMes,
              ranking: 0, // Será calculado depois
            };
          } catch (error) {
            // Se o agente não for encontrado ou houver erro no relatório, retornar um objeto de erro
            const agenteInfo = await this.agenteService.findOne(cod_agente_autuador).catch(() => null);
            return {
              agente: { 
                cod_agente_autuador, 
                desc_agente_autuador: agenteInfo?.data?.desc_agente_autuador || 'Agente não encontrado',
                matriculafiscal: agenteInfo?.data?.matriculafiscal || 'N/A'
              },
              resumo: { 
                totalMultas: 0, 
                valorTotal: 0, 
                valorMedio: 0,
                mediaMultasPorDia: 0
              },
              multasPorMes: [],
              ranking: 0,
              erro: error.message,
            };
          }
        })
      );

      // ✅ CALCULAR RANKING
      const comparativoOrdenado = comparativo
        .sort((a, b) => b.resumo.totalMultas - a.resumo.totalMultas)
        .map((item, index) => ({ ...item, ranking: index + 1 }));

      return {
        success: true,
        data: {
          periodo: { inicio, fim },
          agentes: comparativoOrdenado,
          resumoGeral: {
            totalAgentes: comparativo.length,
            totalMultas: comparativo.reduce((sum, a) => sum + a.resumo.totalMultas, 0),
            valorTotal: comparativo.reduce((sum, a) => sum + a.resumo.valorTotal, 0),
            mediaMultasPorAgente: comparativo.length > 0 
              ? comparativo.reduce((sum, a) => sum + a.resumo.totalMultas, 0) / comparativo.length 
              : 0,
            valorMedioPorAgente: comparativo.length > 0 
              ? comparativo.reduce((sum, a) => sum + a.resumo.valorTotal, 0) / comparativo.length 
              : 0,
          },
          analises: {
            melhorAgente: comparativoOrdenado[0] || null,
            maiorVariacao: this.calcularMaiorVariacao(comparativoOrdenado),
            consistenciaProdutividade: this.calcularConsistencia(comparativoOrdenado),
          }
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar comparativo: ${error.message}`);
    }
  }

  // ✅ 13. HISTÓRICO DE MULTAS DO AGENTE
  @Get(':cod_agente_autuador/multas')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Histórico de multas do agente',
    description: 'Retorna todas as multas emitidas por um agente específico'
  })
  @ApiParam({ 
    name: 'cod_agente_autuador', 
    type: Number,
    description: 'Código do agente autuador',
    example: 123
  })
  @ApiQuery({ 
    name: 'dataInicio', 
    required: false,
    type: String,
    description: 'Data início (YYYY-MM-DD)'
  })
  @ApiQuery({ 
    name: 'dataFim', 
    required: false,
    type: String,
    description: 'Data fim (YYYY-MM-DD)'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false,
    type: Number,
    description: 'Página (padrão: 1)'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false,
    type: Number,
    description: 'Limite por página (padrão: 50)'
  })
  @ApiQuery({ 
    name: 'orderBy', 
    required: false,
    type: String,
    description: 'Campo para ordenação (padrão: dataemissaomulta)'
  })
  @ApiQuery({ 
    name: 'orderDirection', 
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Direção da ordenação (padrão: DESC)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Histórico de multas retornado com sucesso'
  })
  async getHistoricoMultas(
    @Param('cod_agente_autuador', ParseIntPipe) cod_agente_autuador: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: 'ASC' | 'DESC'
  ) {
    const filters: any = {
      cod_agente_autuador,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      orderBy: orderBy || 'dataemissaomulta',
      orderDirection: orderDirection || 'DESC',
    };
    
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      if (isNaN(inicio.getTime())) {
        throw new BadRequestException('Data início inválida. Use o formato YYYY-MM-DD');
      }
      filters.dataEmissaoInicio = inicio;
    }
    
    if (dataFim) {
      const fim = new Date(dataFim);
      if (isNaN(fim.getTime())) {
        throw new BadRequestException('Data fim inválida. Use o formato YYYY-MM-DD');
      }
      filters.dataEmissaoFim = fim;
    }

    try {
      const agente = await this.agenteService.findOne(cod_agente_autuador);
      
      return {
        success: true,
        data: {
          agente: {
            cod_agente_autuador: agente.data.cod_agente_autuador,
            desc_agente_autuador: agente.data.desc_agente_autuador,
            matriculafiscal: agente.data.matriculafiscal,
          },
          filtros: filters,
          message: 'ATENÇÃO: Implementar integração com DvsMultaService.findAll() com filtro de agente para obter histórico real de multas.',
          multas: [], // TODO: Substituir por dados reais de multas
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: 0, // TODO: Substituir por total real
            totalPages: 0, // TODO: Substituir por total de páginas real
          }
        }
      };
    } catch (error) {
      throw new BadRequestException(`Agente ${cod_agente_autuador} não encontrado ou erro ao buscar histórico: ${error.message}`);
    }
  }

  // ✅ MÉTODOS PRIVADOS AUXILIARES
  private calcularMaiorVariacao(agentes: any[]): any {
    if (agentes.length < 2) return null;
    
    const valores = agentes.map(a => a.resumo.totalMultas);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    
    return {
      variacao: max - min,
      percentual: min > 0 ? ((max - min) / min) * 100 : 0,
      agenteMax: agentes.find(a => a.resumo.totalMultas === max)?.agente.desc_agente_autuador,
      agenteMin: agentes.find(a => a.resumo.totalMultas === min)?.agente.desc_agente_autuador,
    };
  }

  private calcularConsistencia(agentes: any[]): number {
    if (agentes.length === 0) return 0;
    
    const valores = agentes.map(a => a.resumo.totalMultas);
    const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
    
    if (media === 0) return 100;
    
    const variancia = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;
    const desvioPadrao = Math.sqrt(variancia);
    const coeficienteVariacao = (desvioPadrao / media) * 100;
    
        // Retorna consistência como percentual (100% = muito consistente, 0% = muito variável)
        return Math.max(0, 100 - coeficienteVariacao);
      }
    }