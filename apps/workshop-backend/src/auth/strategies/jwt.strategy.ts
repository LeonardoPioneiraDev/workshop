// apps/backend/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      issuer: configService.get('JWT_ISSUER', 'workshop-backend'),
      audience: configService.get('JWT_AUDIENCE', 'workshop-users'),
    });
  }

  async validate(payload: any) {
    try {
      this.logger.debug(`🔍 [JWT] Validando token para usuário: ${payload.username || payload.sub}`);
      
      // Buscar usuário por ID (sub) ou username
      let user = null;
      
      if (payload.sub) {
        user = await this.usersService.findById(payload.sub);
      } else if (payload.username) {
        user = await this.usersService.findByUsername(payload.username);
      }

      if (!user) {
        this.logger.warn(`❌ [JWT] Usuário não encontrado: ${payload.username || payload.sub}`);
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (!user.isActive) {
        this.logger.warn(`❌ [JWT] Usuário inativo: ${user.username}`);
        throw new UnauthorizedException('Usuário inativo');
      }

      // Verificar se o usuário está bloqueado
      if (user.isLocked && user.isLocked()) {
        this.logger.warn(`❌ [JWT] Usuário bloqueado: ${user.username}`);
        throw new UnauthorizedException('Usuário temporariamente bloqueado');
      }

      this.logger.debug(`✅ [JWT] Token válido para: ${user.username}`);
      
      // Retornar dados do usuário para o request
      return {
        id: user.id,
        sub: user.id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        position: user.position,
        isActive: user.isActive,
        permissions: user.permissions,
      };

    } catch (error) {
      this.logger.error(`💥 [JWT] Erro na validação do token:`, error.message);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Token inválido');
    }
  }
}