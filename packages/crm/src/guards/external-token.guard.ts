import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ExternalTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['codrr_token'] as string | undefined;
    const expected = this.config.getOrThrow<string>('EXTERNAL_FIXED_TOKEN');

    if (!token || token !== expected) {
      throw new UnauthorizedException('Token externo inválido');
    }

    return true;
  }
}
