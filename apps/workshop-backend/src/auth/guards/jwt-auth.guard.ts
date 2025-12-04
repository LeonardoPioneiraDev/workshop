// apps/backend/src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      this.logger.warn(`❌ [JWT_GUARD] Acesso negado para ${request.url}: ${info?.message || err?.message || 'Token inválido'}`);
      throw err || new UnauthorizedException('Token de acesso inválido ou expirado');
    }

    this.logger.debug(`✅ [JWT_GUARD] Acesso autorizado para ${user.username} em ${request.url}`);
    return user;
  }
}