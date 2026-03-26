import { IsEnum, IsOptional, IsString } from 'class-validator';

export type AmountMode = 'single' | 'debe-haber';

export class ExtractMappingDto {
  @IsEnum(['single', 'debe-haber'])
  amountMode!: AmountMode;

  @IsOptional()
  @IsString()
  dateCol?: string;

  @IsOptional()
  @IsString()
  conceptCol?: string;

  @IsOptional()
  @IsString()
  amountCol?: string;

  @IsOptional()
  @IsString()
  debeCol?: string;

  @IsOptional()
  @IsString()
  haberCol?: string;
}

export class SystemMappingDto {
  @IsEnum(['single', 'debe-haber'])
  amountMode!: AmountMode;

  @IsOptional()
  @IsString()
  issueDateCol?: string;

  @IsOptional()
  @IsString()
  dueDateCol?: string;

  @IsOptional()
  @IsString()
  descriptionCol?: string;

  @IsOptional()
  @IsString()
  amountCol?: string;

  @IsOptional()
  @IsString()
  debeCol?: string;

  @IsOptional()
  @IsString()
  haberCol?: string;
}
