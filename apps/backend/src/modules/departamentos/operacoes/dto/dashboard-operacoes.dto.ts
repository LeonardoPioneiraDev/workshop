// src/modules/departamentos/operacoes/dto/dashboard-operacoes.dto.ts
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DashboardOperacoesDto {
  @ApiPropertyOptional({ description: 'Ano para filtrar (ex: 2025)', minimum: 2020, maximum: 2030 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2030)
  ano?: number;

  @ApiPropertyOptional({ description: 'Mês para filtrar (1-12)', minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  mes?: number;

  @ApiPropertyOptional({ description: 'Garagem específica para filtrar' })
  @IsOptional()
  @IsString()
  garagem?: string;

  @ApiPropertyOptional({ description: 'Incluir dados históricos', default: false })
  @IsOptional()
  incluirHistorico?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir tendências', default: true })
  @IsOptional()
  incluirTendencias?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir recomendações', default: true })
  @IsOptional()
  incluirRecomendacoes?: boolean = true;
}

export class FiltrosPeriodoDto {
  @ApiPropertyOptional({ description: 'Data início (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @ApiPropertyOptional({ description: 'Data fim (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dataFim?: string;

  @ApiPropertyOptional({ description: 'Ano' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ano?: number;

  @ApiPropertyOptional({ description: 'Mês' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mes?: number;
}

export class KPIsOperacionaisDto {
  indiceSinistralidade: number;
  custoMedioAcidente: number;
  percentualAcidentesComVitimas: number;
  eficienciaOperacional: number;
  veiculosDisponiveis: number;
  totalVeiculos: number;
  percentualDisponibilidade: number;
}

export class ResumoExecutivoDto {
  frotaTotal: number;
  frotaAtiva: number;
  percentualDisponibilidade: number;
  totalAcidentes: number;
  indiceSinistralidade: number;
  custoTotalDanos: number;
}