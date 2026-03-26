import { SetMetadata } from '@nestjs/common';
import { ModuleKey } from '@lince/types';

export const MODULE_KEY = 'required_module';

export const RequireModule = (module: ModuleKey) =>
  SetMetadata(MODULE_KEY, module);
