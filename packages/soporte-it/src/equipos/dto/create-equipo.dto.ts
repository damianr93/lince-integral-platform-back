import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EstadoEquipo } from '../../entities/equipo.entity';

export class CreateEquipoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  numeroActivo?: number;

  @IsOptional()
  @IsString()
  aCargoDe?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  hostname?: string;

  @IsOptional()
  @IsString()
  windowsUserId?: string;

  @IsOptional()
  @IsString()
  fabricante?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  ramGb?: string;

  @IsOptional()
  @IsString()
  sistemaOperativo?: string;

  @IsOptional()
  @IsString()
  procesador?: string;

  @IsOptional()
  @IsString()
  firmwareUefi?: string;

  @IsOptional()
  @IsString()
  graficos?: string;

  @IsOptional()
  @IsString()
  almacenamiento?: string;

  @IsOptional()
  @IsString()
  adaptadorRed?: string;

  @IsOptional()
  @IsString()
  ipv6?: string;

  @IsOptional()
  @IsString()
  controladorUsbHost?: string;

  @IsOptional()
  @IsIn(['activo', 'en_reparacion', 'baja'])
  estado?: EstadoEquipo;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsUUID()
  usuarioPlatId?: string;
}
