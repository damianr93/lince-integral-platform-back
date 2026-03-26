export const GlobalRole = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type GlobalRole = (typeof GlobalRole)[keyof typeof GlobalRole];

export const ModuleKey = {
  CRM: 'crm',
  CONCILIACIONES: 'conciliaciones',
  OCR: 'ocr',
  MARKETING: 'marketing',
} as const;

export type ModuleKey = (typeof ModuleKey)[keyof typeof ModuleKey];

export interface ModulePermission {
  enabled: boolean;
  role: string;
}

export type UserModules = Partial<Record<ModuleKey, ModulePermission>>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  modules: UserModules;
  mustChangePassword: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  globalRole: GlobalRole;
  modules: UserModules;
}

export interface JwtRefreshPayload {
  sub: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}
