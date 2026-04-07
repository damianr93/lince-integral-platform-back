import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertRelevamientoItemDto {
  @IsOptional()
  @IsString()
  id?: string;

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

export class UpdateRelevamientoDto {
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

  /** Reemplaza todos los ítems del relevamiento */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertRelevamientoItemDto)
  items?: UpsertRelevamientoItemDto[];
}
