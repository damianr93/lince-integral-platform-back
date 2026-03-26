import { GlobalRole, UserModules } from './auth.types';

export interface AreaDto {
  id: string;
  name: string;
  modules: UserModules;
  createdAt: string;
  updatedAt: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  modules: UserModules;
  active: boolean;
  area?: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  globalRole?: GlobalRole;
  modules?: UserModules;
}

export interface UpdateUserDto {
  name?: string;
  globalRole?: GlobalRole;
  active?: boolean;
}

export interface UpdateUserModulesDto {
  modules: UserModules;
}
