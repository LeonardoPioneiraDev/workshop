// src/modules/departamentos/operacoes/dto/filtros-acidentes.dto.ts
import { IsOptional, IsString, IsDateString, IsNumber, IsEnum, Allow } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum GrauAcidente {
  COM_VITIMAS = 'COM VÍTIMAS',
  SEM_VITIMAS = 'SEM VÍTIMAS',
  TODOS = 'TODOS'
}

export enum StatusProcesso {
  ABERTO = 'ABERTO',
  FECHADO = 'FECHADO',
  EM_ANDAMENTO = 'EM ANDAMENTO',
  TODOS = 'TODOS'
}

export class FiltrosAcidentesDto {
  @ApiPropertyOptional({ description: 'Data início (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ description: 'Data fim (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional({ enum: GrauAcidente, default: GrauAcidente.TODOS })
  @IsOptional()
  @IsEnum(GrauAcidente)
  grauAcidente?: GrauAcidente = GrauAcidente.TODOS;

  @ApiPropertyOptional({ enum: StatusProcesso, default: StatusProcesso.TODOS })
  @IsOptional()
  @IsEnum(StatusProcesso)
  statusProcesso?: StatusProcesso = StatusProcesso.TODOS;

  @ApiPropertyOptional({ description: 'Garagem específica' })
  @IsOptional()
  @IsString()
  garagem?: string;

  @ApiPropertyOptional({ description: 'Prefixo do veículo' })
  @IsOptional()
  @IsString()
  prefixoVeiculo?: string;

  @ApiPropertyOptional({ description: 'Município' })
  @IsOptional()
  @IsString()
  municipio?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({ description: 'Turno' })
  @IsOptional()
  @IsString()
  turno?: string;

  @ApiPropertyOptional({ description: 'Ano', type: Number })
  @IsOptional()
  @IsNumber()
  ano?: number;

  @ApiPropertyOptional({ description: 'Mês', type: Number })
  @IsOptional()
  @IsNumber()
  mes?: number;

  @ApiPropertyOptional({ description: 'Forçar nova sincronização', default: false })
  @IsOptional()
  forcarSincronizacao?: boolean = false;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 5000 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 5000;

  // Permite parâmetros extras do frontend sem validação
  @Allow()
  params?: any;
}