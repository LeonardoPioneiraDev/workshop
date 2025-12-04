// apps/backend/src/auth/dto/validate-reset-token.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateResetTokenDto {
  @ApiProperty({ 
    description: 'Token de recuperação para validação',
    example: 'abc123def456...'
  })
  @IsString({ message: 'Token deve ser uma string' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;
}