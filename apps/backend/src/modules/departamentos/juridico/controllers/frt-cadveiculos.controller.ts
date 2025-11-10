// src/modules/departamentos/juridico/controllers/frt-cadveiculos.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { FrtCadveiculosService, VeiculoFilters } from '../services/frt-cadveiculos.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';

// ✅ DECORATOR PARA PULAR AUTENTICAÇÃO
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export class VeiculoFiltersDto implements VeiculoFilters {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoveic?: number;

  @IsOptional()
  @IsString()
  prefixoveic?: string;

  @IsOptional()
  @IsString()
  placaatualveic?: string;

  @IsOptional()
  @IsString()
  placaanteriorveic?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoempresa?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoga?: number;

  @IsOptional()
  @IsString()
  codigouf?: string;

  @IsOptional()
  @IsEnum(['A', 'I', 'M', 'V', 'T', 'S'])
  condicaoveic?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigotpveic?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigocategoriaveic?: number;

  @IsOptional()
  @IsDateString()
  dtinicioutilInicio?: Date;

  @IsOptional()
  @IsDateString()
  dtinicioutilFim?: Date;

  @IsOptional()
  @IsString()
  renavanveic?: string;

  @IsOptional()
  @IsString()
  numeromotor?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC';
}

@ApiTags('FRT - Veículos')
@Controller('juridico/veiculos')
export class FrtCadveiculosController {
  constructor(private readonly veiculoService: FrtCadveiculosService) {}

  // ✅ SINCRONIZAR FROTA COMPLETA - SEM AUTENTICAÇÃO
  @Post('sincronizar-frota')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Sincronizar frota completa do Oracle',
    description: 'Sincroniza todos os veículos ativos e opcionalmente inativos das garagens específicas - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'incluirInativos', 
    required: false, 
    type: Boolean,
    description: 'Incluir veículos inativos na sincronização (padrão: false)'
  })
  @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na sincronização' })
  async sincronizarFrotaCompleta(
    @Query('incluirInativos') incluirInativos?: boolean
  ) {
    try {
      const resultado = await this.veiculoService.sincronizarFrotaCompleta(incluirInativos || false);
      
      return {
        success: true,
        message: 'Sincronização da frota realizada com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro na sincronização: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FROTA SINCRONIZADA - COM AUTENTICAÇÃO
  @Get('frota-sincronizada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar frota sincronizada',
    description: 'Retorna veículos sincronizados do PostgreSQL com filtros avançados por setor/garagem'
  })
  @ApiQuery({ name: 'codigoGaragem', required: false, type: Number, description: 'Código da garagem (31=PARANOÁ, 124=SANTA MARIA, 239=SÃO SEBASTIÃO, 240=GAMA)' })
  @ApiQuery({ name: 'nomeGaragem', required: false, type: String, description: 'Nome da garagem/setor' })
  @ApiQuery({ name: 'situacao', required: false, enum: ['ATIVO', 'INATIVO'], description: 'Situação do veículo' })
  @ApiQuery({ name: 'prefixoVeiculo', required: false, type: String, description: 'Prefixo do veículo' })
  @ApiQuery({ name: 'placaVeiculo', required: false, type: String, description: 'Placa do veículo' })
  @ApiQuery({ name: 'tipoFrota', required: false, type: Number, description: 'Código do tipo de frota' })
  @ApiQuery({ name: 'idadeMinima', required: false, type: Number, description: 'Idade mínima do veículo (anos)' })
  @ApiQuery({ name: 'idadeMaxima', required: false, type: Number, description: 'Idade máxima do veículo (anos)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ status: 200, description: 'Frota sincronizada retornada com sucesso' })
  async buscarFrotaSincronizada(@Query() filters: any) {
    return await this.veiculoService.buscarFrotaSincronizada(filters);
  }

  // ✅ ESTATÍSTICAS DA FROTA SINCRONIZADA - COM AUTENTICAÇÃO
  @Get('frota-sincronizada/estatisticas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Estatísticas da frota sincronizada',
    description: 'Retorna estatísticas consolidadas da frota por garagem/setor e tipo de veículo'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async estatisticasFrotaSincronizada() {
    return await this.veiculoService.estatisticasFrotaSincronizada();
  }

  // ✅ DASHBOARD FROTA POR SETORES - COM AUTENTICAÇÃO
  @Get('dashboard/setores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Dashboard da frota por setores',
    description: 'Visão consolidada da frota agrupada por garagens/setores (PARANOÁ, SANTA MARIA, SÃO SEBASTIÃO, GAMA)'
  })
  @ApiResponse({ status: 200, description: 'Dashboard por setores retornado com sucesso' })
  async dashboardSetores() {
    try {
      const estatisticas = await this.veiculoService.estatisticasFrotaSincronizada();
      
      return {
        success: true,
        data: {
          resumoGeral: estatisticas.data.resumo,
          setores: estatisticas.data.distribuicao.porGaragem.map(garagem => ({
            codigo: garagem.codigoGaragem,
            nome: garagem.nomeGaragem,
            totalVeiculos: parseInt(garagem.total),
            veiculosAtivos: parseInt(garagem.ativos),
            veiculosInativos: parseInt(garagem.inativos),
            percentualAtivos: garagem.total > 0 ? (garagem.ativos / garagem.total) * 100 : 0,
            percentualInativos: garagem.total > 0 ? (garagem.inativos / garagem.total) * 100 : 0,
            status: garagem.ativos > 0 ? 'OPERACIONAL' : 'INATIVO'
          })),
          tiposFrota: estatisticas.data.distribuicao.porTipoFrota,
          alertas: {
            setoresComProblemas: estatisticas.data.distribuicao.porGaragem.filter(g => g.inativos > g.ativos).length,
            totalVeiculosInativos: estatisticas.data.resumo.veiculosInativos,
            percentualInativosGeral: estatisticas.data.resumo.percentualInativos
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro no dashboard por setores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ LISTAR TODOS OS VEÍCULOS - COM AUTENTICAÇÃO
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Listar veículos com filtros',
    description: 'Retorna lista paginada de veículos com filtros'
  })
  @ApiQuery({ name: 'codigoveic', required: false, type: Number, description: 'Código do veículo' })
  @ApiQuery({ name: 'prefixoveic', required: false, type: String, description: 'Prefixo do veículo' })
  @ApiQuery({ name: 'placaatualveic', required: false, type: String, description: 'Placa atual do veículo' })
  @ApiQuery({ name: 'placaanteriorveic', required: false, type: String, description: 'Placa anterior do veículo' })
  @ApiQuery({ name: 'codigoempresa', required: false, type: Number, description: 'Código da empresa' })
  @ApiQuery({ name: 'codigoga', required: false, type: Number, description: 'Código da garagem' })
  @ApiQuery({ name: 'codigouf', required: false, type: String, description: 'Código da UF' })
  @ApiQuery({ 
    name: 'condicaoveic', 
    required: false, 
    enum: ['A', 'I', 'M', 'V', 'T', 'S'],
    description: 'Condição do veículo (A=Ativo, I=Inativo, M=Manutenção, V=Vendido, T=Transferido, S=Sucata)'
  })
  @ApiQuery({ name: 'codigotpveic', required: false, type: Number, description: 'Código do tipo de veículo' })
  @ApiQuery({ name: 'codigocategoriaveic', required: false, type: Number, description: 'Código da categoria do veículo' })
  @ApiQuery({ name: 'dtinicioutilInicio', required: false, type: String, description: 'Data início utilização (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dtinicioutilFim', required: false, type: String, description: 'Data fim utilização (YYYY-MM-DD)' })
  @ApiQuery({ name: 'renavanveic', required: false, type: String, description: 'RENAVAN do veículo' })
  @ApiQuery({ name: 'numeromotor', required: false, type: String, description: 'Número do motor' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada com sucesso' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filters: VeiculoFiltersDto) {
    return await this.veiculoService.findAll(filters);
  }

  // ✅ BUSCAR VEÍCULO POR CÓDIGO - COM AUTENTICAÇÃO
  @Get('codigo/:codigoveic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículo por código',
    description: 'Retorna detalhes completos de um veículo específico'
  })
  @ApiParam({ 
    name: 'codigoveic', 
    type: Number,
    description: 'Código do veículo',
    example: 12345
  })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findOne(@Param('codigoveic', ParseIntPipe) codigoveic: number) {
    return await this.veiculoService.findOne(codigoveic);
  }

  // ✅ BUSCAR VEÍCULO POR PREFIXO - COM AUTENTICAÇÃO
  @Get('prefixo/:prefixoveic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículo por prefixo',
    description: 'Retorna detalhes de um veículo pelo prefixo'
  })
  @ApiParam({ 
    name: 'prefixoveic', 
    type: String,
    description: 'Prefixo do veículo',
    example: 'A1234'
  })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findByPrefixo(@Param('prefixoveic') prefixoveic: string) {
    return await this.veiculoService.findByPrefixo(prefixoveic);
  }

  // ✅ BUSCAR VEÍCULO POR PLACA - COM AUTENTICAÇÃO
  @Get('placa/:placaatualveic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículo por placa',
    description: 'Retorna detalhes de um veículo pela placa atual'
  })
  @ApiParam({ 
    name: 'placaatualveic', 
    type: String,
    description: 'Placa atual do veículo',
    example: 'ABC1234'
  })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findByPlaca(@Param('placaatualveic') placaatualveic: string) {
    return await this.veiculoService.findByPlaca(placaatualveic);
  }

  // ✅ BUSCAR VEÍCULOS POR EMPRESA - COM AUTENTICAÇÃO
  @Get('empresa/:codigoempresa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículos por empresa',
    description: 'Retorna todos os veículos de uma empresa específica'
  })
  @ApiParam({ 
    name: 'codigoempresa', 
    type: Number,
    description: 'Código da empresa',
    example: 1
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiQuery({ name: 'condicaoveic', required: false, enum: ['A', 'I', 'M', 'V', 'T', 'S'], description: 'Condição do veículo' })
  async findByEmpresa(
    @Param('codigoempresa', ParseIntPipe) codigoempresa: number,
    @Query() filters: Partial<VeiculoFiltersDto>
  ) {
    return await this.veiculoService.findByEmpresa(codigoempresa, filters);
  }

  // ✅ BUSCAR VEÍCULOS POR GARAGEM - COM AUTENTICAÇÃO
  @Get('garagem/:codigoga')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículos por garagem',
    description: 'Retorna todos os veículos de uma garagem específica'
  })
  @ApiParam({ 
    name: 'codigoga', 
    type: Number,
    description: 'Código da garagem',
    example: 10
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiQuery({ name: 'condicaoveic', required: false, enum: ['A', 'I', 'M', 'V', 'T', 'S'], description: 'Condição do veículo' })
  async findByGaragem(
    @Param('codigoga', ParseIntPipe) codigoga: number,
    @Query() filters: Partial<VeiculoFiltersDto>
  ) {
    return await this.veiculoService.findByGaragem(codigoga, filters);
  }

  // ✅ VEÍCULOS COM MAIS MULTAS - COM AUTENTICAÇÃO
  @Get('stats/mais-multas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Veículos com mais multas',
    description: 'Retorna os veículos que mais possuem multas'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (padrão: 10)',
    example: 10
  })
  @ApiResponse({ status: 200, description: 'Veículos com mais multas retornados com sucesso' })
  async getComMaisMultas(@Query('limit') limit?: number) {
    return await this.veiculoService.getComMaisMultas(limit || 10);
  }

  // ✅ ESTATÍSTICAS GERAIS - COM AUTENTICAÇÃO
  @Get('stats/geral')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Estatísticas gerais de veículos',
    description: 'Retorna estatísticas consolidadas da frota'
  })
  @ApiQuery({ name: 'codigoempresa', required: false, type: Number, description: 'Filtrar por empresa' })
  @ApiQuery({ name: 'codigoga', required: false, type: Number, description: 'Filtrar por garagem' })
  @ApiQuery({ name: 'condicaoveic', required: false, enum: ['A', 'I', 'M', 'V', 'T', 'S'], description: 'Filtrar por condição' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async getStats(@Query() filters: Partial<VeiculoFiltersDto>) {
    return await this.veiculoService.getStats(filters);
  }

  // ✅ BUSCA POR TEXTO - COM AUTENTICAÇÃO
  @Get('busca/:texto')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículos por texto',
    description: 'Busca veículos por prefixo, placa, RENAVAN ou número do motor'
  })
  @ApiParam({ 
    name: 'texto', 
    type: String,
    description: 'Texto para busca',
    example: 'A1234'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (padrão: 20)',
    example: 20
  })
  @ApiResponse({ status: 200, description: 'Busca realizada com sucesso' })
  async search(
    @Param('texto') texto: string,
    @Query('limit') limit?: number
  ) {
    return await this.veiculoService.search(texto, limit || 20);
  }

  // ✅ VEÍCULOS POR CONDIÇÃO - COM AUTENTICAÇÃO
  @Get('condicao/:condicao')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Buscar veículos por condição',
    description: 'Retorna veículos filtrados por condição específica'
  })
  @ApiParam({ 
    name: 'condicao', 
    type: String,
    description: 'Condição do veículo',
    enum: ['A', 'I', 'M', 'V', 'T', 'S'],
    example: 'A'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiResponse({ status: 200, description: 'Veículos por condição retornados com sucesso' })
  async findByCondicao(
    @Param('condicao') condicao: string,
    @Query() filters: Partial<VeiculoFiltersDto>
  ) {
    const filtrosComCondicao = { ...filters, condicaoveic: condicao };
    return await this.veiculoService.findAll(filtrosComCondicao);
  }

  // ✅ DASHBOARD FROTA - COM AUTENTICAÇÃO
  @Get('dashboard/frota')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Dashboard da frota',
    description: 'Retorna dados consolidados para dashboard da frota'
  })
  @ApiResponse({ status: 200, description: 'Dashboard da frota retornado com sucesso' })
  async getDashboardFrota() {
    const [statsGeral, veiculosComMaisMultas] = await Promise.all([
      this.veiculoService.getStats(),
      this.veiculoService.getComMaisMultas(5),
    ]);

    const alertas = {
      veiculosInativos: statsGeral.veiculosInativos || 0,
      veiculosManutencao: statsGeral.veiculosManutencao || 0,
      veiculosComMultasPendentes: veiculosComMaisMultas.filter(v => (v as any).valorTotal > 0).length,
    };

    return {
      success: true,
      data: {
        estatisticas: statsGeral,
        veiculosComMaisMultas,
        alertas,
        resumo: {
          totalVeiculos: statsGeral.totalVeiculos || 0,
          percentualAtivos: statsGeral.totalVeiculos > 0 
            ? ((statsGeral.veiculosAtivos || 0) / statsGeral.totalVeiculos) * 100 
            : 0,
          percentualInativos: statsGeral.totalVeiculos > 0 
            ? ((statsGeral.veiculosInativos || 0) / statsGeral.totalVeiculos) * 100 
            : 0,
        },
      }
    };
  }

  // ✅ HISTÓRICO DE MULTAS DO VEÍCULO - COM AUTENTICAÇÃO
  @Get(':codigoveic/multas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Histórico de multas do veículo',
    description: 'Retorna todas as multas de um veículo específico'
  })
  @ApiParam({ 
    name: 'codigoveic', 
    type: Number,
    description: 'Código do veículo',
    example: 12345
  })
  @ApiQuery({ 
    name: 'situacao', 
    required: false,
    enum: ['PAGA', 'PENDENTE', 'VENCIDA', 'EM_RECURSO', 'ANISTIADA'],
    description: 'Filtrar por situação da multa'
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
  @ApiResponse({ status: 200, description: 'Histórico de multas retornado com sucesso' })
  async getHistoricoMultas(
    @Param('codigoveic', ParseIntPipe) codigoveic: number,
    @Query('situacao') situacao?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string
  ) {
    const filters: any = { codigoveic };
    
    if (situacao) filters.situacao = situacao;
    if (dataInicio) filters.dataEmissaoInicio = new Date(dataInicio);
    if (dataFim) filters.dataEmissaoFim = new Date(dataFim);

    return {
      success: true,
      data: {
        codigoveic,
        filtros: filters,
        message: 'Histórico de multas - Implementar integração com DvsMultaService.findByVeiculo()',
        multas: []
      }
    };
  }

  // ✅ RELATÓRIO DE FROTA POR EMPRESA - COM AUTENTICAÇÃO
  @Get('relatorio/empresa/:codigoempresa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Relatório de frota por empresa',
    description: 'Gera relatório detalhado da frota de uma empresa'
  })
  @ApiParam({ 
    name: 'codigoempresa', 
    type: Number,
    description: 'Código da empresa',
    example: 1
  })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  async getRelatorioEmpresa(@Param('codigoempresa', ParseIntPipe) codigoempresa: number) {
    const [veiculos, stats] = await Promise.all([
      this.veiculoService.findByEmpresa(codigoempresa),
      this.veiculoService.getStats({ codigoempresa }),
    ]);

    const veiculosArray = Array.isArray(veiculos) ? veiculos : (veiculos as any).data || [];

    return {
      success: true,
      data: {
        empresa: {
          codigoempresa,
          totalVeiculos: veiculosArray.length,
        },
        veiculos: veiculosArray,
        estatisticas: stats,
        resumo: {
          veiculosAtivos: veiculosArray.filter(v => v.condicaoveic === 'A').length,
          veiculosInativos: veiculosArray.filter(v => v.condicaoveic === 'I').length,
          veiculosManutencao: veiculosArray.filter(v => v.condicaoveic === 'M').length,
          totalMultas: veiculosArray.reduce((sum, v) => sum + ((v as any).totalMultas || 0), 0),
          valorTotalMultas: veiculosArray.reduce((sum, v) => sum + ((v as any).valorTotalMultas || 0), 0),
        },
      }
    };
  }
}