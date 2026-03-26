import { IsOptional, IsString } from 'class-validator';

export class CreatePendingDto {
  @IsString()
  area!: string;

  @IsOptional()
  @IsString()
  systemLineId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolvePendingDto {
  @IsOptional()
  @IsString()
  note?: string;
}
