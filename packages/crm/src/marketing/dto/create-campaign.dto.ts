import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class RecipientFilterDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siguiendo?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  estado?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  producto?: string[];
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsNotEmpty()
  templateLanguage: string;

  @IsOptional()
  recipientFilter?: RecipientFilterDto;
}
