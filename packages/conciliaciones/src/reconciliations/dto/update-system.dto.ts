import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SystemMappingDto } from './mapping.dto';

export class UpdateSystemDto {
  @IsArray()
  rows!: Record<string, unknown>[];

  @ValidateNested()
  @Type(() => SystemMappingDto)
  mapping!: SystemMappingDto;
}
