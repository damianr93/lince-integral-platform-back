import { IsString, IsNotEmpty, IsIn } from 'class-validator';

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
  @IsIn(['EZEQUIEL', 'DENIS', 'MARTIN'])
  advisor: 'EZEQUIEL' | 'DENIS' | 'MARTIN';
}
