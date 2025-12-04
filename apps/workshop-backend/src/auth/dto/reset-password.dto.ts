// apps/backend/src/auth/dto/reset-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ 
    description: 'Token de recuperação recebido por email',
    example: 'abc123def456...'
  })
  @IsString({ message: 'Token deve ser uma string' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;

  @ApiProperty({ 
    description: 'Nova senha do usuário',
    example: 'MinhaNovaSenh@123'
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo especial' }
  )
  newPassword: string;
}