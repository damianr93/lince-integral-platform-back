import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export enum ComoNosConocio {
  VISITA_VENDEDOR = 'VISITA_VENDEDOR',
  RECOMENDACION_COLEGA = 'RECOMENDACION_COLEGA',
  VENDEDOR = 'VENDEDOR',
  WEB = 'WEB',
  EXPOSICIONES = 'EXPOSICIONES',
}

export enum Recomendacion {
  SI = 'SI',
  NO = 'NO',
  MAYBE = 'MAYBE',
}

export enum AnteInconvenientes {
  EXCELENTE = 'EXCELENTE',
  BUENA = 'BUENA',
  MALA = 'MALA',
  N_A = 'N_A',
}

export enum Valoracion {
  CALIDAD = 'CALIDAD',
  TIEMPO_ENTREGA = 'TIEMPO_ENTREGA',
  ATENCION = 'ATENCION',
  RESOLUCION_INCONVENIENTES = 'RESOLUCION_INCONVENIENTES',
  SIN_VALORACION = 'SIN_VALORACION',
}

export class CreateSatisfactionDto {
  @ApiPropertyOptional({ example: '+54 9 351 555-1234', description: 'Teléfono del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'PIPO Bovino 18%', description: 'Producto evaluado' })
  @IsOptional()
  @IsString()
  producto?: string;

  @ApiPropertyOptional({
    enum: ComoNosConocio,
    description: 'Cómo conoció al cliente',
  })
  @IsOptional()
  @IsEnum(ComoNosConocio)
  comoNosConocio?: ComoNosConocio;

  @ApiPropertyOptional({
    description: '¿Se compró el producto?',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  productoComprado?: boolean;

  @ApiPropertyOptional({
    example: 'Bloque Magnesiado',
    description: 'Nombre específico del producto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombreProducto?: string;

  @ApiPropertyOptional({
    example: 4,
    minimum: 1,
    maximum: 5,
    description: 'Calidad percibida (1-5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  calidad?: number;

  @ApiPropertyOptional({
    example: 3,
    minimum: 1,
    maximum: 5,
    description: 'Tiempo de entrega/formación (1-5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  tiempoForme?: number;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Atención recibida (1-5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  atencion?: number;

  @ApiPropertyOptional({
    enum: Recomendacion,
    description: '¿Recomendaría el producto?',
  })
  @IsOptional()
  @IsEnum(Recomendacion)
  recomendacion?: Recomendacion;

  @ApiPropertyOptional({
    enum: AnteInconvenientes,
    description: 'Valoración ante inconvenientes',
  })
  @IsOptional()
  @IsEnum(AnteInconvenientes)
  anteInconvenientes?: AnteInconvenientes;

  @ApiPropertyOptional({
    enum: Valoracion,
    description: 'Aspecto más valorado por el cliente',
  })
  @IsOptional()
  @IsEnum(Valoracion)
  valoracion?: Valoracion;

  @ApiPropertyOptional({
    example: 'Muy conforme con el seguimiento postventa',
    maxLength: 300,
    description: 'Comentarios adicionales',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  comentarios?: string;
}
