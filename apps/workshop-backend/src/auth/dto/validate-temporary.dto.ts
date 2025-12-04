// apps/backend/src/auth/dto/validate-temporary.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTemporaryDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@vpioneira.com.br'
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha temporária recebida por email',
    example: 'TempPass123!'
  })
  @IsString({ message: 'Senha temporária é obrigatória' })
  @MinLength(1, { message: 'Senha temporária não pode estar vazia' })
  temporaryPassword: string;
}