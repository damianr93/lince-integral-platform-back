import { IsArray, IsString } from 'class-validator';

export class SetMatchDto {
  @IsString()
  systemLineId!: string;

  @IsArray()
  @IsString({ each: true })
  extractLineIds!: string[];
}
