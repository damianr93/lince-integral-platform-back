import { IsArray, IsOptional, IsString } from 'class-validator';

export class NotifyDto {
  @IsArray()
  @IsString({ each: true })
  areas!: string[];

  @IsOptional()
  @IsString()
  customMessage?: string;
}
