import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRelevamientoItemDto {
  @IsInt()
  @Min(0)
  orden: number;

  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  procedimiento?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;
}

export class CreateRelevamientoDto {
  @IsUUID()
  incidenteId: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  modalidad?: string;

  @IsOptional()
  @IsString()
  conclusionGeneral?: string;

  @IsOptional()
  @IsString()
  pasosASeguir?: string;

  @IsOptional()
  @IsString()
  recomendaciones?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRelevamientoItemDto)
  items?: CreateRelevamientoItemDto[];
}
