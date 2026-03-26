import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { UserModules } from '@lince/types';

export class CreateAreaDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsObject()
  modules?: UserModules;
}
