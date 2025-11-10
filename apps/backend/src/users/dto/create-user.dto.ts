// apps/backend/src/users/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum'; // ✅ MUDANÇA: Importar Role diretamente

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'joao.silva',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username deve conter apenas letras, números, pontos, hífens e underscores',
  })
  username: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@empresa.com',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João da Silva Santos',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Departamento do usuário',
    example: 'Tecnologia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({
    description: 'Cargo/Posição do usuário',
    example: 'Desenvolvedor Senior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiProperty({
    description: 'Role/Permissão do usuário',
    enum: Role, // ✅ MUDANÇA: UserRole → Role
    example: Role.USUARIO, // ✅ MUDANÇA: UserRole.USER → Role.USUARIO
  })
  @IsEnum(Role) // ✅ MUDANÇA: UserRole → Role
  role: Role; // ✅ MUDANÇA: UserRole → Role

  @ApiPropertyOptional({
    description: 'Se o usuário está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Se deve enviar email de boas-vindas',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  sendWelcomeEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Observações sobre o usuário',
    example: 'Usuário temporário para projeto específico',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}