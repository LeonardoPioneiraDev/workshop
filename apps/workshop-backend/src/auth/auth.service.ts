// apps/backend/src/auth/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginLogService } from '../users/services/login-log.service'; // ✅ NOVO
import { User } from '../users/entities/user.entity';
import { LoginEventType } from '../users/entities/login-log.entity'; // ✅ NOVO
import { LoginDto, RegisterDto, ChangePasswordDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly loginLogService: LoginLogService, // ✅ NOVO
  ) {}

  /**
   * ✅ NOVO: Extrair informações da requisição
   */
  private extractRequestInfo(request?: any): {
    ipAddress: string;
    userAgent: string;
    deviceInfo: any;
  } {
    const ipAddress = request?.ip || 
                     request?.connection?.remoteAddress || 
                     request?.headers?.['x-forwarded-for']?.split(',')[0] || 
                     'unknown';
    
    const userAgent = request?.headers?.['user-agent'] || 'unknown';
    
    // Parse básico do user agent
    const deviceInfo = {
      browser: this.parseBrowser(userAgent),
      os: this.parseOS(userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent)
    };

    return { ipAddress, userAgent, deviceInfo };
  }

  /**
   * ✅ MELHORADO: Validar credenciais do usuário (aceita username OU email)
   */
  async validateUser(usernameOrEmail: string, password: string, request?: any): Promise<User | null> {
    try {
      console.log('🔍 [AUTH] Iniciando validação para:', usernameOrEmail);
      console.log('🔍 [AUTH] Senha recebida:', password ? '[SENHA FORNECIDA]' : '[SENHA VAZIA]');
      
      // ✅ BUSCAR POR USERNAME OU EMAIL
      let user = await this.usersService.findByUsername(usernameOrEmail);
      if (!user) {
        user = await this.usersService.findByEmail(usernameOrEmail);
      }

      if (!user) {
        console.log('❌ [AUTH] Usuário não encontrado:', usernameOrEmail);
        this.logger.warn(`Tentativa de login com credencial inexistente: ${usernameOrEmail}`);
        
        // ✅ LOG DE TENTATIVA FALHADA (usuário não encontrado)
        const requestInfo = this.extractRequestInfo(request);
        await this.loginLogService.createLoginLog({
          userId: null,
          eventType: LoginEventType.LOGIN_FAILED,
          success: false,
          failureReason: 'Usuário não encontrado',
          ...requestInfo,
          additionalData: { attemptedCredential: usernameOrEmail }
        }).catch(err => this.logger.error('Erro ao salvar log:', err));
        
        return null;
      }

      console.log('👤 [AUTH] Usuário encontrado:', {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
        isTemporaryPassword: user.isTemporaryPassword,
        mustChangePassword: user.mustChangePassword
      });

      // Verificar se conta está bloqueada
      if (user.isLocked()) {
        const unlockTime = user.lockedUntil?.toLocaleTimeString() || 'indefinido';
        console.log('🔒 [AUTH] Conta bloqueada até:', unlockTime);
        this.logger.warn(`Tentativa de login em conta bloqueada: ${usernameOrEmail} (desbloqueio: ${unlockTime})`);
        
        // ✅ LOG DE CONTA BLOQUEADA
        const requestInfo = this.extractRequestInfo(request);
        await this.loginLogService.createLoginLog({
          userId: user.id,
          eventType: LoginEventType.ACCOUNT_LOCKED,
          success: false,
          failureReason: `Conta bloqueada até ${unlockTime}`,
          ...requestInfo
        }).catch(err => this.logger.error('Erro ao salvar log:', err));
        
        throw new UnauthorizedException(`Conta temporariamente bloqueada até ${unlockTime}`);
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        console.log('❌ [AUTH] Conta desativada:', usernameOrEmail);
        this.logger.warn(`Tentativa de login em conta desativada: ${usernameOrEmail}`);
        
        // ✅ LOG DE CONTA INATIVA
        const requestInfo = this.extractRequestInfo(request);
        await this.loginLogService.createLoginLog({
          userId: user.id,
          eventType: LoginEventType.LOGIN_FAILED,
          success: false,
          failureReason: 'Conta desativada',
          ...requestInfo
        }).catch(err => this.logger.error('Erro ao salvar log:', err));
        
        throw new UnauthorizedException('Conta desativada. Entre em contato com o administrador.');
      }

      // Validar senha
      console.log('🔐 [AUTH] Comparando senhas...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('✅ [AUTH] Resultado da comparação:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ [AUTH] Senha inválida para:', usernameOrEmail);
        await this.handleFailedLogin(user, request);
        return null;
      }

      // ✅ DETECTAR ATIVIDADE SUSPEITA
      const requestInfo = this.extractRequestInfo(request);
      const suspiciousActivity = await this.loginLogService.detectSuspiciousActivity(
        user.id, 
        requestInfo.ipAddress
      );

      if (suspiciousActivity.isSuspicious) {
        this.logger.warn(`🚨 Atividade suspeita detectada para ${user.username}: ${suspiciousActivity.reasons.join(', ')}`);
        
        // ✅ LOG DE ATIVIDADE SUSPEITA
        await this.loginLogService.createLoginLog({
          userId: user.id,
          eventType: LoginEventType.SUSPICIOUS_ACTIVITY,
          success: true, // Login foi bem-sucedido, mas suspeito
          ...requestInfo,
          additionalData: {
            riskScore: suspiciousActivity.riskScore,
            reasons: suspiciousActivity.reasons
          }
        }).catch(err => this.logger.error('Erro ao salvar log:', err));
      }

      // Sucesso no login - resetar tentativas
      console.log('🎉 [AUTH] Login válido para:', usernameOrEmail);
      await this.handleSuccessfulLogin(user, request);
      return user;

    } catch (error) {
      console.log('💥 [AUTH] Erro na validação:', error.message);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Erro na validação do usuário ${usernameOrEmail}:`, error);
      throw new UnauthorizedException('Erro interno. Tente novamente.');
    }
  }

  /**
   * ✅ MELHORADO: Realizar login com logs
   */
  async login(loginDto: LoginDto, request?: any): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password, request);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se precisa trocar senha
    const needsPasswordChange = user.mustChangePassword || user.isTemporaryPassword;

    const tokens = this.generateTokens(user);

    // ✅ LOG DE LOGIN SUCESSO
    const requestInfo = this.extractRequestInfo(request);
    await this.loginLogService.createLoginLog({
      userId: user.id,
      eventType: user.isTemporaryPassword ? LoginEventType.FIRST_LOGIN : LoginEventType.LOGIN_SUCCESS,
      success: true,
      ...requestInfo,
      sessionId: this.generateSessionId(),
      expiresAt: new Date(Date.now() + this.parseExpirationTime(this.configService.get('JWT_EXPIRES_IN', '5m')) * 1000),
      additionalData: {
        needsPasswordChange,
        tokenExpiry: new Date(Date.now() + this.parseExpirationTime(this.configService.get('JWT_EXPIRES_IN', '5m')) * 1000)
      }
    }).catch(err => this.logger.error('Erro ao salvar log:', err));

    this.logger.log(`Login realizado com sucesso: ${user.username} (${user.role})`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      needsPasswordChange,
      message: needsPasswordChange ? 
        'Login realizado. É necessário alterar a senha.' : 
        'Login realizado com sucesso'
    };
  }

  /**
   * ✅ MELHORADO: Registrar novo usuário (apenas @vpioneira.com.br)
   */
  async register(registerDto: RegisterDto, request?: any): Promise<AuthResponseDto> {
    try {
      // ✅ VALIDAR DOMÍNIO DO EMAIL
      const allowedDomain = this.configService.get<string>('ALLOWED_EMAIL_DOMAIN', '@vpioneira.com.br');
      if (!registerDto.email.toLowerCase().endsWith(allowedDomain.toLowerCase())) {
        this.logger.warn(`Tentativa de registro com email não autorizado: ${registerDto.email}`);
        throw new BadRequestException(`Apenas emails do domínio ${allowedDomain} são permitidos`);
      }

      // Verificar se usuário já existe
      const existingUser = await this.usersService.findByUsername(registerDto.username);
      if (existingUser) {
        throw new ConflictException('Nome de usuário já existe');
      }

      const existingEmail = await this.usersService.findByEmail(registerDto.email);
      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }

      // Validar força da senha
      this.validatePasswordStrength(registerDto.password);

      // Hash da senha
      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);

      // Criar usuário
      const userDto = {
        username: registerDto.username,
        email: registerDto.email,
        fullName: registerDto.fullName,
        department: registerDto.department,
        position: registerDto.position,
        role: registerDto.role,
        phone: registerDto.phone,
        sendWelcomeEmail: false,
      };

      const user = await this.usersService.createWithHashedPassword(userDto, hashedPassword, 'self-registration');

      // ✅ LOG DE REGISTRO
      const requestInfo = this.extractRequestInfo(request);
      await this.loginLogService.createLoginLog({
        userId: user.id,
        eventType: LoginEventType.REGISTRATION,
        success: true,
        ...requestInfo,
        sessionId: this.generateSessionId(),
        additionalData: { registrationMethod: 'self-registration' }
      }).catch(err => this.logger.error('Erro ao salvar log:', err));

      this.logger.log(`Novo usuário registrado: ${registerDto.username} (${registerDto.email})`);

      return {
        ...this.generateTokens(user),
        user: this.sanitizeUser(user),
        message: 'Usuário registrado com sucesso'
      };

    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro no registro do usuário ${registerDto.username}:`, error);
      throw new BadRequestException('Erro ao registrar usuário. Tente novamente.');
    }
  }

  /**
   * ✅ MELHORADO: Alterar senha com logs
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto, request?: any) {
    try {
      const userResponse = await this.usersService.findOne(userId);
      if (!userResponse) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const userEntity = await this.usersService.findByUsername(userResponse.username);
      if (!userEntity) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Validar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword, 
        userEntity.password
      );
      if (!isCurrentPasswordValid) {
        this.logger.warn(`Tentativa de alteração de senha com senha atual incorreta: ${userEntity.username}`);
        
        // ✅ LOG DE TENTATIVA FALHADA
        const requestInfo = this.extractRequestInfo(request);
        await this.loginLogService.createLoginLog({
          userId: userEntity.id,
          eventType: LoginEventType.LOGIN_FAILED,
          success: false,
          failureReason: 'Senha atual incorreta na alteração',
          ...requestInfo
        }).catch(err => this.logger.error('Erro ao salvar log:', err));
        
        throw new UnauthorizedException('Senha atual incorreta');
      }

      // Validar se nova senha é diferente da atual
      const isSamePassword = await bcrypt.compare(
        changePasswordDto.newPassword, 
        userEntity.password
      );
      if (isSamePassword) {
        throw new BadRequestException('A nova senha deve ser diferente da senha atual');
      }

      // Validar força da nova senha
      this.validatePasswordStrength(changePasswordDto.newPassword);

      // Alterar senha
      await this.usersService.changePassword(
        userId, 
        changePasswordDto.currentPassword, 
        changePasswordDto.newPassword,
        userEntity
      );

      // ✅ LOG DE ALTERAÇÃO DE SENHA
      const requestInfo = this.extractRequestInfo(request);
      await this.loginLogService.createLoginLog({
        userId: userEntity.id,
        eventType: LoginEventType.PASSWORD_CHANGE,
        success: true,
        ...requestInfo
      }).catch(err => this.logger.error('Erro ao salvar log:', err));

      this.logger.log(`Senha alterada com sucesso: ${userEntity.username}`);

      return { 
        message: 'Senha alterada com sucesso',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erro na alteração de senha para usuário ${userId}:`, error);
      throw new BadRequestException('Erro ao alterar senha. Tente novamente.');
    }
  }

  /**
   * ✅ MELHORADO: Refresh token com logs
   */
  async refreshToken(refreshToken: string, request?: any) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
      });

      const user = await this.usersService.findByUsername(decoded.username);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token inválido');
      }

      // ✅ LOG DE REFRESH TOKEN
      const requestInfo = this.extractRequestInfo(request);
      await this.loginLogService.createLoginLog({
        userId: user.id,
        eventType: LoginEventType.REFRESH_TOKEN,
        success: true,
        ...requestInfo,
        sessionId: this.generateSessionId()
      }).catch(err => this.logger.error('Erro ao salvar log:', err));

      return this.generateTokens(user);

    } catch (error) {
      this.logger.warn(`Tentativa de refresh com token inválido`);
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  /**
   * ✅ MELHORADO: Logout com logs
   */
  async logout(userId: string, request?: any) {
    try {
      // ✅ LOG DE LOGOUT
      const requestInfo = this.extractRequestInfo(request);
      await this.loginLogService.createLoginLog({
        userId: parseInt(userId),
        eventType: LoginEventType.LOGOUT,
        success: true,
        ...requestInfo
      }).catch(err => this.logger.error('Erro ao salvar log:', err));

      this.logger.log(`Logout realizado: usuário ${userId}`);
      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro no logout:`, error);
      return { message: 'Logout realizado com sucesso' }; // Sempre retornar sucesso
    }
  }

  // ✅ MÉTODOS EXISTENTES (mantidos iguais)
  async validateTemporaryCredentials(email: string, temporaryPassword: string): Promise<any> {
    try {
      this.logger.log(`🔍 [AUTH] Validando credenciais temporárias para: ${email}`);
      
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.warn(`⚠️ [AUTH] Usuário não encontrado: ${email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (!user.isTemporaryPassword) {
        this.logger.warn(`⚠️ [AUTH] Usuário não possui senha temporária: ${email}`);
        throw new UnauthorizedException('Senha temporária não encontrada');
      }

      // Verificar se a senha temporária não expirou (24h)
      const passwordAge = Date.now() - user.updatedAt.getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (passwordAge > maxAge) {
        this.logger.warn(`⚠️ [AUTH] Senha temporária expirada para: ${email}`);
        throw new UnauthorizedException('Senha temporária expirada');
      }

      const isValidPassword = await bcrypt.compare(temporaryPassword, user.password);
      if (!isValidPassword) {
        this.logger.warn(`⚠️ [AUTH] Senha temporária inválida para: ${email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      this.logger.log(`✅ [AUTH] Credenciais temporárias válidas para: ${email}`);
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        position: user.position,
        isTemporaryPassword: user.isTemporaryPassword,
      };
    } catch (error) {
      this.logger.error(`❌ [AUTH] Erro ao validar credenciais temporárias:`, error.message);
      throw error;
    }
  }

  async completeFirstLogin(email: string, temporaryPassword: string, newPassword: string): Promise<any> {
    try {
      this.logger.log(`🔄 [AUTH] Completando primeiro login para: ${email}`);
      
      // Validar credenciais temporárias
      const userData = await this.validateTemporaryCredentials(email, temporaryPassword);
      
      // Validar força da nova senha
      this.validatePasswordStrength(newPassword);
      
      // Atualizar senha e remover flag temporária
      await this.usersService.updateUserPassword(userData.id, newPassword);
      
      // Buscar usuário atualizado
      const updatedUser = await this.usersService.findById(userData.id);
      if (!updatedUser) {
        throw new UnauthorizedException('Erro ao buscar usuário atualizado');
      }
      
      // Gerar tokens de acesso
      const tokens = this.generateTokens(updatedUser);
      
      this.logger.log(`✅ [AUTH] Primeiro login completado para: ${email}`);
      
      return {
        ...tokens,
        user: this.sanitizeUser(updatedUser),
        message: 'Primeiro login realizado com sucesso'
      };
    } catch (error) {
      this.logger.error(`❌ [AUTH] Erro no primeiro login:`, error.message);
      throw error;
    }
  }

  async firstLogin(username: string, temporaryPassword: string, newPassword: string) {
    try {
      console.log('🔍 [AUTH] Processando primeiro login para:', username);
      
      // Validar força da nova senha
      this.validatePasswordStrength(newPassword);

      // Processar primeiro login no UsersService
      const user = await this.usersService.processFirstLogin(username, temporaryPassword, newPassword);

      console.log('✅ [AUTH] Primeiro login processado com sucesso para:', username);

      // Gerar token JWT
      const tokens = this.generateTokens(user);

      // Atualizar último login
      await this.usersService.updateLoginAttempts(user.id.toString(), {
        lastLoginAt: new Date(),
        lastLoginIp: null, // TODO: pegar IP real
        failedLoginAttempts: 0,
        lockedUntil: null
      });

      return {
        ...tokens,
        user: this.sanitizeUser(user),
        message: 'Senha definida com sucesso. Bem-vindo ao sistema!'
      };

    } catch (error) {
      console.error('💥 [AUTH] Erro no primeiro login:', error);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao processar primeiro login');
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🔄 [FORGOT_PASSWORD] Solicitação para email: ${email}`);

      // Buscar usuário por email
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.warn(`❌ [FORGOT_PASSWORD] Email não encontrado: ${email}`);
        // Por segurança, retornar sucesso mesmo se email não existir
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.'
        };
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        this.logger.warn(`❌ [FORGOT_PASSWORD] Usuário inativo: ${email}`);
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.'
        };
      }

      // Gerar token de reset seguro
      const resetToken = this.generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      this.logger.log(`🔑 [FORGOT_PASSWORD] Token gerado para: ${email}`);

      // Salvar token no banco
      await this.usersService.updateResetToken(user.id.toString(), resetToken, resetExpires);

      // Enviar email de recuperação
      const emailSent = await this.emailService.sendPasswordResetEmail(email, resetToken);

      if (!emailSent) {
        this.logger.error(`❌ [FORGOT_PASSWORD] Falha no envio de email para: ${email}`);
        throw new InternalServerErrorException('Erro ao enviar email de recuperação');
      }

      this.logger.log(`✅ [FORGOT_PASSWORD] Email enviado com sucesso para: ${email}`);

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.'
      };

    } catch (error) {
      this.logger.error(`💥 [FORGOT_PASSWORD] Erro:`, error.message);
      
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro interno ao processar solicitação de recuperação');
    }
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; message: string; userId?: string }> {
    try {
      this.logger.log(`🔍 [VALIDATE_TOKEN] Validando token: ${token.substring(0, 10)}...`);

      if (!token || token.length < 32) {
        return { valid: false, message: 'Token inválido' };
      }

      // Buscar usuário pelo token
      const user = await this.usersService.findByResetToken(token);
      if (!user) {
        this.logger.warn(`❌ [VALIDATE_TOKEN] Token não encontrado`);
        return { valid: false, message: 'Token inválido ou expirado' };
      }

      // Verificar se token não expirou
      if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
        this.logger.warn(`❌ [VALIDATE_TOKEN] Token expirado para usuário: ${user.email}`);
        return { valid: false, message: 'Token expirado. Solicite uma nova recuperação.' };
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        this.logger.warn(`❌ [VALIDATE_TOKEN] Usuário inativo: ${user.email}`);
        return { valid: false, message: 'Usuário inativo' };
      }

      this.logger.log(`✅ [VALIDATE_TOKEN] Token válido para usuário: ${user.email}`);

      return {
        valid: true,
        message: 'Token válido',
        userId: user.id.toString()
      };

    } catch (error) {
      this.logger.error(`💥 [VALIDATE_TOKEN] Erro:`, error.message);
      return { valid: false, message: 'Erro ao validar token' };
    }
  }

  async resetPassword(token: string, newPassword: string, request?: any): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🔄 [RESET_PASSWORD] Iniciando reset com token: ${token.substring(0, 10)}...`);

      // Validar token primeiro
      const tokenValidation = await this.validateResetToken(token);
      if (!tokenValidation.valid) {
        return { success: false, message: tokenValidation.message };
      }

      const userId = tokenValidation.userId!;
      const user = await this.usersService.findById(userId);
      if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      this.logger.log(`�� [RESET_PASSWORD] Alterando senha para usuário: ${user.email}`);

      // Validar força da nova senha
      this.validatePasswordStrength(newPassword);

      // Atualizar senha e limpar token
      await this.usersService.resetPasswordWithToken(userId, newPassword);

      // ✅ LOG DE RESET DE SENHA
      const requestInfo = this.extractRequestInfo(request);
      await this.loginLogService.createLoginLog({
        userId: user.id,
        eventType: LoginEventType.PASSWORD_RESET,
        success: true,
        ...requestInfo,
        additionalData: { resetToken: token.substring(0, 10) + '...' }
      }).catch(err => this.logger.error('Erro ao salvar log:', err));

      // Enviar email de confirmação
      try {
        await this.emailService.sendPasswordChangedEmail(user.email, user.fullName);
        this.logger.log(`📧 [RESET_PASSWORD] Email de confirmação enviado para: ${user.email}`);
      } catch (emailError) {
        this.logger.warn(`⚠️ [RESET_PASSWORD] Falha no envio de confirmação:`, emailError.message);
        // Não falhar o reset por erro de email
      }

      this.logger.log(`✅ [RESET_PASSWORD] Senha alterada com sucesso para: ${user.email}`);

      return {
        success: true,
        message: 'Senha alterada com sucesso! Você já pode fazer login com a nova senha.'
      };

    } catch (error) {
      this.logger.error(`💥 [RESET_PASSWORD] Erro:`, error.message);
      
      if (error instanceof BadRequestException) {
        return { success: false, message: error.message };
      }
      
      return { success: false, message: 'Erro ao alterar senha. Tente novamente.' };
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }

  // ===============================================
  // 🔧 MÉTODOS PRIVADOS
  // ===============================================

  /**
   * ✅ MELHORADO: Tratar login falhado com logs
   */
  private async handleFailedLogin(user: User, request?: any): Promise<void> {
    const maxAttempts = this.configService.get<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5);
    const lockTimeMinutes = this.configService.get<number>('AUTH_LOCK_TIME_MINUTES', 15);

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    let eventType = LoginEventType.LOGIN_FAILED;
    let failureReason = `Senha incorreta (tentativa ${user.failedLoginAttempts}/${maxAttempts})`;

    if (user.failedLoginAttempts >= maxAttempts) {
      user.lockedUntil = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
      eventType = LoginEventType.ACCOUNT_LOCKED;
      failureReason = `Conta bloqueada por ${lockTimeMinutes} minutos após ${maxAttempts} tentativas`;
      this.logger.warn(`Usuário bloqueado por ${lockTimeMinutes} minutos: ${user.username}`);
    }

    await this.usersService.updateLoginAttempts(user.id.toString(), {
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
    });

    // ✅ LOG DE TENTATIVA FALHADA
    const requestInfo = this.extractRequestInfo(request);
    await this.loginLogService.createLoginLog({
      userId: user.id,
      eventType,
      success: false,
      failureReason,
      ...requestInfo,
      additionalData: {
        attemptNumber: user.failedLoginAttempts,
        maxAttempts,
        lockTimeMinutes: user.lockedUntil ? lockTimeMinutes : null
      }
    }).catch(err => this.logger.error('Erro ao salvar log:', err));
  }

  /**
   * ✅ MELHORADO: Tratar login bem-sucedido
   */
  private async handleSuccessfulLogin(user: User, request?: any): Promise<void> {
    await this.usersService.updateLoginAttempts(user.id.toString(), {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: this.extractRequestInfo(request).ipAddress,
    });
  }

  /**
   * ✅ MELHORADO: Gerar tokens JWT (com validade curta para inatividade)
   */
  private generateTokens(user: User) {
    const payload = {
      sub: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      iat: Math.floor(Date.now() / 1000),
    };

    // ✅ TOKEN DE ACESSO COM VALIDADE CURTA (5 minutos para inatividade)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '5m'), // 5 minutos por padrão
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.parseExpirationTime(this.configService.get('JWT_EXPIRES_IN', '5m')),
    };
  }

  /**
   * ✅ NOVO: Gerar ID de sessão único
   */
  private generateSessionId(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * ✅ NOVO: Parse básico do browser
   */
  private parseBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * ✅ NOVO: Parse básico do OS
   */
  private parseOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Gerar token seguro para reset
   */
  private generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sanitizar dados do usuário para resposta
   */
  private sanitizeUser(user: User) {
    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      position: user.position,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      isTemporaryPassword: user.isTemporaryPassword,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLoginAt,
      permissions: user.permissions,
    };
  }

  /**
   * Validar força da senha
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

  /**
   * Converter tempo de expiração para segundos
   */
  private parseExpirationTime(expiration: string): number {
    const timeUnit = expiration.slice(-1);
    const timeValue = parseInt(expiration.slice(0, -1));

    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return 24 * 60 * 60; // 24 horas por padrão
    }
  }
}