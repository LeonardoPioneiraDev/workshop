// src/modules/departamentos/juridico/controllers/dvs-multa.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
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
  ApiBody,
  ApiProperty,
  getSchemaPath
} from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DvsMultaService, MultaFilters, MultaDetalhada, MultaStats } from '../services/dvs-multa.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';

// ✅ DTOs DE RESPOSTA SIMPLIFICADOS (SEM IMPLEMENTAR INTERFACES)

class AgenteSimplesDto {
  @ApiProperty({ example: 123, description: 'Código do agente autuador' })
  cod_agente_autuador: number;

  @ApiProperty({ example: 'Agente Silva', description: 'Nome do agente autuador' })
  desc_agente_autuador: string;

  @ApiProperty({ example: 'MAT123', description: 'Matrícula fiscal do agente' })
  matriculafiscal: string;
}

class InfracaoSimplesDto {
  @ApiProperty({ example: '50610', description: 'Código da infração' })
  codigoinfra: string;

  @ApiProperty({ example: 'Excesso de Velocidade', description: 'Descrição da infração' })
  descricaoinfra: string;

  @ApiProperty({ example: 5, description: 'Pontuação da infração' })
  pontuacaoinfra?: number;

  @ApiProperty({ example: 'VELOCIDADE', description: 'Grupo da infração' })
  grupoinfra?: string;
}

class VeiculoSimplesDto {
  @ApiProperty({ example: 456, description: 'Código do veículo' })
  codigoveic: number;

  @ApiProperty({ example: 'ABC-1234', description: 'Placa atual do veículo' })
  placaatualveic: string;

  @ApiProperty({ example: 'V123', description: 'Prefixo do veículo' })
  prefixoveic: string;

  @ApiProperty({ example: 'Mercedes-Benz', description: 'Marca do veículo' })
  marcaveic?: string;

  @ApiProperty({ example: 'O500U', description: 'Modelo do veículo' })
  modeloveic?: string;
}

// ✅ DTO DE RESPOSTA PRINCIPAL (SEM IMPLEMENTAR INTERFACE)
class MultaDetalhadaResponseDto {
  @ApiProperty({ example: 'AI123456789', description: 'Número do AI da multa' })
  numeroaimulta: string;

  @ApiProperty({ example: 12345, description: 'Código do veículo' })
  codigoveic?: number;

  @ApiProperty({ example: '50610', description: 'Código da infração' })
  codigoinfra?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', description: 'Data de emissão da multa' })
  dataemissaomulta?: Date;

  @ApiProperty({ example: 500.00, description: 'Valor total da multa' })
  valortotalmulta?: number;

  @ApiProperty({ example: 'M', description: 'Responsável pela multa (M=Motorista, E=Empresa)' })
  responsavelmulta?: string;

  @ApiProperty({ example: null, description: 'Data de pagamento da multa' })
  datapagtomulta?: Date;

  @ApiProperty({ example: null, description: 'Recurso (S/N)' })
  recuso?: string;

  @ApiProperty({ example: null, description: 'Anistia (S/N)' })
  anistia?: string;

  @ApiProperty({ example: 250.00, description: 'Valor pago' })
  valorpago?: number;

  @ApiProperty({ example: '123', description: 'Auto de infração' })
  autodeinfracao?: string;

  @ApiProperty({ example: 100, description: 'Pontuação da infração' })
  pontuacaoinfracao?: number;

  @ApiProperty({ example: 'VELOCIDADE', description: 'Grupo da infração' })
  grupoinfracao?: string;

  @ApiProperty({ example: 1234, description: 'Código do agente autuador' })
  cod_agente_autuador?: number;

  @ApiProperty({ example: '2024-02-15', description: 'Data de vencimento da multa' })
  datavencimentomulta?: Date;

  @ApiProperty({ example: 'SP123456789', description: 'Número do processo' })
  numeroprocesso?: string;

  @ApiProperty({ example: 'São Paulo', description: 'Local da infração' })
  localinfracao?: string;

  @ApiProperty({ example: 1, description: 'Código da empresa' })
  codigoempresa?: number;

  @ApiProperty({ example: 10, description: 'Código da garagem' })
  codigoga?: number;

  // ✅ RELACIONAMENTOS SIMPLIFICADOS
  @ApiProperty({ type: () => InfracaoSimplesDto, description: 'Dados da infração' })
  infracao?: InfracaoSimplesDto;

  @ApiProperty({ type: () => VeiculoSimplesDto, description: 'Dados do veículo' })
  veiculo?: VeiculoSimplesDto;

  @ApiProperty({ type: () => AgenteSimplesDto, description: 'Dados do agente autuador' })
  agente?: AgenteSimplesDto;

  // ✅ CAMPOS CALCULADOS
  @ApiProperty({ example: 'VENCIDA', description: 'Situação calculada da multa' })
  situacaoCalculada?: string;

  @ApiProperty({ example: 30, description: 'Dias para vencimento (negativo se vencida)' })
  diasVencimento?: number;

  @ApiProperty({ example: 600.00, description: 'Valor atualizado com juros e multa' })
  valorAtualizadoCalculado?: number;

  @ApiProperty({ example: true, description: 'Indica se a multa está vencida' })
  isVencida?: boolean;

  @ApiProperty({ example: false, description: 'Indica se a multa foi paga' })
  isPaga?: boolean;

  @ApiProperty({ example: false, description: 'Indica se a multa tem recurso' })
  temRecurso?: boolean;

  @ApiProperty({ example: false, description: 'Indica se a multa foi anistiada' })
  isAnistiada?: boolean;
}

// ✅ DTO DE ESTATÍSTICAS (SEM IMPLEMENTAR INTERFACE)
class MultaStatsResponseDto {
  @ApiProperty({ example: 1000, description: 'Total de multas' })
  totalMultas: number;

  @ApiProperty({ example: 50000.00, description: 'Valor total das multas' })
  valorTotalMultas: number;

  @ApiProperty({ example: 30000.00, description: 'Valor total pago' })
  valorTotalPago: number;

  @ApiProperty({ example: 20000.00, description: 'Valor pendente' })
  valorPendente: number;

  @ApiProperty({ example: 600, description: 'Quantidade de multas pagas' })
  multasPagas: number;

  @ApiProperty({ example: 300, description: 'Quantidade de multas pendentes' })
  multasPendentes: number;

  @ApiProperty({ example: 50, description: 'Quantidade de multas vencidas' })
  multasVencidas: number;

  @ApiProperty({ example: 20, description: 'Quantidade de multas com recurso' })
  multasComRecurso: number;

  @ApiProperty({ example: 10, description: 'Quantidade de multas anistiadas' })
  multasAnistiadas: number;

  @ApiProperty({ example: 50.00, description: 'Valor médio das multas' })
  mediaValorMulta: number;

  @ApiProperty({ 
    type: [Object], 
    description: 'Top 10 infrações mais frequentes',
    example: [
      {
        codigoinfra: '50610',
        descricaoinfra: 'Excesso de velocidade',
        quantidade: 150,
        valorTotal: 45000.00
      }
    ]
  })
  infracoesFrequentes: Array<{
    codigoinfra: string;
    descricaoinfra: string;
    quantidade: number;
    valorTotal: number;
  }>;

  @ApiProperty({ 
    type: [Object], 
    description: 'Top 10 veículos com mais multas',
    example: [
      {
        codigoveic: 123,
        prefixoveic: 'V001',
        placaatualveic: 'ABC-1234',
        quantidade: 25,
        valorTotal: 7500.00
      }
    ]
  })
  veiculosComMaisMultas: Array<{
    codigoveic: number;
    prefixoveic: string;
    placaatualveic: string;
    quantidade: number;
    valorTotal: number;
  }>;

  @ApiProperty({ 
    type: [Object], 
    description: 'Distribuição por mês',
    example: [
      {
        mes: '2024-01',
        quantidade: 100,
        valorTotal: 15000.00
      }
    ]
  })
  distribuicaoPorMes?: Array<{
    mes: string;
    quantidade: number;
    valorTotal: number;
  }>;

  @ApiProperty({ 
    type: [Object], 
    description: 'Distribuição por responsável',
    example: [
      {
        responsavel: 'M',
        descricao: 'Motorista',
        quantidade: 800,
        valorTotal: 40000.00
      }
    ]
  })
  distribuicaoPorResponsavel?: Array<{
    responsavel: string;
    descricao: string;
    quantidade: number;
    valorTotal: number;
  }>;
}

// ✅ DTOs PARA VALIDAÇÃO (SEM @ApiQuery nas propriedades)
export class MultaFiltersDto implements MultaFilters {
  @IsOptional()
  @IsString()
  numeroaimulta?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoveic?: number;

  @IsOptional()
  @IsString()
  codigoinfra?: string;

  @IsOptional()
  @IsDateString()
  dataEmissaoInicio?: Date;

  @IsOptional()
  @IsDateString()
  dataEmissaoFim?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  valorMinimo?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  valorMaximo?: number;

  @IsOptional()
  @IsString()
  responsavelmulta?: string;

  @IsOptional()
  @IsString()
  numeroprocesso?: string;

  @IsOptional()
  @IsString()
  autodeinfracao?: string;

  @IsOptional()
  @IsString()
  placaVeiculo?: string;

  @IsOptional()
  @IsString()
  prefixoVeiculo?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoempresa?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoga?: number;

  @IsOptional()
  @IsEnum(['PAGA', 'PENDENTE', 'VENCIDA', 'EM_RECURSO', 'ANISTIADA'])
  situacao?: 'PAGA' | 'PENDENTE' | 'VENCIDA' | 'EM_RECURSO' | 'ANISTIADA';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  temRecurso?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  cod_agente_autuador?: number;

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

// ✅ DTO PARA BUSCA AVANÇADA
class BuscaAvancadaDto {
  @ApiProperty({ 
    type: [String], 
    required: false, 
    description: 'Lista de números AI das multas',
    example: ['AI123456789', 'AI987654321']
  })
  @IsOptional()
  numeroaimulta?: string[];

  @ApiProperty({ 
    type: [Number], 
    required: false, 
    description: 'Lista de códigos de veículos',
    example: [123, 456, 789]
  })
  @IsOptional()
  codigosveic?: number[];

  @ApiProperty({ 
    type: [String], 
    required: false, 
    description: 'Lista de códigos de infrações',
    example: ['50610', '50620', '50630']
  })
  @IsOptional()
  codigosinfracao?: string[];

  @ApiProperty({ 
    type: [Number], 
    required: false, 
    description: 'Lista de códigos de empresas',
    example: [1, 2, 3]
  })
  @IsOptional()
  empresas?: number[];

  @ApiProperty({ 
    type: [Number], 
    required: false, 
    description: 'Lista de códigos de garagens',
    example: [10, 20, 30]
  })
  @IsOptional()
  garagens?: number[];

  @ApiProperty({ 
    type: [Number], 
    required: false, 
    description: 'Lista de códigos de agentes autuadores',
    example: [100, 200, 300]
  })
  @IsOptional()
  agentes?: number[];

  @ApiProperty({ 
    required: false, 
    type: String, 
    format: 'date',
    description: 'Data início de emissão',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  dataEmissaoInicio?: Date;

  @ApiProperty({ 
    required: false, 
    type: String, 
    format: 'date',
    description: 'Data fim de emissão',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  dataEmissaoFim?: Date;

  @ApiProperty({ 
    required: false, 
    type: Number,
    description: 'Valor mínimo da multa',
    example: 100.00
  })
  @IsOptional()
  @IsNumber()
  valorMinimo?: number;

  @ApiProperty({ 
    required: false, 
    type: Number,
    description: 'Valor máximo da multa',
    example: 1000.00
  })
  @IsOptional()
  @IsNumber()
  valorMaximo?: number;

  @ApiProperty({ 
    type: [String], 
    required: false, 
    enum: ['PAGA', 'PENDENTE', 'VENCIDA', 'EM_RECURSO', 'ANISTIADA'],
    description: 'Lista de situações das multas',
    example: ['PENDENTE', 'VENCIDA']
  })
  @IsOptional()
  situacoes?: ('PAGA' | 'PENDENTE' | 'VENCIDA' | 'EM_RECURSO' | 'ANISTIADA')[];

  @ApiProperty({ 
    required: false, 
    type: Boolean,
    description: 'Filtrar por multas com recurso',
    example: true
  })
  @IsOptional()
  temRecurso?: boolean;

  @ApiProperty({ 
    required: false, 
    type: Number,
    description: 'Página',
    example: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ 
    required: false, 
    type: Number,
    description: 'Limite por página',
    example: 50,
    default: 50
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ 
    required: false, 
    type: String,
    description: 'Campo para ordenação',
    example: 'dataemissaomulta',
    default: 'dataemissaomulta'
  })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiProperty({ 
    required: false, 
    enum: ['ASC', 'DESC'],
    description: 'Direção da ordenação',
    example: 'DESC',
    default: 'DESC'
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC';
}

@ApiTags('DVS - Multas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('juridico/multas')
export class DvsMultaController {
  constructor(private readonly multaService: DvsMultaService) {}

  // ✅ LISTAR TODAS AS MULTAS
  @Get()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Listar multas com filtros',
    description: 'Retorna lista paginada de multas com filtros avançados'
  })
  @ApiQuery({ name: 'numeroaimulta', required: false, type: String, description: 'Número do AI da multa' })
  @ApiQuery({ name: 'codigoveic', required: false, type: Number, description: 'Código do veículo' })
  @ApiQuery({ name: 'codigoinfra', required: false, type: String, description: 'Código da infração' })
  @ApiQuery({ name: 'dataEmissaoInicio', required: false, type: String, description: 'Data início emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataEmissaoFim', required: false, type: String, description: 'Data fim emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'valorMinimo', required: false, type: Number, description: 'Valor mínimo da multa' })
  @ApiQuery({ name: 'valorMaximo', required: false, type: Number, description: 'Valor máximo da multa' })
  @ApiQuery({ name: 'responsavelmulta', required: false, type: String, description: 'Responsável pela multa (E=Empresa, M=Motorista)' })
  @ApiQuery({ name: 'numeroprocesso', required: false, type: String, description: 'Número do processo' })
  @ApiQuery({ name: 'autodeinfracao', required: false, type: String, description: 'Auto de infração' })
  @ApiQuery({ name: 'placaVeiculo', required: false, type: String, description: 'Placa do veículo' })
  @ApiQuery({ name: 'prefixoVeiculo', required: false, type: String, description: 'Prefixo do veículo' })
  @ApiQuery({ name: 'codigoempresa', required: false, type: Number, description: 'Código da empresa' })
  @ApiQuery({ name: 'codigoga', required: false, type: Number, description: 'Código da garagem' })
  @ApiQuery({ name: 'situacao', required: false, enum: ['PAGA', 'PENDENTE', 'VENCIDA', 'EM_RECURSO', 'ANISTIADA'], description: 'Situação da multa' })
  @ApiQuery({ name: 'temRecurso', required: false, type: Boolean, description: 'Tem recurso (true/false)' })
  @ApiQuery({ name: 'cod_agente_autuador', required: false, type: Number, description: 'Código do agente autuador' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de multas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { 
          type: 'array', 
          items: { $ref: getSchemaPath(MultaDetalhadaResponseDto) }
        },
        pagination: { 
          type: 'object', 
          properties: { 
            page: { type: 'number' }, 
            limit: { type: 'number' }, 
            total: { type: 'number' }, 
            totalPages: { type: 'number' } 
          } 
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filters: MultaFiltersDto) {
    try {
      const resultado = await this.multaService.findAll(filters);
      return {
        success: true,
        ...resultado
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar multas: ${error.message}`);
    }
  }

  // ✅ BUSCAR MULTA POR ID
  @Get(':numeroaimulta')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar multa por número AI',
    description: 'Retorna detalhes completos de uma multa específica'
  })
  @ApiParam({ 
    name: 'numeroaimulta', 
    type: String,
    description: 'Número do AI da multa',
    example: 'AI123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Multa encontrada com sucesso',
    type: MultaDetalhadaResponseDto
  })
  @ApiResponse({ status: 404, description: 'Multa não encontrada' })
  async findOne(@Param('numeroaimulta') numeroaimulta: string) {
    if (!numeroaimulta || numeroaimulta.trim().length === 0) {
      throw new BadRequestException('Número do AI da multa é obrigatório');
    }
    try {
      const multa = await this.multaService.findOne(numeroaimulta.trim());
      return {
        success: true,
        data: multa
      };
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(`Erro ao buscar multa: ${error.message}`);
    }
  }

  // ✅ BUSCAR MULTAS POR VEÍCULO
  @Get('veiculo/:codigoveic')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar multas por veículo',
    description: 'Retorna todas as multas de um veículo específico'
  })
  @ApiParam({ 
    name: 'codigoveic', 
    type: Number,
    description: 'Código do veículo',
    example: 12345
  })
  @ApiQuery({ name: 'situacao', required: false, enum: ['PAGA', 'PENDENTE', 'VENCIDA', 'EM_RECURSO', 'ANISTIADA'], description: 'Situação da multa' })
  @ApiQuery({ name: 'temRecurso', required: false, type: Boolean, description: 'Tem recurso (true/false)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Multas do veículo retornadas com sucesso',
    type: [MultaDetalhadaResponseDto]
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByVeiculo(
    @Param('codigoveic', ParseIntPipe) codigoveic: number,
    @Query() filters: MultaFiltersDto
  ) {
    try {
      const multas = await this.multaService.findByVeiculo(codigoveic, filters);
      return {
        success: true,
        data: multas,
        meta: {
          codigoveic,
          total: multas.length,
          filtros: filters
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar multas do veículo: ${error.message}`);
    }
  }

  // ✅ BUSCAR MULTAS POR INFRAÇÃO
  @Get('infracao/:codigoinfra')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar multas por infração',
    description: 'Retorna todas as multas de uma infração específica'
  })
  @ApiParam({ 
    name: 'codigoinfra', 
    type: String,
    description: 'Código da infração',
    example: '50610'
  })
  @ApiQuery({ name: 'situacao', required: false, enum: ['PAGA', 'PENDENTE', 'VENCIDA', 'EM_RECURSO', 'ANISTIADA'], description: 'Situação da multa' })
  @ApiQuery({ name: 'temRecurso', required: false, type: Boolean, description: 'Tem recurso (true/false)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Multas da infração retornadas com sucesso',
    type: [MultaDetalhadaResponseDto]
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByInfracao(
    @Param('codigoinfra') codigoinfra: string,
    @Query() filters: MultaFiltersDto
  ) {
    if (!codigoinfra || codigoinfra.trim().length === 0) {
      throw new BadRequestException('Código da infração é obrigatório');
    }
    try {
      const multas = await this.multaService.findByInfracao(codigoinfra.trim(), filters);
      return {
        success: true,
        data: multas,
        meta: {
          codigoinfra: codigoinfra.trim(),
          total: multas.length,
          filtros: filters
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar multas da infração: ${error.message}`);
    }
  }

  // ✅ ESTATÍSTICAS GERAIS
  @Get('stats/geral')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Estatísticas gerais de multas',
    description: 'Retorna estatísticas consolidadas do sistema de multas'
  })
  @ApiQuery({ name: 'dataEmissaoInicio', required: false, type: String, description: 'Data início emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataEmissaoFim', required: false, type: String, description: 'Data fim emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'responsavelmulta', required: false, type: String, description: 'Responsável pela multa (E=Empresa, M=Motorista)' })
  @ApiQuery({ name: 'codigoveic', required: false, type: Number, description: 'Código do veículo' })
  @ApiQuery({ name: 'codigoinfra', required: false, type: String, description: 'Código da infração' })
  @ApiQuery({ name: 'cod_agente_autuador', required: false, type: Number, description: 'Código do agente autuador' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas retornadas com sucesso',
    type: MultaStatsResponseDto
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getStats(@Query() filters: MultaFiltersDto) {
    try {
      const estatisticas = await this.multaService.getStats(filters);
      return {
        success: true,
        data: estatisticas,
        meta: {
          filtros: filters,
          geradoEm: new Date()
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar estatísticas: ${error.message}`);
    }
  }

  // ✅ MULTAS VENCIDAS
  @Get('situacao/vencidas')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Listar multas vencidas',
    description: 'Retorna todas as multas com vencimento em atraso'
  })
  @ApiQuery({ name: 'dataEmissaoInicio', required: false, type: String, description: 'Data início emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataEmissaoFim', required: false, type: String, description: 'Data fim emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'codigoveic', required: false, type: Number, description: 'Código do veículo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Multas vencidas retornadas com sucesso',
    type: [MultaDetalhadaResponseDto]
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMultasVencidas(@Query() filters: MultaFiltersDto) {
    try {
      const multasVencidas = await this.multaService.getMultasVencidas(filters);
      return {
        success: true,
        data: multasVencidas,
        meta: {
          total: multasVencidas.length,
          filtros: filters,
          criterio: 'dataVencimento < hoje'
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar multas vencidas: ${error.message}`);
    }
  }

  // ✅ MULTAS EM RECURSO
  @Get('situacao/recurso')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Listar multas em recurso',
    description: 'Retorna todas as multas que possuem recurso ativo'
  })
  @ApiQuery({ name: 'dataEmissaoInicio', required: false, type: String, description: 'Data início emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataEmissaoFim', required: false, type: String, description: 'Data fim emissão (YYYY-MM-DD)' })
  @ApiQuery({ name: 'codigoveic', required: false, type: Number, description: 'Código do veículo' })
  @ApiResponse({ 
    status: 200, 
    description: 'Multas em recurso retornadas com sucesso',
    type: [MultaDetalhadaResponseDto]
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMultasEmRecurso(@Query() filters: MultaFiltersDto) {
    try {
      const multasEmRecurso = await this.multaService.getMultasEmRecurso(filters);
      return {
        success: true,
        data: multasEmRecurso,
        meta: {
          total: multasEmRecurso.length,
          filtros: filters,
          criterio: 'recuso = "S"'
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar multas em recurso: ${error.message}`);
    }
  }

  // ✅ RELATÓRIO POR PERÍODO
  @Get('relatorio/periodo')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Relatório de multas por período',
    description: 'Gera relatório detalhado de multas em um período específico'
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
    description: 'Relatório gerado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            periodo: { 
              type: 'object', 
              properties: { 
                inicio: { type: 'string', format: 'date' }, 
                fim: { type: 'string', format: 'date' } 
              } 
            },
            multas: { 
              type: 'array', 
              items: { $ref: getSchemaPath(MultaDetalhadaResponseDto) }
            },
            estatisticas: { $ref: getSchemaPath(MultaStatsResponseDto) }
          }
        },
        meta: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Período inválido' })
  async getRelatorioPorPeriodo(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string
  ) {
    if (!dataInicio || !dataFim) {
      throw new BadRequestException('Data início e data fim são obrigatórias para o relatório.');
    }
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      throw new BadRequestException('Datas inválidas. Use o formato YYYY-MM-DD.');
    }
    if (inicio > fim) {
      throw new BadRequestException('Data início deve ser anterior à data fim.');
    }
    
    try {
      const relatorio = await this.multaService.getRelatorioPorPeriodo(inicio, fim);
      return {
        success: true,
        data: relatorio,
        meta: {
          periodo: { inicio, fim },
          geradoEm: new Date()
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar relatório por período: ${error.message}`);
    }
  }

  // ✅ DASHBOARD - RESUMO EXECUTIVO
  @Get('dashboard/resumo')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Dashboard - Resumo executivo',
    description: 'Retorna dados consolidados para dashboard executivo'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumo executivo retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            geral: { $ref: getSchemaPath(MultaStatsResponseDto) },
            mesAtual: { $ref: getSchemaPath(MultaStatsResponseDto) },
            alertas: {
              type: 'object',
              properties: {
                multasVencidas: { type: 'number' },
                multasEmRecurso: { type: 'number' },
                valorVencido: { type: 'number' }
              }
            },
            periodo: { 
              type: 'object', 
              properties: { 
                inicio: { type: 'string', format: 'date' }, 
                fim: { type: 'string', format: 'date' } 
              } 
            }
          }
        },
        meta: { type: 'object' }
      }
    }
  })
  async getDashboardResumo() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    try {
      const [statsGeral, statsMes, multasVencidas, multasRecurso] = await Promise.all([
        this.multaService.getStats(),
        this.multaService.getStats({
          dataEmissaoInicio: inicioMes,
          dataEmissaoFim: fimMes,
        }),
        this.multaService.getMultasVencidas(),
        this.multaService.getMultasEmRecurso(),
      ]);

      return {
        success: true,
        data: {
          geral: statsGeral,
          mesAtual: statsMes,
          alertas: {
            multasVencidas: multasVencidas.length,
            multasEmRecurso: multasRecurso.length,
            valorVencido: multasVencidas.reduce((sum, multa) => sum + (multa.valorAtualizadoCalculado || 0), 0),
          },
          periodo: {
            inicio: inicioMes,
            fim: fimMes,
          },
        },
        meta: {
          geradoEm: new Date()
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar dashboard: ${error.message}`);
    }
  }

  // ✅ BUSCA AVANÇADA
  @Post('busca/avancada')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Busca avançada de multas',
    description: 'Permite busca com múltiplos critérios complexos'
  })
  @ApiBody({
    description: 'Critérios de busca avançada',
    type: BuscaAvancadaDto
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Busca realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { 
          type: 'array', 
          items: { $ref: getSchemaPath(MultaDetalhadaResponseDto) }
        },
        pagination: { 
          type: 'object', 
          properties: { 
            page: { type: 'number' }, 
            limit: { type: 'number' }, 
            total: { type: 'number' }, 
            totalPages: { type: 'number' } 
          } 
        }
      }
    }
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async buscaAvancada(@Body() criterios: BuscaAvancadaDto) {
    // ✅ CONVERTER CRITÉRIOS COMPLEXOS PARA MultaFilters
    const filters: MultaFilters = {
      page: criterios.page || 1,
      limit: criterios.limit || 50,
      orderBy: criterios.orderBy || 'dataemissaomulta',
      orderDirection: criterios.orderDirection || 'DESC',
      dataEmissaoInicio: criterios.dataEmissaoInicio,
      dataEmissaoFim: criterios.dataEmissaoFim,
      valorMinimo: criterios.valorMinimo,
      valorMaximo: criterios.valorMaximo,
      temRecurso: criterios.temRecurso,
      // Para campos que são arrays no body mas strings/numbers no filter, pegar o primeiro elemento
      numeroaimulta: criterios.numeroaimulta?.length ? String(criterios.numeroaimulta[0]) : undefined,
      codigoveic: criterios.codigosveic?.length ? criterios.codigosveic[0] : undefined,
      codigoinfra: criterios.codigosinfracao?.length ? String(criterios.codigosinfracao[0]) : undefined,
      codigoempresa: criterios.empresas?.length ? criterios.empresas[0] : undefined,
      codigoga: criterios.garagens?.length ? criterios.garagens[0] : undefined,
      cod_agente_autuador: criterios.agentes?.length ? criterios.agentes[0] : undefined,
      situacao: criterios.situacoes?.length ? criterios.situacoes[0] : undefined,
    };

    try {
      const resultado = await this.multaService.findAll(filters);
      return {
        success: true,
        ...resultado
      };
    } catch (error) {
      throw new BadRequestException(`Erro na busca avançada: ${error.message}`);
    }
  }
}