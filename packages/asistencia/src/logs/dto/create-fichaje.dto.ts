import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { Planta } from '../../entities/empleado.entity';
import { EstadoFichaje } from '../../entities/fichaje.entity';

export class CreateFichajeDto {
  @IsString()
  pin: string;

  @IsEnum(Planta)
  planta: Planta;

  @IsEnum(EstadoFichaje)
  estado: EstadoFichaje;

  @IsISO8601()
  tiempo: string;

  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  @IsOptional()
  empleadoId?: string | null;
}
