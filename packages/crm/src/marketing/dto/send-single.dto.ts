import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class SendSingleDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsNotEmpty()
  templateLanguage: string;

  @IsString()
  @IsIn(['EZEQUIEL', 'DENIS', 'MARTIN', 'JULIAN'])
  advisor: 'EZEQUIEL' | 'DENIS' | 'MARTIN' | 'JULIAN';

  @IsOptional()
  @IsString()
  templateHeaderImageUrl?: string;
}
