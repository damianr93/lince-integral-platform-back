import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, GlobalRole } from '@lince/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<GlobalRole[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Sin autenticación');

    // SUPERADMIN siempre pasa
    if (user.globalRole === GlobalRole.SUPERADMIN) return true;

    const hasRole = requiredRoles.includes(user.globalRole);
    if (!hasRole)
      throw new ForbiddenException(
        `Se requiere rol: ${requiredRoles.join(' o ')}`,
      );

    return true;
  }
}
