// apps/backend/src/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Request,
  HttpCode,
  HttpStatus,
  Query,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { 
  LoginDto, 
  RegisterDto, 
  ChangePasswordDto, 
  AuthResponseDto
} from './dto/auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { ValidateTemporaryDto } from './dto/validate-temporary.dto';
import { FirstLoginDto } from './dto/first-login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Request() req) { // ✅ Adicionado @Request() req
    return this.authService.login(loginDto, req); // ✅ Passando req
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async register(@Body() registerDto: RegisterDto, @Request() req) { // ✅ Adicionado @Request() req
    return this.authService.register(registerDto, req); // ✅ Passando req
  }

  @Post('validate-temporary')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar credenciais temporárias' })
  @ApiResponse({ status: 200, description: 'Credenciais válidas' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou expiradas' })
  async validateTemporary(@Body() validateDto: ValidateTemporaryDto) {
    return this.authService.validateTemporaryCredentials(
      validateDto.email,
      validateDto.temporaryPassword,
    );
  }

  @Post('first-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar primeiro login' })
  @ApiResponse({ status: 200, description: 'Primeiro login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 400, description: 'Senha não atende aos critérios' })
  async firstLogin(@Body() firstLoginDto: FirstLoginDto) {
    return this.authService.completeFirstLogin(
      firstLoginDto.email,
      firstLoginDto.temporaryPassword,
      firstLoginDto.newPassword,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alterar senha' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto, req); // ✅ Passando req
  }

  // ===============================================
  // 🔐 ENDPOINTS DE RECUPERAÇÃO DE SENHA
  // ===============================================

  @Post('forgot-password')
  @Public()
  @ApiOperation({ 
    summary: 'Solicitar recuperação de senha via email',
    description: 'Envia um email com token para recuperação de senha. Endpoint público.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Solicitação processada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email de recuperação enviado com sucesso!' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`📧 [FORGOT_PASSWORD] Solicitação recebida para: ${forgotPasswordDto.email}`);
    
    try {
      const result = await this.authService.forgotPassword(forgotPasswordDto.email);
      
      this.logger.log(`✅ [FORGOT_PASSWORD] Resposta: ${result.success ? 'Sucesso' : 'Falha'}`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ [FORGOT_PASSWORD] Erro:`, error.message);
      throw error;
    }
  }

  @Get('validate-reset-token')
  @Public()
  @ApiOperation({ 
    summary: 'Validar token de recuperação de senha',
    description: 'Verifica se um token de reset é válido e não expirou. Endpoint público.'
  })
  @ApiQuery({ 
    name: 'token', 
    description: 'Token de recuperação recebido por email',
    example: 'abc123def456...'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status da validação do token',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Token válido' }
      }
    }
  })
  async validateResetToken(@Query('token') token: string) {
    this.logger.log(`🔍 [VALIDATE_TOKEN] Validação solicitada para token: ${token?.substring(0, 10)}...`);
    
    if (!token) {
      return { valid: false, message: 'Token não fornecido' };
    }
    
    const result = await this.authService.validateResetToken(token);
    
    this.logger.log(`✅ [VALIDATE_TOKEN] Resultado: ${result.valid ? 'Válido' : 'Inválido'}`);
    
    return result;
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ 
    summary: 'Resetar senha com token de recuperação',
    description: 'Define uma nova senha usando o token recebido por email. Endpoint público.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Senha alterada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Senha alterada com sucesso!' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Token inválido ou senha não atende aos critérios' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Request() req) { // ✅ Adicionado @Request() req
    this.logger.log(`�� [RESET_PASSWORD] Solicitação recebida para token: ${resetPasswordDto.token?.substring(0, 10)}...`);
    
    try {
      const result = await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
        req // ✅ Passando req
      );
      
      this.logger.log(`✅ [RESET_PASSWORD] Resultado: ${result.success ? 'Sucesso' : 'Falha'}`);
      
      return result;
    } catch (error) {
      this.logger.error(`❌ [RESET_PASSWORD] Erro:`, error.message);
      throw error;
    }
  }

  // ===============================================
  // 🔐 OUTROS ENDPOINTS DE AUTENTICAÇÃO
  // ===============================================

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  async refreshToken(@Body('refresh_token') refreshToken: string, @Request() req) { // ✅ Adicionado @Request() req
    return this.authService.refreshToken(refreshToken, req); // ✅ Passando req
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer logout' })
  @ApiResponse({ status: 200, description: 'Logout realizado' })
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub, req); // ✅ Passando req
  }
}