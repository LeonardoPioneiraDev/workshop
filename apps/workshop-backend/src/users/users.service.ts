// apps/backend/src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { EmailService } from '../email/email.service';
// ✅ IMPORTAR FUNÇÕES DO ENUM ATUALIZADO
import { Role, getRoleLevel } from '../common/enums/role.enum';

export interface UserFilters {
  search?: string;
  department?: string;
  position?: string;
  role?: Role; // ✅ USAR Role em vez de UserRole
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface LoginAttemptsUpdate {
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}

export interface PasswordUpdateData {
  password: string;
  mustChangePassword: boolean;
  isTemporaryPassword: boolean;
  temporaryPassword: string | null;
  temporaryPasswordExpires: Date | null;
  lastPasswordChange: Date;
  emailVerified?: boolean;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Criar novo usuário com senha temporária
   */
  async create(createUserDto: CreateUserDto, createdBy: string): Promise<UserResponseDto> {
    try {
      console.log('🔍 [USERS] Dados recebidos para criação:', {
        username: createUserDto.username,
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        role: createUserDto.role,
        sendWelcomeEmail: createUserDto.sendWelcomeEmail
      });

      // Verificar se username já existe
      const existingUsername = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Nome de usuário já existe');
      }

      // Verificar se email já existe
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }

      // Gerar senha temporária
      const temporaryPassword = this.generateTemporaryPassword();
      console.log('🔑 [USERS] Senha temporária gerada para:', createUserDto.username);
      
      // Hash da senha temporária
      const saltRounds = this.getSaltRounds();
      console.log('🔐 [USERS] Usando salt rounds (número):', saltRounds, typeof saltRounds);
      
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(temporaryPassword, salt);
      
      console.log('✅ [USERS] Hash da senha gerado com sucesso');

      // Criar usuário com senha temporária
      const user = this.userRepository.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        department: createUserDto.department,
        position: createUserDto.position,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
        mustChangePassword: true,
        isTemporaryPassword: true,
        temporaryPassword: temporaryPassword,
        temporaryPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        notes: createUserDto.notes,
        emailVerified: false,
        lastPasswordChange: new Date(),
      });

      const savedUser = await this.userRepository.save(user);
      console.log('✅ [USERS] Usuário criado com sucesso:', savedUser.username);
      
      // Enviar email de boas-vindas se solicitado
      if (createUserDto.sendWelcomeEmail) {
        try {
          await this.emailService.sendWelcomeEmail(
            savedUser.email,
            savedUser.username,
            temporaryPassword,
            savedUser.fullName
          );
          this.logger.log(`✅ [USERS] E-mail de boas-vindas enviado para: ${savedUser.email}`);
        } catch (emailError) {
          this.logger.error(`❌ [USERS] Erro ao enviar e-mail:`, emailError.message);
          // Não falhar a criação do usuário por erro de e-mail
        }
      }
      
      this.logger.log(`Usuário criado: ${savedUser.username} por ${createdBy}`);
      
      return this.toResponseDto(savedUser);

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('💥 [USERS] Erro ao criar usuário:', error);
      this.logger.error(`Erro ao criar usuário ${createUserDto.username}:`, error);
      throw new BadRequestException('Erro ao criar usuário');
    }
  }

  /**
   * Criar usuário com senha já hasheada (para registro direto)
   */
  async createWithHashedPassword(
    createUserDto: Omit<CreateUserDto, 'password'>, 
    hashedPassword: string,
    createdBy: string
  ): Promise<User> {
    try {
      // Verificar se username já existe
      const existingUsername = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Nome de usuário já existe');
      }

      // Verificar se email já existe
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }

      // Criar usuário com senha já hasheada
      const user = this.userRepository.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        department: createUserDto.department,
        position: createUserDto.position,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
        mustChangePassword: false,
        isTemporaryPassword: false,
        notes: createUserDto.notes,
        emailVerified: true,
        lastPasswordChange: new Date(),
      });

      const savedUser = await this.userRepository.save(user);
      
      this.logger.log(`Usuário criado com senha hasheada: ${savedUser.username} por ${createdBy}`);
      
      return savedUser;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Erro ao criar usuário com senha hasheada ${createUserDto.username}:`, error);
      throw new BadRequestException('Erro ao criar usuário');
    }
  }

  /**
   * Listar usuários com filtros e paginação
   */
  async findAll(filters: UserFilters = {}) {
    try {
      const {
        search,
        department,
        position,
        role,
        isActive,
        page = 1,
        limit = 20,
      } = filters;

      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // Filtros
      if (search) {
        queryBuilder.andWhere(
          '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (department) {
        queryBuilder.andWhere('user.department = :department', { department });
      }

      if (position) {
        queryBuilder.andWhere('user.position = :position', { position });
      }

      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      if (isActive !== undefined) {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive });
      }

      // Paginação
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Ordenação
      queryBuilder.orderBy('user.fullName', 'ASC');

      const [users, total] = await queryBuilder.getManyAndCount();

      return {
        data: users.map(user => this.toResponseDto(user)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };

    } catch (error) {
      this.logger.error('Erro ao buscar usuários:', error);
      throw new BadRequestException('Erro ao buscar usuários');
    }
  }

  /**
   * Buscar usuário por ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ 
      where: { id: parseInt(id) } 
    });
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    
    return this.toResponseDto(user);
  }

  /**
   * Buscar usuário por ID (retorna entidade completa)
   */
  async findById(id: string): Promise<User | null> {
    try {
      this.logger.log(`🔍 [USERS] Buscando usuário por ID: ${id}`);
      
      const user = await this.userRepository.findOne({
        where: { id: parseInt(id) },
      });
      
      if (user) {
        this.logger.log(`✅ [USERS] Usuário encontrado por ID: ${id}`);
      } else {
        this.logger.log(`❌ [USERS] Usuário não encontrado por ID: ${id}`);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`❌ [USERS] Erro ao buscar usuário por ID:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar usuário por username (retorna entidade completa)
   */
  async findByUsername(username: string): Promise<User | null> {
    console.log('🔍 [USERS] Buscando usuário por username:', username);
    
    try {
      const user = await this.userRepository.findOne({
        where: { username }
      });
      
      console.log('👤 [USERS] Resultado da busca:', user ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      if (user) {
        console.log('📊 [USERS] Dados do usuário:', {
          id: user.id,
          username: user.username,
          email: user.email,
          hasPassword: !!user.password,
          passwordLength: user.password?.length || 0,
          isTemporaryPassword: user.isTemporaryPassword,
          mustChangePassword: user.mustChangePassword
        });
      }
      
      return user;
    } catch (error) {
      console.log('💥 [USERS] Erro na busca:', error.message);
      throw error;
    }
  }

  /**
   * Buscar usuário por email (retorna entidade completa)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.log(`🔍 [USERS] Buscando usuário por email: ${email}`);
      
      const user = await this.userRepository.findOne({
        where: { email },
      });
      
      if (user) {
        this.logger.log(`✅ [USERS] Usuário encontrado por email: ${email}`);
      } else {
        this.logger.log(`❌ [USERS] Usuário não encontrado por email: ${email}`);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`❌ [USERS] Erro ao buscar usuário por email:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar usuário por token de reset (retorna entidade completa)
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { passwordResetToken: token } 
    });
  }

  /**
   * Atualizar usuário
   */
  async update(
    id: string, 
    updateUserDto: UpdateUserDto, 
    updatedBy: string,
    currentUser?: User
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Verificar conflitos de email se estiver sendo atualizado
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingEmail = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });
        if (existingEmail && existingEmail.id !== user.id) {
          throw new ConflictException('Email já está em uso');
        }
      }

      // Campos que podem ser atualizados
      const allowedFields = [
        'email',
        'fullName', 
        'phone', 
        'department', 
        'position', 
        'role', 
        'isActive',
        'notes',
        'emailVerified',
        'mustChangePassword',
        'failedLoginAttempts',
        'lockedUntil',
        'lastLoginAt',
        'lastLoginIp'
      ];

      // Atualizar apenas campos permitidos
      allowedFields.forEach(field => {
        if (updateUserDto[field] !== undefined) {
          user[field] = updateUserDto[field];
        }
      });

      const savedUser = await this.userRepository.save(user);
      
      this.logger.log(`Usuário atualizado: ${savedUser.username} por ${updatedBy}`);
      
      return this.toResponseDto(savedUser);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Erro ao atualizar usuário ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar usuário');
    }
  }

  /**
   * Atualizar tentativas de login
   */
  async updateLoginAttempts(id: string, updates: LoginAttemptsUpdate): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      Object.assign(user, updates);
      await this.userRepository.save(user);

    } catch (error) {
      this.logger.error(`Erro ao atualizar tentativas de login para usuário ${id}:`, error);
      // Não lançar erro para não quebrar o fluxo de autenticação
    }
  }

  /**
   * Atualizar senha do usuário
   */
  async updatePassword(id: string, passwordData: PasswordUpdateData): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Se uma nova senha foi fornecida, fazer hash dela
      if (passwordData.password) {
        const saltRounds = this.getSaltRounds();
        const salt = await bcrypt.genSalt(saltRounds);
        passwordData.password = await bcrypt.hash(passwordData.password, salt);
      }

      // Atualizar dados da senha
      Object.assign(user, passwordData);
      await this.userRepository.save(user);
      
      this.logger.log(`Senha atualizada para usuário: ${user.username}`);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao atualizar senha para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar senha');
    }
  }

  /**
   * Atualizar senha do usuário (método simplificado para AuthService)
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.log(`🔐 [USERS] Atualizando senha para usuário ID: ${userId}`);
      
      const saltRounds = this.getSaltRounds();
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      await this.userRepository.update(parseInt(userId), {
        password: hashedPassword,
        isTemporaryPassword: false,
        mustChangePassword: false,
        lastPasswordChange: new Date(),
        updatedAt: new Date(),
      });
      
      this.logger.log(`✅ [USERS] Senha atualizada com sucesso para usuário ID: ${userId}`);
    } catch (error) {
      this.logger.error(`❌ [USERS] Erro ao atualizar senha:`, error.message);
      throw new InternalServerErrorException('Erro ao atualizar senha');
    }
  }

  /**
   * Atualizar token de reset de senha
   */
  async updateResetToken(id: string, token: string, expires: Date): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      user.passwordResetToken = token;
      user.passwordResetExpires = expires;

      await this.userRepository.save(user);
      
      this.logger.log(`Token de reset gerado para usuário: ${user.username}`);

    } catch (error) {
      this.logger.error(`Erro ao atualizar token de reset para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao gerar token de reset');
    }
  }

  /**
   * Resetar senha com token
   */
  async resetPasswordWithToken(id: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Hash da nova senha
      const saltRounds = this.getSaltRounds();
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Atualizar senha e limpar dados de reset
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      user.mustChangePassword = false;
      user.isTemporaryPassword = false;
      user.lastPasswordChange = new Date();

      await this.userRepository.save(user);
      
      this.logger.log(`Senha resetada com token para usuário: ${user.username}`);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao resetar senha com token para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao resetar senha');
    }
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(
    id: string, 
    currentPassword: string, 
    newPassword: string,
    currentUser: User
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Hash da nova senha
      const saltRounds = this.getSaltRounds();
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Atualizar senha e limpar flags temporárias
      user.password = hashedPassword;
      user.mustChangePassword = false;
      user.isTemporaryPassword = false;
      user.lastPasswordChange = new Date();

      await this.userRepository.save(user);
      
      this.logger.log(`Senha alterada para usuário: ${user.username}`);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao alterar senha para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao alterar senha');
    }
  }

  /**
   * Validar credenciais temporárias
   */
  async validateTemporaryCredentials(username: string, temporaryPassword: string): Promise<boolean> {
    try {
      console.log('🔍 [USERS] Validando credenciais temporárias para:', username);
      
      const user = await this.findByUsername(username);
      if (!user) {
        console.log('❌ [USERS] Usuário não encontrado:', username);
        return false;
      }

      // Verificar se é senha temporária e não expirou
      if (!user.isTemporaryPassword || !user.temporaryPasswordExpires) {
        console.log('❌ [USERS] Usuário não tem senha temporária:', username);
        return false;
      }

      if (new Date() > user.temporaryPasswordExpires) {
        console.log('❌ [USERS] Senha temporária expirada para:', username);
        return false;
      }

      // Validar senha temporária
      const isPasswordValid = await bcrypt.compare(temporaryPassword, user.password);
      console.log('🔑 [USERS] Senha temporária válida:', isPasswordValid);
      
      return isPasswordValid;
      
    } catch (error) {
      console.error('💥 [USERS] Erro ao validar credenciais temporárias:', error);
      return false;
    }
  }

  /**
   * Processar primeiro login
   */
  async processFirstLogin(username: string, temporaryPassword: string, newPassword: string): Promise<User> {
    try {
      console.log('🔍 [USERS] Processando primeiro login para:', username);
      
      // Validar credenciais temporárias
      const isValid = await this.validateTemporaryCredentials(username, temporaryPassword);
      if (!isValid) {
        throw new BadRequestException('Credenciais temporárias inválidas ou expiradas');
      }

      const user = await this.findByUsername(username);
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Gerar hash da nova senha
      const saltRounds = this.getSaltRounds();
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Atualizar usuário com nova senha
      await this.updatePassword(user.id.toString(), {
        password: hashedNewPassword,
        mustChangePassword: false,
        isTemporaryPassword: false,
        temporaryPassword: null,
        temporaryPasswordExpires: null,
        lastPasswordChange: new Date(),
        emailVerified: true
      });

      console.log('✅ [USERS] Senha definida com sucesso para:', username);

      // Retornar usuário atualizado
      return await this.findByUsername(username) as User;

    } catch (error) {
      console.error('💥 [USERS] Erro no primeiro login:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao processar primeiro login');
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  async toggleActive(id: string, currentUser: User): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Não permitir desativar o próprio usuário
      if (user.id === currentUser.id) {
        throw new BadRequestException('Não é possível desativar seu próprio usuário');
      }

      user.isActive = !user.isActive;
      const savedUser = await this.userRepository.save(user);
      
      this.logger.log(`Usuário ${user.isActive ? 'ativado' : 'desativado'}: ${user.username}`);
      
      return this.toResponseDto(savedUser);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao alterar status do usuário ${id}:`, error);
      throw new BadRequestException('Erro ao alterar status do usuário');
    }
  }

  /**
   * Remover usuário
   */
  async remove(id: string, currentUser: User): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Não permitir remover o próprio usuário
      if (user.id === currentUser.id) {
        throw new BadRequestException('Não é possível remover seu próprio usuário');
      }

      await this.userRepository.remove(user);
      
      this.logger.log(`Usuário removido: ${user.username} por ${currentUser.username}`);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao remover usuário ${id}:`, error);
      throw new BadRequestException('Erro ao remover usuário');
    }
  }

  /**
   * Obter estatísticas de usuários
   */
  async getStatistics() {
    try {
      const allUsers = await this.userRepository.find();
      
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.isActive).length,
        inactive: allUsers.filter(u => !u.isActive).length,
        newThisMonth: allUsers.filter(u => u.createdAt >= oneMonthAgo).length,
        byRole: this.getRoleStats(allUsers),
        recentLogins: allUsers.filter(u => 
          u.lastLoginAt && u.lastLoginAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        mustChangePassword: allUsers.filter(u => u.mustChangePassword).length,
        locked: allUsers.filter(u => u.isLocked()).length,
        withResetTokens: allUsers.filter(u => u.passwordResetToken && u.passwordResetExpires && u.passwordResetExpires > new Date()).length,
      };

      return stats;

    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      throw new BadRequestException('Erro ao obter estatísticas');
    }
  }

  /**
   * Buscar usuários por departamento
   */
  async findByDepartment(department: string): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { department, isActive: true },
      order: { fullName: 'ASC' },
    });

    return users.map(user => this.toResponseDto(user));
  }

  /**
   * ✅ CORRIGIDO: Buscar subordinados de um usuário
   */
  async findSubordinates(userId: string): Promise<UserResponseDto[]> {
    try {
      const manager = await this.userRepository.findOne({ 
        where: { id: parseInt(userId) } 
      });
      
      if (!manager) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Por enquanto, retornar usuários do mesmo departamento com role inferior
      const users = await this.userRepository.find({
        where: { 
          department: manager.department,
          isActive: true,
        },
        order: { fullName: 'ASC' },
      });

      // ✅ CORRIGIR: Filtrar subordinados baseado na hierarquia de roles
      const subordinates = users.filter(user => {
        if (user.id === manager.id) return false;
        
        // ✅ USAR AS FUNÇÕES DO ENUM ATUALIZADO
        return getRoleLevel(manager.role) > getRoleLevel(user.role);
      });

      return subordinates.map(user => this.toResponseDto(user));

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar subordinados do usuário ${userId}:`, error);
      throw new BadRequestException('Erro ao buscar subordinados');
    }
  }

  /**
   * Criar usuários padrão do sistema
   */
  async createDefaultUsers(): Promise<void> {
    try {
      const adminUsername = this.configService.get('ADMIN_USERNAME', 'admin');
      const adminEmail = this.configService.get('ADMIN_EMAIL', 'admin@workshop.com');
      const adminPassword = this.configService.get('ADMIN_PASSWORD', 'Admin@123456');
      const adminFullName = this.configService.get('ADMIN_FULL_NAME', 'Administrador do Sistema');

      const existingAdmin = await this.userRepository.findOne({
        where: { username: adminUsername },
      });

      if (!existingAdmin) {
        // Hash da senha do admin
        const saltRounds = this.getSaltRounds();
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const admin = this.userRepository.create({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          fullName: adminFullName,
          role: Role.ADMIN, // ✅ USAR Role.ADMIN
          isActive: true,
          emailVerified: true,
          mustChangePassword: false,
          isTemporaryPassword: false,
        });

        await this.userRepository.save(admin);
        this.logger.log(`✅ Usuário admin criado: ${adminUsername}`);
      } else {
        this.logger.log(`ℹ️ Usuário admin já existe: ${adminUsername}`);
      }

    } catch (error) {
      this.logger.error('Erro ao criar usuários padrão:', error);
    }
  }

  /**
   * Limpar tokens de reset expirados
   */
  async cleanupExpiredResetTokens(): Promise<number> {
    try {
      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where('password_reset_expires < :now', { now: new Date() })
        .andWhere('password_reset_token IS NOT NULL')
        .execute();

      const cleanedCount = result.affected || 0;
      
      if (cleanedCount > 0) {
        this.logger.log(`🧹 ${cleanedCount} tokens de reset expirados removidos`);
      }

      return cleanedCount;

    } catch (error) {
      this.logger.error('Erro ao limpar tokens de reset expirados:', error);
      return 0;
    }
  }

  /**
   * Alterar senha de usuário (apenas admin)
   */
  async adminChangePassword(
    id: string, 
    newPassword: string,
    currentUser: User
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Verificar se o admin não está alterando sua própria senha
      if (user.id === currentUser.id) {
        throw new BadRequestException('Use o endpoint de alteração de senha normal para alterar sua própria senha');
      }

      // Validar força da nova senha
      this.validatePasswordStrength(newPassword);

      // Hash da nova senha
      const saltRounds = this.getSaltRounds();
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Atualizar senha e forçar troca no próximo login
      user.password = hashedPassword;
      user.mustChangePassword = true;
      user.isTemporaryPassword = true;
      user.lastPasswordChange = new Date();

      await this.userRepository.save(user);
      
      this.logger.log(`Senha alterada pelo admin ${currentUser.username} para usuário: ${user.username}`);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao alterar senha por admin para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao alterar senha');
    }
  }

  /**
   * Resetar senha temporária (gerar nova)
   */
  async resetTemporaryPassword(id: string, adminId: string): Promise<{ temporaryPassword: string; expiresAt: Date }> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Gerar nova senha temporária
      const temporaryPassword = this.generateTemporaryPassword();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
      // Hash da nova senha temporária
      const saltRounds = this.getSaltRounds();
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

      // Atualizar usuário
      user.password = hashedPassword;
      user.temporaryPassword = temporaryPassword;
      user.temporaryPasswordExpires = expiresAt;
      user.isTemporaryPassword = true;
      user.mustChangePassword = true;
      user.lastPasswordChange = new Date();

      await this.userRepository.save(user);
      
      this.logger.log(`Nova senha temporária gerada para usuário: ${user.username} por admin: ${adminId}`);
      console.log(`🔑 Nova senha temporária para ${user.username}: ${temporaryPassword}`);

      return { temporaryPassword, expiresAt };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao resetar senha temporária para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao resetar senha temporária');
    }
  }

  /**
   * Reenviar email de boas-vindas
   */
  async resendWelcomeEmail(id: string, adminId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Verificar se tem senha temporária válida
      if (!user.isTemporaryPassword || !user.temporaryPassword || !user.temporaryPasswordExpires) {
        throw new BadRequestException('Usuário não possui senha temporária válida. Gere uma nova senha temporária primeiro.');
      }

      if (new Date() > user.temporaryPasswordExpires) {
        throw new BadRequestException('Senha temporária expirada. Gere uma nova senha temporária primeiro.');
      }

      // Reenviar email
      try {
        await this.emailService.sendWelcomeEmail(
          user.email,
          user.username,
          user.temporaryPassword,
          user.fullName
        );
        this.logger.log(`Email de boas-vindas reenviado para usuário: ${user.username} por admin: ${adminId}`);
      } catch (emailError) {
        this.logger.error(`Erro ao reenviar email:`, emailError.message);
        throw new BadRequestException('Erro ao enviar email. Verifique as configurações de e-mail.');
      }

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro ao reenviar email para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao reenviar email de boas-vindas');
    }
  }

  /**
   * Obter credenciais temporárias (apenas para admins)
   */
  async getTemporaryCredentials(id: string): Promise<{
    username: string;
    temporaryPassword: string | null;
    expiresAt: Date | null;
    isValid: boolean;
  }> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { id: parseInt(id) } 
      });
      
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const isValid = user.isTemporaryPassword && 
                     user.temporaryPasswordExpires && 
                     new Date() < user.temporaryPasswordExpires;

      return {
        username: user.username,
        temporaryPassword: user.temporaryPassword,
        expiresAt: user.temporaryPasswordExpires,
        isValid
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao obter credenciais temporárias para usuário ${id}:`, error);
      throw new BadRequestException('Erro ao obter credenciais temporárias');
    }
  }

  // ===============================================
  // 🔧 MÉTODOS PRIVADOS
  // ===============================================

  /**
   * Obter salt rounds como número
   */
  private getSaltRounds(): number {
    const saltRounds = this.configService.get<string>('BCRYPT_ROUNDS', '12');
    const parsed = parseInt(saltRounds, 10);
    
    // Validar se é um número válido
    if (isNaN(parsed) || parsed < 4 || parsed > 20) {
      console.warn('⚠️ [USERS] Salt rounds inválido, usando padrão 12:', saltRounds);
      return 12;
    }
    
    return parsed;
  }

  /**
   * Gerar senha temporária segura
   */
  private generateTemporaryPassword(): string {
    // Caracteres permitidos (removendo caracteres ambíguos)
    const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar com caracteres aleatórios até 12 caracteres
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Converter entidade para DTO de resposta
   */
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      department: user.department,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified || false,
      mustChangePassword: user.mustChangePassword || false,
      lastLogin: user.lastLoginAt,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions: user.permissions,
    };
  }

  /**
   * ✅ CORRIGIDO: Estatísticas por role
   */
  private getRoleStats(users: User[]) {
    const stats = {};
    Object.values(Role).forEach(role => { // ✅ USAR Role em vez de UserRole
      stats[role] = users.filter(user => user.role === role).length;
    });
    return stats;
  }

  /**
   * Validar força da senha (método privado)
   */
  private validatePasswordStrength(password: string): void {
    const minLength = this.configService.get<number>('PASSWORD_MIN_LENGTH', 8);
    const requireUppercase = this.configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true);
    const requireLowercase = this.configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true);
    const requireNumbers = this.configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true);
    const requireSymbols = this.configService.get<boolean>('PASSWORD_REQUIRE_SYMBOLS', true);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`mínimo ${minLength} caracteres`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('pelo menos uma letra maiúscula');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('pelo menos uma letra minúscula');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('pelo menos um número');
    }

    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(password)) {
      errors.push('pelo menos um símbolo especial');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`A senha deve conter: ${errors.join(', ')}`);
    }
  }
}