import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GlobalRole, UserModules } from '@lince/types';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(GlobalRole)
  globalRole?: GlobalRole;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsObject()
  modules?: UserModules;
}
