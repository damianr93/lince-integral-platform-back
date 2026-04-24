import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthUser, LoginResponse, TokenPair } from '@lince/types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<LoginResponse>;
    refresh(user: {
        id: string;
        refreshToken: string;
    }): Promise<TokenPair>;
    logout(user: AuthUser): Promise<void>;
    me(user: AuthUser): Promise<AuthUser>;
    /** Cambiar propia contraseña (requerido cuando mustChangePassword = true) */
    changePassword(user: AuthUser, dto: ChangePasswordDto): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map