// apps/backend/src/auth/dto/first-login.dto.ts
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirstLoginDto {
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

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'MinhaNovaSenh@123'
  })
  @IsString({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'
  })
  newPassword: string;
}