// apps/backend/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn(`❌ [ROLES_GUARD] Usuário não encontrado no request`);
      throw new ForbiddenException('Usuário não autenticado');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(`❌ [ROLES_GUARD] Acesso negado para ${user.username}. Role: ${user.role}, Requerido: ${requiredRoles.join(', ')}`);
      throw new ForbiddenException('Permissões insuficientes para acessar este recurso');
    }

    this.logger.debug(`✅ [ROLES_GUARD] Acesso autorizado para ${user.username} com role ${user.role}`);
    return true;
  }
}