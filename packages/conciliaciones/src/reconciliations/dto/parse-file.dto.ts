import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ParseFileDto {
  @IsOptional()
  @IsString()
  sheetName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  headerRow?: number;
}
