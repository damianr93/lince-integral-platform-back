import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { JwtRefreshPayload } from '@lince/types';
export interface RefreshRequest extends Request {
    user: {
        id: string;
        refreshToken: string;
    };
}
declare const JwtRefreshStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private readonly users;
    constructor(config: ConfigService, users: Repository<UserEntity>);
    validate(req: Request, payload: JwtRefreshPayload): Promise<{
        id: string;
        refreshToken: string;
    }>;
}
export {};
//# sourceMappingURL=jwt-refresh.strategy.d.ts.map