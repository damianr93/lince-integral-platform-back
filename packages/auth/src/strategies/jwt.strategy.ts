import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { AuthUser, JwtPayload } from '@lince/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findOne({
      where: { id: payload.sub, active: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      modules: user.modules,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
