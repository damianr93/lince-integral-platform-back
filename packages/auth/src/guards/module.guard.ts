import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, GlobalRole, ModuleKey } from '@lince/types';
import { MODULE_KEY } from '../decorators/module.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<ModuleKey>(
      MODULE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredModule) return true;

    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Sin autenticación');

    // SUPERADMIN accede a todo
    if (user.globalRole === GlobalRole.SUPERADMIN) return true;

    const permission = user.modules[requiredModule as ModuleKey];
    if (!permission?.enabled) {
      throw new ForbiddenException(
        `No tenés acceso al módulo: ${requiredModule}`,
      );
    }

    return true;
  }
}
