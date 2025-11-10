// src/modules/departamentos/operacoes/dto/filtros-frota.dto.ts
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Allow } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum StatusVeiculo {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  TODOS = 'TODOS'
}

export class FiltrosFrotaDto {
  @ApiPropertyOptional({ enum: StatusVeiculo, default: StatusVeiculo.TODOS })
  @IsOptional()
  @IsEnum(StatusVeiculo)
  status?: StatusVeiculo = StatusVeiculo.TODOS;

  @ApiPropertyOptional({ description: 'Garagem específica' })
  @IsOptional()
  @IsString()
  garagem?: string;

  @ApiPropertyOptional({ description: 'Prefixo do veículo' })
  @IsOptional()
  @IsString()
  prefixo?: string;

  @ApiPropertyOptional({ description: 'Placa do veículo' })
  @IsOptional()
  @IsString()
  placa?: string;

  @ApiPropertyOptional({ description: 'Tipo de veículo' })
  @IsOptional()
  @IsString()
  tipoVeiculo?: string;

  @ApiPropertyOptional({ description: 'Data de sincronização (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dataSincronizacao?: string;

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