import { GlobalRole, UserModules } from '@lince/types';
export declare class UserEntity {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    globalRole: GlobalRole;
    modules: UserModules;
    active: boolean;
    area: string | null;
    /** Set to true after an admin resets the password. Forces the user to change it on next login. */
    mustChangePassword: boolean;
    /**
     * Stores the bcrypt hash of the current refresh token.
     * Null when the user is logged out. Used for refresh token rotation.
     */
    refreshTokenHash: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.entity.d.ts.map