import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { AuthUser, LoginResponse, TokenPair } from '@lince/types';
export declare class AuthService {
    private readonly users;
    private readonly jwtService;
    private readonly config;
    constructor(users: Repository<UserEntity>, jwtService: JwtService, config: ConfigService);
    login(email: string, password: string): Promise<LoginResponse>;
    refresh(userId: string): Promise<TokenPair>;
    logout(userId: string): Promise<void>;
    getMe(userId: string): Promise<AuthUser>;
    changePassword(userId: string, newPassword: string): Promise<void>;
    private generateTokens;
    private storeRefreshToken;
    static hashPassword(password: string): Promise<string>;
    findOrCreateSuperAdmin(email: string, password: string, name: string): Promise<UserEntity>;
}
//# sourceMappingURL=auth.service.d.ts.map