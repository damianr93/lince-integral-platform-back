import { SetMetadata } from '@nestjs/common';
import { GlobalRole } from '@lince/types';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: GlobalRole[]) => SetMetadata(ROLES_KEY, roles);
