import { IsObject } from 'class-validator';
import { UserModules } from '@lince/types';

export class UpdateModulesDto {
  @IsObject()
  modules: UserModules;
}
