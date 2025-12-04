import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SyncMultasDto {
    @ApiPropertyOptional({ description: 'Data inicial para sincronização (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dataInicio?: string;

    @ApiPropertyOptional({ description: 'Data final para sincronização (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dataFim?: string;
}
