// apps/backend/src/users/dto/admin-change-password.dto.ts
import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminChangePasswordDto {
  @ApiProperty({
    description: 'Nova senha para o usuário',
    example: 'NovaSenh@123'
  })
  @IsString({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'
  })
  newPassword: string;
}