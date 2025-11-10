// src/modules/departamentos/manutencao/dto/filtros-os.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosOSDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  origens?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  garagens?: number[];

  @IsOptional()
  @Type(() => Number)
  setor_codigo?: number;

  @IsOptional()
  @IsString()
  setor?: string;

  @IsOptional()
  @IsString()
  prefixo?: string;

  @IsOptional()
  @IsString()
  numeroOS?: string;

  @IsOptional()
  @IsString()
  numero_os?: string;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  tipoOS?: string;

  @IsOptional()
  @IsString()
  condicaoOS?: string;

  @IsOptional()
  @IsString()
  garagem?: string;

  @IsOptional()
  @IsString()
  tipoProblema?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  forcarSincronizacao?: boolean;
}
