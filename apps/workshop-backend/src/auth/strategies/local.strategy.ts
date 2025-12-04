// apps/backend/src/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    try {
      this.logger.debug(`🔍 [LOCAL] Validando credenciais para: ${username}`);
      
      if (!username || !password) {
        this.logger.warn(`❌ [LOCAL] Credenciais incompletas para: ${username}`);
        throw new UnauthorizedException('Username e senha são obrigatórios');
      }

      const user = await this.authService.validateUser(username, password);
      
      if (!user) {
        this.logger.warn(`❌ [LOCAL] Credenciais inválidas para: ${username}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      this.logger.debug(`✅ [LOCAL] Credenciais válidas para: ${user.username}`);
      
      return user;

    } catch (error) {
      this.logger.error(`💥 [LOCAL] Erro na validação:`, error.message);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Erro na validação das credenciais');
    }
  }
}