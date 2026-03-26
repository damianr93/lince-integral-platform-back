import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { JwtRefreshPayload } from '@lince/types';
import * as bcrypt from 'bcryptjs';

export interface RefreshRequest extends Request {
  user: { id: string; refreshToken: string };
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): Promise<{ id: string; refreshToken: string }> {
    const body = req.body as { refreshToken?: string };
    const refreshToken = body.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token ausente');

    const user = await this.users.findOne({
      where: { id: payload.sub, active: true },
      select: ['id', 'refreshTokenHash'],
    });

    if (!user?.refreshTokenHash)
      throw new UnauthorizedException('Sesión inválida');

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new UnauthorizedException('Refresh token inválido');

    return { id: user.id, refreshToken };
  }
}
