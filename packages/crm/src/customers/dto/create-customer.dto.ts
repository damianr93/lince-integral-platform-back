import {
  IsString,
  IsEmail,
  IsEnum,
  MaxLength,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { sanitizeProductName } from '../utils/product-sanitizer.util';

export enum Actividad {
  CRIA = 'CRIA',
  RECRIA = 'RECRIA',
  MIXTO = 'MIXTO',
  DISTRIBUIDOR = 'DISTRIBUIDOR',
}

export class UbicacionDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  pais?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  provincia?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  localidad?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  zona?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lon?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  displayName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  fuente?: string;

  @IsOptional()
  @IsBoolean()
  esNormalizada?: boolean;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  nombre?: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  apellido?: string;

  @ApiProperty({
    example: '+54 9 351 555-1234',
    description: 'Teléfono de contacto',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  telefono!: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico',
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  correo?: string;

  @ApiProperty({
    example: 120,
    minimum: 0,
    description: 'Cantidad de cabezas de ganado (se almacena como string)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  cabezas?: string;

  @ApiProperty({
    example: 6,
    minimum: 0,
    description: 'Meses que va a suplementar (se almacena como string)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  mesesSuplemento?: string;

  @ApiProperty({
    example: 'PIPO Bovino 18%',
    description: 'Producto consultado/comprado',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeProductName(value))
  producto?: string;

  @ApiProperty({ example: 'Córdoba', description: 'Localidad del cliente' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  localidad?: string;

  @ApiPropertyOptional({ example: 'Córdoba', description: 'Provincia del cliente' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  provincia?: string;

  @ApiPropertyOptional({
    description: 'Ubicación normalizada (pais, provincia, localidad, zona, coordenadas)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UbicacionDto)
  ubicacion?: UbicacionDto;

  @ApiProperty({ enum: Actividad, description: 'Actividad principal' })
  @IsOptional()
  @IsEnum(Actividad)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  actividad?: Actividad;

  @ApiPropertyOptional({
    example: 'Prefiere entrega los lunes por la mañana',
    description: 'Observaciones adicionales',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  observaciones?: string;

  @ApiProperty({
    enum: ['EZEQUIEL', 'DENIS', 'MARTIN', 'JULIAN', 'SIN_ASIGNAR'],
    default: 'SIN_ASIGNAR',
    description: 'Quién está siguiendo al cliente',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  siguiendo?: 'EZEQUIEL' | 'DENIS' | 'MARTIN' | 'JULIAN' | 'SIN_ASIGNAR';

  @ApiProperty({
    enum: ['INSTAGRAM', 'WEB', 'WHATSAPP', 'FACEBOOK', 'OTRO'],
    default: 'OTRO',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  medioAdquisicion?: 'INSTAGRAM' | 'WEB' | 'WHATSAPP' | 'FACEBOOK' | 'OTRO';

  @ApiProperty({
    enum: ['COMPRO', 'NO_COMPRO', 'PENDIENTE'],
    default: 'PENDIENTE',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  estado?: 'PENDIENTE' | 'DERIVADO_A_DISTRIBUIDOR' | 'NO_CONTESTO' | 'SE_COTIZO_Y_PENDIENTE' | 'SE_COTIZO_Y_NO_INTERESO' | 'COMPRO';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : String(value),
  )
  createdAt?: string;

  @ApiPropertyOptional({
    description: 'Marca si el registro es una reconsulta detectada automáticamente',
    default: false,
    readOnly: true,
  })
  @IsOptional()
  @IsBoolean()
  isReconsulta?: boolean;
}
