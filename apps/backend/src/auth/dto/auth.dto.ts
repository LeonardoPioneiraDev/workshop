// apps/backend/src/auth/dto/auth.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsNotEmpty, 
  MinLength, 
  MaxLength,
  Matches,
  IsEnum,
  IsOptional
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @ApiProperty({ description: 'Nome de usuário ou email' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ValidateTemporaryDto {
  @ApiProperty({ description: 'Nome de usuário' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Senha temporária' })
  @IsString()
  @IsNotEmpty()
  temporaryPassword: string;
}

export class FirstLoginDto {
  @ApiProperty({ description: 'Nome de usuário' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Senha temporária' })
  @IsString()
  @IsNotEmpty()
  temporaryPassword: string;

  @ApiProperty({ description: 'Nova senha', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'
  })
  newPassword: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'Nome de usuário', minLength: 3, maxLength: 50 })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username deve conter apenas letras, números, pontos, hífens e underscores'
  })
  username: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'
  })
  password: string;

  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Cargo/Posição' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Role do usuário', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'Nova senha', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'
  })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email para reset de senha' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de reset' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Nova senha', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'
  })
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Token de acesso' })
  access_token: string;

  @ApiProperty({ description: 'Token de refresh' })
  refresh_token: string;

  @ApiProperty({ description: 'Tipo do token' })
  token_type: string;

  @ApiProperty({ description: 'Tempo de expiração em segundos' })
  expires_in: number;

  @ApiProperty({ description: 'Dados do usuário' })
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    department?: string;
    position?: string;
    isActive: boolean;
    mustChangePassword?: boolean;
    isTemporaryPassword?: boolean;
    emailVerified?: boolean;
    lastLogin?: Date;
    permissions: string[];
  };

  @ApiPropertyOptional({ description: 'Se precisa trocar senha' })
  needsPasswordChange?: boolean;

  @ApiProperty({ description: 'Mensagem de resposta' })
  message: string;
}