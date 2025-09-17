// src/cumprimento-servico/dto/filtrosdto/filters.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosDTO {
  @IsOptional()
  @IsString()
  motorista?: string;

  @IsOptional()
  @IsString()
  linha?: string;

  @IsOptional()
  @IsString()
  sentido?: string;

  @IsOptional()
  @IsString()
  setor?: string;

  @IsOptional()
  @IsString()
  pontoInicial?: string;

  @IsOptional()
  @IsString()
  pontoFinal?: string;

  @IsOptional()
  @IsString()
  prefixoprevisto?: string;

  @IsOptional()
  @IsString()
  prefixorealizado?: string;
  
  // Adicionar suporte a paginação
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}