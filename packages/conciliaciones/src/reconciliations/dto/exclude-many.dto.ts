import { IsArray, IsString } from 'class-validator';

export class ExcludeManyDto {
  @IsArray()
  @IsString({ each: true })
  concepts!: string[];
}
