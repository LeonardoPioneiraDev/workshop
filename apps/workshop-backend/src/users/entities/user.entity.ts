// apps/backend/src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
// ✅ IMPORTAR O ENUM ATUALIZADO E AS PERMISSÕES
import { Role, RolePermissions, obterNivelRole } from '../../common/enums/role.enum'; // ✅ MUDANÇA: getRoleLevel → obterNivelRole

// ✅ USAR O ENUM GLOBAL Role para evitar duplicação
export { Role as UserRole }; 

@Entity('users')
@Index('idx_users_username', ['username'])
@Index('idx_users_email', ['email'])
@Index('idx_users_role', ['role'])
@Index('idx_users_isactive', ['isActive'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({
    type: 'enum',
    enum: Role, // ✅ Usar o Role do enum global
    default: Role.USUARIO, // ✅ MUDANÇA: Role.USER → Role.USUARIO
  })
  role: Role; // ✅ Usar o Role do enum global

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  // ===============================================
  // 📧 CAMPOS DE RESET DE SENHA
  // ===============================================
  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @Column({ name: 'temporary_password', nullable: true })
  temporaryPassword?: string;

  @Column({ name: 'temporary_password_expires', type: 'timestamp', nullable: true })
  temporaryPasswordExpires?: Date;

  @Column({ name: 'is_temporary_password', default: false })
  isTemporaryPassword?: boolean;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword?: boolean;

  @Column({ name: 'last_password_change', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastPasswordChange?: Date;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts?: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ name: 'email_verified', default: false })
  emailVerified?: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===============================================
  // 🔧 MÉTODOS AUXILIARES ATUALIZADOS
  // ===============================================
  get permissions(): string[] {
    // ✅ BUSCAR PERMISSÕES DO MAPA GLOBAL RolePermissions
    return RolePermissions[this.role] || [];
  }

  get isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  get isDirector(): boolean {
    return this.role === Role.DIRETOR;
  }

  get isGerente(): boolean {
    return this.role === Role.GERENTE;
  }

  get isEncarregado(): boolean {
    return this.role === Role.ENCARREGADO;
  }

  get isCoordenador(): boolean {
    return this.role === Role.COORDENADOR;
  }

  get isSupervisor(): boolean {
    return this.role === Role.SUPERVISOR;
  }

  get isAnalista(): boolean {
    return this.role === Role.ANALISTA;
  }

  get isOperator(): boolean {
    return this.role === Role.OPERADOR;
  }

  get canManageUsers(): boolean {
    return obterNivelRole(this.role) >= obterNivelRole(Role.GERENTE); // ✅ MUDANÇA: getRoleLevel → obterNivelRole
  }

  get canAccessOracle(): boolean {
    return obterNivelRole(this.role) >= obterNivelRole(Role.OPERADOR); // ✅ MUDANÇA: getRoleLevel → obterNivelRole
  }

  get canViewReports(): boolean {
    return obterNivelRole(this.role) >= obterNivelRole(Role.ENCARREGADO); // ✅ MUDANÇA: getRoleLevel → obterNivelRole
  }

  get canViewLogs(): boolean {
    return obterNivelRole(this.role) >= obterNivelRole(Role.DIRETOR); // ✅ MUDANÇA: getRoleLevel → obterNivelRole
  }

  get isPasswordExpired(): boolean {
    if (!this.isTemporaryPassword || !this.temporaryPasswordExpires) {
      return false;
    }
    return new Date() > this.temporaryPasswordExpires;
  }

  get isResetTokenExpired(): boolean {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
      return true;
    }
    return new Date() > this.passwordResetExpires;
  }

  isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  isPasswordResetTokenValid(): boolean {
    return this.passwordResetToken && 
           this.passwordResetExpires && 
           this.passwordResetExpires > new Date();
  }

  isTemporaryPasswordValid(): boolean {
    return this.isTemporaryPassword && 
           this.temporaryPasswordExpires && 
           this.temporaryPasswordExpires > new Date();
  }

  clearResetData(): void {
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
    this.temporaryPassword = null;
    this.temporaryPasswordExpires = null;
    this.isTemporaryPassword = false;
    this.mustChangePassword = false;
  }
}