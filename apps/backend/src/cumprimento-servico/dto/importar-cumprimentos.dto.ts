import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ImportarCumprimentosDto {
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'O campo "dia" deve estar no formato yyyy-mm-dd' })
  dia: string;

  @IsOptional()
  @IsString()
  idservico?: string;

  @IsOptional()
  @IsString()
  idempresa?: string;

  @IsOptional()
  @IsString()
  numerolinha?: string;

  @IsOptional()
  @IsString()
  prefixoprevisto?: string;

  @IsOptional()
  @IsString()
  prefixorealizado?: string; // Adicionar este campo

  @IsOptional()
  @IsString()
  statusini?: string;

  @IsOptional()
  @IsString()
  statusfim?: string;
}