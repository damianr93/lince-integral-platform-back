import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '@lince/database';
import {
  AuthUser,
  JwtPayload,
  JwtRefreshPayload,
  LoginResponse,
  TokenPair,
} from '@lince/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.users.findOne({
      where: { email, active: true },
      select: [
        'id',
        'email',
        'name',
        'globalRole',
        'modules',
        'passwordHash',
        'active',
        'mustChangePassword',
      ],
    });

    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const tokens = await this.generateTokens(user);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      modules: user.modules,
      mustChangePassword: user.mustChangePassword,
    };

    return { ...tokens, user: authUser };
  }

  async refresh(userId: string): Promise<TokenPair> {
    const user = await this.users.findOne({
      where: { id: userId, active: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.users.update(userId, { refreshTokenHash: null });
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.users.findOne({
      where: { id: userId, active: true },
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

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId, active: true } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const passwordHash = await AuthService.hashPassword(newPassword);
    await this.users.update(userId, { passwordHash, mustChangePassword: false });
  }

  private async generateTokens(user: UserEntity): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      globalRole: user.globalRole,
      modules: user.modules,
    };

    const refreshPayload: JwtRefreshPayload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.users.update(userId, { refreshTokenHash: hash });
  }

  // Utility used by UsersService to hash passwords
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Utility used by seed scripts
  async findOrCreateSuperAdmin(
    email: string,
    password: string,
    name: string,
  ): Promise<UserEntity> {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) return existing;

    const passwordHash = await AuthService.hashPassword(password);
    const user = this.users.create({
      email,
      name,
      passwordHash,
      globalRole: 'SUPERADMIN' as UserEntity['globalRole'],
      modules: {},
    });

    return this.users.save(user);
  }
}
