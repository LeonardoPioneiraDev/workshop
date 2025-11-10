// apps/backend/src/modules/departamentos/juridico/dto/multa-completa-filter.dto.ts

import { IsOptional, IsString, IsDateString, IsNumber, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class MultaCompletaFilterDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  prefixoVeic?: string;

  @IsOptional()
  @IsString()
  numeroAiMulta?: string;

  @IsOptional()
  @IsString()
  codigoVeic?: string;

  @IsOptional()
  @IsString()
  codigoInfra?: string;

  @IsOptional()
  @IsString()
  agenteCodigo?: string;

  @IsOptional()
  @IsString()
  agenteDescricao?: string;

  @IsOptional()
  @IsString()
  localMulta?: string;

  @IsOptional()
  @IsString()
  responsavelMulta?: string;

  @IsOptional()
  @IsString()
  situacao?: string; // 'paga', 'vencida', 'recurso', 'pendente'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorMinimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorMaximo?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  gruposInfracao?: string[];

  @IsOptional()
  @IsString()
  busca?: string; // busca geral

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;

  @IsOptional()
  @IsString()
  orderBy?: string = 'dataEmissaoMulta';

  @IsOptional()
  @IsString()
  orderDirection?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  groupBy?: string; // 'agente', 'veiculo', 'infracao', 'mes', 'dia'
}