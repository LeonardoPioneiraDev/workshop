// apps/backend/src/users/dto/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'ID único do usuário' })
  id: string;

  @ApiProperty({ description: 'Nome de usuário' })
  username: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome completo' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  department?: string;

  @ApiPropertyOptional({ description: 'Cargo/Posição' })
  position?: string;

  @ApiProperty({ description: 'Role/Permissão', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Se o usuário está ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Se o email foi verificado' })
  emailVerified: boolean;

  @ApiProperty({ description: 'Se deve trocar a senha' })
  mustChangePassword: boolean;

  @ApiPropertyOptional({ description: 'Último login' })
  lastLogin?: Date;

  @ApiPropertyOptional({ description: 'Observações' })
  notes?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({ description: 'Permissões do usuário', type: [String] })
  permissions: string[];
}