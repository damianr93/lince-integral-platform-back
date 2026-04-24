import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { AuthUser, JwtPayload } from '@lince/types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly users;
    constructor(config: ConfigService, users: Repository<UserEntity>);
    validate(payload: JwtPayload): Promise<AuthUser>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map