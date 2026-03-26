import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GlobalRole } from '@lince/types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(GlobalRole)
  globalRole?: GlobalRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  area?: string | null;
}
