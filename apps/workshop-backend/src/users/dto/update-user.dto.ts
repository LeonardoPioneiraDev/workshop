// apps/backend/src/users/dto/update-user.dto.ts
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsDate, IsString, IsBoolean, IsEmail } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Email do usuário' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Tentativas de login falhadas' })
  @IsOptional()
  @IsNumber()
  failedLoginAttempts?: number;

  @ApiPropertyOptional({ description: 'Data até quando a conta está bloqueada' })
  @IsOptional()
  @IsDate()
  lockedUntil?: Date;

  @ApiPropertyOptional({ description: 'Data do último login' })
  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;

  @ApiPropertyOptional({ description: 'IP do último login' })
  @IsOptional()
  @IsString()
  lastLoginIp?: string;

  @ApiPropertyOptional({ description: 'Se o email foi verificado' })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Se deve trocar a senha no próximo login' })
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}