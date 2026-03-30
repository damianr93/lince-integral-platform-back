import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

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

export class CreateCampaignWaveDto {
  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(1)
  recipientCount: number;
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
  @IsString()
  templateHeaderImageUrl?: string;

  @IsOptional()
  recipientFilter?: RecipientFilterDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CreateCampaignWaveDto)
  waves?: CreateCampaignWaveDto[];
}
